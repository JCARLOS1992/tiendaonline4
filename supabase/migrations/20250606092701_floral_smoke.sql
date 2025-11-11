/*
  # Configurar Storage para productos

  1. Crear bucket para productos
  2. Configurar políticas de acceso
  3. Permitir subida de imágenes para administradores
*/

-- Crear bucket para productos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir a todos ver las imágenes públicas
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Política para permitir a usuarios autenticados subir imágenes
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados actualizar sus imágenes
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados eliminar imágenes
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);