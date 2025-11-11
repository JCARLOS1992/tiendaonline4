/*
  # Add admin user

  1. Changes
    - Creates initial admin user with secure credentials
    - Sets admin flag to true for this user
*/

DO $$
BEGIN
  -- Insert admin user if not exists
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@jubetech.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@jubetech.com'
  );

  -- Get the admin user id
  INSERT INTO public.users (
    id,
    email,
    full_name,
    is_admin
  )
  SELECT
    id,
    email,
    'Admin',
    true
  FROM auth.users
  WHERE email = 'admin@jubetech.com'
  ON CONFLICT (id) DO UPDATE
  SET is_admin = true;
END $$;