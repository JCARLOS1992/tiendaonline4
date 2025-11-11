import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Create a fallback client that won't crash the app if env vars are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key');
};

// Helper function to get configuration status
export const getSupabaseConfigStatus = () => {
  return {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    isConfigured: isSupabaseConfigured()
  };
};

// Helper function to check database connection and tables
export const checkDatabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase no está configurado correctamente'
      };
    }

    // Check if products table exists and has data
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          error: 'La tabla de productos no existe. Por favor, ejecuta las migraciones de la base de datos.'
        };
      }
      throw error;
    }

    return {
      success: true,
      count: data?.[0]?.count || 0
    };
  } catch (error: any) {
    console.error('Error checking database connection:', error);
    return {
      success: false,
      error: error.message || 'Error al conectar con la base de datos'
    };
  }
};