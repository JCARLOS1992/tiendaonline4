import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  X, 
  Calendar,
  User,
  Package,
  RefreshCw,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  Edit,
  Plus,
  Minus
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  print_job_id: string | null;
  quantity: number;
  unit_price: number;
  customization: any;
  product?: {
    id: string;
    name: string;
    image_url: string;
    category: string;
  } | null;
  print_job?: {
    id: string;
    file_url: string;
  } | null;
};

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  order_items?: OrderItem[];
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', icon: Clock, color: 'yellow' },
  { value: 'processing', label: 'En Proceso', icon: Package, color: 'blue' },
  { value: 'shipped', label: 'Enviado', icon: CheckCircle, color: 'purple' },
  { value: 'completed', label: 'Completado', icon: CheckCircle, color: 'green' },
  { value: 'cancelled', label: 'Cancelado', icon: X, color: 'red' },
] as const;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

// Security helpers
const sanitizeString = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim();
};

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const isValidStatus = (status: string): boolean => {
  return STATUS_OPTIONS.some(opt => opt.value === status);
};

const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Validate and apply status filter
    if (statusFilter !== 'all' && isValidStatus(statusFilter)) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sanitize and apply search filter
    if (searchTerm) {
      const sanitizedSearch = sanitizeString(searchTerm).toLowerCase();
      if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
        filtered = filtered.filter(order => {
          const userName = (order.user?.full_name || '').toLowerCase();
          const userEmail = (order.user?.email || '').toLowerCase();
          const orderId = order.id.toLowerCase();
          
          return userName.includes(sanitizedSearch) ||
                 userEmail.includes(sanitizedSearch) ||
                 (isValidUUID(order.id) && orderId.includes(sanitizedSearch));
        });
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Configuración de Supabase no encontrada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch orders with user data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users(id, email, full_name, phone, address)
        `)
        .order('created_at', { ascending: false })
        .limit(1000); // Prevent DoS

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Validate orders data
      const validOrders = (ordersData || [])
        .filter(order => 
          isValidUUID(order.id) &&
          isValidStatus(order.status) &&
          typeof order.total_amount === 'number' &&
          order.total_amount >= 0 &&
          typeof order.shipping_address === 'string' &&
          typeof order.payment_method === 'string'
        )
        .map(order => ({
          ...order,
          shipping_address: sanitizeString(order.shipping_address || ''),
          payment_method: sanitizeString(order.payment_method || ''),
        }));

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        validOrders.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(id, name, image_url, category),
              print_job:print_jobs(id, file_url)
            `)
            .eq('order_id', order.id)
            .limit(100); // Limit items per order

          let orderItems: OrderItem[] = [];
          if (!itemsError && itemsData) {
            orderItems = (itemsData || []).map((item: any) => ({
              id: item.id,
              order_id: item.order_id,
              product_id: item.product_id,
              print_job_id: item.print_job_id,
              quantity: Math.max(1, Math.min(item.quantity || 1, 1000)),
              unit_price: Math.max(0, typeof item.unit_price === 'number' ? item.unit_price : 0),
              customization: item.customization || null,
              product: item.product || null,
              print_job: item.print_job || null,
            }));
          }

          return {
            ...order,
            order_items: orderItems,
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isValidUUID(orderId) || !isValidStatus(newStatus)) {
      toast.error('Datos inválidos');
      return;
    }

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      toast.success('Estado del pedido actualizado');
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteOrderItem = async (itemId: string, orderId: string) => {
    if (!isValidUUID(itemId) || !isValidUUID(orderId)) {
      toast.error('ID inválido');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este item del pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingItemId(itemId);

      // Delete the order item
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting order item:', error);
        throw error;
      }

      // Recalculate order total
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const remainingItems = order.order_items?.filter(item => item.id !== itemId) || [];
        const newTotal = remainingItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // Update order total
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            total_amount: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order total:', updateError);
        }
      }

      toast.success('Item eliminado del pedido');
      await fetchOrders();
      
      // Update selected order if open
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({
            ...updatedOrder,
            order_items: updatedOrder.order_items?.filter(item => item.id !== itemId) || [],
          });
        }
      }
    } catch (error: any) {
      console.error('Error deleting order item:', error);
      toast.error('Error al eliminar el item del pedido');
    } finally {
      setDeletingItemId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!isValidUUID(orderId)) {
      toast.error('ID de pedido inválido');
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast.error('Pedido no encontrado');
      return;
    }

    const itemCount = order.order_items?.length || 0;
    const confirmMessage = itemCount > 0
      ? `¿Estás seguro de que deseas eliminar este pedido?\n\nEste pedido tiene ${itemCount} ${itemCount === 1 ? 'item' : 'items'} asociados que también serán eliminados.\n\nEsta acción no se puede deshacer.`
      : '¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);

      // Delete order items first (should cascade, but explicit is safer)
      if (order.order_items && order.order_items.length > 0) {
        const itemIds = order.order_items.map(item => item.id);
        for (const itemId of itemIds) {
          if (isValidUUID(itemId)) {
            const { error: itemError } = await supabase
              .from('order_items')
              .delete()
              .eq('id', itemId);

            if (itemError) {
              console.warn('Error deleting order item:', itemError);
            }
          }
        }
      }

      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }

      toast.success('Pedido eliminado correctamente');
      await fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setIsModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      console.error('Error deleting order:', error);
      
      if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        toast.error('No se puede eliminar el pedido porque tiene relaciones activas');
      } else {
        toast.error('Error al eliminar el pedido');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return { total, pending, processing, completed, totalRevenue };
  }, [orders]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">Administra y gestiona todos los pedidos de productos</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <RefreshCw size={20} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.processing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-semibold text-gray-900">S/ {stats.totalRevenue.toFixed(2)}</p>
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
              placeholder="Buscar por cliente, email o ID de pedido..."
              value={searchTerm}
              onChange={(e) => {
                const value = sanitizeString(e.target.value);
                if (value.length <= 100) {
                  setSearchTerm(value);
                }
              }}
              maxLength={100}
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Buscar pedidos"
            />
          </div>
          
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'all' || isValidStatus(value)) {
                  setStatusFilter(value);
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Configuración de Supabase requerida</h3>
              <p className="text-sm text-red-700 mt-1">
                Por favor, configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Pedido
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : !isSupabaseConfigured() ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Supabase no está configurado. Por favor, configura las variables de entorno.
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    {orders.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron pedidos con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">
                        {order.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="text-gray-400 mr-2" size={16} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.user?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-gray-500">{order.user?.email || 'Sin email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        S/ {order.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                          aria-label="Ver detalles del pedido"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          disabled={isDeleting || !isSupabaseConfigured()}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar pedido"
                          aria-label="Eliminar pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
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
                <h2 id="modal-title" className="text-xl font-semibold">Detalles del Pedido</h2>
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
                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Package className="mr-2" size={18} />
                      Información del Pedido
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">ID del Pedido:</span>
                        <p className="text-sm text-gray-900 font-mono">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fecha:</span>
                        <p className="text-sm text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estado:</span>
                        <p className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                            {getStatusLabel(selectedOrder.status)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Total:</span>
                        <p className="text-sm text-gray-900 font-semibold">S/ {selectedOrder.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Método de pago:</span>
                        <p className="text-sm text-gray-900">{selectedOrder.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="mr-2" size={18} />
                      Información del Cliente
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nombre:</span>
                        <p className="text-sm text-gray-900">{selectedOrder.user?.full_name || 'No especificado'}</p>
                      </div>
                      {selectedOrder.user?.email && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <div className="flex items-center">
                            <p className="text-sm text-gray-900 mr-2">{selectedOrder.user.email}</p>
                            <a
                              href={`mailto:${selectedOrder.user.email}`}
                              className="text-blue-500 hover:text-blue-700"
                              title="Enviar email"
                              rel="noopener noreferrer"
                            >
                              <Mail size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                      {selectedOrder.user?.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                          <div className="flex items-center">
                            <p className="text-sm text-gray-900 mr-2">{selectedOrder.user.phone}</p>
                            <a
                              href={`tel:${selectedOrder.user.phone.replace(/[^0-9+]/g, '')}`}
                              className="text-blue-500 hover:text-blue-700"
                              title="Llamar"
                              rel="noopener noreferrer"
                            >
                              <Phone size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="mr-2" size={18} />
                    Dirección de Envío
                  </h3>
                  <p className="text-sm text-gray-700">
                    {selectedOrder.shipping_address || 'No especificada'}
                  </p>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ShoppingCart className="mr-2" size={18} />
                    Items del Pedido ({selectedOrder.order_items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                          {item.product && item.product.image_url && isValidUrl(item.product.image_url) && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg mr-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            {item.product ? (
                              <>
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-sm text-gray-500">Producto • {item.product.category}</p>
                                {item.customization && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Personalización: {JSON.stringify(item.customization)}
                                  </p>
                                )}
                              </>
                            ) : item.print_job ? (
                              <>
                                <p className="font-medium text-gray-900">Servicio de Impresión</p>
                                <p className="text-sm text-gray-500">Impresión personalizada</p>
                              </>
                            ) : (
                              <p className="font-medium text-gray-900">Item sin información</p>
                            )}
                          </div>
                          <div className="text-right mr-4">
                            <p className="font-medium text-gray-900">Cantidad: {item.quantity}</p>
                            <p className="text-sm text-gray-500">Precio unit: S/ {item.unit_price.toFixed(2)}</p>
                            <p className="font-semibold text-primary-500">Subtotal: S/ {(item.quantity * item.unit_price).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => deleteOrderItem(item.id, selectedOrder.id)}
                            disabled={deletingItemId === item.id || isDeleting}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar item del pedido"
                          >
                            {deletingItemId === item.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No hay items en este pedido</p>
                    )}
                  </div>
                  
                  {/* Delete all items warning */}
                  {selectedOrder.order_items && selectedOrder.order_items.length === 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <AlertCircle className="mr-2" size={16} />
                        Este pedido no tiene items. Puedes eliminarlo si ya no es necesario.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {/* Status Update Dropdown */}
                  {isSupabaseConfigured() && (
                    <div className="relative">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (isValidStatus(newStatus)) {
                            updateOrderStatus(selectedOrder.id, newStatus);
                          }
                        }}
                        disabled={isUpdating}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.value === selectedOrder.status ? `Estado: ${status.label}` : `Cambiar a: ${status.label}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    disabled={isDeleting || !isSupabaseConfigured()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="mr-2" size={16} />
                    Eliminar pedido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;

