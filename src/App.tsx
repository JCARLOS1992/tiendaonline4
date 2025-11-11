import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import AdminLayout from './pages/admin/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import PrintService from './pages/PrintService';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminPrintOrders from './pages/admin/PrintOrders';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <Router>
      <SettingsProvider>
        <CartProvider>
          <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
          <Route path="/admin/print-orders" element={<AdminLayout><AdminPrintOrders /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          
          {/* Client Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/print" element={<Layout><PrintService /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/cart" element={<Layout><Cart /></Layout>} />
          </Routes>
          <Toaster position="top-right"  />
        </CartProvider>
      </SettingsProvider>
    </Router>
  );
}

export default App;