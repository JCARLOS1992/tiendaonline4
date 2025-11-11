import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Upload, CheckCircle, Sparkles, Truck, Shield, Star, ArrowRight, Zap, Award, Heart, ChevronLeft, ChevronRight, Printer, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard, { Product } from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  // Fetch featured products
  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (featuredProducts.length <= 4) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 4) % featuredProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Error fetching products:', error);
        // Fallback to demo products
        setFeaturedProducts(getDemoProducts());
        return;
      }

      if (data && data.length > 0) {
        const transformedProducts: Product[] = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url || 'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          category: product.category
        }));
        setFeaturedProducts(transformedProducts);
      } else {
        setFeaturedProducts(getDemoProducts());
      }
    } catch (error) {
      console.error('Error:', error);
      setFeaturedProducts(getDemoProducts());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoProducts = (): Product[] => [
    { 
      id: "1", 
      name: "Polo Personalizado", 
      price: 49.90, 
      image: "https://images.pexels.com/photos/5709667/pexels-photo-5709667.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      category: "tecnologia"
    },
    { 
      id: "2", 
      name: "Taza con Diseño", 
      price: 29.90, 
      image: "https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      category: "arte-diseño"
    },
    { 
      id: "3", 
      name: "Libreta Personalizada", 
      price: 19.90, 
      image: "https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      category: "escolar"
    },
    { 
      id: "4", 
      name: "Cuadro Decorativo", 
      price: 39.90, 
      image: "https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1",
      category: "arte-diseño"
    }
  ];

  const nextSlide = () => {
    if (featuredProducts.length <= 4) return;
    setCurrentSlide((prev) => (prev + 4) % featuredProducts.length);
  };

  const prevSlide = () => {
    if (featuredProducts.length <= 4) return;
    setCurrentSlide((prev) => (prev - 4 + featuredProducts.length) % featuredProducts.length);
  };

  const goToSlide = (pageIndex: number) => {
    setCurrentSlide(pageIndex * 4);
  };

  // Calculate visible products for carousel (4 at a time)
  const getVisibleProducts = () => {
    if (featuredProducts.length === 0) return [];
    const products: Product[] = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentSlide + i) % featuredProducts.length;
      products.push(featuredProducts[index]);
    }
    return products;
  };

  const visibleProducts = getVisibleProducts();
  const totalPages = Math.ceil(featuredProducts.length / 4);
  const currentPage = Math.floor(currentSlide / 4);

  return (
    <>
      {/* Hero Section - Enhanced */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-20 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 z-10 pt-24 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center space-y-6"
              >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full w-fit text-sm font-medium mb-2"
              >
                <Sparkles size={16} />
                <span>Innovación en cada producto</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight">
                <span className="text-primary-500">Personaliza</span> y{' '}
                <span className="text-accent-500">Crea</span> con{' '}
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  Estilo
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                Tu tienda online con impresión inteligente. Transforma tus ideas en realidad con tecnología de última generación y entrega rápida.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to="/products" 
                    className="group bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Explorar Productos
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link 
                    to="/print" 
                    className="group bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                  >
                    <Upload className="h-5 w-5" />
                    Servicio de Impresión
                  </Link>
                </motion.div>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, text: "Personalización IA", color: "text-primary-500" },
                  { icon: Truck, text: "Envío Nacional", color: "text-accent-500" },
                  { icon: Shield, text: "Calidad Garantizada", color: "text-green-500" }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className={`p-2 bg-gray-50 rounded-lg ${benefit.color}`}>
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
              </motion.div>

              {/* Hero Image - Elegant Professional Design */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative flex items-center justify-center lg:justify-end"
              >
                <div className="relative w-full max-w-2xl">
                  {/* Elegant Decorative Frame */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary-400/30 via-transparent to-accent-400/30 rounded-3xl blur-3xl opacity-50"></div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl"></div>
                  
                  {/* Main Image Container with Elegant Design */}
                  <motion.div
                    whileHover={{ scale: 1.01, y: -5 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm"
                  >
                    {/* Professional Office Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src="https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2" 
                        alt="Profesional trabajando en diseño e impresión - Personaliza y crea con estilo" 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Subtle Overlay for Elegance */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-accent-900/10"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Elegant Floating Cards */}
                    <motion.div
                      initial={{ opacity: 0, x: -20, y: 20 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="absolute top-8 left-8 bg-white/98 backdrop-blur-md px-5 py-3 rounded-xl shadow-2xl border border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
                          <Sparkles className="text-white" size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Innovación</p>
                          <p className="text-sm font-bold text-gray-900">Diseño Profesional</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20, y: -20 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: 1, duration: 0.6 }}
                      className="absolute bottom-8 right-8 bg-white/98 backdrop-blur-md px-5 py-3 rounded-xl shadow-2xl border border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg shadow-lg">
                          <Zap className="text-white" size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tecnología</p>
                          <p className="text-sm font-bold text-gray-900">Impresión Inteligente</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Elegant Corner Accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary-500/20 to-transparent rounded-br-full"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-accent-500/20 to-transparent rounded-tl-full"></div>
                  </motion.div>

                  {/* Elegant Floating Elements */}
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-8 -right-8 hidden lg:block z-10"
                  >
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-2xl shadow-2xl border-2 border-white/30">
                      <ImageIcon className="text-white" size={32} />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ 
                      y: [0, 20, 0],
                      rotate: [0, -10, 10, 0]
                    }}
                    transition={{ 
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
                    className="absolute -bottom-8 -left-8 hidden lg:block z-10"
                  >
                    <div className="bg-gradient-to-br from-accent-500 to-accent-600 p-5 rounded-2xl shadow-2xl border-2 border-white/30">
                      <Printer className="text-white" size={32} />
                    </div>
                  </motion.div>

                  {/* Elegant Bottom Accent Line */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase - Enhanced */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Servicios</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Descubre todo lo que Jube Tech puede hacer por ti, desde productos personalizados hasta impresiones profesionales.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Printing Service */}
            <motion.div 
              className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2" 
                  alt="Servicio de impresión profesional" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <Printer className="text-primary-600" size={20} />
                  <span className="font-semibold text-gray-900">Impresión Profesional</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900">Servicio de Impresión</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Imprimimos tus documentos con calidad profesional. Tesis, planos, folletos, tarjetas y más con acabados perfectos.
                </p>
                <Link 
                  to="/print" 
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group/link"
                >
                  Subir archivo
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
            
            {/* Customized Products */}
            <motion.div 
              className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=2" 
                  alt="Productos personalizados con diseño" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <ImageIcon className="text-accent-600" size={20} />
                  <span className="font-semibold text-gray-900">Productos Únicos</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900">Productos Personalizados</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Personaliza polos, tazas, libretas, cuadros y más con tus propios diseños o nuestras sugerencias IA.
                </p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group/link"
                >
                  Ver productos
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel - Enhanced */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Productos Destacados</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Explora nuestra selección de productos personalizables más populares
              </p>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative max-w-7xl mx-auto">
              {/* Carousel Container */}
              <div className="relative overflow-hidden rounded-2xl">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                      {visibleProducts.map((product, index) => (
                        <ProductCard
                          key={`${product.id}-${currentSlide}-${index}`}
                          product={product}
                          viewMode="grid"
                          onAddToCart={() => {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              type: 'product',
                              category: product.category
                            });
                            toast.success(`${product.name} añadido al carrito`);
                          }}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                {featuredProducts.length > 4 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-20 bg-white shadow-lg hover:shadow-xl rounded-full p-3 md:p-4 transition-all hover:scale-110 active:scale-95"
                      aria-label="Producto anterior"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-20 bg-white shadow-lg hover:shadow-xl rounded-full p-3 md:p-4 transition-all hover:scale-110 active:scale-95"
                      aria-label="Siguiente producto"
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                    </button>
                  </>
                )}
              </div>

                {/* Carousel Indicators */}
              {featuredProducts.length > 4 && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        currentPage === index
                          ? 'w-8 bg-primary-500'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Ir a página ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No hay productos destacados disponibles en este momento.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/products"
                className="inline-flex items-center bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Ver todos los productos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Opiniones reales de clientes satisfechos con nuestros productos y servicios
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Carlos Mendoza",
                role: "Estudiante Universitario",
                comment: "Imprimí mi tesis con ellos y quedé muy satisfecho con la calidad. El proceso fue muy sencillo y rápido.",
                image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
              },
              {
                name: "María Gutiérrez",
                role: "Emprendedora",
                comment: "Los polos personalizados para mi negocio quedaron increíbles. La calidad del estampado es excelente y el diseño exactamente como lo quería.",
                image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
              },
              {
                name: "Luis Vargas",
                role: "Arquitecto",
                comment: "Imprimo mis planos constantemente con Jube Tech. El servicio es rápido y la calidad siempre es consistente.",
                image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-primary-200"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic leading-relaxed">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, white 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para comenzar?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-95">
              Personaliza tus productos o imprime tus documentos con la mejor calidad y atención
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products" 
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Comprar ahora
              </Link>
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-xl flex items-center justify-center transition-all"
              >
                Contáctanos
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;
