import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'customer'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Apply type filter
    if (filterType === 'admin') {
      filtered = filtered.filter(user => user.is_admin);
    } else if (filterType === 'customer') {
      filtered = filtered.filter(user => !user.is_admin);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const name = (user.full_name || '').toLowerCase();
        const email = user.email.toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        return name.includes(term) || email.includes(term) || phone.includes(term);
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterType]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Configuración de Supabase no encontrada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Obtener solo usuarios con login real (excluir temporales/invitados)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .not('email', 'like', '%@guest.jubetech.com%')
        .not('email', 'like', '%@temp.com%')
        .not('email', 'like', '%venta-fisica-%')
        .not('email', 'ilike', '%guest_%')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Filtrar usuarios temporales/invitados y validar datos
      const validUsers = (data || []).filter(user => {
        if (!user.id || !user.email) return false;
        
        const email = user.email.toLowerCase();
        
        // Excluir usuarios temporales
        if (
          email.includes('@guest.jubetech.com') ||
          email.includes('@temp.com') ||
          email.includes('venta-fisica-') ||
          email.includes('guest_') ||
          email.startsWith('venta-fisica')
        ) {
          return false;
        }
        
        // Solo incluir usuarios con email válido (formato de email real)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return false;
        }
        
        return typeof user.is_admin === 'boolean';
      });

      setUsers(validUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar los usuarios');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('users')
        .update({ 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      toast.success(`Usuario ${isAdmin ? 'promovido a' : 'removido de'} administrador`);
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_admin: isAdmin, updated_at: new Date().toISOString() }
          : user
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, is_admin: isAdmin } : null);
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar el usuario');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateUserInfo = async (userId: string, updates: Partial<User>) => {
    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('users')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      toast.success('Usuario actualizado correctamente');
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...updates, updated_at: new Date().toISOString() }
          : user
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
      }
      
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar el usuario');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.is_admin) {
      toast.error('No se puede eliminar un usuario administrador');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.email}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }

      toast.success('Usuario eliminado correctamente');
      await fetchUsers();
      
      if (selectedUser?.id === userId) {
        setIsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.is_admin).length;
    const customers = users.filter(u => !u.is_admin).length;
    return { total, admins, customers };
  }, [users]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra todos los usuarios registrados con login</p>
        </div>
        <button
          onClick={fetchUsers}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Configuración de Supabase requerida</h3>
              <p className="text-sm text-red-700 mt-1">
                Por favor, configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.customers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxLength={100}
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Buscar usuarios"
            />
          </div>
          
          <div className="lg:w-48 flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'admin' | 'customer')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Filtrar por tipo"
            >
              <option value="all">Todos</option>
              <option value="admin">Administradores</option>
              <option value="customer">Clientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : !isSupabaseConfigured() ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Supabase no está configurado. Por favor, configura las variables de entorno.
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.phone && (
                          <div className="flex items-center mb-1">
                            <Phone className="mr-2 text-gray-400" size={14} />
                            {user.phone}
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center">
                            <MapPin className="mr-2 text-gray-400" size={14} />
                            <span className="max-w-xs truncate">{user.address}</span>
                          </div>
                        )}
                        {!user.phone && !user.address && (
                          <span className="text-gray-400">Sin información</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_admin
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_admin ? (
                          <>
                            <Shield className="mr-1" size={12} />
                            Administrador
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1" size={12} />
                            Cliente
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(user.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                          aria-label="Ver detalles del usuario"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar usuario"
                          aria-label="Editar usuario"
                        >
                          <Edit size={16} />
                        </button>
                        {!user.is_admin && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            disabled={isDeleting}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar usuario"
                            aria-label="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 id="modal-title" className="text-xl font-semibold">Detalles del Usuario</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="mr-2" size={18} />
                      Información del Usuario
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nombre:</span>
                        <p className="text-sm text-gray-900">{selectedUser.full_name || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tipo:</span>
                        <p className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedUser.is_admin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedUser.is_admin ? 'Administrador' : 'Cliente'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Phone className="mr-2" size={18} />
                      Información de Contacto
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                        <p className="text-sm text-gray-900">{selectedUser.phone || 'No especificado'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Dirección:</span>
                        <p className="text-sm text-gray-900">{selectedUser.address || 'No especificada'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fecha de registro:</span>
                        <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {isSupabaseConfigured() && (
                    <>
                      {selectedUser.is_admin ? (
                        <button
                          onClick={() => updateUserAdminStatus(selectedUser.id, false)}
                          disabled={isUpdating}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                          <UserX className="mr-2" size={16} />
                          Remover como Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserAdminStatus(selectedUser.id, true)}
                          disabled={isUpdating}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                          <Shield className="mr-2" size={16} />
                          Promover a Admin
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingUser(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Editar Usuario</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  updateUserInfo(editingUser.id, {
                    full_name: formData.get('full_name') as string || null,
                    phone: formData.get('phone') as string || null,
                    address: formData.get('address') as string || null,
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={editingUser.full_name || ''}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser.phone || ''}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="address"
                    defaultValue={editingUser.address || ''}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;

