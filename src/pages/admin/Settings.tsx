import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Building2, 
  CreditCard, 
  Truck, 
  FileText, 
  Mail, 
  Phone, 
  MapPin,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Globe,
  Receipt,
  Bell
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

type CompanySettings = {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  website: string;
};

type ShippingSettings = {
  freeShippingThreshold: number;
  shippingCost: number;
  estimatedDays: number;
};

type PaymentSettings = {
  yapeEnabled: boolean;
  plinEnabled: boolean;
  bankTransferEnabled: boolean;
  cardEnabled: boolean;
  yapeNumber: string;
  plinNumber: string;
  bankAccount: string;
  bankName: string;
};

type ReceiptSettings = {
  headerText: string;
  footerText: string;
  showIGV: boolean;
  receiptPrefix: string;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'shipping' | 'payment' | 'receipt'>('company');
  const [isSaving, setIsSaving] = useState(false);
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'JuBeTech',
    ruc: '20123456789',
    address: 'Av. Principal 123, Lima, Perú',
    phone: '+51 987 654 321',
    email: 'ventas@jubetech.com',
    website: 'https://www.jubetech.com'
  });

  // Shipping Settings
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 100,
    shippingCost: 15,
    estimatedDays: 3
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    yapeEnabled: true,
    plinEnabled: true,
    bankTransferEnabled: true,
    cardEnabled: false,
    yapeNumber: '987654321',
    plinNumber: '987654321',
    bankAccount: 'CCI: 003-12345678901234567890',
    bankName: 'Interbank'
  });

  // Receipt Settings
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    headerText: '¡Gracias por su compra!',
    footerText: 'Conserve este documento para sus registros.',
    showIGV: true,
    receiptPrefix: 'BOL'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    
    try {
      // Cargar todas las configuraciones
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');
      
      if (error) {
        console.error('Error loading settings:', error);
        return;
      }
      
      if (data) {
        // Mapear las configuraciones
        data.forEach(setting => {
          switch (setting.key) {
            case 'company':
              setCompanySettings(setting.value as CompanySettings);
              break;
            case 'shipping':
              setShippingSettings(setting.value as ShippingSettings);
              break;
            case 'payment':
              setPaymentSettings(setting.value as PaymentSettings);
              break;
            case 'receipt':
              setReceiptSettings(setting.value as ReceiptSettings);
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase no está configurado');
      return;
    }
    
    setIsSaving(true);
    try {
      // Guardar todas las configuraciones
      const settingsToSave = [
        { key: 'company', value: companySettings },
        { key: 'shipping', value: shippingSettings },
        { key: 'payment', value: paymentSettings },
        { key: 'receipt', value: receiptSettings },
      ];
      
      // Usar upsert para cada configuración
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key: setting.key, value: setting.value },
            { onConflict: 'key' }
          );
        
        if (error) {
          throw error;
        }
      }
      
      toast.success('Configuración guardada correctamente. Los cambios se reflejarán en la página principal.');
      
      // Disparar evento para actualizar todos los componentes que usan settings
      window.dispatchEvent(new CustomEvent('settings-updated'));
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'shipping', label: 'Envíos', icon: Truck },
    { id: 'payment', label: 'Pagos', icon: CreditCard },
    { id: 'receipt', label: 'Boletas', icon: Receipt },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Gestiona la configuración general del sistema</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 animate-spin" size={18} />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2" size={18} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="text-yellow-500 mr-2" size={20} />
            <div>
              <h3 className="text-yellow-800 font-medium">Configuración de Supabase recomendada</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Para guardar la configuración permanentemente, configura Supabase
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="mr-2" size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="mr-2" size={20} />
                  Información de la Empresa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUC *
                    </label>
                    <input
                      type="text"
                      value={companySettings.ruc}
                      onChange={(e) => setCompanySettings({ ...companySettings, ruc: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="mr-2" size={16} />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="mr-2" size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Globe className="mr-2" size={16} />
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="mr-2" size={20} />
                  Configuración de Envíos
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo de Envío (S/)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingSettings.shippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, shippingCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Costo estándar de envío</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Envío Gratis a partir de (S/)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Si el pedido supera este monto, el envío es gratis</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días Estimados de Entrega
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={shippingSettings.estimatedDays}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDays: parseInt(e.target.value) || 3 })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tiempo estimado de entrega en días</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="mr-2" size={20} />
                  Métodos de Pago
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold">Y</span>
                        </div>
                        <span className="font-medium">Yape</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.yapeEnabled}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, yapeEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">P</span>
                        </div>
                        <span className="font-medium">Plin</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.plinEnabled}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, plinEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <CreditCard className="text-purple-600" size={20} />
                        </div>
                        <span className="font-medium">Transferencia Bancaria</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.bankTransferEnabled}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, bankTransferEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <CreditCard className="text-orange-600" size={20} />
                        </div>
                        <span className="font-medium">Tarjeta de Crédito</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.cardEnabled}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, cardEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>

                  {paymentSettings.yapeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Yape
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.yapeNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, yapeNumber: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="987654321"
                      />
                    </div>
                  )}

                  {paymentSettings.plinEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Plin
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.plinNumber}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, plinNumber: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="987654321"
                      />
                    </div>
                  )}

                  {paymentSettings.bankTransferEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Banco *
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.bankName}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Interbank, BCP, BBVA"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Nombre del banco para transferencias</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cuenta Bancaria / CCI
                        </label>
                        <textarea
                          value={paymentSettings.bankAccount}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccount: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={2}
                          placeholder="CCI: 003-12345678901234567890"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Receipt className="mr-2" size={20} />
                  Configuración de Boletas
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prefijo de Boleta
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.receiptPrefix}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, receiptPrefix: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="BOL"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">Prefijo que aparecerá en el número de boleta</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto del Encabezado
                    </label>
                    <input
                      type="text"
                      value={receiptSettings.headerText}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="¡Gracias por su compra!"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto del Pie de Página
                    </label>
                    <textarea
                      value={receiptSettings.footerText}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="Conserve este documento para sus registros."
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                    <div>
                      <label className="font-medium text-gray-700">Mostrar IGV en Boletas</label>
                      <p className="text-sm text-gray-500">Incluir desglose de IGV (18%) en las boletas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receiptSettings.showIGV}
                        onChange={(e) => setReceiptSettings({ ...receiptSettings, showIGV: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

