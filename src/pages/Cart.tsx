import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, CartItem } from '../contexts/CartContext';
import { motion } from 'framer-motion';
import { Trash2, ArrowLeft, CreditCard, Plus, Minus, CheckCircle, ShoppingCart, Truck, Shield, Lock, Package, MapPin, Phone, Mail, Home, Building, Banknote, QrCode } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useSettingsContext } from '../contexts/SettingsContext';

const CATEGORY_LABELS: { [key: string]: string } = {
  'tecnologia': 'Tecnología',
  'arte-diseño': 'Arte y Diseño',
  'escolar': 'Escolar',
  'oficina': 'Oficina',
  'universitario': 'Universitario',
  'Polos': 'Polos Personalizados',
  'Tazas': 'Tazas Personalizadas',
  'Libretas': 'Libretas Personalizadas',
  'Cuadros': 'Cuadros Personalizados',
  'Accesorios': 'Accesorios Personalizados'
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalItems, subtotal, clearCart } = useCart();
  const { settings } = useSettingsContext();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'transfer' | 'card'>('yape');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<CartItem[]>([]);

  // Calcular costo de envío basado en settings
  const shipping = subtotal >= settings.shipping.freeShippingThreshold 
    ? 0 
    : settings.shipping.shippingCost;
  const total = subtotal + shipping;

  // Función para manejar el cambio de cantidad
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el carrito no esté vacío
    if (cart.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    // Validar datos de envío
    if (!shippingDetails.fullName.trim()) {
      toast.error('Por favor, ingresa tu nombre completo');
      return;
    }
    if (!shippingDetails.address.trim()) {
      toast.error('Por favor, ingresa tu dirección');
      return;
    }
    if (!shippingDetails.phone.trim()) {
      toast.error('Por favor, ingresa tu número de teléfono');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Procesando tu pedido...', { id: 'checkout' });

      if (!isSupabaseConfigured()) {
        throw new Error('Configuración de Supabase no encontrada');
      }

      // Obtener o crear usuario
      let userId: string | null = null;
      
      // Intentar obtener el usuario autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        userId = authUser.id;
        // Actualizar o crear perfil de usuario
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: authUser.email || shippingDetails.phone + '@temporal.com',
            full_name: shippingDetails.fullName,
            phone: shippingDetails.phone,
            address: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.postalCode}`,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (userError) {
          console.warn('Error updating user profile:', userError);
          // Continuar aunque falle la actualización del perfil
        }
      } else {
        // Usuario anónimo - necesitamos crear un usuario temporal
        // Generar un email único basado en timestamp y teléfono
        const tempEmail = `guest_${Date.now()}_${shippingDetails.phone.replace(/\D/g, '')}@guest.jubetech.com`;
        
        // Intentar crear usuario - puede fallar por RLS, pero intentamos
        // Nota: Esto puede requerir que el RLS permita insertar usuarios anónimos
        // o que se use un servicio edge function para crear el usuario
        try {
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              email: tempEmail,
              full_name: shippingDetails.fullName,
              phone: shippingDetails.phone,
              address: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.postalCode}`,
            })
            .select()
            .single();

          if (userError) {
            console.error('Error creating anonymous user:', userError);
            // Si no podemos crear usuario por RLS, intentar usar servicio anónimo
            // o mostrar mensaje de que necesita registrarse
            throw new Error('Para realizar pedidos necesitas estar registrado. Por favor, crea una cuenta primero.');
          }

          if (newUser) {
            userId = newUser.id;
          }
        } catch (error: any) {
          // Si falla, pedir al usuario que se registre
          throw new Error('Para realizar pedidos necesitas estar registrado. Por favor, crea una cuenta primero o inicia sesión.');
        }
      }

      if (!userId) {
        throw new Error('No se pudo obtener o crear el usuario. Por favor, intenta registrarte o iniciar sesión.');
      }

      // Construir dirección completa
      const fullAddress = `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.postalCode}`.trim();

      // Crear el pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'pending',
          total_amount: total,
          shipping_address: fullAddress,
          payment_method: paymentMethod === 'card' ? 'Tarjeta' : 
                         paymentMethod === 'transfer' ? 'Transferencia bancaria' :
                         paymentMethod.toUpperCase(),
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      if (!order) {
        throw new Error('No se pudo crear el pedido');
      }

      // Guardar resumen del pedido antes de limpiar el carrito
      const cartItemsCopy = JSON.parse(JSON.stringify(cart));
      setOrderSummary(cartItemsCopy);

      // Crear los items del pedido - solo productos (filtramos prints)
      const productItems = cart.filter(item => item.type === 'product');
      
      if (productItems.length === 0) {
        // Si no hay productos, eliminar el pedido
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error('El carrito debe contener al menos un producto. Los servicios de impresión deben gestionarse por separado.');
      }

      // VALIDAR STOCK ANTES DE CREAR EL PEDIDO
      const stockErrors: string[] = [];
      const productStockMap = new Map<string, { name: string; stock: number; requested: number }>();

      for (const item of productItems) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('id', item.id)
          .single();

        if (productError || !product) {
          stockErrors.push(`No se pudo verificar el stock del producto ${item.name || item.id}`);
          continue;
        }

        productStockMap.set(item.id, {
          name: product.name,
          stock: product.stock,
          requested: item.quantity
        });

        if (product.stock < item.quantity) {
          stockErrors.push(
            `${product.name}: Stock disponible (${product.stock}) es menor a la cantidad solicitada (${item.quantity})`
          );
        }
      }

      // Si hay errores de stock, eliminar el pedido y mostrar error
      if (stockErrors.length > 0) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Stock insuficiente:\n${stockErrors.join('\n')}`);
      }

      const orderItems = productItems.map(item => {
        const itemData: any = {
          order_id: order.id,
          quantity: item.quantity,
          unit_price: item.price,
          product_id: item.id,
        };

        if (item.customization) {
          itemData.customization = item.customization;
        }

        return itemData;
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Intentar eliminar el pedido si fallan los items
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      // ACTUALIZAR EL STOCK DE LOS PRODUCTOS DESPUÉS DE CREAR EL PEDIDO
      const stockUpdateErrors: string[] = [];
      
      for (const item of productItems) {
        const productInfo = productStockMap.get(item.id);
        if (!productInfo) {
          stockUpdateErrors.push(`No se encontró información del producto ${item.id}`);
          continue;
        }

        // Calcular nuevo stock
        const newStock = Math.max(0, productInfo.stock - item.quantity);

        // Actualizar el stock del producto
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Error updating stock for product ${item.id}:`, updateError);
          stockUpdateErrors.push(`Error al actualizar stock de ${productInfo.name}`);
        } else {
          console.log(`Stock actualizado: ${productInfo.name} - De ${productInfo.stock} a ${newStock}`);
        }
      }

      // Si hay errores críticos al actualizar el stock, advertir pero no revertir el pedido
      // (ya que el pedido ya fue creado y los items insertados)
      if (stockUpdateErrors.length > 0) {
        console.warn('Errores al actualizar stock:', stockUpdateErrors);
        toast.error('El pedido se creó pero hubo problemas al actualizar el stock. Por favor, contacta al administrador.', {
          duration: 6000
        });
      }

      // Advertir si había items de impresión que no se procesaron
      const printItems = cart.filter(item => item.type === 'print');
      if (printItems.length > 0) {
        console.warn(`${printItems.length} item(s) de impresión fueron omitidos del pedido. Deben gestionarse por separado.`);
      }

      toast.success('¡Pedido creado correctamente!', { id: 'checkout' });
      
      setCreatedOrderId(order.id);
      
      // Limpiar el carrito después de guardar el resumen
      clearCart();
      
      setCheckoutStep('confirmation');
      
    } catch (error: any) {
      console.error('Error processing order:', error);
      toast.error(
        error.message || 'Error al procesar el pedido. Por favor, intenta de nuevo.',
        { id: 'checkout', duration: 5000 }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getProductCategoryInfo = (item: any) => {
    if (item.type === 'print') {
      return 'Servicio de Impresión';
    }
    return getCategoryDisplayName(item.category || 'Producto');
  };

  if (cart.length === 0 && checkoutStep === 'cart') {
    return (
      <div className="min-h-screen pt-28 pb-12">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Tu Carrito de Compras
              </h1>
              <p className="text-gray-600">Revisa tus productos antes de finalizar tu compra</p>
            </div>

            {/* Empty Cart Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-12 text-center"
            >
              {/* Icono animado */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-100 to-accent-100 rounded-full p-6">
                    <ShoppingCart className="w-16 h-16 text-primary-600" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Parece que no has añadido nada a tu carrito todavía. 
                ¡Explora nuestros productos y encuentra algo increíble!
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/products" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ShoppingCart size={20} />
                    Explorar productos
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/print" 
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-8 rounded-xl shadow-md hover:shadow-lg border-2 border-gray-200 transition-all duration-300"
                  >
                    Servicio de impresión
                  </Link>
                </motion.div>
              </div>

              {/* Características destacadas */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="text-primary-600" size={24} />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Envío rápido</p>
                  <p className="text-xs text-gray-500">Recibe tus productos en tiempo récord</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="text-accent-600" size={24} />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Productos únicos</p>
                  <p className="text-xs text-gray-500">Personaliza todo lo que necesites</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Pago seguro</p>
                  <p className="text-xs text-gray-500">Transacciones protegidas</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-700 hover:text-primary-500 inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Inicio
              </Link>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="text-gray-500 ml-1 md:ml-2 text-sm font-medium">Carrito</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header con gradiente */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            Tu Carrito de Compras
          </h1>
          <p className="text-gray-600">Revisa tus productos antes de finalizar tu compra</p>
        </div>

        {/* Checkout Progress - Mejorado */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between relative">
              {/* Progress Line Background */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 -z-0">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 ease-out"
                  style={{ 
                    width: checkoutStep === 'cart' ? '0%' : 
                           checkoutStep === 'shipping' ? '33.3%' : 
                           checkoutStep === 'payment' ? '66.6%' : '100%' 
                  }}
                ></div>
              </div>

              {[
                { key: 'cart', label: 'Carrito', icon: ShoppingCart, num: 1 },
                { key: 'shipping', label: 'Envío', icon: Truck, num: 2 },
                { key: 'payment', label: 'Pago', icon: CreditCard, num: 3 },
                { key: 'confirmation', label: 'Confirmación', icon: CheckCircle, num: 4 }
              ].map((step, index) => {
                const isActive = checkoutStep === step.key;
                const isCompleted = (
                  (checkoutStep === 'shipping' && step.key === 'cart') ||
                  (checkoutStep === 'payment' && (step.key === 'cart' || step.key === 'shipping')) ||
                  (checkoutStep === 'confirmation')
                );
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <motion.div
                      initial={false}
                      animate={{ 
                        scale: isActive ? 1.1 : 1,
                      }}
                      className={`w-14 h-14 flex items-center justify-center rounded-full border-2 mb-2 transition-all duration-300 ${
                        isCompleted
                          ? 'border-green-500 bg-green-500 text-white shadow-lg'
                          : isActive
                          ? 'border-primary-500 bg-primary-500 text-white shadow-lg'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <Icon size={20} />
                      )}
                    </motion.div>
                    <div className={`text-xs font-semibold text-center transition-colors ${
                      isActive || isCompleted ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className={`text-xs mt-1 transition-colors ${
                      isActive || isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Paso {step.num}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {checkoutStep === 'cart' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  {/* Header del carrito */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="text-white" size={24} />
                      Productos en tu carrito ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex gap-4">
                            {/* Imagen del producto */}
                            <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 group-hover:border-primary-400 transition-colors shadow-sm">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                              <div className="absolute top-1 right-1 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                                {item.quantity}
                              </div>
                            </div>

                            {/* Información del producto */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                    {item.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {getProductCategoryInfo(item)}
                                  </p>
                                  {item.type === 'product' && item.customization?.text && (
                                    <div className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium mb-2">
                                      ✨ {item.customization.text}
                                    </div>
                                  )}
                                  {item.type === 'print' && item.printOptions && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="inline-flex items-center px-2 py-1 bg-accent-50 text-accent-700 rounded-md text-xs font-medium">
                                        {item.printOptions.color ? 'Color' : 'B/N'}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                                        {item.printOptions.paperType}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                                        {item.printOptions.size.toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xl font-bold text-primary-600">
                                    S/ {(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      S/ {item.price.toFixed(2)} c/u
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Controles */}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                {/* Contador de cantidad */}
                                <div className="flex items-center bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    className="p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                    aria-label="Reducir cantidad"
                                  >
                                    <Minus size={18} />
                                  </button>
                                  <span className="px-4 py-2 border-x-2 border-gray-200 font-semibold text-gray-900 min-w-[3rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    className="p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                    aria-label="Aumentar cantidad"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>

                                {/* Botón eliminar */}
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-medium transition-colors border border-red-200"
                                >
                                  <Trash2 size={18} />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Footer del carrito */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-4">
                    <Link 
                      to="/products" 
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
                    >
                      <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                      <span>Continuar comprando</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                {/* Resumen sticky */}
                <div className="sticky top-4">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
                    {/* Header del resumen */}
                    <div className="bg-gradient-to-r from-accent-500 to-accent-400 px-6 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard size={24} />
                        Resumen del pedido
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      {/* Detalles del resumen */}
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center py-2">
                          <div>
                            <p className="text-gray-600 text-sm">Subtotal</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})
                            </p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">S/ {subtotal.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-t border-gray-200">
                          <div>
                            <p className="text-gray-600 text-sm">Envío</p>
                            <p className="text-xs text-gray-500 mt-0.5">Estándar</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">S/ {shipping.toFixed(2)}</p>
                        </div>
                        
                        {/* Divider con estilo */}
                        <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-primary-300"></div>
                          </div>
                        </div>
                        
                        {/* Total destacado */}
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4 border-2 border-primary-200">
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-gray-900">Total</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                              S/ {total.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-500" />
                            Impuestos incluidos
                          </p>
                        </div>
                      </div>
                      
                      {/* Botón de checkout mejorado */}
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0, 123, 255, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCheckoutStep('shipping')}
                        disabled={cart.length === 0}
                        className={`
                          w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                          text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 
                          flex items-center justify-center gap-2
                          ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
                        `}
                      >
                        <CreditCard size={20} />
                        <span>Proceder al pago</span>
                        <ArrowLeft size={20} className="rotate-180" />
                      </motion.button>
                      
                      {/* Badge de seguridad */}
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">
                          🔒 Pago seguro y protegido
                        </p>
                        <p className="text-xs text-gray-400">
                          Al proceder aceptas nuestros{' '}
                          <a href="#" className="text-primary-600 hover:text-primary-700 underline font-medium">
                            términos y condiciones
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Envío gratis en compras mayores a S/ 100
                        </p>
                        <p className="text-xs text-blue-700">
                          Agrega más productos para obtener envío gratuito
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'shipping' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MapPin className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Dirección de envío</h2>
                        <p className="text-primary-100 text-sm">Ingresa dónde deseas recibir tu pedido</p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleShippingSubmit} className="p-6">
                    <div className="space-y-5">
                      {/* Nombre completo */}
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Home size={16} className="text-primary-500" />
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={shippingDetails.fullName}
                          onChange={(e) => setShippingDetails({...shippingDetails, fullName: e.target.value})}
                          required
                          placeholder="Ej: Juan Pérez García"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        />
                      </div>
                      
                      {/* Dirección */}
                      <div className="space-y-2">
                        <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Building size={16} className="text-primary-500" />
                          Dirección completa
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={shippingDetails.address}
                          onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                          required
                          placeholder="Ej: Av. Principal 123, Dpto 45"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        />
                      </div>
                      
                      {/* Ciudad y Código postal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPin size={16} className="text-primary-500" />
                            Ciudad
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={shippingDetails.city}
                            onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                            required
                            placeholder="Ej: Lima"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="postalCode" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Código postal
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={shippingDetails.postalCode}
                            onChange={(e) => setShippingDetails({...shippingDetails, postalCode: e.target.value})}
                            required
                            placeholder="Ej: 15001"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          />
                        </div>
                      </div>
                      
                      {/* Teléfono */}
                      <div className="space-y-2">
                        <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Phone size={16} className="text-primary-500" />
                          Teléfono de contacto
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={shippingDetails.phone}
                          onChange={(e) => setShippingDetails({...shippingDetails, phone: e.target.value})}
                          required
                          placeholder="Ej: +51 999 888 777"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        />
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                      <motion.button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        whileHover={{ x: -5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                      >
                        <ArrowLeft size={18} />
                        Volver al carrito
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                      >
                        <span>Continuar al pago</span>
                        <ArrowLeft size={18} className="rotate-180" />
                      </motion.button>
                    </div>
                  </form>
                  
                  {/* Badge de seguridad */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                      <Shield size={14} className="text-green-500" />
                      <span>Tu información está protegida y será utilizada solo para el envío</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-1">
                {/* Resumen sticky mejorado para envío */}
                <div className="sticky top-4">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package size={24} />
                        Resumen del pedido
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      {/* Productos en el carrito */}
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <ShoppingCart size={16} />
                          Productos ({totalItems})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-auto">
                          {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-14 w-14 flex-shrink-0 rounded-lg object-cover border-2 border-gray-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500">{getProductCategoryInfo(item)}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-600">Cant: {item.quantity}</span>
                                  <span className="text-sm font-bold text-primary-600">S/ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t-2 border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Subtotal</p>
                            <p className="text-xs text-gray-500">({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">S/ {subtotal.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Envío</p>
                            <p className="text-xs text-gray-500">Estándar</p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">S/ {shipping.toFixed(2)}</p>
                        </div>
                        
                        <div className="relative py-3">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-primary-300"></div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4 border-2 border-primary-200">
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-gray-900">Total</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                              S/ {total.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-500" />
                            Impuestos incluidos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-accent-500 to-accent-400 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <CreditCard className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Método de pago</h2>
                        <p className="text-accent-100 text-sm">Selecciona cómo deseas pagar</p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handlePaymentSubmit} className="p-6">
                    {/* Métodos de pago con cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* Yape */}
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        htmlFor="yape"
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'yape'
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          id="yape"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'yape'}
                          onChange={() => setPaymentMethod('yape')}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              paymentMethod === 'yape' ? 'bg-primary-500' : 'bg-gradient-to-br from-green-400 to-green-600'
                            }`}>
                              <QrCode className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">Yape</h3>
                              <p className="text-xs text-gray-500">Pago móvil rápido</p>
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'yape' && (
                          <CheckCircle className="text-primary-500 absolute top-2 right-2" size={20} />
                        )}
                      </motion.label>

                      {/* Plin */}
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        htmlFor="plin"
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'plin'
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          id="plin"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'plin'}
                          onChange={() => setPaymentMethod('plin')}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              paymentMethod === 'plin' ? 'bg-primary-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                              <QrCode className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">Plin</h3>
                              <p className="text-xs text-gray-500">Pago móvil seguro</p>
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'plin' && (
                          <CheckCircle className="text-primary-500 absolute top-2 right-2" size={20} />
                        )}
                      </motion.label>

                      {/* Transferencia */}
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        htmlFor="transfer"
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'transfer'
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          id="transfer"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'transfer'}
                          onChange={() => setPaymentMethod('transfer')}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              paymentMethod === 'transfer' ? 'bg-primary-500' : 'bg-gradient-to-br from-purple-400 to-purple-600'
                            }`}>
                              <Banknote className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">Transferencia</h3>
                              <p className="text-xs text-gray-500">Transferencia bancaria</p>
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'transfer' && (
                          <CheckCircle className="text-primary-500 absolute top-2 right-2" size={20} />
                        )}
                      </motion.label>

                      {/* Tarjeta */}
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        htmlFor="card"
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          id="card"
                          name="paymentMethod"
                          type="radio"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              paymentMethod === 'card' ? 'bg-primary-500' : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                            }`}>
                              <CreditCard className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">Tarjeta</h3>
                              <p className="text-xs text-gray-500">Crédito / Débito</p>
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'card' && (
                          <CheckCircle className="text-primary-500 absolute top-2 right-2" size={20} />
                        )}
                      </motion.label>
                    </div>

                    {paymentMethod === 'yape' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <QrCode className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Pagar con Yape</h3>
                            <p className="text-sm text-gray-600">Pago rápido e instantáneo</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                          <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="border-2 border-green-200 rounded-lg p-3 bg-white">
                              <img 
                                src="https://images.pexels.com/photos/278430/pexels-photo-278430.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                                alt="QR Yape" 
                                className="w-40 h-40 object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-3">Escanea el código QR con tu app de Yape o envía el dinero al:</p>
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                                <p className="text-lg font-bold text-green-700 flex items-center gap-2">
                                  <Phone size={18} />
                                  +51 999 888 777
                                </p>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>Una vez realizado el pago, nuestro equipo verificará la transacción y procesará tu pedido.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'plin' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <QrCode className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Pagar con Plin</h3>
                            <p className="text-sm text-gray-600">Pago seguro y confiable</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                          <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="border-2 border-blue-200 rounded-lg p-3 bg-white">
                              <img 
                                src="https://images.pexels.com/photos/278430/pexels-photo-278430.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                                alt="QR Plin" 
                                className="w-40 h-40 object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-3">Escanea el código QR con tu app de Plin o envía el dinero al:</p>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
                                <p className="text-lg font-bold text-blue-700 flex items-center gap-2">
                                  <Phone size={18} />
                                  +51 999 888 777
                                </p>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>Una vez realizado el pago, nuestro equipo verificará la transacción y procesará tu pedido.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'transfer' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Banknote className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Transferencia Bancaria</h3>
                            <p className="text-sm text-gray-600">Pago directo desde tu banco</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-5 border-2 border-purple-300">
                          <p className="text-sm font-medium text-gray-700 mb-4">Realiza una transferencia bancaria a la siguiente cuenta:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs text-gray-600 mb-1">Banco</p>
                              <p className="font-bold text-gray-900">{settings.payment.bankName}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs text-gray-600 mb-1">Titular</p>
                              <p className="font-bold text-gray-900">JuBeTech S.A.C.</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs text-gray-600 mb-1">Cuenta Corriente</p>
                              <p className="font-bold text-gray-900">123-456789-123</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-xs text-gray-600 mb-1">CCI</p>
                              <p className="font-bold text-gray-900">003-123-123456789123-12</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                            <Mail size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>Envíanos el comprobante a <strong>contacto@jubetech.com</strong> o WhatsApp <strong>+51 999 888 777</strong></span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === 'card' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <CreditCard className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Tarjeta de Crédito / Débito</h3>
                            <p className="text-sm text-gray-600">Pago seguro con Stripe</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-5 border-2 border-indigo-300 space-y-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                              <CreditCard size={16} className="text-indigo-500" />
                              Número de tarjeta
                            </label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Fecha de expiración
                              </label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                CVV
                              </label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Nombre del titular
                            </label>
                            <input
                              type="text"
                              placeholder="Como aparece en la tarjeta"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                              required
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                            <Lock size={14} className="text-green-500" />
                            <span>Pago procesado de forma segura con encriptación SSL</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                      <motion.button
                        type="button"
                        onClick={() => setCheckoutStep('shipping')}
                        whileHover={{ x: -5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                      >
                        <ArrowLeft size={18} />
                        Volver a envío
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: isProcessing ? 1 : 1.02, boxShadow: isProcessing ? 'none' : "0 10px 25px rgba(0, 123, 255, 0.3)" }}
                        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                        type="submit"
                        disabled={isProcessing}
                        className={`
                          bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                          text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 
                          flex items-center gap-2
                          ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}
                        `}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={18} />
                            <span>Confirmar y pagar</span>
                            <CheckCircle size={18} />
                          </>
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Badge de seguridad */}
                    <div className="mt-6">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <Shield size={14} className="text-green-500" />
                        <span>Tu pago está protegido con encriptación de nivel bancario</span>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>

              <div className="lg:col-span-1">
                {/* Resumen sticky mejorado para pago */}
                <div className="sticky top-4 space-y-4">
                  {/* Resumen del pedido */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-accent-500 to-accent-400 px-6 py-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package size={24} />
                        Resumen del pedido
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      {/* Productos */}
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <ShoppingCart size={16} />
                          Productos ({totalItems})
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-auto">
                          {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover border-2 border-gray-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500">{getProductCategoryInfo(item)}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-600">x{item.quantity}</span>
                                  <span className="text-sm font-bold text-primary-600">S/ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t-2 border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 text-sm font-medium">Subtotal</p>
                          <p className="text-lg font-semibold text-gray-900">S/ {subtotal.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 text-sm font-medium">Envío</p>
                          <p className="text-lg font-semibold text-gray-900">S/ {shipping.toFixed(2)}</p>
                        </div>
                        
                        <div className="relative py-3">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-primary-300"></div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4 border-2 border-primary-200">
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-gray-900">Total</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                              S/ {total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dirección de envío */}
                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <MapPin size={18} className="text-primary-500" />
                        Dirección de envío
                      </h3>
                    </div>
                    <div className="p-6">
                      <address className="not-italic text-sm text-gray-700 space-y-1">
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Home size={14} />
                          {shippingDetails.fullName}
                        </p>
                        <p className="flex items-center gap-2">
                          <Building size={14} className="text-gray-400" />
                          {shippingDetails.address}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          {shippingDetails.city}, {shippingDetails.postalCode}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          {shippingDetails.phone}
                        </p>
                      </address>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'confirmation' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              {/* Card principal de confirmación */}
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-8 py-12 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/5"></div>
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
                    >
                      <CheckCircle className="text-green-600" size={48} strokeWidth={3} />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-4xl font-bold text-white mb-3"
                    >
                      ¡Pedido Confirmado!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-green-50 text-lg"
                    >
                      Gracias por tu compra. Tu pedido ha sido recibido exitosamente.
                    </motion.p>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-8 md:p-10">
                  {/* Número de pedido destacado */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-primary-50 via-accent-50 to-primary-50 rounded-xl p-6 mb-8 border-2 border-primary-200 shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Package className="text-primary-600" size={28} />
                      <p className="text-base font-semibold text-gray-700">Número de pedido</p>
                    </div>
                    <p className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent text-center mb-2">
                      {createdOrderId ? `#${createdOrderId.slice(0, 8).toUpperCase()}` : 'JBT-' + Math.floor(Math.random() * 10000)}
                    </p>
                    {createdOrderId && (
                      <p className="text-xs text-gray-500 text-center mt-2 font-mono bg-gray-100 px-3 py-1 rounded inline-block">
                        ID: {createdOrderId}
                      </p>
                    )}
                  </motion.div>

                  {/* Grid de información */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Productos */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200"
                    >
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingCart className="text-primary-600" size={20} />
                        Productos
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-auto">
                        {orderSummary.length > 0 ? orderSummary.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover border-2 border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-500">{getProductCategoryInfo(item)}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-600">Cant: {item.quantity}</span>
                                <span className="text-sm font-bold text-primary-600">S/ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500 text-center py-4">No hay productos en este pedido.</p>
                        )}
                      </div>
                      
                      {/* Resumen de totales */}
                      <div className="mt-6 pt-4 border-t-2 border-gray-300 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">S/ {orderSummary.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Envío:</span>
                          <span className="font-semibold">S/ {shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300">
                          <span>Total:</span>
                          <span className="text-primary-600">S/ {(orderSummary.reduce((sum, item) => sum + (item.price * item.quantity), 0) + shipping).toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Información de envío y pago */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-4"
                    >
                      {/* Dirección */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="text-blue-600" size={20} />
                          Dirección de envío
                        </h3>
                        <address className="not-italic text-sm text-gray-700 space-y-2">
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Home size={16} className="text-blue-500" />
                            {shippingDetails.fullName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Building size={16} className="text-gray-400" />
                            {shippingDetails.address}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            {shippingDetails.city}, {shippingDetails.postalCode}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" />
                            {shippingDetails.phone}
                          </p>
                        </address>
                      </div>

                      {/* Método de pago */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <CreditCard className="text-purple-600" size={20} />
                          Método de pago
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            paymentMethod === 'yape' ? 'bg-green-500' :
                            paymentMethod === 'plin' ? 'bg-blue-500' :
                            paymentMethod === 'transfer' ? 'bg-purple-500' :
                            'bg-indigo-500'
                          }`}>
                            {paymentMethod === 'yape' || paymentMethod === 'plin' ? <QrCode className="text-white" size={20} /> :
                             paymentMethod === 'transfer' ? <Banknote className="text-white" size={20} /> :
                             <CreditCard className="text-white" size={20} />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {paymentMethod === 'card' ? 'Tarjeta de crédito/débito' : 
                               paymentMethod === 'transfer' ? 'Transferencia bancaria' : 
                               paymentMethod.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {paymentMethod === 'card' ? 'Stripe' :
                                paymentMethod === 'transfer' ? settings.payment.bankName :
                                'Pago móvil'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Mensaje informativo */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8 border-2 border-blue-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="text-white" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">¿Qué sigue ahora?</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            Te hemos enviado un correo electrónico con los detalles de tu pedido
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            Procesaremos tu pedido y te notificaremos cuando sea enviado
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            Recibirás un número de seguimiento para rastrear tu envío
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link 
                        to="/products" 
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ShoppingCart size={20} />
                        Seguir comprando
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-xl shadow-md hover:shadow-lg border-2 border-gray-200 transition-all duration-300"
                      >
                        <Home size={20} />
                        Volver al inicio
                      </Link>
                    </motion.div>
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

export default Cart;