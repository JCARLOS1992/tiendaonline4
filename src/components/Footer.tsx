import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send, CheckCircle, Shield, Truck, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { useSettingsContext } from '../contexts/SettingsContext';

const Footer = () => {
  const { settings } = useSettingsContext();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo size="medium" variant="white" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Tu tienda online con impresión inteligente. Personaliza productos o imprime tus archivos con tecnología de última generación.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-full text-xs">
                <Shield size={12} className="text-green-400" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-full text-xs">
                <Truck size={12} className="text-primary-400" />
                <span>Envío Rápido</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-3 pt-2">
              <motion.a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-gray-800/50 hover:bg-primary-500 rounded-lg transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </motion.a>
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-gray-800/50 hover:bg-pink-500 rounded-lg transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </motion.a>
              <motion.a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-gray-800/50 hover:bg-blue-400 rounded-lg transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              {[
                { path: '/', label: 'Inicio' },
                { path: '/products', label: 'Productos' },
                { path: '/print', label: 'Servicio de Impresión' },
                { path: '/about', label: 'Nosotros' },
                { path: '/contact', label: 'Contacto' },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform inline-block">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Categorías</h3>
            <ul className="space-y-3">
              {[
                { path: '/products?category=Polos', label: 'Polos Personalizados' },
                { path: '/products?category=Tazas', label: 'Tazas y Termos' },
                { path: '/products?category=Libretas', label: 'Libretas y Cuadernos' },
                { path: '/products?category=Cuadros', label: 'Cuadros Decorativos' },
                { path: '/print', label: 'Impresión de Documentos' },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform inline-block">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Mantente Informado</h3>
            
            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email"
                  className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm"
                  required
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                  aria-label="Suscribirse"
                >
                  <Send size={18} />
                </motion.button>
              </div>
              {subscribed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-sm text-green-400"
                >
                  <CheckCircle size={14} />
                  <span>¡Suscrito exitosamente!</span>
                </motion.div>
              )}
            </form>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Contacto</h4>
              <a 
                href={`tel:${settings.company.phone.replace(/\s/g, '')}`}
                className="flex items-center text-gray-400 hover:text-primary-400 transition-colors group"
              >
                <Phone size={16} className="mr-3 text-primary-500" />
                <span className="group-hover:underline">{settings.company.phone}</span>
              </a>
              <a 
                href={`mailto:${settings.company.email}`}
                className="flex items-center text-gray-400 hover:text-primary-400 transition-colors group"
              >
                <Mail size={16} className="mr-3 text-primary-500" />
                <span className="group-hover:underline text-sm">{settings.company.email}</span>
              </a>
              <div className="flex items-start text-gray-400">
                <MapPin size={16} className="mr-3 mt-1 text-primary-500 flex-shrink-0" />
                <span className="text-sm">{settings.company.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} <span className="text-white font-semibold">{settings.company.name}</span>. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/about" className="text-gray-400 hover:text-primary-400 transition-colors">
                Términos y Condiciones
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-primary-400 transition-colors">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;