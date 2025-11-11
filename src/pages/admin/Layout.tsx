import React, { ReactNode, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, Users, Settings, LogOut, Printer } from 'lucide-react';
import { checkAdminAccess } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type AdminLayoutProps = {
  children: ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      const isAdmin = await checkAdminAccess();
      if (!isAdmin) {
        toast.error('Acceso no autorizado');
        navigate('/admin/login');
      }
    };

    checkAccess();
  }, [navigate]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <Package size={20} />, label: 'Productos', path: '/admin/products' },
    { icon: <Printer size={20} />, label: 'Impresiones', path: '/admin/print-orders' },
    { icon: <FileText size={20} />, label: 'Pedidos', path: '/admin/orders' },
    { icon: <Users size={20} />, label: 'Usuarios', path: '/admin/users' },
    { icon: <Settings size={20} />, label: 'Configuración', path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/admin/login');
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <Link to="/admin" className="text-xl font-bold flex items-center">
            <span className="text-primary-500">Jube</span>
            <span className="text-accent-500">Tech</span>
            <span className="text-sm text-gray-500 ml-2">Admin</span>
          </Link>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md w-full transition-colors"
            >
              <LogOut size={20} />
              <span className="ml-3">Cerrar sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;