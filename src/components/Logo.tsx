import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  variant?: 'default' | 'white' | 'gradient';
  className?: string;
  onClick?: () => void;
};

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showIcon = true, 
  variant = 'default',
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl md:text-4xl'
  };

  const iconSizes = {
    small: 18,
    medium: 24,
    large: 32
  };

  const getColorClasses = () => {
    switch (variant) {
      case 'white':
        return {
          first: 'text-white',
          second: 'text-white/90'
        };
      case 'gradient':
        return {
          first: 'text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600',
          second: 'text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-accent-600'
        };
      default:
        return {
          first: 'text-primary-500 group-hover:text-primary-600',
          second: 'text-accent-500 group-hover:text-accent-600'
        };
    }
  };

  const colors = getColorClasses();
  const iconSize = iconSizes[size];

  const LogoContent = () => (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {showIcon && (
        <motion.div
          className="relative"
          animate={{ 
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-md"></div>
            {/* Icon container */}
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-1.5 rounded-lg shadow-lg">
              <Zap 
                size={iconSize} 
                className="text-white drop-shadow-sm" 
                fill="white"
              />
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="flex items-baseline gap-0.5">
        <motion.span
          className={`font-bold ${sizeClasses[size]} ${colors.first} transition-colors`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          Jube
        </motion.span>
        <motion.span
          className={`font-bold ${sizeClasses[size]} ${colors.second} transition-colors`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          Tech
        </motion.span>
      </div>

      {/* Decorative sparkle */}
      {showIcon && size !== 'small' && (
        <motion.div
          className="hidden md:block"
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles size={iconSize * 0.6} className="text-accent-400" />
        </motion.div>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="group"
        aria-label="Jube Tech Home"
      >
        <LogoContent />
      </button>
    );
  }

  return (
    <Link
      to="/"
      className="group"
      aria-label="Jube Tech Home"
    >
      <LogoContent />
    </Link>
  );
};

export default Logo;

