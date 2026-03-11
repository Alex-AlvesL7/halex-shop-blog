import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Product } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface SupportChatProps {
  products: Product[];
}

export const SupportChat: React.FC<SupportChatProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o assistente virtual da Halex Shop. Como posso ajudar você hoje com seus treinos e suplementação?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `
        Você é o assistente virtual da Halex Shop, uma loja de suplementos e acessórios esportivos de elite.
        Seu objetivo é ajudar os clientes com dúvidas sobre suplementação, treinos e recomendar produtos da loja.
        
        Aqui está o catálogo atual de produtos:
        ${products.map(p => `- ${p.name}: R$ ${p.price.toFixed(2)} (${p.category}). Descrição: ${p.description}. Estoque: ${p.stock}`).join('\n')}
        
        Regras:
        1. Seja profissional, motivador e focado em performance.
        2. Se o cliente perguntar sobre um objetivo (ex: ganhar massa, emagrecer), recomende os produtos adequados do catálogo acima.
        3. Se um produto estiver com estoque 0, mencione que está temporariamente indisponível.
        4. Responda sempre em Português do Brasil.
        5. Use Markdown para formatar suas respostas (negrito, listas, etc).
        6. Se não souber algo, direcione o cliente para o suporte humano através do email suporte@halexshop.com.
      `;

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: userMessage });
      const botText = response.text || "Desculpe, tive um problema ao processar sua mensagem. Poderia repetir?";
      
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro na conexão. Por favor, tente novamente em instantes." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Suporte Halex</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Online Agora</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-100' : 'bg-brand-orange/10'}`}>
                      {msg.role === 'user' ? <User size={14} className="text-gray-500" /> : <Bot size={14} className="text-brand-orange" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-black text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none'}`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="animate-spin text-brand-orange" size={16} />
                    <span className="text-xs text-gray-400 font-medium">Halex está digitando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Como podemos ajudar?"
                  className="w-full p-4 pr-12 bg-white rounded-2xl border border-gray-100 outline-none focus:border-brand-orange transition-colors text-sm"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-orange text-white rounded-xl hover:bg-brand-black transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-orange text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-black transition-colors relative"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold">
            1
          </div>
        )}
      </motion.button>
    </div>
  );
};
