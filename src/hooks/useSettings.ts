import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type CompanySettings = {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  website: string;
};

export type ShippingSettings = {
  freeShippingThreshold: number;
  shippingCost: number;
  estimatedDays: number;
};

export type PaymentSettings = {
  yapeEnabled: boolean;
  plinEnabled: boolean;
  bankTransferEnabled: boolean;
  cardEnabled: boolean;
  yapeNumber: string;
  plinNumber: string;
  bankAccount: string;
  bankName: string;
};

export type ReceiptSettings = {
  headerText: string;
  footerText: string;
  showIGV: boolean;
  receiptPrefix: string;
};

export type Settings = {
  company: CompanySettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
  receipt: ReceiptSettings;
};

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

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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

        setSettings({
          company: loadedSettings.company || defaultSettings.company,
          shipping: loadedSettings.shipping || defaultSettings.shipping,
          payment: loadedSettings.payment || defaultSettings.payment,
          receipt: loadedSettings.receipt || defaultSettings.receipt,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading, refreshSettings: loadSettings };
};

