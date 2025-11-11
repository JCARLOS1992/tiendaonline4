import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, X, AlertTriangle, Info, Send, FileText, Image as ImageIcon, Shield, Clock, Award, Sparkles, Printer, Copy, Mail, Calendar, CheckCircle2, PartyPopper, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type PrintOptions = {
  paperType: string;
  color: boolean;
  size: string;
  copies: number;
  doubleSided: boolean;
  additionalNotes: string;
};

type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

const PrintService = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    paperType: 'bond',
    color: false,
    size: 'a4',
    copies: 1,
    doubleSided: false,
    additionalNotes: '',
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [price, setPrice] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploadedFile(file);
    
    // Create preview for supported file types
    if (file.type.startsWith('image/')) {
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    } else {
      setPreviewUrl(null);
    }
    
    setUploadStatus('uploading');
    
    // Simulate upload
    setTimeout(() => {
      setUploadStatus('success');
    }, 1500);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Documentos
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      
      // Imágenes básicas
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      
      // Archivos comprimidos
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
    },
    maxSize: 50485760, // 50MB para archivos más grandes como ZIP
  });

  // Calcular precio en tiempo real cuando cambien las opciones
  useEffect(() => {
    if (uploadedFile) {
      calculatePrice(printOptions);
    }
  }, [printOptions, uploadedFile]);

  const calculatePrice = (options: PrintOptions) => {
    // Base price per page
    let basePrice = 0.50;
    
    // Paper type multiplier
    const paperMultiplier = {
      'bond': 1,
      'couche': 1.5,
      'cartulina': 2,
    }[options.paperType] || 1;
    
    // Color multiplier
    const colorMultiplier = options.color ? 3 : 1;
    
    // Size multiplier
    const sizeMultiplier = {
      'a4': 1,
      'a3': 2,
      'letter': 1,
      'legal': 1.5,
    }[options.size] || 1;
    
    // Double sided discount (10% off)
    const doubleSidedMultiplier = options.doubleSided ? 0.9 : 1;
    
    // Calculate final price
    const finalPrice = basePrice * paperMultiplier * colorMultiplier * sizeMultiplier * options.copies * doubleSidedMultiplier;
    
    setPrice(finalPrice);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const updatedOptions = {
      ...printOptions,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (name === 'copies' ? parseInt(value) || 1 : value),
    };
    
    setPrintOptions(updatedOptions);
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `print-files/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products') // Using the existing products bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(uploadData.path);

      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Error al subir el archivo. Por favor, intenta de nuevo.');
    }
  };

  const submitPrintJob = async () => {
    if (!uploadedFile) {
      toast.error('Por favor, sube un archivo primero');
      return;
    }

    if (!customerInfo.name.trim()) {
      toast.error('Por favor, ingresa tu nombre');
      return;
    }

    if (!customerInfo.email.trim()) {
      toast.error('Por favor, ingresa tu email');
      return;
    }

    try {
      // Cancelar cualquier toast anterior que pueda estar activo
      toast.dismiss();
      toast.dismiss('submit'); // Cancelar específicamente el toast con id 'submit' si existe
      
      setIsSubmitting(true);
      setLoadingStep('uploading');

      // Upload file to Supabase Storage
      const fileUrl = await uploadFileToSupabase(uploadedFile);
      
      setLoadingStep('saving');

      // Create print job in database
      const printJobData = {
        file_url: fileUrl,
        paper_type: printOptions.paperType,
        color: printOptions.color,
        size: printOptions.size,
        copies: printOptions.copies,
        double_sided: printOptions.doubleSided,
        notes: printOptions.additionalNotes.trim() || null,
        price: price,
        status: 'pending',
        customer_info: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim() || null,
        }
      };

      const { data, error } = await supabase
        .from('print_jobs')
        .insert([printJobData])
        .select()
        .single();

      if (error) {
        console.error('Error creating print job:', error);
        throw error;
      }

      // Guardar detalles del pedido para mostrar en la modal
      setOrderDetails({
        id: data.id,
        orderNumber: data.id.slice(0, 8).toUpperCase(),
        fileName: uploadedFile.name,
        price: price,
        printOptions: printOptions,
        customerInfo: customerInfo,
        createdAt: new Date().toLocaleString('es-PE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });

      setLoadingStep('success');

      // Small delay before showing success modal for better UX
      setTimeout(() => {
        // Mostrar modal de confirmación
        setShowSuccessModal(true);
        setLoadingStep('');
        
        // Reset form después de un pequeño delay
        setTimeout(() => {
          resetForm();
        }, 100);
      }, 500);

    } catch (error: any) {
      console.error('Error submitting print job:', error);
      
      let errorMessage = 'Error al enviar el pedido. Por favor, intenta de nuevo.';
      
      if (error.message?.includes('permission') || error.message?.includes('row-level security')) {
        errorMessage = 'Error de permisos. Por favor, recarga la página e intenta de nuevo.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setLoadingStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadStatus('idle');
    setPrintOptions({
      paperType: 'bond',
      color: false,
      size: 'a4',
      copies: 1,
      doubleSided: false,
      additionalNotes: '',
    });
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
    });
    setPrice(0);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadStatus('idle');
    setPrice(0);
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Return appropriate icon based on file type
    if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return '🖼️';
    } else if (['pdf'].includes(extension || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return '📊';
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return '📽️';
    } else if (['zip', 'rar', '7z'].includes(extension || '')) {
      return '🗜️';
    } else {
      return '📁';
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && loadingStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 relative overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-primary-50 opacity-50"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Animated Spinner / Success Icon */}
                <motion.div className="mb-6">
                  {loadingStep === 'success' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                        <CheckCircle2 size={64} className="text-green-500 relative z-10" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 
                        size={64} 
                        className={`${
                          loadingStep === 'uploading' ? 'text-blue-500' : 
                          'text-primary-500'
                        }`}
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Progress Steps */}
                <div className="w-full mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {/* Step 1: Upload */}
                    <motion.div
                      animate={{
                        scale: loadingStep === 'uploading' ? 1.2 : 1,
                        opacity: loadingStep === 'uploading' || loadingStep === 'saving' || loadingStep === 'success' ? 1 : 0.5
                      }}
                      className={`flex flex-col items-center ${loadingStep === 'uploading' || loadingStep === 'saving' || loadingStep === 'success' ? 'text-primary-600' : 'text-gray-400'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        loadingStep === 'uploading' || loadingStep === 'saving' || loadingStep === 'success' 
                          ? 'bg-primary-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-xs mt-1 font-medium">Subiendo</span>
                    </motion.div>

                    {/* Connector */}
                    <div className={`h-0.5 w-12 ${
                      loadingStep === 'saving' || loadingStep === 'success' ? 'bg-primary-500' : 'bg-gray-300'
                    }`}></div>

                    {/* Step 2: Saving */}
                    <motion.div
                      animate={{
                        scale: loadingStep === 'saving' ? 1.2 : 1,
                        opacity: loadingStep === 'saving' || loadingStep === 'success' ? 1 : 0.5
                      }}
                      className={`flex flex-col items-center ${loadingStep === 'saving' || loadingStep === 'success' ? 'text-primary-600' : 'text-gray-400'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        loadingStep === 'saving' || loadingStep === 'success' 
                          ? 'bg-primary-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-xs mt-1 font-medium">Guardando</span>
                    </motion.div>

                    {/* Connector */}
                    <div className={`h-0.5 w-12 ${
                      loadingStep === 'success' ? 'bg-primary-500' : 'bg-gray-300'
                    }`}></div>

                    {/* Step 3: Complete */}
                    <motion.div
                      animate={{
                        scale: loadingStep === 'success' ? 1.2 : 1,
                        opacity: loadingStep === 'success' ? 1 : 0.5
                      }}
                      className={`flex flex-col items-center ${loadingStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        loadingStep === 'success' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-xs mt-1 font-medium">Listo</span>
                    </motion.div>
                  </div>
                </div>

                {/* Status Message */}
                <motion.div
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {loadingStep === 'uploading' && 'Subiendo tu archivo...'}
                    {loadingStep === 'saving' && 'Guardando tu pedido...'}
                    {loadingStep === 'success' && '¡Pedido enviado!'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {loadingStep === 'uploading' && 'Esto puede tardar unos segundos'}
                    {loadingStep === 'saving' && 'Creando tu pedido en el sistema'}
                    {loadingStep === 'success' && 'Tu pedido ha sido recibido exitosamente'}
                  </p>
                </motion.div>

                {/* File name display during upload */}
                {loadingStep === 'uploading' && uploadedFile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-gray-50 rounded-lg w-full"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary-500" />
                      <span className="text-sm text-gray-700 truncate">{uploadedFile.name}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Header */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Printer size={18} />
              <span className="text-sm font-medium">Servicio de Impresión Profesional</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ¿Necesitas imprimir algo?{' '}
              <span className="text-accent-300">JuBeTech</span> lo hace por ti
            </h1>
            
            <p className="text-xl md:text-2xl opacity-95 mb-8 leading-relaxed max-w-3xl">
              Sube tu archivo, configura las opciones de impresión y nosotros nos encargamos del resto. 
              Calidad profesional para tus tesis, planos, folletos y más.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Shield size={20} />
                <span className="text-sm font-medium">Calidad Garantizada</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Clock size={20} />
                <span className="text-sm font-medium">Entrega Rápida</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Award size={20} />
                <span className="text-sm font-medium">Miles de Clientes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* File Upload Section */}
            <div className="lg:col-span-2 p-6 md:p-8 border-r border-gray-200">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Upload className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sube tu archivo</h2>
                    <p className="text-sm text-gray-500">Selecciona el archivo que deseas imprimir</p>
                  </div>
                </div>

                <div 
                  {...getRootProps()} 
                  className={`
                    relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 mb-6
                    ${isDragActive 
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 scale-[1.02] shadow-lg' 
                      : uploadedFile 
                      ? 'border-green-300 bg-green-50/50' 
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {uploadStatus === 'uploading' ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative mb-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Upload className="text-primary-500" size={24} />
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">Subiendo archivo...</p>
                      <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
                    </motion.div>
                  ) : uploadStatus === 'success' && uploadedFile ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center w-full"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="bg-green-500 text-white rounded-full p-4 mb-4 shadow-lg"
                      >
                        <CheckCircle size={32} />
                      </motion.div>
                      <p className="text-xl font-bold text-green-600 mb-4">¡Archivo subido correctamente!</p>
                      
                      {/* File Info Card */}
                      <div className="w-full bg-white rounded-xl border-2 border-green-200 p-4 mb-4 shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary-50 p-3 rounded-lg">
                            <span className="text-3xl">{getFileTypeIcon(uploadedFile.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-900 truncate mb-1">
                              {uploadedFile.name}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{uploadedFile.type || 'Archivo'}</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            disabled={isSubmitting}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            aria-label="Eliminar archivo"
                          >
                            <X size={20} />
                          </motion.button>
                        </div>
                      </div>
                      
                      {previewUrl && (
                        <div className="w-full">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Vista previa:</p>
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full max-h-48 object-contain border-2 border-gray-200 rounded-lg shadow-sm" 
                          />
                        </div>
                      )}
                    </motion.div>
                  ) : uploadStatus === 'error' ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="bg-red-500 text-white rounded-full p-4 mb-4">
                        <AlertTriangle size={32} />
                      </div>
                      <p className="text-lg font-semibold text-red-600">Error al subir el archivo</p>
                      <p className="text-sm text-gray-600 mt-1">Inténtalo de nuevo</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                        className="mb-6"
                      >
                        <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-full p-6 inline-block">
                          <Upload className="text-primary-500" size={48} />
                        </div>
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {isDragActive ? '¡Suelta el archivo aquí!' : 'Arrastra y suelta tu archivo'}
                      </h3>
                      <p className="text-gray-600 mb-6">O haz clic para buscar en tu dispositivo</p>
                      
                      {/* Supported Formats */}
                      <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Formatos soportados</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-2 justify-center">
                            <FileText size={14} className="text-primary-500" />
                            <span>PDF, DOC, DOCX</span>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <ImageIcon size={14} className="text-primary-500" />
                            <span>JPG, PNG</span>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <File size={14} className="text-primary-500" />
                            <span>ZIP, RAR, 7Z</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-3 font-medium">
                          Máximo 50MB por archivo
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="bg-gradient-to-br from-gray-50 to-primary-50 rounded-xl p-6 border border-gray-200 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Info className="text-primary-600" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información de contacto</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={customerInfo.name}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={customerInfo.email}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleCustomerInfoChange}
                        className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                        placeholder="+51 999 888 777"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-primary-500 p-5 rounded-r-xl">
                  <div className="flex gap-3">
                    <Sparkles className="text-primary-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-primary-900 font-bold mb-2">Consejos para tu impresión</h3>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-primary-500 mt-1">•</span>
                          <span>Asegúrate de que tu archivo esté en buena resolución (mínimo 300 DPI)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-500 mt-1">•</span>
                          <span>Para documentos de texto, guarda en PDF para mantener el formato</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-500 mt-1">•</span>
                          <span>Los archivos ZIP serán extraídos y procesados individualmente</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Print Options Sidebar */}
            <div className="bg-gray-50 p-6 md:p-8 border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="sticky top-8 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Printer className="text-primary-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Opciones</h2>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Tipo de papel
                    </label>
                    <select
                      name="paperType"
                      value={printOptions.paperType}
                      onChange={handleOptionChange}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white font-medium"
                    >
                      <option value="bond">Bond (Estándar) - Económico</option>
                      <option value="couche">Couché (Brillante) - +50%</option>
                      <option value="cartulina">Cartulina - +100%</option>
                    </select>
                  </div>

                  {/* Tipo de impresión y Doble cara */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Tipo de impresión */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Tipo de impresión
                      </label>
                      <div className="space-y-2">
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${!printOptions.color 
                              ? 'border-primary-500 bg-primary-50 shadow-md' 
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="color"
                            checked={!printOptions.color}
                            onChange={() => setPrintOptions(prev => ({ ...prev, color: false }))}
                            className="h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">Blanco y Negro</span>
                              <span className="text-xs text-green-600 font-bold">Económico</span>
                            </div>
                          </div>
                        </motion.label>
                        
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${printOptions.color 
                              ? 'border-primary-500 bg-primary-50 shadow-md' 
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="color"
                            checked={printOptions.color}
                            onChange={() => setPrintOptions(prev => ({ ...prev, color: true }))}
                            className="h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">Color</span>
                              <span className="text-xs text-orange-600 font-bold">+200%</span>
                            </div>
                          </div>
                        </motion.label>
                      </div>
                    </div>

                    {/* Doble cara */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Impresión
                      </label>
                      <div className="space-y-2">
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${!printOptions.doubleSided 
                              ? 'border-primary-500 bg-primary-50 shadow-md' 
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="doubleSided"
                            checked={!printOptions.doubleSided}
                            onChange={() => setPrintOptions(prev => ({ ...prev, doubleSided: false }))}
                            className="h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-500"
                          />
                          <div className="ml-3 flex-1">
                            <span className="text-base font-semibold text-gray-900">Una cara</span>
                          </div>
                        </motion.label>
                        
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${printOptions.doubleSided 
                              ? 'border-primary-500 bg-primary-50 shadow-md' 
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="doubleSided"
                            checked={printOptions.doubleSided}
                            onChange={() => setPrintOptions(prev => ({ ...prev, doubleSided: true }))}
                            className="h-5 w-5 text-primary-500 border-gray-300 focus:ring-primary-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">Doble cara</span>
                              <span className="text-xs text-green-600 font-bold">-10% desc.</span>
                            </div>
                          </div>
                        </motion.label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Tamaño del papel
                    </label>
                    <select
                      name="size"
                      value={printOptions.size}
                      onChange={handleOptionChange}
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white font-medium"
                    >
                      <option value="a4">A4 (210 × 297 mm) - Estándar</option>
                      <option value="a3">A3 (297 × 420 mm) - +100%</option>
                      <option value="letter">Carta (216 × 279 mm)</option>
                      <option value="legal">Oficio (216 × 356 mm) - +50%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Número de copias
                    </label>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPrintOptions(prev => ({ ...prev, copies: Math.max(1, prev.copies - 1) }))}
                        className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-bold text-lg bg-white"
                      >
                        -
                      </motion.button>
                      <input
                        type="number"
                        name="copies"
                        min="1"
                        value={printOptions.copies}
                        onChange={handleOptionChange}
                        className="flex-1 h-12 border-2 border-gray-300 rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPrintOptions(prev => ({ ...prev, copies: prev.copies + 1 }))}
                        className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all font-bold text-lg bg-white"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Notas adicionales <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                    </label>
                    <textarea
                      name="additionalNotes"
                      value={printOptions.additionalNotes}
                      onChange={handleOptionChange}
                      rows={3}
                      placeholder="Ej: Instrucciones especiales, urgencia, etc."
                      className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none bg-white"
                    ></textarea>
                  </div>
                </div>

                {/* Price Summary & Submit */}
                <AnimatePresence>
                  {uploadedFile && uploadStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8"
                    >
                      {/* Price Card */}
                      <div className="bg-gradient-to-br from-primary-50 via-accent-50 to-white border-2 border-primary-200 rounded-2xl p-6 shadow-lg mb-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-primary-200">
                          <h3 className="text-lg font-bold text-gray-900">Total estimado:</h3>
                          <span className="text-3xl font-bold text-primary-600">
                            S/ {price.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Price breakdown */}
                        <div className="text-sm text-gray-700 space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span>Base × {printOptions.copies} {printOptions.copies === 1 ? 'copia' : 'copias'}:</span>
                            <span className="font-semibold">S/ {(0.50 * printOptions.copies).toFixed(2)}</span>
                          </div>
                          
                          {printOptions.paperType !== 'bond' && (
                            <div className="flex justify-between text-orange-600">
                              <span>+ Papel premium:</span>
                              <span className="font-semibold">+{printOptions.paperType === 'couche' ? '50%' : '100%'}</span>
                            </div>
                          )}
                          
                          {printOptions.color && (
                            <div className="flex justify-between text-orange-600">
                              <span>+ Impresión a color:</span>
                              <span className="font-semibold">+200%</span>
                            </div>
                          )}
                          
                          {printOptions.size !== 'a4' && (
                            <div className="flex justify-between text-orange-600">
                              <span>+ Tamaño {printOptions.size.toUpperCase()}:</span>
                              <span className="font-semibold">+{printOptions.size === 'a3' ? '100%' : '50%'}</span>
                            </div>
                          )}
                          
                          {printOptions.doubleSided && (
                            <div className="flex justify-between text-green-600 font-semibold">
                              <span>✓ Descuento doble cara:</span>
                              <span>-10%</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white/60 rounded-lg p-3 mt-4">
                          <p className="text-xs text-gray-600 text-center">
                            💡 Precio actualizado en tiempo real
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={submitPrintJob}
                        disabled={isSubmitting || !customerInfo.name.trim() || !customerInfo.email.trim()}
                        className={`
                          w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 
                          text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all 
                          flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
                        `}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Enviando pedido...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Enviar pedido de impresión
                          </>
                        )}
                      </motion.button>
                      
                      {(!customerInfo.name.trim() || !customerInfo.email.trim()) && (
                        <p className="text-xs text-red-500 mt-2 text-center">
                          Completa todos los campos requeridos
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto mt-16 mb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              ¿Cómo <span className="text-primary-500">funciona</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Proceso simple y rápido en solo 4 pasos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                step: 1,
                title: "Sube tu archivo",
                description: "Arrastra y suelta tu archivo, o selecciónalo desde tu dispositivo. Aceptamos múltiples formatos.",
                icon: Upload,
                color: "from-blue-500 to-blue-600"
              },
              {
                step: 2,
                title: "Configura las opciones",
                description: "Selecciona el tipo de papel, color, tamaño y número de copias según tus necesidades.",
                icon: Printer,
                color: "from-purple-500 to-purple-600"
              },
              {
                step: 3,
                title: "Proporciona tus datos",
                description: "Ingresa tu información de contacto para que podamos comunicarnos contigo.",
                icon: Info,
                color: "from-green-500 to-green-600"
              },
              {
                step: 4,
                title: "Recibe tu pedido",
                description: "Te contactaremos para coordinar el pago y la entrega de tu impresión.",
                icon: Award,
                color: "from-orange-500 to-orange-600"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="flex flex-col items-center text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className={`bg-gradient-to-br ${item.color} rounded-full w-20 h-20 flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="text-white" size={36} />
                  </div>
                  <div className="bg-primary-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center mb-3 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Success Confirmation Modal */}
      <AnimatePresence>
        {showSuccessModal && orderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>

              {/* Success Content */}
              <div className="p-8 md:p-12">
                {/* Celebration Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-xl">
                      <CheckCircle2 className="text-white" size={64} />
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="absolute -top-2 -right-2"
                    >
                      <PartyPopper className="text-yellow-400" size={32} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    ¡Pedido enviado con éxito!
                  </h2>
                  <p className="text-lg text-gray-600">
                    Tu solicitud de impresión ha sido registrada correctamente
                  </p>
                </motion.div>

                {/* Order Number */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 mb-6 border-2 border-primary-200"
                >
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Número de Pedido</p>
                    <p className="text-3xl font-bold text-primary-600 tracking-wider">
                      #{orderDetails.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Guarda este número para seguimiento
                    </p>
                  </div>
                </motion.div>

                {/* Order Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="text-primary-500" size={20} />
                    Detalles del Pedido
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Archivo</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{orderDetails.fileName}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="text-lg font-bold text-primary-600">S/ {orderDetails.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Tipo de Papel</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {orderDetails.printOptions.paperType === 'bond' ? 'Bond (Estándar)' :
                         orderDetails.printOptions.paperType === 'couche' ? 'Couché (Brillante)' :
                         'Cartulina'}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Impresión</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {orderDetails.printOptions.color ? 'Color' : 'Blanco y Negro'}
                        {orderDetails.printOptions.doubleSided && ' - Doble cara'}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Tamaño</p>
                      <p className="text-sm font-semibold text-gray-900 uppercase">
                        {orderDetails.printOptions.size}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Copias</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {orderDetails.printOptions.copies}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    <Mail className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2">¿Qué sigue?</h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Te enviaremos un correo a <strong>{orderDetails.customerInfo.email}</strong> con los detalles 
                        de tu pedido. Nos pondremos en contacto contigo pronto para coordinar el pago y la entrega.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
                        <Calendar size={14} />
                        <span>Fecha: {orderDetails.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigator.clipboard.writeText(`Pedido #${orderDetails.orderNumber}`);
                      toast.success('Número de pedido copiado');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    Copiar N° Pedido
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const emailSubject = `Pedido de Impresión #${orderDetails.orderNumber}`;
                      const emailBody = `Hola, solicito información sobre mi pedido de impresión:
                      
Número de Pedido: #${orderDetails.orderNumber}
Archivo: ${orderDetails.fileName}
Total: S/ ${orderDetails.price.toFixed(2)}`;
                      window.location.href = `mailto:info@jubetech.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    }}
                    className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Enviar Email
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={18} />
                    Nuevo Pedido
                  </motion.button>
                </motion.div>

                {/* Footer Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 text-center"
                >
                  <p className="text-xs text-gray-500">
                    Gracias por confiar en <strong className="text-primary-600">JuBeTech</strong>. 
                    Estamos aquí para ayudarte.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrintService;