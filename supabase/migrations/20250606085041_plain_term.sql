/*
  # Agregar productos de muestra

  1. Productos de muestra
    - Polos personalizados
    - Tazas con diseño
    - Libretas personalizadas
    - Cuadros decorativos
    - Accesorios varios

  2. Datos incluidos
    - Nombres descriptivos
    - Precios competitivos
    - Descripciones detalladas
    - Categorías organizadas
    - Stock variado
    - Colores y tallas disponibles
    - URLs de imágenes de Pexels
    - Estado activo por defecto
*/

-- Insertar productos de muestra
INSERT INTO products (
  name,
  description,
  price,
  category,
  image_url,
  available_colors,
  available_sizes,
  stock,
  is_active
) VALUES
-- Polos
(
  'Polo Personalizado Premium',
  'Polo de algodón 100% peinado de alta calidad. Perfecto para estampados personalizados, logos empresariales o diseños únicos. Tela suave y resistente al lavado.',
  49.90,
  'Polos',
  'https://images.pexels.com/photos/5709667/pexels-photo-5709667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco', 'Azul marino', 'Gris', 'Rojo'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  50,
  true
),
(
  'Polo Básico Personalizable',
  'Polo clásico de algodón ideal para personalización. Excelente relación calidad-precio. Disponible en múltiples colores y tallas.',
  35.90,
  'Polos',
  'https://images.pexels.com/photos/5384429/pexels-photo-5384429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco', 'Azul', 'Verde', 'Amarillo'],
  ARRAY['S', 'M', 'L', 'XL'],
  75,
  true
),
(
  'Polo Deportivo Dri-Fit',
  'Polo deportivo con tecnología que absorbe la humedad. Ideal para equipos deportivos, eventos corporativos o uso casual activo.',
  59.90,
  'Polos',
  'https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco', 'Azul royal', 'Rojo', 'Verde'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  30,
  true
),

-- Tazas
(
  'Taza Cerámica Personalizada',
  'Taza de cerámica de 11 oz con acabado brillante. Perfecta para sublimación y diseños personalizados. Apta para microondas y lavavajillas.',
  29.90,
  'Tazas',
  'https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Blanco', 'Negro', 'Azul', 'Rojo'],
  ARRAY['11 oz', '15 oz'],
  100,
  true
),
(
  'Termo Personalizado Acero Inoxidable',
  'Termo de acero inoxidable de doble pared que mantiene las bebidas calientes por 12 horas y frías por 24 horas. Ideal para personalización con láser.',
  79.90,
  'Tazas',
  'https://images.pexels.com/photos/1342529/pexels-photo-1342529.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Plateado', 'Negro', 'Azul', 'Rosa'],
  ARRAY['500ml', '750ml'],
  25,
  true
),
(
  'Taza Mágica Cambia Color',
  'Taza que cambia de color con el calor. Revela tu diseño personalizado cuando se llena con líquido caliente. Efecto sorprendente garantizado.',
  39.90,
  'Tazas',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul oscuro'],
  ARRAY['11 oz'],
  40,
  true
),

-- Libretas
(
  'Libreta Ejecutiva Personalizada',
  'Libreta de tapa dura con 200 páginas rayadas. Papel bond de 90g. Perfecta para empresas, eventos o regalos corporativos personalizados.',
  34.90,
  'Libretas',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul', 'Rojo', 'Verde', 'Marrón'],
  ARRAY['A4', 'A5'],
  60,
  true
),
(
  'Cuaderno Espiral Personalizable',
  'Cuaderno con espiral metálico y tapa plastificada. 100 hojas cuadriculadas. Ideal para estudiantes y profesionales.',
  19.90,
  'Libretas',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Blanco', 'Azul', 'Rojo', 'Verde'],
  ARRAY['A4', 'A5', 'A6'],
  80,
  true
),
(
  'Agenda Personalizada 2024',
  'Agenda anual con planificador semanal y mensual. Tapa dura personalizable. Incluye páginas para notas y contactos.',
  45.90,
  'Libretas',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul marino', 'Rojo', 'Verde'],
  ARRAY['A4', 'A5'],
  35,
  true
),

-- Cuadros
(
  'Cuadro Canvas Personalizado',
  'Impresión en canvas de alta calidad montado en bastidor de madera. Colores vibrantes y duraderos. Perfecto para decoración personalizada.',
  89.90,
  'Cuadros',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Canvas natural'],
  ARRAY['20x30cm', '30x40cm', '40x60cm', '50x70cm'],
  20,
  true
),
(
  'Cuadro Acrílico Moderno',
  'Impresión en acrílico de 3mm con colores brillantes y acabado premium. Incluye sistema de montaje invisible.',
  129.90,
  'Cuadros',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Transparente'],
  ARRAY['20x30cm', '30x40cm', '40x60cm'],
  15,
  true
),
(
  'Cuadro Marco Madera',
  'Fotografía enmarcada en marco de madera natural. Vidrio anti-reflejo incluido. Ideal para fotos familiares o arte personalizado.',
  69.90,
  'Cuadros',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Madera natural', 'Madera oscura', 'Blanco'],
  ARRAY['15x20cm', '20x30cm', '30x40cm'],
  25,
  true
),

-- Accesorios
(
  'Mouse Pad Personalizado',
  'Mouse pad de goma antideslizante con superficie lisa para óptimo deslizamiento. Base de goma natural que se adhiere a cualquier superficie.',
  24.90,
  'Accesorios',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco'],
  ARRAY['20x24cm', '25x30cm'],
  50,
  true
),
(
  'Llavero Acrílico Personalizado',
  'Llavero de acrílico transparente de 3mm con impresión a full color. Incluye argolla metálica resistente.',
  12.90,
  'Accesorios',
  'https://images.pexels.com/photos/8367221/pexels-photo-8367221.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Transparente', 'Blanco'],
  ARRAY['5x5cm', '6x4cm', '7x5cm'],
  100,
  true
),
(
  'Stickers Personalizados Vinilo',
  'Stickers de vinilo resistente al agua y UV. Perfectos para laptops, autos, botellas. Corte personalizado disponible.',
  8.90,
  'Accesorios',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Blanco', 'Transparente'],
  ARRAY['5x5cm', '10x10cm', '15x15cm'],
  200,
  true
),
(
  'Gorra Personalizable',
  'Gorra de algodón con visera curva. Cierre ajustable. Perfecta para bordados y estampados. Ideal para equipos y empresas.',
  39.90,
  'Accesorios',
  'https://images.pexels.com/photos/5709667/pexels-photo-5709667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco', 'Azul marino', 'Rojo'],
  ARRAY['Ajustable'],
  45,
  true
),
(
  'Bolsa Ecológica Personalizada',
  'Bolsa de tela de algodón 100% natural. Resistente y reutilizable. Perfecta para estampados ecológicos y promocionales.',
  18.90,
  'Accesorios',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Natural', 'Blanco', 'Negro'],
  ARRAY['35x40cm', '40x45cm'],
  70,
  true
);