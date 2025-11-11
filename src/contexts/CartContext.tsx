import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  type: 'product' | 'print';
  category?: string;
  customization?: {
    text: string;
    font?: string;
    color?: string;
  };
  printOptions?: {
    color: boolean;
    paperType: string;
    size: string;
    copies: number;
  };
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);

  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        updateCartTotals(parsedCart);
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Guardar el carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartTotals(cart);
  }, [cart]);

  // Función para actualizar totales
  const updateCartTotals = useCallback((currentCart: CartItem[]) => {
    const newSubtotal = currentCart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const newItemsCount = currentCart.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    setCartTotal(newSubtotal);
    setItemsCount(newItemsCount);
  }, []);

  // Verificar productos válidos en el carrito
  useEffect(() => {
    const checkCartProducts = async () => {
      const invalidProducts = [];
      
      for (const item of cart) {
        const { data, error } = await supabase
          .from('products')
          .select('id, is_active')
          .eq('id', item.id)
          .single();
          
        if (error || !data || !data.is_active) {
          invalidProducts.push(item.id);
        }
      }
      
      if (invalidProducts.length > 0) {
        invalidProducts.forEach(id => removeFromCart(id));
        toast.error('Algunos productos han sido removidos por estar inactivos o eliminados');
      }
    };
    
    checkCartProducts();
  }, [cart]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.id === item.id
      );

      let newCart;
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        newCart = [...prevCart];
        const newQuantity = newCart[existingItemIndex].quantity + (item.quantity || 1);
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newQuantity
        };
      } else {
        // Item doesn't exist, add new item
        newCart = [...prevCart, { ...item, quantity: item.quantity || 1 }];
      }

      updateCartTotals(newCart);
      return newCart;
    });
  }, [updateCartTotals]);

  const removeFromCart = useCallback((id: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== id);
      updateCartTotals(newCart);
      return newCart;
    });
  }, [updateCartTotals]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      );
      updateCartTotals(newCart);
      return newCart;
    });
  }, [updateCartTotals]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartTotal(0);
    setItemsCount(0);
  }, []);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: itemsCount,
    subtotal: cartTotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};