import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Search, Eye, EyeOff, AlertCircle, RefreshCw, Package, TrendingUp, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  available_colors: string[];
  available_sizes: string[];
  is_active: boolean;
};

const CATEGORIES = [
  'tecnologia', 
  'arte-diseño', 
  'escolar', 
  'oficina', 
  'universitario'
];

const CATEGORY_LABELS: { [key: string]: string } = {
  'tecnologia': 'Tecnología',
  'arte-diseño': 'Arte y Diseño',
  'escolar': 'Escolar',
  'oficina': 'Oficina',
  'universitario': 'Universitario'
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'tecnologia': 'bg-blue-100 text-blue-800',
  'arte-diseño': 'bg-purple-100 text-purple-800',
  'escolar': 'bg-green-100 text-green-800',
  'oficina': 'bg-orange-100 text-orange-800',
  'universitario': 'bg-indigo-100 text-indigo-800'
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: '',
    available_colors: [] as string[],
    available_sizes: [] as string[],
    is_active: true,
  });

  // Configurar dropzone para subida de imágenes
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Manejar archivos rechazados
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.file.size > 5242880) {
          toast.error('La imagen es muy grande. Máximo 5MB permitido.');
        } else {
          toast.error('Formato de archivo no válido. Solo se permiten imágenes.');
        }
        return;
      }

      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      await uploadImage(file);
    }
  });

  // Función para subir imagen a Supabase Storage
  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      toast.loading('Subiendo imagen...', { id: 'upload' });

      console.log('Iniciando subida de imagen:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      console.log('Subiendo archivo:', { fileName, filePath });

      // Intentar subir el archivo
      let { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error de subida:', uploadError);
        
        // Manejar errores específicos
        if (uploadError.message.includes('The resource already exists')) {
          // Intentar con un nombre diferente
          const retryFileName = `${timestamp}-${randomString}-retry.${fileExt}`;
          const retryFilePath = `product-images/${retryFileName}`;
          
          console.log('Reintentando con nuevo nombre:', retryFilePath);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('products')
            .upload(retryFilePath, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (retryError) {
            console.error('Error en retry:', retryError);
            throw retryError;
          }
          
          if (!retryData) {
            throw new Error('Error al subir la imagen: no se recibió respuesta del servidor');
          }
          
          // Asignar retryData a uploadData para continuar con el flujo
          uploadData = retryData;
        } else if (uploadError.message.includes('new row violates row-level security')) {
          throw new Error('No tienes permisos para subir imágenes. Verifica tu sesión.');
        } else if (uploadError.message.includes('Bucket not found')) {
          throw new Error('El bucket de almacenamiento "products" no existe. Debe ser creado en el panel de Supabase.');
        } else {
          throw uploadError;
        }
      }

      // Verificar que uploadData existe antes de continuar
      if (!uploadData) {
        throw new Error('Error al subir la imagen: no se recibió respuesta del servidor');
      }

      console.log('Subida exitosa:', uploadData);

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(uploadData?.path || filePath);

      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL de la imagen');
      }

      console.log('URL pública obtenida:', urlData.publicUrl);

      // Actualizar el formulario con la nueva URL
      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success('Imagen subida correctamente', { id: 'upload' });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Error al subir la imagen';
      
      if (error.message?.includes('permission') || error.message?.includes('row-level security')) {
        errorMessage = 'No tienes permisos para subir imágenes. Inicia sesión nuevamente.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (error.message?.includes('size')) {
        errorMessage = 'La imagen es muy grande. Máximo 5MB.';
      } else if (error.message?.includes('Bucket not found') || error.message?.includes('bucket de almacenamiento')) {
        errorMessage = 'El bucket de almacenamiento "products" no existe. Debe ser creado en el panel de Supabase.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  // Función para eliminar imagen del storage
  const deleteImage = async (imageUrl: string) => {
    try {
      if (!imageUrl || !imageUrl.includes('supabase')) return;
      
      // Extraer el path de la URL
      const urlParts = imageUrl.split('/storage/v1/object/public/products/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];
      
      console.log('Eliminando imagen:', filePath);
      
      const { error } = await supabase.storage
        .from('products')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
      } else {
        console.log('Imagen eliminada correctamente');
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      
      // Ensure all products have the required fields
      const productsWithDefaults = (data || []).map(product => ({
        ...product,
        available_colors: product.available_colors || [],
        available_sizes: product.available_sizes || [],
        is_active: product.is_active !== undefined ? product.is_active : true,
        description: product.description || '',
        image_url: product.image_url || ''
      }));
      
      setProducts(productsWithDefaults);
      console.log('Products loaded:', productsWithDefaults.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }
    
    if (!formData.category) {
      toast.error('La categoría es requerida');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('El stock no puede ser negativo');
      return;
    }

    try {
      setIsSaving(true);
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
        image_url: formData.image_url || null,
        available_colors: formData.available_colors.filter(color => color.trim()),
        available_sizes: formData.available_sizes.filter(size => size.trim()),
        is_active: formData.is_active
      };

      console.log('Saving product:', productData);

      if (editingProduct) {
        // Si se cambió la imagen, eliminar la anterior
        if (editingProduct.image_url && editingProduct.image_url !== formData.image_url) {
          await deleteImage(editingProduct.image_url);
        }

        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        toast.success('Producto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        toast.success('Producto creado correctamente');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
      await fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      if (error.message?.includes('permission')) {
        toast.error('No tienes permisos para realizar esta acción');
      } else if (error.message?.includes('network')) {
        toast.error('Error de conexión. Verifica tu internet');
      } else {
        toast.error('Error al guardar el producto. Intenta de nuevo');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      available_colors: product.available_colors || [],
      available_sizes: product.available_sizes || [],
      is_active: product.is_active !== undefined ? product.is_active : true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, productName: string, imageUrl?: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${productName}"?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Eliminar imagen del storage si existe
      if (imageUrl) {
        await deleteImage(imageUrl);
      }
      
      toast.success('Producto eliminado correctamente');
      await fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      
      if (error.message?.includes('permission')) {
        toast.error('No tienes permisos para eliminar este producto');
      } else {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  const toggleProductStatus = async (id: string, currentStatus: boolean, productName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Status update error:', error);
        throw error;
      }
      
      toast.success(`"${productName}" ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Error al actualizar el estado del producto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image_url: '',
      available_colors: [],
      available_sizes: [],
      is_active: true,
    });
  };

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.is_active) ||
                         (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    lowStock: products.filter(p => p.stock < 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">Administra el catálogo de productos de tu tienda</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProducts}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <EyeOff className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-lg font-semibold text-gray-900">S/ {stats.totalValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Precio Prom.</p>
              <p className="text-lg font-semibold text-gray-900">S/ {stats.avgPrice.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="lg:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{getCategoryDisplayName(category)}</option>
              ))}
            </select>
          </div>
          
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-3 text-sm font-medium ${
                viewMode === 'table' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-3 text-sm font-medium ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cuadrícula
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Búsqueda: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {getCategoryDisplayName(selectedCategory)}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-2 hover:text-green-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {statusFilter === 'active' ? 'Activos' : 'Inactivos'}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 hover:text-purple-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="mb-4">
        <p className="text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
          {selectedCategory && ` en ${getCategoryDisplayName(selectedCategory)}`}
        </p>
      </div>

      {/* Products Table/Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {products.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos con los filtros aplicados'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover border"
                              src={product.image_url || 'https://via.placeholder.com/48?text=Sin+Imagen'}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/48?text=Sin+Imagen';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {product.description || 'Sin descripción'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          S/ {product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          product.stock < 10 ? 'text-red-600' : 
                          product.stock < 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                          {getCategoryDisplayName(product.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active, product.name)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            product.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <Eye size={12} className="mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} className="mr-1" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name, product.image_url)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500">
                {products.length === 0 ? 'No hay productos registrados' : 'Intenta con otros filtros'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative h-48">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {getCategoryDisplayName(product.category)}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description || 'Sin descripción'}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-primary-500">S/ {product.price.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${
                      product.stock < 10 ? 'text-red-600' : 
                      product.stock < 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active, product.name)}
                      className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${
                        product.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {product.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name, product.image_url)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isSaving || isUploading}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen del producto
                    </label>
                    <div 
                      {...getRootProps()} 
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-primary-500 bg-primary-50' : 
                        isUploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' :
                        'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      <input {...getInputProps()} disabled={isUploading || isSaving} />
                      {formData.image_url ? (
                        <div className="relative">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/200?text=Error+al+cargar';
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, image_url: '' }));
                            }}
                            disabled={isUploading || isSaving}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : isUploading ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                          <p className="text-sm text-gray-600">Subiendo imagen...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="text-gray-400 mb-2" size={32} />
                          <p className="text-sm text-gray-600">
                            {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP hasta 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del producto *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Mouse Pad Gaming RGB"
                        disabled={isSaving || isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isSaving || isUploading}
                      >
                        <option value="">Selecciona una categoría</option>
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{getCategoryDisplayName(category)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio (S/) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                          disabled={isSaving || isUploading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                          disabled={isSaving || isUploading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                          disabled={isSaving || isUploading}
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Producto activo
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Los productos inactivos no se mostrarán en la tienda
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Describe las características del producto..."
                        disabled={isSaving || isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Colores disponibles
                      </label>
                      <input
                        type="text"
                        value={formData.available_colors.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          available_colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Negro, Blanco, Azul"
                        disabled={isSaving || isUploading}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separa los colores con comas</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tallas/Tamaños disponibles
                      </label>
                      <input
                        type="text"
                        value={formData.available_sizes.join(', ')}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          available_sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: S, M, L, XL o 35x25cm, 40x30cm"
                        disabled={isSaving || isUploading}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separa los tamaños con comas</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSaving || isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className={`px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-md flex items-center ${
                      (isSaving || isUploading) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      editingProduct ? 'Guardar cambios' : 'Crear producto'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;