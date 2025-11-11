/*
  # Agregar nuevas categorías de productos

  1. Nuevos productos por categoría
    - Tecnología: 5 productos (accesorios tech, gaming, etc.)
    - Arte y Diseño: 5 productos (materiales artísticos, herramientas)
    - Escolar: 5 productos (útiles escolares, mochilas, etc.)
    - Oficina: 5 productos (papelería, organización, etc.)
    - Universitario: 5 productos (material académico, tesis, etc.)

  2. Datos incluidos
    - Nombres descriptivos y específicos
    - Precios competitivos del mercado peruano
    - Categorías organizadas según el nuevo sistema
    - Stock variado y realista
    - URLs de imágenes de Pexels
    - Estado activo por defecto
*/

-- Insertar productos de TECNOLOGÍA
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
(
  'Mouse Pad Gaming RGB',
  'Mouse pad gaming con iluminación RGB personalizable. Base antideslizante de goma natural y superficie de tela suave para óptimo deslizamiento.',
  45.90,
  'tecnologia',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'RGB'],
  ARRAY['35x25cm', '40x30cm'],
  25,
  true
),
(
  'Soporte para Laptop Ajustable',
  'Soporte ergonómico para laptop con altura y ángulo ajustable. Fabricado en aluminio resistente con ventilación integrada.',
  89.90,
  'tecnologia',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Plateado', 'Negro'],
  ARRAY['Universal'],
  15,
  true
),
(
  'Hub USB-C Multipuerto',
  'Hub USB-C 7 en 1 con puertos USB 3.0, HDMI 4K, lector SD/microSD y carga rápida PD. Compatible con MacBook y laptops USB-C.',
  129.90,
  'tecnologia',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Gris espacial', 'Plateado'],
  ARRAY['Compacto'],
  20,
  true
),
(
  'Cargador Inalámbrico Rápido',
  'Cargador inalámbrico de 15W con tecnología Qi. Compatible con iPhone, Samsung y otros dispositivos. Incluye cable USB-C.',
  79.90,
  'tecnologia',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Blanco'],
  ARRAY['Standard'],
  30,
  true
),
(
  'Webcam HD 1080p',
  'Cámara web Full HD 1080p con micrófono integrado y enfoque automático. Ideal para videollamadas y streaming.',
  159.90,
  'tecnologia',
  'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro'],
  ARRAY['Standard'],
  18,
  true
);

-- Insertar productos de ARTE Y DISEÑO
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
(
  'Set de Lápices de Dibujo Profesional',
  'Set de 12 lápices de grafito profesionales desde 9H hasta 9B. Incluye difuminos, borrador amasable y sacapuntas.',
  34.90,
  'arte-diseño',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Natural'],
  ARRAY['Set 12 piezas'],
  40,
  true
),
(
  'Tableta Gráfica Digital',
  'Tableta gráfica de 10x6 pulgadas con 8192 niveles de presión. Incluye lápiz sin batería y software de diseño.',
  299.90,
  'arte-diseño',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro'],
  ARRAY['10x6 pulgadas'],
  12,
  true
),
(
  'Set de Acuarelas Profesionales',
  'Set de 24 colores de acuarela profesional en tubos de 12ml. Pigmentos de alta calidad con excelente luminosidad.',
  89.90,
  'arte-diseño',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Multicolor'],
  ARRAY['24 colores'],
  22,
  true
),
(
  'Papel Canson para Dibujo A3',
  'Block de papel Canson de 180g/m² ideal para técnicas secas. 20 hojas de textura media, libre de ácido.',
  25.90,
  'arte-diseño',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Blanco'],
  ARRAY['A3', 'A4'],
  35,
  true
),
(
  'Regla T Profesional 60cm',
  'Regla T de acrílico transparente de 60cm con graduación en milímetros. Ideal para dibujo técnico y arquitectónico.',
  45.90,
  'arte-diseño',
  'https://images.pexels.com/photos/1074131/pexels-photo-1074131.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Transparente'],
  ARRAY['60cm'],
  28,
  true
);

