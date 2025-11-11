import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, Heart, Bell } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Productos', path: '/products' },
    { name: 'Impresión', path: '/print' },
    { name: 'Nosotros', path: '/about' },
    { name: 'Contacto', path: '/contact' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
            : 'bg-white/80 backdrop-blur-sm py-4'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
          {/* Logo */}
          <Logo size="medium" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 font-medium transition-all rounded-lg ${
                  location.pathname === item.path
                    ? 'text-primary-500 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                }`}
              >
                <span className="relative z-10">{item.name}</span>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary-50 rounded-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Buscar productos"
            >
              <Search size={18} />
              <span className="hidden lg:inline text-sm">Buscar</span>
              <span className="hidden xl:inline text-xs text-gray-400 ml-1">⌘K</span>
            </motion.button>

            {/* Desktop Cart */}
            <Link 
              to="/cart" 
              className="relative hidden md:block"
              aria-label={`Carrito de compras (${totalItems} items)`}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-700 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart size={20} />
              </motion.div>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </Link>
          
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 text-gray-700 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={toggleMenu}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={closeMenu}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <Logo 
                      size="small" 
                      onClick={closeMenu}
                    />
                    <button
                      onClick={closeMenu}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      aria-label="Cerrar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </form>
                </div>

                <nav className="p-4 space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center py-3 px-4 rounded-lg transition-all ${
                          location.pathname === item.path
                            ? 'bg-primary-50 text-primary-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={closeMenu}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Mobile Cart Link */}
                  <Link
                    to="/cart"
                    className="flex items-center justify-between py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                    onClick={closeMenu}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={20} />
                      <span>Carrito</span>
                    </div>
                    {totalItems > 0 && (
                      <span className="bg-accent-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center px-4">
                    <Search className="text-gray-400" size={20} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar productos, categorías..."
                      className="w-full py-4 px-4 text-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Cerrar búsqueda"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                    Presiona <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> para cerrar
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;