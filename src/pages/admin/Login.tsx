import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { AuthError } from '@supabase/supabase-js';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if admin credentials are configured
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        throw new Error('Las credenciales de administrador no están configuradas. Por favor, configura VITE_ADMIN_EMAIL y VITE_ADMIN_PASSWORD en tu archivo .env');
      }

      // First validate against environment variables
      if (email !== adminEmail || password !== adminPassword) {
        throw new Error('Credenciales inválidas');
      }

      // If credentials match admin env vars, proceed with authentication
      if (email === adminEmail && password === adminPassword) {
        // Check if Supabase is properly configured
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured, using fallback authentication');
          toast.success('Acceso concedido (modo de emergencia - Supabase no configurado)');
          navigate('/admin/products');
          return;
        }

        try {
          // Attempt Supabase authentication
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            // Check if it's a server error (500) or schema error
            if (error.message.includes('Database error querying schema') || 
                error.message.includes('unexpected_failure') ||
                error.message.includes('Failed to fetch') ||
                error.status === 500) {
              console.warn('Supabase authentication service unavailable, using fallback authentication');
              toast.success('Acceso concedido (modo de emergencia)');
              navigate('/admin/products');
              return;
            }
            throw error;
          }

          if (data.user) {
            // Wait a moment for the session to be fully established
            await new Promise(resolve => setTimeout(resolve, 100));

            // Since credentials match admin env vars, we always grant access
            // and ensure the user is marked as admin in the database
            try {
              // Try to upsert the admin user to ensure they have admin privileges
              const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                  id: data.user.id,
                  email: data.user.email,
                  is_admin: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id'
                });

              if (upsertError) {
                console.error('Error updating admin user:', upsertError);
                // Still allow access since credentials are valid
              }
            } catch (dbError) {
              console.error('Database error while updating admin status:', dbError);
              // Still allow access since credentials are valid
            }

            // Always grant access for matching admin credentials
            navigate('/admin/products');
            toast.success('Bienvenido al panel de administración');
          }
        } catch (authError) {
          console.error('Supabase authentication error:', authError);
          
          // Check if it's a server/schema error and provide fallback
          if (authError instanceof Error && 
              (authError.message.includes('Database error querying schema') || 
               authError.message.includes('unexpected_failure') ||
               authError.message.includes('Failed to fetch') ||
               authError.message.includes('500'))) {
            console.warn('Supabase service unavailable, using credential-based fallback');
            toast.success('Acceso concedido (servicio de autenticación temporalmente no disponible)');
            navigate('/admin/products');
            return;
          }
          
          throw authError;
        }
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      
      if (error instanceof AuthError) {
        switch (error.message) {
          case 'Invalid login credentials':
            toast.error('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
            break;
          case 'Email not confirmed':
            toast.error('Por favor, confirma tu correo electrónico antes de iniciar sesión.');
            break;
          default:
            if (error.message.includes('Database error querying schema') || 
                error.message.includes('unexpected_failure') ||
                error.message.includes('Failed to fetch')) {
              toast.error('Servicio de autenticación temporalmente no disponible. Por favor, intenta más tarde o contacta al soporte técnico.');
            } else {
              toast.error(`Error de autenticación: ${error.message}`);
            }
        }
      } else if (error instanceof Error) {
        if (error.message.includes('Database error querying schema') || 
            error.message.includes('unexpected_failure') ||
            error.message.includes('Failed to fetch')) {
          toast.error('Servicio de autenticación temporalmente no disponible. Por favor, intenta más tarde.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check configuration status
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            <span className="text-primary-500">Jube</span>
            <span className="text-accent-500">Tech</span>
            <span className="block text-xl mt-2">Panel de Administración</span>
          </h2>
        </div>

        {/* Configuration Status */}
        {(!adminEmail || !adminPassword || !supabaseConfigured) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium mb-2">Configuración requerida</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {!adminEmail && (
                <li>• Falta VITE_ADMIN_EMAIL en el archivo .env</li>
              )}
              {!adminPassword && (
                <li>• Falta VITE_ADMIN_PASSWORD en el archivo .env</li>
              )}
              {!supabaseConfigured && (
                <li>• Falta configuración de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)</li>
              )}
            </ul>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={adminEmail ? 'Ingresa tu email de administrador' : 'Email no configurado'}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={adminPassword ? 'Ingresa tu contraseña' : 'Contraseña no configurada'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !adminEmail || !adminPassword}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              (isLoading || !adminEmail || !adminPassword) ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Si experimentas problemas de conexión, el sistema puede usar un modo de acceso de emergencia para administradores autorizados.
          </p>
          {!supabaseConfigured && (
            <p className="text-sm text-blue-700 mt-2">
              Para funcionalidad completa, configura las variables de entorno de Supabase en tu archivo .env
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;