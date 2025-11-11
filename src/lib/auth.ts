import { supabase } from './supabase';

export const checkAdminAccess = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // First check if the user email matches the admin email from env vars
    if (user.email === import.meta.env.VITE_ADMIN_EMAIL) {
      return true;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin access:', error);
        // Fallback to env var check if database query fails
        return user.email === import.meta.env.VITE_ADMIN_EMAIL;
      }
      
      return userData?.is_admin || false;
    } catch (dbError) {
      console.error('Database error in checkAdminAccess:', dbError);
      // Fallback to env var check if database query fails
      return user.email === import.meta.env.VITE_ADMIN_EMAIL;
    }
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};