/*
  # Eliminar usuario administrador

  1. Cambios
    - Elimina el usuario administrador de la tabla auth.users
    - Elimina el perfil del usuario de la tabla public.users
    - Limpia cualquier referencia relacionada

  2. Seguridad
    - Solo elimina el usuario específico admin@jubetech.com
    - Mantiene la integridad referencial
*/

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Obtener el ID del usuario administrador
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@jubetech.com';

  -- Si el usuario existe, eliminarlo
  IF admin_user_id IS NOT NULL THEN
    -- Primero eliminar de la tabla public.users
    DELETE FROM public.users WHERE id = admin_user_id;
    
    -- Luego eliminar de auth.users
    DELETE FROM auth.users WHERE id = admin_user_id;
    
    -- También eliminar de auth.identities si existe
    DELETE FROM auth.identities WHERE user_id = admin_user_id;
    
    RAISE NOTICE 'Usuario administrador eliminado correctamente';
  ELSE
    RAISE NOTICE 'Usuario administrador no encontrado';
  END IF;
END $$;