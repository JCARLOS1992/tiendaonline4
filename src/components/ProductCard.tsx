import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, Heart, ArrowRight } from 'lucide-react';

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

type ProductCardProps = {
  product: Product;
  onAddToCart: () => void;
  viewMode?: 'grid' | 'list';
};

const ProductCard = ({ product, onAddToCart, viewMode = 'grid' }: ProductCardProps) => {
  const getCategoryDisplayName = (category: string) => {
    const categoryLabels: { [key: string]: string } = {
      "tecnologia": "Tecnología",
      "arte-diseño": "Arte y Diseño",
      "escolar": "Escolar",
      "oficina": "Oficina",
      "universitario": "Universitario"
    };
    return categoryLabels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      "tecnologia": "bg-blue-100 text-blue-800",
      "arte-diseño": "bg-purple-100 text-purple-800",
      "escolar": "bg-green-100 text-green-800",
      "oficina": "bg-orange-100 text-orange-800",
      "universitario": "bg-indigo-100 text-indigo-800"
    };
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all flex border group"
      >
        {/* Clickable Image */}
        <Link to={`/products/${product.id}`} className="w-32 h-32 flex-shrink-0 overflow-hidden cursor-pointer">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="flex-grow p-4 flex items-center justify-between">
          <div className="flex-grow">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(product.category)}`}>
              {getCategoryDisplayName(product.category)}
            </span>
            <Link to={`/products/${product.id}`} className="block">
              <h3 className="text-base font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors cursor-pointer">{product.name}</h3>
            </Link>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} className="text-yellow-400 fill-current" />
              ))}
              <span className="text-xs text-gray-500 ml-1">(4.8)</span>
            </div>
            <span className="text-xl font-bold text-primary-500">S/ {product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAddToCart}
              className="bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
              aria-label="Agregar al carrito"
              title="Agregar al carrito"
            >
              <ShoppingCart size={18} />
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link 
                to={`/products/${product.id}`}
                className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                aria-label="Ver detalles"
                title="Ver detalles"
              >
                <Eye size={18} />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 group relative"
    >
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
        {/* Clickable Image - Goes to Details */}
        <Link 
          to={`/products/${product.id}`} 
          className="absolute inset-0 z-0"
        >
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
          />
        </Link>
        
        {/* Category Badge - Improved */}
        <motion.div 
          className="absolute top-3 left-3 z-20 pointer-events-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm bg-white/90 ${getCategoryColor(product.category)}`}>
            {getCategoryDisplayName(product.category)}
          </span>
        </motion.div>

        {/* Favorite Button - Always Visible */}
        <motion.div 
          className="absolute top-3 right-3 z-20"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <button
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-all shadow-md hover:shadow-lg hover:bg-white"
            aria-label="Agregar a favoritos"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart size={16} className="transition-transform group-hover:scale-110" />
          </button>
        </motion.div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Product Name - Clickable */}
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[2.5rem] cursor-pointer">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating - Enhanced */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-xs text-gray-500 font-medium">4.8</span>
          <span className="text-xs text-gray-400">(124)</span>
        </div>
        
        {/* Price and Action Buttons - Always Visible */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
          <div>
            <span className="text-2xl font-bold text-primary-500">S/ {product.price.toFixed(2)}</span>
          </div>
          
          {/* Quick Action Buttons - Always Visible */}
          <div className="flex items-center gap-2">
            {/* Quick Add to Cart Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart();
              }}
              className="bg-primary-500 text-white p-2.5 rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
              aria-label="Agregar al carrito"
              title="Agregar al carrito"
            >
              <ShoppingCart size={18} />
            </motion.button>
            
            {/* Quick View Details Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link 
                to={`/products/${product.id}`}
                className="bg-gray-100 text-gray-700 p-2.5 rounded-lg hover:bg-gray-200 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                aria-label="Ver detalles"
                title="Ver detalles"
              >
                <Eye size={18} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 bg-gradient-to-br from-primary-500/5 to-accent-500/5"></div>
    </motion.div>
  );
};

export default ProductCard;