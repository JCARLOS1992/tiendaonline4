/*
  # Configurar Storage para productos

  1. Crear bucket 'products' si no existe
  2. Configurar políticas de acceso
  3. Habilitar acceso público para lectura
  4. Permitir operaciones CRUD para usuarios autenticados
*/

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Crear bucket para productos si no existe
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'products', 
    'products', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  );
EXCEPTION WHEN unique_violation THEN
  -- El bucket ya existe, actualizar configuración
  UPDATE storage.buckets 
  SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  WHERE id = 'products';
END $$;

-- Política para acceso público de lectura
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Política para que usuarios autenticados puedan subir
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Política para que usuarios autenticados puedan actualizar
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Política para que usuarios autenticados puedan eliminar
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Verificar que el bucket se creó correctamente
DO $$
DECLARE
  bucket_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'products') INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Bucket "products" configurado correctamente';
  ELSE
    RAISE EXCEPTION 'Error: No se pudo crear el bucket "products"';
  END IF;
END $$;