-- Insertar productos ESCOLARES
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
(
  'Cuaderno Universitario 100 Hojas',
  'Cuaderno universitario con espiral metálico, 100 hojas cuadriculadas de papel bond 75g. Tapa plastificada resistente.',
  8.90,
  'escolar',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Azul', 'Rojo', 'Verde', 'Negro'],
  ARRAY['A4'],
  100,
  true
),
(
  'Set de Útiles Escolares Completo',
  'Kit completo con lápices, colores, borrador, tajador, regla, compás y más. Todo lo necesario para el año escolar.',
  45.90,
  'escolar',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Multicolor'],
  ARRAY['Kit completo'],
  50,
  true
),
(
  'Mochila Escolar Ergonómica',
  'Mochila escolar con diseño ergonómico, tirantes acolchados y múltiples compartimentos. Resistente al agua.',
  89.90,
  'escolar',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Azul', 'Negro', 'Rosa', 'Verde'],
  ARRAY['Mediana', 'Grande'],
  30,
  true
),
(
  'Calculadora Científica Casio',
  'Calculadora científica con 252 funciones, pantalla de 2 líneas y alimentación dual (solar y batería).',
  129.90,
  'escolar',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro'],
  ARRAY['Standard'],
  25,
  true
),
(
  'Cartuchera Triple Compartimento',
  'Cartuchera de tela resistente con tres compartimentos y cierre. Perfecta para organizar útiles escolares.',
  24.90,
  'escolar',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Azul', 'Rosa', 'Negro', 'Verde'],
  ARRAY['Standard'],
  60,
  true
);

-- Insertar productos de OFICINA
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
(
  'Archivador A4 con Palanca',
  'Archivador de cartón forrado con mecanismo de palanca. Lomo de 7.5cm, ideal para documentos A4.',
  18.90,
  'oficina',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul', 'Rojo', 'Verde'],
  ARRAY['A4'],
  80,
  true
),
(
  'Organizador de Escritorio Bambú',
  'Organizador de escritorio de bambú natural con múltiples compartimentos para lápices, clips y documentos.',
  65.90,
  'oficina',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Natural'],
  ARRAY['Mediano', 'Grande'],
  20,
  true
),
(
  'Perforadora de 2 Huecos Heavy Duty',
  'Perforadora metálica resistente para hasta 30 hojas. Base antideslizante y guía ajustable para papel A4.',
  35.90,
  'oficina',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Gris'],
  ARRAY['Standard'],
  40,
  true
),
(
  'Papel Bond A4 75g (500 hojas)',
  'Resma de papel bond A4 de 75g/m², blancura 95%. Ideal para impresión y fotocopiado de alta calidad.',
  12.90,
  'oficina',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Blanco'],
  ARRAY['A4'],
  150,
  true
),
(
  'Agenda Ejecutiva 2024',
  'Agenda ejecutiva con planificador semanal, mensual y anual. Tapa dura con cierre elástico y bolsillo interior.',
  49.90,
  'oficina',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul marino', 'Marrón'],
  ARRAY['A5'],
  35,
  true
);

-- Insertar productos UNIVERSITARIOS
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
(
  'Folder Manila A4 (Pack 50)',
  'Pack de 50 folders manila A4 de 180g. Ideales para organizar documentos, trabajos y presentaciones universitarias.',
  15.90,
  'universitario',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Manila'],
  ARRAY['A4'],
  200,
  true
),
(
  'Anillado de Tesis Empastado',
  'Servicio de anillado con tapa dura personalizable. Incluye impresión de carátula y contracarátula.',
  25.90,
  'universitario',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Azul', 'Rojo', 'Verde'],
  ARRAY['A4'],
  100,
  true
),
(
  'Resaltadores Stabilo (Set 6)',
  'Set de 6 resaltadores Stabilo en colores fluorescentes. Punta biselada de 2-5mm, tinta a base de agua.',
  18.90,
  'universitario',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Multicolor'],
  ARRAY['Set 6 colores'],
  75,
  true
),
(
  'Portafolio Ejecutivo A4',
  'Portafolio ejecutivo de cuero sintético con cierre, calculadora incluida y múltiples compartimentos.',
  79.90,
  'universitario',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Negro', 'Marrón'],
  ARRAY['A4'],
  25,
  true
),
(
  'Separadores de Plástico A4 (12 pos)',
  'Juego de 12 separadores de plástico A4 con pestañas numeradas. Resistentes y reutilizables.',
  8.90,
  'universitario',
  'https://images.pexels.com/photos/6044198/pexels-photo-6044198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ARRAY['Multicolor', 'Transparente'],
  ARRAY['A4'],
  90,
  true
);