import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Heart, Share, X, Star, Truck, Shield, Package, ZoomIn, Minus, Plus, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: { [key: string]: string } = {
  'tecnologia': 'Tecnología',
  'arte-diseño': 'Arte y Diseño',
  'escolar': 'Escolar',
  'oficina': 'Oficina',
  'universitario': 'Universitario',
  'Polos': 'Polos Personalizados',
  'Tazas': 'Tazas Personalizadas',
  'Libretas': 'Libretas Personalizadas',
  'Cuadros': 'Cuadros Personalizados',
  'Accesorios': 'Accesorios Personalizados'
};

// Mock product data - in a real app, this would come from an API
const PRODUCTS = [
  // TECNOLOGÍA
  { 
    id: "tech-1", 
    name: "Mouse Pad Gaming RGB", 
    price: 45.90, 
    description: "Mouse pad gaming con iluminación RGB personalizable. Base antideslizante de goma natural y superficie de tela suave para óptimo deslizamiento.",
    image: "https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "tecnologia",
    colors: ["Negro", "RGB"],
    sizes: ["35x25cm", "40x30cm"]
  },
  { 
    id: "tech-2", 
    name: "Soporte para Laptop Ajustable", 
    price: 89.90, 
    description: "Soporte ergonómico para laptop con altura y ángulo ajustable. Fabricado en aluminio resistente con ventilación integrada.",
    image: "https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "tecnologia",
    colors: ["Plateado", "Negro"],
    sizes: ["Universal"]
  },
  
  // ARTE Y DISEÑO
  { 
    id: "art-1", 
    name: "Set de Lápices de Dibujo Profesional", 
    price: 34.90, 
    description: "Set de 12 lápices de grafito profesionales desde 9H hasta 9B. Incluye difuminos, borrador amasable y sacapuntas.",
    image: "https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "arte-diseño",
    colors: ["Natural"],
    sizes: ["Set 12 piezas"]
  },
  
  // ESCOLAR
  { 
    id: "school-1", 
    name: "Cuaderno Universitario 100 Hojas", 
    price: 8.90, 
    description: "Cuaderno universitario con espiral metálico, 100 hojas cuadriculadas de papel bond 75g. Tapa plastificada resistente.",
    image: "https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "escolar",
    colors: ["Azul", "Rojo", "Verde", "Negro"],
    sizes: ["A4"]
  },
  
  // OFICINA
  { 
    id: "office-1", 
    name: "Archivador A4 con Palanca", 
    price: 18.90, 
    description: "Archivador de cartón forrado con mecanismo de palanca. Lomo de 7.5cm, ideal para documentos A4.",
    image: "https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "oficina",
    colors: ["Negro", "Azul", "Rojo", "Verde"],
    sizes: ["A4"]
  },
  
  // UNIVERSITARIO
  { 
    id: "uni-1", 
    name: "Folder Manila A4 (Pack 50)", 
    price: 15.90, 
    description: "Pack de 50 folders manila A4 de 180g. Ideales para organizar documentos, trabajos y presentaciones universitarias.",
    image: "https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "universitario",
    colors: ["Manila"],
    sizes: ["A4"]
  },

  // Productos originales personalizables
  { 
    id: "custom-1", 
    name: "Polo Personalizado", 
    price: 49.90, 
    description: "Polo de algodón 100% con estampado personalizado. Disponible en varios colores y tallas. Ideal para eventos, empresas o regalos personalizados.",
    image: "https://images.pexels.com/photos/5709667/pexels-photo-5709667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "Polos",
    colors: ["black", "white", "gray", "blue", "red"],
    sizes: ["S", "M", "L", "XL"]
  },
  { 
    id: "custom-2", 
    name: "Taza con Diseño", 
    price: 29.90, 
    description: "Taza de cerámica de alta calidad con diseño personalizado. Resistente al microondas y lavavajillas. Perfecta para regalar o para uso diario.",
    image: "https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "Tazas",
    colors: ["white", "black"],
    sizes: ["Standard"]
  },
  { 
    id: "custom-3", 
    name: "Libreta Personalizada", 
    price: 19.90, 
    description: "Libreta de tapa dura con diseño personalizado. Incluye 100 hojas rayadas de papel bond de alta calidad. Tamaño A5.",
    image: "https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "Libretas",
    colors: ["black", "blue", "red", "green"],
    sizes: ["A5", "A4"]
  },
  { 
    id: "custom-4", 
    name: "Cuadro Decorativo", 
    price: 39.90, 
    description: "Cuadro decorativo con diseño personalizado. Marco de madera de alta calidad. Disponible en diferentes tamaños.",
    image: "https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "Cuadros",
    colors: ["black", "white", "natural"],
    sizes: ["20x30cm", "30x40cm", "40x50cm"]
  },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      if (!isSupabaseConfigured()) {
        setProduct(null);
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setProduct(null);
      } else {
        setProduct({
          ...data,
          image: data.image_url || 'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          colors: data.available_colors || [],
          sizes: data.available_sizes || [],
        });
        setStock(data.stock || 0);
        setSelectedColor((data.available_colors && data.available_colors[0]) || '');
        setSelectedSize((data.available_sizes && data.available_sizes[0]) || '');
      }
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Validar stock
    if (stock !== null && stock < quantity) {
      toast.error(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`);
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      type: 'product',
      category: product.category,
      quantity: quantity,
      customization: {
        text: customText,
        color: selectedColor,
      }
    });
    
    toast.success(`${product.name} añadido al carrito`, {
      icon: '🛒',
      duration: 3000,
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  if (isLoading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <p className="text-gray-600 mb-8">
            El producto que buscas no existe o ha sido removido de nuestro catálogo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/products" 
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-md shadow transition-colors"
            >
              Ver todos los productos
            </Link>
            <Link 
              to="/" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-md shadow transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumbs - Mejorado */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-sm text-gray-600 mb-8 flex-wrap gap-2"
        >
          <Link to="/" className="hover:text-primary-500 transition-colors font-medium">Inicio</Link>
          <span className="text-gray-400">/</span>
          <Link to="/products" className="hover:text-primary-500 transition-colors font-medium">Productos</Link>
          <span className="text-gray-400">/</span>
          <Link 
            to={`/products?category=${product.category}`} 
            className="hover:text-primary-500 transition-colors font-medium"
          >
            {getCategoryDisplayName(product.category)}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image - Mejorado con zoom */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <div 
                className="relative aspect-square overflow-hidden cursor-zoom-in"
                onClick={() => setImageZoom(true)}
              >
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
              </div>
              
              {/* Badge de stock */}
              {stock !== null && (
                <div className="absolute top-4 left-4">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${
                    stock > 10 
                      ? 'bg-green-500 text-white' 
                      : stock > 0 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {stock > 0 ? `${stock} disponibles` : 'Agotado'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal de zoom */}
            <AnimatePresence>
              {imageZoom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                  onClick={() => setImageZoom(false)}
                >
                  <motion.img
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => setImageZoom(false)}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Product Info - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Categoría y acciones */}
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 rounded-full text-sm font-semibold">
                {getCategoryDisplayName(product.category)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-3 rounded-full transition-all ${
                    isFavorite 
                      ? 'bg-red-100 text-red-500' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Agregar a favoritos"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  title="Compartir"
                >
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Título y precio */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-primary-600">S/ {product.price.toFixed(2)}</span>
                {product.price > 50 && (
                  <span className="text-lg text-gray-500 line-through">S/ {(product.price * 1.2).toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-yellow-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                <span className="text-gray-600 text-sm ml-2">(4.8) · 124 reseñas</span>
              </div>
            </div>
            
            {/* Descripción */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">{product.description || 'Producto de alta calidad con garantía de satisfacción.'}</p>
            </div>
            
            {/* Beneficios destacados */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <Truck className="w-6 h-6 text-primary-500 mb-2" />
                <span className="text-xs font-medium text-gray-700 text-center">Envío rápido</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <Shield className="w-6 h-6 text-primary-500 mb-2" />
                <span className="text-xs font-medium text-gray-700 text-center">Garantía</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200">
                <Package className="w-6 h-6 text-primary-500 mb-2" />
                <span className="text-xs font-medium text-gray-700 text-center">Original</span>
              </div>
            </div>
            
            {/* Color Selection - Mejorado */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Color:</h3>
                  {selectedColor && (
                    <span className="text-sm text-gray-600 capitalize">Seleccionado: {selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color: string) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(color)}
                      className={`
                        relative px-5 py-3 rounded-xl font-medium text-sm capitalize transition-all
                        ${selectedColor === color 
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg ring-2 ring-primary-300 ring-offset-2' 
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'}
                      `}
                    >
                      {selectedColor === color && (
                        <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-white bg-primary-600 rounded-full" />
                      )}
                      {color}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Selection - Mejorado */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Tamaño:</h3>
                  {selectedSize && (
                    <span className="text-sm text-gray-600">Seleccionado: {selectedSize}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        relative px-5 py-3 rounded-xl font-medium text-sm transition-all min-w-[80px]
                        ${selectedSize === size 
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg ring-2 ring-primary-300 ring-offset-2' 
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'}
                      `}
                    >
                      {selectedSize === size && (
                        <CheckCircle className="absolute -top-1 -right-1 w-5 h-5 text-white bg-primary-600 rounded-full" />
                      )}
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Customization - Mejorado */}
            {['Polos', 'Tazas', 'Libretas', 'Cuadros', 'Accesorios'].includes(product.category) && (
              <div className="space-y-3 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-200">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  Personalización:
                </h3>
                <input
                  type="text"
                  placeholder="Añade texto personalizado (opcional)"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                />
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-primary-500">*</span> Para diseños más complejos, adjunta tus ideas en el carrito.
                </p>
              </div>
            )}
            
            {/* Quantity - Mejorado */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">Cantidad:</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </motion.button>
                  <input
                    type="number"
                    min="1"
                    max={stock !== null ? stock : undefined}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const max = stock !== null ? stock : Infinity;
                      setQuantity(Math.min(Math.max(1, val), max));
                    }}
                    className="w-20 h-12 text-center text-lg font-semibold focus:outline-none border-x-2 border-gray-200"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const max = stock !== null ? stock : Infinity;
                      setQuantity(q => Math.min(q + 1, max));
                    }}
                    disabled={stock !== null && quantity >= stock}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5 text-gray-700" />
                  </motion.button>
                </div>
                {stock !== null && (
                  <span className="text-sm text-gray-600">
                    {stock > 0 ? `${stock} disponibles` : 'Agotado'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Mejorado */}
            <div className="space-y-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={stock !== null && stock === 0}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    Añadir al carrito
                  </>
                )}
              </motion.button>
              
              {stock !== null && stock === 0 && (
                <p className="text-center text-red-600 font-medium">Este producto está agotado</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Related Products - Mejorado */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Productos relacionados</h2>
            <Link 
              to={`/products?category=${product.category}`}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
            >
              Ver todos
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTS.filter(p => p.id !== id && p.category === product.category).slice(0, 4).map((relatedProduct, index) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-100 group"
              >
                <Link to={`/products/${relatedProduct.id}`} className="block">
                  <div className="relative overflow-hidden">
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name} 
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </Link>
                <div className="p-5">
                  <Link to={`/products/${relatedProduct.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 mb-3">{getCategoryDisplayName(relatedProduct.category)}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-primary-600">S/ {relatedProduct.price.toFixed(2)}</span>
                    <Link 
                      to={`/products/${relatedProduct.id}`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      Ver
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;