import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Users, Target, Zap, TrendingUp, Clock, Shield, Heart, CheckCircle, Printer, Cpu, Package } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-16">
      {/* Header */}
      <div className="bg-primary-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Sobre JuBeTech</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Conoce nuestra historia, misión y visión. Descubre cómo combinamos creatividad, tecnología e impresión de calidad.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Nuestra Historia</h2>
              <div className="h-1 w-20 bg-accent-500 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <img 
                  src="https://images.pexels.com/photos/6612388/pexels-photo-6612388.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="JuBeTech Team" 
                  className="rounded-lg shadow-lg"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-gray-700 mb-4">
                  JuBeTech nació en 2023 con una visión clara: revolucionar la industria de la impresión y los productos personalizados, combinando la última tecnología con un servicio al cliente excepcional.
                </p>
                <p className="text-gray-700 mb-4">
                  Fundada por un grupo de emprendedores apasionados por la tecnología y el diseño, nuestra empresa comenzó como un pequeño emprendimiento y rápidamente creció hasta convertirse en un referente en el mercado peruano.
                </p>
                <p className="text-gray-700">
                  Hoy, JuBeTech se destaca por ofrecer soluciones innovadoras tanto para individuos como para empresas, utilizando inteligencia artificial para facilitar la personalización de productos y optimizar el proceso de impresión.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <div className="inline-block p-3 bg-primary-50 rounded-lg mb-4">
                  <Target className="text-primary-500" size={30} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Misión</h3>
                <p className="text-gray-700">
                  Nuestra misión es proporcionar productos personalizados de alta calidad y servicios de impresión excepcionales, utilizando tecnología avanzada e inteligencia artificial para superar las expectativas de nuestros clientes en cada pedido.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <div className="inline-block p-3 bg-primary-50 rounded-lg mb-4">
                  <Zap className="text-primary-500" size={30} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Visión</h3>
                <p className="text-gray-700">
                  Aspiramos a convertirnos en la imprenta online más confiable e innovadora del Perú, liderando la revolución digital en la industria de la personalización y la impresión, y creando experiencias memorables para nuestros clientes a través de la tecnología y el diseño.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Nuestros Valores</h2>
              <div className="h-1 w-20 bg-accent-500 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { 
                  icon: <Award className="text-primary-500" size={24} />, 
                  title: "Calidad", 
                  description: "Nos comprometemos con la excelencia en cada producto y servicio que ofrecemos." 
                },
                { 
                  icon: <Zap className="text-primary-500" size={24} />, 
                  title: "Innovación", 
                  description: "Constantemente buscamos nuevas tecnologías y métodos para mejorar nuestros procesos." 
                },
                { 
                  icon: <Users className="text-primary-500" size={24} />, 
                  title: "Servicio al Cliente", 
                  description: "Ponemos a nuestros clientes en el centro de todo lo que hacemos." 
                },
                { 
                  icon: <Heart className="text-primary-500" size={24} />, 
                  title: "Responsabilidad", 
                  description: "Nos preocupamos por el impacto ambiental y social de nuestras operaciones." 
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 p-6 rounded-lg"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-primary-50 rounded-full mr-3">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{value.title}</h3>
                  </div>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Nuestro Equipo</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Detrás de JuBeTech hay un equipo de profesionales apasionados por la tecnología, el diseño y la impresión de calidad.
            </p>
            <div className="h-1 w-20 bg-accent-500 mx-auto mt-4"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { 
                name: "Carlos Mendoza", 
                role: "Fundador & CEO", 
                image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              },
              { 
                name: "Ana Gutiérrez", 
                role: "Directora de Diseño", 
                image: "https://images.pexels.com/photos/773371/pexels-photo-773371.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              },
              { 
                name: "Luis Vargas", 
                role: "Jefe de Producción", 
                image: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              },
              { 
                name: "María Rodríguez", 
                role: "Responsable de IA", 
                image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-56 object-cover"
                />
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-primary-500">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">JuBeTech en Números</h2>
              <div className="h-1 w-20 bg-accent-500 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: "500+", label: "Clientes Satisfechos", icon: <Users className="text-primary-500" size={32} /> },
                { number: "10K+", label: "Pedidos Completados", icon: <CheckCircle className="text-green-500" size={32} /> },
                { number: "50+", label: "Productos Disponibles", icon: <Package className="text-purple-500" size={32} /> },
                { number: "24/7", label: "Soporte Disponible", icon: <Clock className="text-orange-500" size={32} /> }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-center mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">¿Por qué elegir JuBeTech?</h2>
              <div className="h-1 w-20 bg-accent-500 mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Cpu className="text-primary-500" size={28} />,
                  title: "Tecnología de Vanguardia",
                  description: "Utilizamos inteligencia artificial y las últimas tecnologías de impresión para ofrecer resultados excepcionales."
                },
                {
                  icon: <Zap className="text-primary-500" size={28} />,
                  title: "Entrega Rápida",
                  description: "Procesamos y entregamos tus pedidos en el menor tiempo posible sin comprometer la calidad."
                },
                {
                  icon: <Shield className="text-primary-500" size={28} />,
                  title: "Garantía de Calidad",
                  description: "Todos nuestros productos pasan por estrictos controles de calidad antes de llegar a tus manos."
                },
                {
                  icon: <TrendingUp className="text-primary-500" size={28} />,
                  title: "Precios Competitivos",
                  description: "Ofrecemos los mejores precios del mercado sin sacrificar la calidad de nuestros productos y servicios."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="p-3 bg-primary-50 rounded-lg mr-4">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Nuestro Proceso de Trabajo</h2>
              <div className="h-1 w-20 bg-accent-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Desde que recibes tu pedido hasta que lo tienes en tus manos, te acompañamos en cada paso.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Solicitud", description: "Realizas tu pedido online o personalizas tu producto", icon: <Printer className="text-primary-500" size={24} /> },
                { step: "02", title: "Procesamiento", description: "Revisamos y procesamos tu pedido con tecnología IA", icon: <Cpu className="text-primary-500" size={24} /> },
                { step: "03", title: "Producción", description: "Fabricamos tu producto con los más altos estándares", icon: <Package className="text-primary-500" size={24} /> },
                { step: "04", title: "Entrega", description: "Te enviamos tu pedido de forma rápida y segura", icon: <CheckCircle className="text-primary-500" size={24} /> }
              ].map((process, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-3">
                      {process.step}
                    </div>
                    <div className="absolute top-8 left-full w-full hidden md:block">
                      {index < 3 && (
                        <div className="h-0.5 bg-gray-300 relative">
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-gray-300 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary-50 rounded-lg">
                        {process.icon}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{process.title}</h3>
                  <p className="text-sm text-gray-600">{process.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para trabajar con nosotros?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Permítenos ayudarte con tus proyectos de impresión y productos personalizados.
          </p>
          <Link 
            to="/contact" 
            className="inline-block bg-white text-primary-600 font-medium py-3 px-8 rounded-md shadow-md hover:bg-gray-100 transition-colors"
          >
            Contáctanos hoy
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;