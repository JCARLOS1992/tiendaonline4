import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type ChatAssistantProps = {
  onClose: () => void;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: '¡Hola! Soy el asistente virtual de JuBeTech. ¿En qué puedo ayudarte hoy?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const ChatAssistant = ({ onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Simulate bot response (would be replaced with actual AI integration)
    setTimeout(() => {
      const botResponses = [
        "¡Claro! Puedo ayudarte a personalizar productos o imprimir tus documentos.",
        "Tenemos una amplia gama de productos personalizables. ¿Qué te interesa?",
        "Para imprimir documentos, simplemente carga tu archivo en la sección de impresión.",
        "Ofrecemos envíos a todo Perú. ¿Necesitas más información sobre nuestros plazos de entrega?",
        "¿Necesitas ayuda con algún producto específico o con el proceso de impresión?"
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50 overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-primary-500 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold">Asistente JuBeTech</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.text}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-3 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="flex-grow px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`px-4 py-2 rounded-r-md flex items-center justify-center ${
            !input.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default ChatAssistant;