import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Monitor, Palette, GraduationCap, Building, BookOpen } from 'lucide-react';

type CategoryMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: string, subcategory?: string) => void;
  selectedCategory: string;
};

const CATEGORIES = [
  {
    id: 'tecnologia',
    name: 'TECNOLOGÍA',
    icon: <Monitor size={20} />,
    subcategories: [
      'Computadoras y Laptops',
      'Smartphones y Tablets',
      'Accesorios Tecnológicos',
      'Gaming y Entretenimiento',
      'Audio y Video',
      'Cables y Conectores'
    ]
  },
  {
    id: 'arte-diseño',
    name: 'ARTE Y DISEÑO',
    icon: <Palette size={20} />,
    subcategories: [
      'Materiales de Dibujo',
      'Pinturas y Pinceles',
      'Herramientas de Diseño',
      'Papel Especializado',
      'Instrumentos de Medición',
      'Accesorios Artísticos'
    ]
  },
  {
    id: 'escolar',
    name: 'ESCOLAR',
    icon: <BookOpen size={20} />,
    subcategories: [
      'Cuadernos y Libretas',
      'Útiles de Escritura',
      'Material Didáctico',
      'Mochilas y Cartucheras',
      'Calculadoras',
      'Organización Escolar'
    ]
  },
  {
    id: 'oficina',
    name: 'OFICINA',
    icon: <Building size={20} />,
    subcategories: [
      'Papelería Corporativa',
      'Archivadores y Carpetas',
      'Equipos de Oficina',
      'Suministros de Impresión',
      'Mobiliario de Escritorio',
      'Planificación y Agenda'
    ]
  },
  {
    id: 'universitario',
    name: 'UNIVERSITARIO',
    icon: <GraduationCap size={20} />,
    subcategories: [
      'Material Académico',
      'Libros y Referencias',
      'Investigación y Tesis',
      'Presentaciones',
      'Laboratorio',
      'Vida Universitaria'
    ]
  }
];

const CategoryMenu = ({ isOpen, onClose, onCategorySelect, selectedCategory }: CategoryMenuProps) => {
  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  const handleSubcategoryClick = (categoryId: string, subcategory: string) => {
    onCategorySelect(categoryId, subcategory);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary-500 text-white">
              <h2 className="text-lg font-semibold">Categorías</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-primary-600 rounded-lg transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="p-4">
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <div key={category.id} className="group">
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 ${selectedCategory === category.id ? 'text-primary-500' : 'text-gray-500'}`}>
                          {category.icon}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform ${selectedCategory === category.id ? 'text-primary-500' : 'text-gray-400'}`}
                      />
                    </button>

                    {/* Subcategories */}
                    <AnimatePresence>
                      {selectedCategory === category.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 mt-2 space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <button
                                key={subcategory}
                                onClick={() => handleSubcategoryClick(category.id, subcategory)}
                                className="block w-full text-left p-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    onCategorySelect('');
                    onClose();
                  }}
                  className="w-full p-3 text-center text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Ver todos los productos
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoryMenu;