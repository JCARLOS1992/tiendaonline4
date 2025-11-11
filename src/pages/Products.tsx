import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { Search, Grid, List, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard, { Product } from '../components/ProductCard';
import { supabase, isSupabaseConfigured, checkDatabaseConnection } from '../lib/supabase';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: { [key: string]: string } = {
  "tecnologia": "Tecnología",
  "arte-diseño": "Arte y Diseño",
  "escolar": "Escolar",
  "oficina": "Oficina",
  "universitario": "Universitario"
};

const CATEGORY_COLORS: { [key: string]: string } = {
  "tecnologia": "bg-blue-100 text-blue-800",
  "arte-diseño": "bg-purple-100 text-purple-800",
  "escolar": "bg-green-100 text-green-800",
  "oficina": "bg-orange-100 text-orange-800",
  "universitario": "bg-indigo-100 text-indigo-800"
};

const Products = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'newest'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      // Check database connection first
      const dbCheck = await checkDatabaseConnection();
      if (!dbCheck.success) {
        console.error('Database check failed:', dbCheck.error);
        toast.error(dbCheck.error);
        setProducts([]);
        return;
      }

      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, using fallback data');
        toast.error('Error de configuración. Por favor, verifica las variables de entorno de Supabase.');
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
        } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('La tabla de productos no existe. Por favor, ejecuta las migraciones de la base de datos.');
        } else {
          throw error;
        }
      }
      
      if (!data || data.length === 0) {
        console.warn('No products found in database');
        toast('No se encontraron productos activos en la base de datos.', { icon: 'ℹ️' });
        setProducts([]);
        return;
      }
      
      // Transform data to match Product interface
      const transformedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || 'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        category: product.category
      }));
      
      setProducts(transformedProducts);
      console.log('Products loaded from Supabase:', transformedProducts.length);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      let errorMessage = 'Error al cargar los productos';
      
      if (error.message?.includes('configuration')) {
        errorMessage = 'Error de configuración. Por favor, configura las variables de entorno de Supabase.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        errorMessage = 'La base de datos no está configurada correctamente. Contacta al administrador del sistema.';
      } else if (typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let results = products;
    
    // Apply category filter
    if (activeCategory !== "Todos") {
      results = results.filter(product => product.category === activeCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
        default:
          return 0; // Keep original order for newest
      }
    });
    
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [activeCategory, searchTerm, sortBy, products]);

  // Calculate pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        type: 'product',
        category: product.category
      });
      toast.success(`${product.name} añadido al carrito`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al añadir el producto al carrito');
    }
  };

  const clearFilters = () => {
    setActiveCategory("Todos");
    setSearchTerm("");
  };

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800';
  };

  // Get category statistics
  const categoryStats = Object.keys(CATEGORY_LABELS).map(category => ({
    name: category,
    displayName: getCategoryDisplayName(category),
    count: products.filter(p => p.category === category).length,
    color: getCategoryColor(category)
  }));

  return (
    <div className="pt-16">
      {/* Simplified Header with JuBeTech colors */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
              Catálogo <span className="text-accent-300">JuBeTech</span>
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Descubre nuestra amplia gama de productos de calidad
            </p>
          </div>
        </div>
      </div>

      {/* Simplified Search and Controls */}
      <div className="bg-white shadow-sm z-20 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-grow lg:max-w-md">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setActiveCategory("Todos")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === "Todos"
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({products.length})
              </button>
              {categoryStats.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category.name
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.displayName} ({category.count})
                </button>
              ))}
            </div>

            {/* Simple Controls */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="newest">Más recientes</option>
                <option value="name">Por nombre</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters - Simplified */}
          {(activeCategory !== "Todos" || searchTerm) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600">Filtros:</span>
              {activeCategory !== "Todos" && (
                <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {getCategoryDisplayName(activeCategory)}
                  <button
                    onClick={() => setActiveCategory("Todos")}
                    className="ml-1 hover:text-primary-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs">
                  "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-accent-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Info - Simplified */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-600 text-sm">
            Mostrando {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            {activeCategory !== "Todos" && ` en ${getCategoryDisplayName(activeCategory)}`}
          </p>
          
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
              Por página:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="8">8</option>
              <option value="12">12</option>
              <option value="16">16</option>
              <option value="24">24</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Grid/List - Clean Layout */}
      <div className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                : "space-y-3"
            }>
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  viewMode={viewMode}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600 border-gray-300'
                    } transition-colors`}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis between gaps
                        const prevPage = array[index - 1];
                        const showEllipsisBefore = prevPage && page - prevPage > 1;
                        
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => goToPage(page)}
                              className={`px-4 py-2 rounded-md border transition-colors ${
                                currentPage === page
                                  ? 'bg-primary-500 text-white border-primary-500 font-medium'
                                  : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600 border-gray-300'
                              }`}
                              aria-label={`Ir a página ${page}`}
                              aria-current={currentPage === page ? 'page' : undefined}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md border ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600 border-gray-300'
                    } transition-colors`}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                {/* Page Info */}
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                <Search size={28} className="text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">No se encontraron productos</h3>
              <p className="text-gray-500 mb-4">
                Intenta con otros términos de búsqueda o categorías.
              </p>
              <button
                onClick={clearFilters}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
              >
                Ver todos los productos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;