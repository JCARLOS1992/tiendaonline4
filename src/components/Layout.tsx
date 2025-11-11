import React, { useState, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatAssistant from './ChatAssistant';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      
      {/* Floating Action Buttons - Right Side */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0, 
                rotate: 180,
                transition: { duration: 0.2 }
              }}
              whileHover={{ 
                scale: 1.15, 
                y: -5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="relative w-14 h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 flex items-center justify-center group overflow-hidden"
              aria-label="Volver arriba"
              title="Volver arriba"
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear"
                }}
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
              
              {/* Icon */}
              <ArrowUp className="h-6 w-6 relative z-10 group-hover:-translate-y-1 transition-transform duration-300" strokeWidth={2.5} />
              
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/40"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Button */}
        <motion.button
          whileHover={{ 
            scale: 1.1, 
            y: -3,
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="relative w-14 h-14 bg-gradient-to-br from-accent-500 via-accent-600 to-primary-500 hover:from-accent-600 hover:via-accent-700 hover:to-primary-600 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 flex items-center justify-center overflow-hidden group"
          aria-label="Open chat assistant"
          title="Abrir chat"
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear",
              delay: 0.5
            }}
          />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
          
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform duration-300"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </motion.button>
      </div>
      
      <AnimatePresence>
        {isChatOpen && <ChatAssistant onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Layout;