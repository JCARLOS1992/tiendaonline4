import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Printer,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .limit(100);

      // Fetch print jobs
      const { data: printJobsData } = await supabase
        .from('print_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setOrders(ordersData || []);
      setProducts(productsData || []);
      setPrintJobs(printJobsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;
    const totalPrintJobs = printJobs.length;
    const pendingPrintJobs = printJobs.filter(p => p.status === 'pending').length;

    // Calculate revenue for last 7 and 30 days
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const revenue7Days = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= last7Days && o.status === 'completed';
      })
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const revenue30Days = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= last30Days && o.status === 'completed';
      })
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Recent orders (last 5)
    const recentOrders = orders.slice(0, 5);

    // Top products (by order items count)
    const productSales: { [key: string]: number } = {};
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        if (item.product_id) {
          productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, sales]) => {
        const product = products.find(p => p.id === productId);
        return { product, sales };
      })
      .filter(item => item.product);

    return {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        revenue: totalRevenue,
        revenue7Days,
        revenue30Days,
        recent: recentOrders
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      printJobs: {
        total: totalPrintJobs,
        pending: pendingPrintJobs
      },
      topProducts
    };
  }, [orders, products, printJobs]);

  // Sales chart data (last 7 days)
  const salesChartData = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= date && orderDate < nextDate && o.status === 'completed';
        })
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      days.push({
        date: date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }
    
    return days;
  }, [orders]);

  const maxRevenue = Math.max(...salesChartData.map(d => d.revenue), 1);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general del negocio</p>
        </div>
        <Link
          to="/admin/products"
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Package className="mr-2" size={18} />
          Gestionar Productos
        </Link>
      </div>

      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">S/ {stats.orders.revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 días: S/ {stats.orders.revenue30Days.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.orders.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.orders.pending} pendientes • {stats.orders.processing} en proceso
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.products.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.products.active} activos • {stats.products.lowStock} con stock bajo
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Print Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Impresiones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.printJobs.total}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.printJobs.pending} pendientes</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Printer className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Ventas últimos 7 días
            </h2>
            <span className="text-sm text-gray-500">S/ {stats.orders.revenue7Days.toFixed(2)}</span>
          </div>
          <div className="space-y-3">
            {salesChartData.map((day, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-xs text-gray-600">{day.date}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-primary-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    >
                      {day.revenue > 0 && (
                        <span className="text-xs text-white font-medium">S/ {day.revenue.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Productos Más Vendidos
            </h2>
            <Link
              to="/admin/products"
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center"
            >
              Ver todos
              <ArrowRight className="ml-1" size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((item, index) => (
                <div key={item.product?.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{item.product?.category || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-gray-900">{item.sales} vendidos</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay datos de ventas aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="mr-2" size={20} />
              Pedidos Recientes
            </h2>
            <Link
              to="/admin/orders"
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center"
            >
              Ver todos
              <ArrowRight className="ml-1" size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.orders.recent.length > 0 ? (
              stats.orders.recent.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/orders"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Pedido #{order.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('es-PE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">S/ {order.total_amount?.toFixed(2) || '0.00'}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendiente' :
                         order.status === 'processing' ? 'En Proceso' :
                         order.status === 'completed' ? 'Completado' :
                         order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay pedidos recientes</p>
            )}
          </div>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Alertas y Acciones Rápidas
            </h2>
          </div>
          <div className="space-y-3">
            {stats.orders.pending > 0 && (
              <Link
                to="/admin/orders"
                className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center">
                  <Clock className="text-yellow-600 mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {stats.orders.pending} pedido{stats.orders.pending !== 1 ? 's' : ''} pendiente{stats.orders.pending !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Requieren atención</p>
                  </div>
                  <ArrowRight className="text-gray-400" size={16} />
                </div>
              </Link>
            )}

            {stats.products.lowStock > 0 && (
              <Link
                to="/admin/products"
                className="block p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="text-orange-600 mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {stats.products.lowStock} producto{stats.products.lowStock !== 1 ? 's' : ''} con stock bajo
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Revisar inventario</p>
                  </div>
                  <ArrowRight className="text-gray-400" size={16} />
                </div>
              </Link>
            )}

            {stats.printJobs.pending > 0 && (
              <Link
                to="/admin/print-orders"
                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Printer className="text-blue-600 mr-3" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {stats.printJobs.pending} pedido{stats.printJobs.pending !== 1 ? 's' : ''} de impresión pendiente{stats.printJobs.pending !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Revisar impresiones</p>
                  </div>
                  <ArrowRight className="text-gray-400" size={16} />
                </div>
              </Link>
            )}

            {stats.orders.pending === 0 && stats.products.lowStock === 0 && stats.printJobs.pending === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-3" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Todo en orden</p>
                    <p className="text-xs text-gray-600 mt-1">No hay alertas pendientes</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/orders"
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex items-center justify-between"
        >
          <div className="flex items-center">
            <ShoppingCart className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="font-medium text-gray-900">Gestión de Pedidos</p>
              <p className="text-sm text-gray-500">Ver y gestionar todos los pedidos</p>
            </div>
          </div>
          <ArrowRight className="text-gray-400" size={20} />
        </Link>

        <Link
          to="/admin/products"
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex items-center justify-between"
        >
          <div className="flex items-center">
            <Package className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="font-medium text-gray-900">Gestión de Productos</p>
              <p className="text-sm text-gray-500">Administrar catálogo</p>
            </div>
          </div>
          <ArrowRight className="text-gray-400" size={20} />
        </Link>

        <Link
          to="/admin/print-orders"
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex items-center justify-between"
        >
          <div className="flex items-center">
            <Printer className="text-orange-600 mr-3" size={24} />
            <div>
              <p className="font-medium text-gray-900">Pedidos de Impresión</p>
              <p className="text-sm text-gray-500">Gestionar impresiones</p>
            </div>
          </div>
          <ArrowRight className="text-gray-400" size={20} />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

