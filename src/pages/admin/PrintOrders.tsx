import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  Printer, 
  X, 
  FileText,
  Calendar,
  User,
  Settings,
  RefreshCw,
  AlertCircle,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

type PrintJob = {
  id: string;
  user_id: string | null;
  file_url: string;
  paper_type: string;
  color: boolean;
  size: string;
  copies: number;
  double_sided: boolean;
  notes: string | null;
  status: string;
  price: number;
  created_at: string;
  updated_at: string;
  customer_info: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'En proceso', color: 'bg-blue-100 text-blue-800' },
  { value: 'printed', label: 'Impreso', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Entregado', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
] as const;

const VALID_STATUSES = STATUS_OPTIONS.map(s => s.value);

// Security utilities
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  // Remove potentially dangerous characters but keep safe ones
  return str.replace(/[<>]/g, '').trim();
};

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const isValidStatus = (status: string): boolean => {
  return VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]);
};

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal and dangerous characters
  return fileName.replace(/\.\./g, '').replace(/[<>:"|?*\x00-\x1f]/g, '').trim();
};

const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

const PrintOrders = () => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<PrintJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchPrintJobs();
  }, []);

  const filterJobs = useCallback(() => {
    let filtered = printJobs;

    // Validate and apply status filter
    if (statusFilter !== 'all' && isValidStatus(statusFilter)) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Sanitize and apply search filter
    if (searchTerm) {
      const sanitizedSearch = sanitizeString(searchTerm).toLowerCase();
      if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
        filtered = filtered.filter(job => {
          const customerName = (job.customer_info?.name || '').toLowerCase();
          const customerEmail = (job.customer_info?.email || '').toLowerCase();
          const fileName = (job.file_url.split('/').pop() || '').toLowerCase();
          
          return customerName.includes(sanitizedSearch) ||
                 customerEmail.includes(sanitizedSearch) ||
                 fileName.includes(sanitizedSearch) ||
                 (isValidUUID(job.id) && job.id.toLowerCase().includes(sanitizedSearch));
        });
      }
    }

    setFilteredJobs(filtered);
  }, [printJobs, searchTerm, statusFilter]);

  useEffect(() => {
    filterJobs();
  }, [filterJobs]);

  const fetchPrintJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, cannot fetch print jobs');
        toast.error('Supabase no está configurado. Por favor, configura las variables de entorno.');
        setPrintJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from('print_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Security: Limit results to prevent DoS

      if (error) {
        console.error('Error fetching print jobs:', error);
        
        // Don't expose internal error messages to users
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
        } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('La tabla no existe. Contacta al administrador.');
        } else {
          throw new Error('Error al cargar los pedidos. Intenta más tarde.');
        }
      }
      
      // Validate and sanitize data from server
      const validatedData = (data || []).filter((job: any): job is PrintJob => {
        return (
          job &&
          typeof job.id === 'string' &&
          isValidUUID(job.id) &&
          typeof job.status === 'string' &&
          isValidStatus(job.status) &&
          typeof job.price === 'number' &&
          job.price >= 0 &&
          typeof job.copies === 'number' &&
          job.copies > 0 &&
          job.copies <= 1000 // Reasonable limit
        );
      });
      
      setPrintJobs(validatedData);
    } catch (error: unknown) {
      console.error('Error fetching print jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los pedidos';
      toast.error(errorMessage);
      setPrintJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateJobStatus = useCallback(async (jobId: string, newStatus: string) => {
    // Security validations
    if (!isValidUUID(jobId)) {
      toast.error('ID de pedido inválido');
      return;
    }

    if (!isValidStatus(newStatus)) {
      toast.error('Estado inválido');
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.error('Supabase no está configurado.');
      return;
    }

    // Prevent concurrent operations
    if (operationInProgress) {
      toast.error('Operación en progreso. Por favor espera.');
      return;
    }

    try {
      setIsUpdating(true);
      setOperationInProgress('update');
      
      const { data, error } = await supabase
        .from('print_jobs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error('Error updating job status:', error);
        // Don't expose internal errors
        throw new Error('Error al actualizar el estado. Intenta más tarde.');
      }

      if (!data || !isValidStatus(data.status)) {
        throw new Error('Respuesta inválida del servidor.');
      }
      
      // Update local state securely
      setPrintJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: data.status, updated_at: data.updated_at }
          : job
      ));
      
      const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
      toast.success(`Estado actualizado a: ${statusLabel}`);
      
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: data.status, updated_at: data.updated_at } : null);
      }
    } catch (error: unknown) {
      console.error('Error updating job status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el estado';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
      setOperationInProgress(null);
    }
  }, [operationInProgress, selectedJob]);

  const deleteJob = useCallback(async (jobId: string, jobName: string) => {
    // Security validations
    if (!isValidUUID(jobId)) {
      toast.error('ID de pedido inválido');
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.error('Supabase no está configurado.');
      return;
    }

    // Sanitize job name for display
    const safeJobName = escapeHtml(sanitizeString(jobName || 'pedido'));
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el pedido "${safeJobName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    // Prevent concurrent operations
    if (operationInProgress) {
      toast.error('Operación en progreso. Por favor espera.');
      return;
    }

    try {
      setIsDeleting(true);
      setOperationInProgress('delete');
      
      const jobToDelete = printJobs.find(job => job.id === jobId);
      
      const { error } = await supabase
        .from('print_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job:', error);
        throw new Error('Error al eliminar el pedido.');
      }

      // Try to delete file from storage safely
      if (jobToDelete?.file_url && isValidUrl(jobToDelete.file_url)) {
        try {
          const urlParts = jobToDelete.file_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const sanitizedFileName = sanitizeFileName(fileName);
          
          if (sanitizedFileName && sanitizedFileName.length < 255) {
            await supabase.storage
              .from('products')
              .remove([`print-files/${sanitizedFileName}`]);
          }
        } catch (storageError) {
          console.warn('Could not delete file from storage:', storageError);
          // Don't fail the operation if storage deletion fails
        }
      }
      
      setPrintJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Pedido eliminado correctamente');
      
      if (selectedJob?.id === jobId) {
        setIsModalOpen(false);
        setSelectedJob(null);
      }
    } catch (error: unknown) {
      console.error('Error deleting job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el pedido';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setOperationInProgress(null);
    }
  }, [printJobs, operationInProgress, selectedJob]);

  const downloadFile = useCallback(async (fileUrl: string, fileName?: string) => {
    // Security validations
    if (!isValidUrl(fileUrl)) {
      toast.error('URL de archivo inválida');
      return;
    }

    try {
      toast.loading('Preparando descarga...', { id: 'download' });
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,application/octet-stream,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error('No se pudo acceder al archivo');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.match(/^(application\/(pdf|octet-stream|zip)|image\/|text\/)/)) {
        throw new Error('Tipo de archivo no permitido');
      }
      
      const blob = await response.blob();
      
      // Security: Limit file size (50MB)
      if (blob.size > 50 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Sanitize filename
      const safeFileName = fileName ? sanitizeFileName(fileName) : 'documento.pdf';
      link.download = safeFileName.length > 0 ? safeFileName : 'documento.pdf';
      
      link.setAttribute('download', link.download);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Archivo descargado correctamente', { id: 'download' });
    } catch (error: unknown) {
      console.error('Error downloading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al descargar el archivo';
      toast.error(errorMessage, { id: 'download' });
    }
  }, []);

  const openFileInNewTab = useCallback((fileUrl: string) => {
    if (!isValidUrl(fileUrl)) {
      toast.error('URL inválida');
      return;
    }
    
    // Security: Use noopener and noreferrer
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  }, []);

  const getStatusLabel = useCallback((status: string): string => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.label || status;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch {
      return 'Fecha inválida';
    }
  }, []);

  const getFileName = useCallback((fileUrl: string): string => {
    try {
      if (!isValidUrl(fileUrl)) {
        return 'archivo.pdf';
      }
      const fileName = fileUrl.split('/').pop() || 'archivo.pdf';
      return sanitizeFileName(fileName) || 'archivo.pdf';
    } catch {
      return 'archivo.pdf';
    }
  }, []);

  // Memoized stats
  const stats = useMemo(() => {
    return {
      total: printJobs.length,
      pending: printJobs.filter(j => j.status === 'pending').length,
      processing: printJobs.filter(j => j.status === 'processing').length,
      printed: printJobs.filter(j => j.status === 'printed').length,
      delivered: printJobs.filter(j => j.status === 'delivered').length
    };
  }, [printJobs]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit search term length for security
    if (value.length <= 100) {
      setSearchTerm(value);
    }
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all' || isValidStatus(value)) {
      setStatusFilter(value);
    }
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Impresión</h1>
          <p className="text-gray-600 mt-1">Gestiona todos los pedidos de impresión de documentos</p>
        </div>
        <button
          onClick={fetchPrintJobs}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
          disabled={isLoading || !!operationInProgress}
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
                Por favor, configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        {STATUS_OPTIONS.slice(0, 4).map((status) => (
          <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${status.color}`}>
                {status.value === 'pending' && <Clock className="w-6 h-6" />}
                {status.value === 'processing' && <Printer className="w-6 h-6" />}
                {status.value === 'printed' && <CheckCircle className="w-6 h-6" />}
                {status.value === 'delivered' && <CheckCircle className="w-6 h-6" />}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{status.label}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats[status.value as keyof typeof stats] || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, email, archivo o ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              maxLength={100}
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Buscar pedidos"
            />
          </div>
          
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Print Jobs Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especificaciones
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
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : !isSupabaseConfigured() ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Supabase no está configurado. Por favor, configura las variables de entorno.
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {printJobs.length === 0 ? 'No hay pedidos de impresión registrados' : 'No se encontraron pedidos con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  // Sanitize data for display
                  const customerName = escapeHtml(job.customer_info?.name || 'Cliente anónimo');
                  const customerEmail = escapeHtml(job.customer_info?.email || 'Sin email');
                  
                  return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900" title={customerName}>
                              {customerName}
                          </div>
                            <div className="text-sm text-gray-500" title={customerEmail}>
                              {customerEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={getFileName(job.file_url)}>
                              {escapeHtml(getFileName(job.file_url))}
                          </div>
                          <div className="text-sm text-gray-500">
                            S/ {job.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.color ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.color ? 'Color' : 'B/N'}
                          </span>
                            <span className="ml-2 text-xs text-gray-500">{escapeHtml(job.size.toUpperCase())}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {job.copies} {job.copies === 1 ? 'copia' : 'copias'} • {escapeHtml(job.paper_type)}
                          {job.double_sided && ' • Doble cara'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(job.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                            aria-label="Ver detalles del pedido"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadFile(job.file_url, getFileName(job.file_url))}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Descargar archivo"
                            aria-label="Descargar archivo"
                        >
                          <Download size={16} />
                        </button>
                        {job.status !== 'printed' && job.status !== 'delivered' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'printed')}
                              disabled={isUpdating || !isSupabaseConfigured() || !!operationInProgress}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Marcar como impreso"
                              aria-label="Marcar como impreso"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteJob(job.id, job.customer_info?.name || 'Cliente anónimo')}
                            disabled={isDeleting || !isSupabaseConfigured() || !!operationInProgress}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar pedido"
                            aria-label="Eliminar pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedJob && (
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
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="mr-2" size={18} />
                      Información del Cliente
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Nombre:</span>
                        <p className="text-sm text-gray-900">{escapeHtml(selectedJob.customer_info?.name || 'No especificado')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-900 mr-2">{escapeHtml(selectedJob.customer_info?.email || 'No especificado')}</p>
                          {selectedJob.customer_info?.email && (
                            <a
                              href={`mailto:${escapeHtml(selectedJob.customer_info.email)}`}
                              className="text-blue-500 hover:text-blue-700"
                              title="Enviar email"
                              rel="noopener noreferrer"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-900 mr-2">{escapeHtml(selectedJob.customer_info?.phone || 'No especificado')}</p>
                          {selectedJob.customer_info?.phone && (
                            <a
                              href={`tel:${selectedJob.customer_info.phone.replace(/[^0-9+]/g, '')}`}
                              className="text-blue-500 hover:text-blue-700"
                              title="Llamar"
                              rel="noopener noreferrer"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="mr-2" size={18} />
                      Información del Trabajo
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">ID del Pedido:</span>
                        <p className="text-sm text-gray-900 font-mono">{selectedJob.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Archivo:</span>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-900 mr-2">{escapeHtml(getFileName(selectedJob.file_url))}</p>
                          <button
                            onClick={() => openFileInNewTab(selectedJob.file_url)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Abrir archivo"
                            aria-label="Abrir archivo"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Precio:</span>
                        <p className="text-sm text-gray-900 font-semibold">S/ {selectedJob.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Print Specifications */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Settings className="mr-2" size={18} />
                      Especificaciones de Impresión
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tipo de papel:</span>
                        <p className="text-sm text-gray-900 capitalize">{escapeHtml(selectedJob.paper_type)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Color:</span>
                        <p className="text-sm text-gray-900">{selectedJob.color ? 'A color' : 'Blanco y negro'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tamaño:</span>
                        <p className="text-sm text-gray-900">{escapeHtml(selectedJob.size.toUpperCase())}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Copias:</span>
                        <p className="text-sm text-gray-900">{selectedJob.copies}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Doble cara:</span>
                        <p className="text-sm text-gray-900">{selectedJob.double_sided ? 'Sí' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates and Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="mr-2" size={18} />
                      Fechas y Estado
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estado actual:</span>
                        <p className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                            {getStatusLabel(selectedJob.status)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fecha de solicitud:</span>
                        <p className="text-sm text-gray-900">{formatDate(selectedJob.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Última actualización:</span>
                        <p className="text-sm text-gray-900">{formatDate(selectedJob.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedJob.notes && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <AlertCircle className="mr-2 text-yellow-600" size={18} />
                      Notas adicionales
                    </h3>
                    <p className="text-sm text-gray-700">{escapeHtml(selectedJob.notes)}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => openFileInNewTab(selectedJob.file_url)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Eye className="mr-2" size={16} />
                    Ver archivo
                  </button>

                  <button
                    onClick={() => downloadFile(selectedJob.file_url, getFileName(selectedJob.file_url))}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Download className="mr-2" size={16} />
                    Descargar archivo
                  </button>

                  {/* Status Update Buttons */}
                  {isSupabaseConfigured() && (
                    <>
                      {selectedJob.status === 'pending' && (
                        <button
                          onClick={() => updateJobStatus(selectedJob.id, 'processing')}
                          disabled={isUpdating || !!operationInProgress}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                          <Printer className="mr-2" size={16} />
                          Marcar en proceso
                        </button>
                      )}

                      {selectedJob.status === 'processing' && (
                        <button
                          onClick={() => updateJobStatus(selectedJob.id, 'printed')}
                          disabled={isUpdating || !!operationInProgress}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="mr-2" size={16} />
                          Marcar como impreso
                        </button>
                      )}

                      {selectedJob.status === 'printed' && (
                        <button
                          onClick={() => updateJobStatus(selectedJob.id, 'delivered')}
                          disabled={isUpdating || !!operationInProgress}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="mr-2" size={16} />
                          Marcar como entregado
                        </button>
                      )}

                      {/* Status Dropdown for more options */}
                      <div className="relative">
                        <select
                          value={selectedJob.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (isValidStatus(newStatus)) {
                              updateJobStatus(selectedJob.id, newStatus);
                            }
                          }}
                          disabled={isUpdating || !!operationInProgress}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.value === selectedJob.status ? `Estado: ${status.label}` : `Cambiar a: ${status.label}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteJob(selectedJob.id, selectedJob.customer_info?.name || 'Cliente anónimo')}
                        disabled={isDeleting || !!operationInProgress}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="mr-2" size={16} />
                        Eliminar pedido
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrintOrders;
