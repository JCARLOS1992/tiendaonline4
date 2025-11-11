import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const Contact = () => {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    // Simulate form submission
    setTimeout(() => {
      setFormStatus('success');
      setFormState({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      // Reset form status after 5 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-primary-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Contacto</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            ¿Tienes alguna pregunta o necesitas más información? Estamos aquí para ayudarte.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <MessageSquare className="mr-2 text-primary-500" size={20} />
              Información de Contacto
            </h2>
            
            <div className="space-y-6">
              <motion.div 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary-50 p-3 rounded-full mr-4">
                  <MapPin className="text-primary-500" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Dirección</h3>
                  <p className="text-gray-600 mt-1">Av. Principal 123, Lima, Perú</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary-50 p-3 rounded-full mr-4">
                  <Phone className="text-primary-500" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Teléfono</h3>
                  <p className="text-gray-600 mt-1">+51 999 888 777</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary-50 p-3 rounded-full mr-4">
                  <Mail className="text-primary-500" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600 mt-1">contacto@jubetech.com</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary-50 p-3 rounded-full mr-4">
                  <Clock className="text-primary-500" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Horario de Atención</h3>
                  <p className="text-gray-600 mt-1">Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Sábado: 9:00 AM - 1:00 PM</p>
                </div>
              </motion.div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium mb-3">Síguenos</h3>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-colors" aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="md:col-span-3 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Envíanos un mensaje</h2>
            
            {formStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-l-4 border-green-500 p-4 mb-6"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">
                      Mensaje enviado correctamente
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Gracias por contactarnos. Te responderemos a la brevedad.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formState.subject}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="productos">Consulta sobre productos</option>
                    <option value="impresion">Consulta sobre impresión</option>
                    <option value="pedido">Estado de mi pedido</option>
                    <option value="cotizacion">Solicitud de cotización</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={`
                    w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-md 
                    shadow transition-colors flex items-center justify-center
                    ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Enviar mensaje
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="max-w-5xl mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-md p-4 overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249743.72044242057!2d-77.12786099265629!3d-12.026620399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c5f619ee3ec7%3A0x14206cb9cc452e4a!2sLima!5e0!3m2!1sen!2spe!4v1689321652353!5m2!1sen!2spe"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="JuBeTech Location Map"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;