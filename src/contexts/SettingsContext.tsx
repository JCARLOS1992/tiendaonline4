import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  CompanySettings, 
  ShippingSettings, 
  PaymentSettings, 
  ReceiptSettings,
  Settings 
} from '../hooks/useSettings';

const defaultSettings: Settings = {
  company: {
    name: 'JuBeTech',
    ruc: '20123456789',
    address: 'Av. Principal 123, Lima, Perú',
    phone: '+51 987 654 321',
    email: 'ventas@jubetech.com',
    website: 'https://www.jubetech.com'
  },
  shipping: {
    freeShippingThreshold: 100,
    shippingCost: 15,
    estimatedDays: 3
  },
  payment: {
    yapeEnabled: true,
    plinEnabled: true,
    bankTransferEnabled: true,
    cardEnabled: false,
    yapeNumber: '987654321',
    plinNumber: '987654321',
    bankAccount: 'CCI: 003-12345678901234567890',
    bankName: 'Interbank'
  },
  receipt: {
    headerText: '¡Gracias por su compra!',
    footerText: 'Conserve este documento para sus registros.',
    showIGV: true,
    receiptPrefix: 'BOL'
  }
};

type SettingsContextType = {
  settings: Settings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Error loading settings:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const loadedSettings: Partial<Settings> = {};
        
        data.forEach(setting => {
          switch (setting.key) {
            case 'company':
              loadedSettings.company = setting.value as CompanySettings;
              break;
            case 'shipping':
              loadedSettings.shipping = setting.value as ShippingSettings;
              break;
            case 'payment':
              loadedSettings.payment = setting.value as PaymentSettings;
              break;
            case 'receipt':
              loadedSettings.receipt = setting.value as ReceiptSettings;
              break;
          }
        });

        const finalSettings = {
          company: loadedSettings.company || defaultSettings.company,
          shipping: loadedSettings.shipping || defaultSettings.shipping,
          payment: loadedSettings.payment || defaultSettings.payment,
          receipt: loadedSettings.receipt || defaultSettings.receipt,
        };
        
        console.log('Settings loaded:', finalSettings);
        setSettings(finalSettings);
      } else {
        console.log('No settings found in database, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    // Escuchar eventos personalizados para refrescar settings
    const handleRefresh = () => {
      loadSettings();
    };

    window.addEventListener('settings-updated', handleRefresh);

    // Escuchar cambios en Supabase Realtime (opcional, más avanzado)
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('settings-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'settings' },
          () => {
            loadSettings();
          }
        )
        .subscribe();

      return () => {
        window.removeEventListener('settings-updated', handleRefresh);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener('settings-updated', handleRefresh);
    };
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

