/*
  # Enhance print_jobs table for admin management

  1. Changes
    - Add double_sided column if not exists
    - Add customer_info JSONB column if not exists
    - Make user_id nullable for anonymous customers
    - Update RLS policies to support anonymous access and admin management

  2. Security
    - Allow anonymous users to create print jobs
    - Allow authenticated users to read/update their own jobs
    - Allow admins full access to all print jobs
*/

-- Agregar campo double_sided si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'print_jobs' AND column_name = 'double_sided'
  ) THEN
    ALTER TABLE print_jobs ADD COLUMN double_sided BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Agregar campo customer_info si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'print_jobs' AND column_name = 'customer_info'
  ) THEN
    ALTER TABLE print_jobs ADD COLUMN customer_info JSONB;
  END IF;
END $$;

-- Hacer user_id nullable para permitir clientes anónimos
DO $$
BEGIN
  -- Check if the column is currently NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'print_jobs' 
    AND column_name = 'user_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE print_jobs ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- Eliminar todas las políticas existentes de print_jobs
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'print_jobs' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON print_jobs';
    END LOOP;
END $$;

-- Crear nuevas políticas

-- Permitir inserción pública (para clientes anónimos)
CREATE POLICY "print_jobs_insert" ON print_jobs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir a usuarios autenticados ver sus propios trabajos o a admins ver todos
CREATE POLICY "print_jobs_select" ON print_jobs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Permitir a usuarios autenticados actualizar sus propios trabajos o a admins actualizar todos
CREATE POLICY "print_jobs_update" ON print_jobs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Permitir a administradores eliminar trabajos
CREATE POLICY "print_jobs_delete" ON print_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Permitir acceso anónimo para crear trabajos de impresión
CREATE POLICY "Allow anonymous print job creation" ON print_jobs
  FOR INSERT
  TO anon
  WITH CHECK (true);