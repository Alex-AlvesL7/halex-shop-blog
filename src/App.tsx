import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { ShoppingBag, Menu, X, User, Search, ChevronRight, Instagram, Facebook, Youtube, Plus, Trash2, LayoutDashboard, Package, FileText, Edit, Upload, CheckCircle, TrendingUp, DollarSign, Users, BarChart3, Heart, LogOut, Tag, ArrowLeft, Mail, Phone, MapPin, CreditCard, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './services/supabaseClient';
import { PRODUCTS, POSTS } from './data';
import { Product, BlogPost, CartItem } from './types';
import { SupportChat } from './components/SupportChat';
import { AffiliatesManagement } from './components/AffiliatesManagement';
import { BlogManagement } from './components/admin/BlogManagement';
import { ProductManagement } from './components/admin/ProductManagement';
import { CategoryManagement } from './components/admin/CategoryManagement';
import { AffiliateDashboard } from './components/AffiliateDashboard';
import { FreteCalculator } from './components/FreteCalculator';
import { FreteOption } from './services/melhorEnvioService';

import { generateSalesInsight, generateSalesQuizRecommendation, SalesQuizProfile } from './services/geminiService';

// --- Contexts ---
const AuthContext = createContext<{ user: any, favorites: any[], toggleFavorite: (id: string, type: 'product' | 'post') => void, isFavorite: (id: string) => boolean, logout: () => void }>({ user: null, favorites: [], toggleFavorite: () => {}, isFavorite: () => false, logout: () => {} });

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
           console.error("Auth error:", error);
           if (error.message.includes("Invalid Refresh Token")) {
             supabase.auth.signOut();
           }
        }
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => setFavorites(data));
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = async (id: string, type: 'product' | 'post') => {
    if (!user) return;
    const existing = favorites.find(f => f.item_id === id);
    if (existing) {
      await fetch(`/api/favorites/${user.id}/${id}`, { method: 'DELETE' });
      setFavorites(favorites.filter(f => f.item_id !== id));
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, item_id: id, item_type: type })
      });
      setFavorites([...favorites, { item_id: id, item_type: type }]);
    }
  };

  const isFavorite = (id: string) => favorites.some(f => f.item_id === id);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, favorites, toggleFavorite, isFavorite, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

const normalizeProductText = (value: string) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

type ProductSalesCopy = {
  summary: string;
  purpose: string;
  composition: string;
};

const PRODUCT_COPY: Record<string, ProductSalesCopy> = {
  'l7-ultra-450-kit': {
    summary: 'Kit pensado para quem busca emagrecimento com mais equilíbrio, combinando controle do apetite com suporte detox na rotina.',
    purpose: 'O L7 Ultra 450mg ajuda na saciedade e no controle da fome. O Detox entra como apoio para rotina digestiva, sensação de leveza e constância no processo.',
    composition: 'Composição principal: L7 Ultra 450mg + Detox. Destaques citados no produto: Laranja Moro, L-Carnitina e Psyllium.',
  },
  'l7-turbo-500-kit': {
    summary: 'Kit voltado para quem quer emagrecer com mais energia no dia a dia e um apoio detox complementar.',
    purpose: 'O L7 Turbo 500mg é indicado para acelerar a rotina e melhorar disposição. O Detox complementa com suporte para retenção, leveza e aderência ao plano.',
    composition: 'Composição principal: L7 Turbo 500mg + Detox.',
  },
  'l7-ultra-450': {
    summary: 'Produto para quem quer um apoio mais equilibrado no controle do apetite e na constância da dieta.',
    purpose: 'Ajuda a reduzir fome excessiva e melhorar saciedade, favorecendo adesão alimentar ao longo do dia.',
    composition: 'Composição destacada: Laranja Moro, L-Carnitina e Psyllium.',
  },
  'l7-nitro-750-kit': {
    summary: 'Kit mais forte para quem quer foco maior em saciedade, metabolismo e resultado mais agressivo no emagrecimento.',
    purpose: 'O L7 Nitro 750mg atua como produto principal para controle do apetite e apoio à queima de gordura. O Detox complementa ajudando na rotina digestiva e na sensação de menos inchaço.',
    composition: 'Composição principal: L7 Nitro 750mg + Detox Shake.',
  },
  'l7-nitro-750': {
    summary: 'Versão individual para quem busca um termogênico com foco em saciedade alta e apoio na gordura abdominal.',
    purpose: 'Indicado para controlar fome, manter foco no plano e intensificar o suporte ao emagrecimento.',
    composition: 'Composição principal: L7 Nitro 750mg.',
  },
  'l7-turbo-500': {
    summary: 'Produto individual para quem quer emagrecimento com mais energia e melhor rendimento na rotina.',
    purpose: 'Ajuda a dar disposição para o dia a dia e apoia o gasto calórico com uso mais prático e direto.',
    composition: 'Composição principal: L7 Turbo 500mg.',
  },
  'l7-nitro-750-full': {
    summary: 'Combo mais completo para emagrecimento, unindo produto principal forte, detox e suporte extra para pele e articulações.',
    purpose: 'O L7 Nitro 750mg foca em saciedade e queima de gordura. O Detox ajuda na rotina digestiva e sensação de leveza. O Colágeno entra como apoio para firmeza da pele e cuidado articular durante o processo.',
    composition: 'Composição principal: L7 Nitro 750mg + Detox + Colágeno.',
  },
  'l7-turbo-500-full': {
    summary: 'Kit completo para quem quer emagrecer com energia, suporte detox e cuidado complementar com pele e articulações.',
    purpose: 'O L7 Turbo 500mg apoia disposição e rotina de queima calórica. O Detox ajuda na sensação de leveza. O Colágeno complementa com suporte para firmeza da pele e articulações.',
    composition: 'Composição principal: L7 Turbo 500mg + Detox + Colágeno.',
  },
};

const getProductMarketingSummary = (product?: Product | null): ProductSalesCopy => {
  if (!product) {
    return {
      summary: '',
      purpose: '',
      composition: '',
    };
  }

  if (PRODUCT_COPY[product.id]) return PRODUCT_COPY[product.id];

  const firstSentence = String(product.description || '').split(/[.!?]/).find(Boolean)?.trim() || 'Produto indicado para uma rotina mais consistente e objetiva';
  const source = normalizeProductText(`${product.name} ${product.description} ${product.category || ''}`);
  const hasDetox = source.includes('detox');
  const hasCollagen = source.includes('colageno');

  return {
    summary: `${firstSentence}.`,
    purpose: `Indicado para ${product.category || 'rotina fitness'}${hasDetox ? ' com apoio detox' : ''}${hasCollagen ? ' e suporte complementar para pele e articulações' : ''}.`,
    composition: `Composição principal: ${product.name.replace(/^1\s*/i, '')}.`,
  };
};

const formatPriceBRL = (value?: number | null) => `R$ ${Number(value || 0).toFixed(2)}`;

const hasProductPromotion = (product?: Product | null) => Boolean(product?.compareAtPrice && product.compareAtPrice > product.price && product.discountPercentage);

// --- Components ---

const ThemeToggle = ({
  themePreference,
  resolvedTheme,
  onThemeChange,
  compact = false,
}: {
  themePreference: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  compact?: boolean;
}) => {
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`theme-toggle flex items-center gap-1 p-1 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'} ${compact ? 'w-full justify-between' : ''}`}>
      {[
        { value: 'light', label: compact ? 'Claro' : '', icon: Sun },
        { value: 'dark', label: compact ? 'Black' : '', icon: Moon },
        { value: 'system', label: compact ? 'Sistema' : '', icon: Monitor },
      ].map(option => {
        const Icon = option.icon;
        const active = themePreference === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onThemeChange(option.value as 'light' | 'dark' | 'system')}
            title={compact ? undefined : option.value === 'light' ? 'Tema claro' : option.value === 'dark' ? 'Tema black' : 'Seguir sistema'}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${active ? 'bg-brand-orange text-white shadow-sm' : isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-500 hover:bg-white'}`}
          >
            <Icon size={14} />
            {compact && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

const Navbar = ({ cartCount, onCartClick, onNavigate, themePreference, resolvedTheme, onThemeChange }: { cartCount: number, onCartClick: () => void, onNavigate: (page: string) => void, themePreference: 'light' | 'dark' | 'system', resolvedTheme: 'light' | 'dark', onThemeChange: (theme: 'light' | 'dark' | 'system') => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`theme-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? (isDark ? 'bg-black/85 backdrop-blur-md shadow-sm py-3' : 'bg-white/90 backdrop-blur-md shadow-sm py-3') : 'bg-transparent py-6'} ${isDark ? 'text-white' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className={`text-2xl font-display font-black tracking-tighter hover:text-brand-orange transition-colors ${isDark ? 'text-white' : 'text-brand-black'}`}>
              HALEX<span className="text-brand-orange">SHOP</span>
            </button>
            
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className="nav-link">Início</button>
              <button onClick={() => onNavigate('store')} className="nav-link">Loja</button>
              <button onClick={() => onNavigate('blog')} className="nav-link">Blog</button>
              <button onClick={() => onNavigate('tips')} className="nav-link">Dicas AI</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ThemeToggle themePreference={themePreference} resolvedTheme={resolvedTheme} onThemeChange={onThemeChange} />
            </div>
            <button className="p-2 text-gray-600 hover:text-brand-orange transition-colors hidden sm:block">
              <Search size={20} />
            </button>
            <button 
              onClick={() => user ? setIsProfileOpen(true) : setIsAuthOpen(true)} 
              className="p-2 text-gray-600 hover:text-brand-orange transition-colors flex items-center gap-2"
            >
              <User size={20} />
              {user && <span className="text-[10px] font-bold hidden sm:inline">{user.email.split('@')[0]}</span>}
            </button>
            <button onClick={onCartClick} className="relative p-2 text-gray-600 hover:text-brand-orange transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            {user?.email === 'alexdjmp3@gmail.com' && (
              <button onClick={() => onNavigate('admin')} className="p-2 text-gray-600 hover:text-brand-orange transition-colors hidden sm:block" title="Painel Admin">
                <LayoutDashboard size={20} />
              </button>
            )}
            {user && (
              <button onClick={logout} className="p-2 text-gray-600 hover:text-red-500 transition-colors hidden sm:block" title="Sair">
                <LogOut size={20} />
              </button>
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`theme-mobile-menu md:hidden overflow-hidden ${isDark ? 'bg-[#0f0f0f] border-t border-white/10 text-white' : 'bg-white border-t border-gray-100'}`}
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <ThemeToggle themePreference={themePreference} resolvedTheme={resolvedTheme} onThemeChange={onThemeChange} compact />
                <button onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Início</button>
                <button onClick={() => { onNavigate('store'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Loja</button>
                <button onClick={() => { onNavigate('blog'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Blog</button>
                <button onClick={() => { onNavigate('tips'); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium">Dicas AI</button>
                {user && <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left py-2 font-medium text-red-500">Sair</button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

const ProductCard: React.FC<{ product: Product, onAddToCart: (p: Product) => void, onClick: (p: Product) => void }> = ({ product, onAddToCart, onClick }) => {
  const { toggleFavorite, isFavorite, user } = useAuth();
  const favorited = isFavorite(product.id);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => onClick(product)}
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative ${product.stock <= 0 ? 'opacity-75' : ''}`}
    >
      {user && (
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id, 'product'); }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${favorited ? 'bg-brand-orange text-white' : 'bg-white/80 text-gray-400 hover:text-brand-orange'}`}
        >
          <Heart size={16} fill={favorited ? "currentColor" : "none"} />
        </button>
      )}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-brand-black">
          {product.category}
        </span>
        {product.promotionLabel && (
          <span className="bg-brand-orange text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {product.promotionLabel}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
            Esgotado
          </span>
        )}
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-display font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}>★</span>
          ))}
        </div>
        <span className="text-xs text-gray-400">({product.reviews})</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          {hasProductPromotion(product) && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 line-through">{formatPriceBRL(product.compareAtPrice)}</span>
              <span className="px-2 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest">
                -{product.discountPercentage}%
              </span>
            </div>
          )}
          <span className="text-lg font-bold text-brand-orange">{formatPriceBRL(product.price)}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (product.stock > 0) onAddToCart(product);
          }}
          disabled={product.stock <= 0}
          className={`p-2 rounded-full transition-colors ${product.stock > 0 ? 'bg-brand-black text-white hover:bg-brand-orange' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          <ShoppingBag size={18} />
        </button>
      </div>
    </div>
  </motion.div>
  );
};

const BlogPostCard: React.FC<{ post: BlogPost, onClick: (p: BlogPost) => void }> = ({ post, onClick }) => {
  const { toggleFavorite, isFavorite, user } = useAuth();
  const favorited = isFavorite(post.id);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => onClick(post)}
      className="group cursor-pointer relative"
    >
      {user && (
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(post.id, 'post'); }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${favorited ? 'bg-brand-orange text-white' : 'bg-white/80 text-gray-400 hover:text-brand-orange'}`}
        >
          <Heart size={16} fill={favorited ? "currentColor" : "none"} />
        </button>
      )}
      <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 border border-gray-100">
      <img 
        src={post.image} 
        alt={post.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
    </div>
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-orange">
        <span>{post.category}</span>
        <span className="w-1 h-1 bg-gray-300 rounded-full" />
        <span className="text-gray-400">{post.readTime}</span>
      </div>
      <h3 className="text-xl font-display font-bold text-gray-900 group-hover:text-brand-orange transition-colors leading-tight">
        {post.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-2">
        {post.excerpt}
      </p>
    </div>
  </motion.div>
  );
};

const Footer = () => (
  <footer className="bg-brand-black text-white pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-3xl font-display font-black tracking-tighter mb-6">
            HALEX<span className="text-brand-orange">SHOP</span>
          </h2>
          <p className="text-gray-400 max-w-md mb-8">
            Sua jornada para a melhor versão começa aqui. Suplementação de elite, 
            estratégias de treino e nutrição baseadas em ciência.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange transition-colors">
              <Youtube size={20} />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-500">Links Rápidos</h4>
          <ul className="space-y-4 text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Loja</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-500">Suporte</h4>
          <ul className="space-y-4 text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Minha Conta</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Rastreio</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Políticas</a></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <p>© 2024 Halex Shop. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          <a href="#" className="hover:text-white transition-colors">Termos</a>
        </div>
      </div>
    </div>
  </footer>
);

// --- Pages ---

const HomePage = ({ onNavigate, onAddToCart, products, posts, onProductClick, onPostClick }: { onNavigate: (p: string) => void, onAddToCart: (p: Product) => void, products: Product[], posts: BlogPost[], onProductClick: (p: Product) => void, onPostClick: (p: BlogPost) => void }) => (
  <div className="space-y-24 pb-24">
    {/* Hero Section */}
    <section className="relative h-screen flex items-center overflow-hidden bg-brand-black">
      <div className="absolute inset-0 opacity-40">
        <img 
          src="https://picsum.photos/seed/gym-hero/1920/1080?grayscale" 
          alt="Hero Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6">
            Performance de Elite
          </span>
          <h1 className="text-6xl md:text-8xl font-display font-black text-white leading-none mb-8">
            TRANSFORME SEU <span className="text-brand-orange">CORPO</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Suplementação premium e conhecimento especializado para quem não aceita nada menos que a excelência física.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => onNavigate('store')} className="btn-primary flex items-center gap-2">
              Comprar Agora <ChevronRight size={20} />
            </button>
            <button onClick={() => onNavigate('blog')} className="btn-secondary border border-white/20">
              Ler o Blog
            </button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Featured Products */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black mb-4">MAIS VENDIDOS</h2>
          <p className="text-gray-500">Os favoritos da nossa comunidade.</p>
        </div>
        <button onClick={() => onNavigate('store')} className="text-brand-orange font-bold flex items-center gap-1 hover:gap-2 transition-all">
          Ver todos <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.slice(0, 4).map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
        ))}
      </div>
    </section>

    {/* Blog Preview */}
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-black mb-4 uppercase">Dicas e Estratégias</h2>
          <p className="text-gray-500">Conteúdo exclusivo sobre alimentação, treino e dieta para acelerar seus resultados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} onClick={onPostClick} />
          ))}
        </div>
      </div>
    </section>
  </div>
);

const StorePage = ({ onAddToCart, products, onProductClick }: { onAddToCart: (p: Product) => void, products: Product[], onProductClick: (p: Product) => void }) => {
  const [filter, setFilter] = useState('todos');
  
  const filteredProducts = filter === 'todos' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-4 uppercase">Nossa Loja</h1>
          <p className="text-gray-500">Suplementos e acessórios de alta performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['todos', 'emagrecedores', 'suplementos', 'acessorios', 'vestuario'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filter === cat ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
        ))}
      </div>
    </div>
  );
};

const BlogPage = ({ posts, onPostClick }: { posts: BlogPost[], onPostClick: (p: BlogPost) => void }) => (
  <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mb-16">
      <h1 className="text-5xl font-black mb-4 uppercase">Halex Blog</h1>
      <p className="text-gray-500 text-lg">
        Sua fonte de conhecimento para otimizar cada aspecto da sua vida fitness.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {posts.map(post => (
        <BlogPostCard key={post.id} post={post} onClick={onPostClick} />
      ))}
    </div>
  </div>
);

const BlogPostDetailsPage: React.FC<{ post: BlogPost, onBack: () => void }> = ({ post, onBack }) => {
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors mb-8 group"
      >
        <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">Voltar para o Blog</span>
      </button>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-brand-orange">
            <span>{post.category}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-gray-400">{post.date}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-gray-400">{post.readTime}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight uppercase">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 pt-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold">{post.author}</p>
              <p className="text-xs text-gray-400">Especialista Halex</p>
            </div>
          </div>
        </div>

        <div className="aspect-video rounded-3xl overflow-hidden border border-gray-100">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="text-gray-600 leading-relaxed space-y-6 whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
};

const TipsPage = ({
  products,
  onProductClick,
  onAddToCart,
}: {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'emagrecimento',
    weight: 70,
    height: 170,
    age: 30,
    gender: 'feminino',
    activityLevel: 'moderado',
    restrictions: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [leadSaved, setLeadSaved] = useState(false);

  const truncateText = (value: string, maxLength: number) => {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Preencha nome, e-mail e WhatsApp para receber sua recomendação personalizada.');
      return;
    }

    setLoading(true);
    try {
      const profile: SalesQuizProfile = {
        name: form.name.trim(),
        goal: form.goal,
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age),
        gender: form.gender,
        activityLevel: form.activityLevel,
        restrictions: form.restrictions.trim(),
      };

      const recommendation = await generateSalesQuizRecommendation(profile, products);
      const primaryProduct = products.find(product => product.id === recommendation.primaryProductId) || null;
      const secondaryProduct = recommendation.secondaryProductId
        ? products.find(product => product.id === recommendation.secondaryProductId) || null
        : null;

      setResult({
        ...recommendation,
        primaryProduct,
        secondaryProduct,
      });

      const leadResponse = await fetch('/api/quiz-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          goal: form.goal,
          weight: form.weight,
          height: form.height,
          age: form.age,
          gender: form.gender,
          activity_level: form.activityLevel,
          restrictions: form.restrictions,
          recommended_product_id: recommendation.primaryProductId,
          metadata: {
            secondary_product_id: recommendation.secondaryProductId || null,
            summary: recommendation.summary,
            cta: recommendation.cta,
            meal_plan: recommendation.mealPlan,
            workout_plan: recommendation.workoutPlan,
            weekly_routine: recommendation.weeklyRoutine,
            monthly_plan_offer: recommendation.monthlyPlanOffer,
            monthly_plan_pitch: recommendation.monthlyPlanPitch,
          }
        })
      });

      setLeadSaved(leadResponse.ok);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black mb-4 uppercase">Quiz AI de Recomendação</h1>
        <p className="text-gray-500 text-lg">Capte leads e recomende um produto da loja com base no perfil real do cliente.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-8 xl:gap-12 items-start">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 xl:sticky xl:top-28">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Nome</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="Seu nome completo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail</label>
                <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="voce@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">WhatsApp</label>
                <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Seu Objetivo</label>
            <select 
              value={form.goal} 
              onChange={(e) => handleChange('goal', e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium"
            >
              <option value="emagrecimento">Emagrecimento</option>
              <option value="hipertrofia">Hipertrofia (Ganho de Massa)</option>
              <option value="performance">Performance Atlética</option>
              <option value="saude">Saúde e Bem-estar</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Peso (kg)</label>
              <input 
                type="number" 
                value={form.weight} 
                onChange={(e) => handleChange('weight', Number(e.target.value))}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Altura (cm)</label>
              <input 
                type="number" 
                value={form.height} 
                onChange={(e) => handleChange('height', Number(e.target.value))}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Idade</label>
              <input type="number" value={form.age} onChange={(e) => handleChange('age', Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Sexo</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium">
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Nível de atividade</label>
            <select value={form.activityLevel} onChange={(e) => handleChange('activityLevel', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium">
              <option value="baixo">Baixo</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Restrições / Observações</label>
            <textarea value={form.restrictions} onChange={(e) => handleChange('restrictions', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium min-h-[96px] resize-y" placeholder="Ex: sensível à cafeína, rotina corrida, treina à noite..." />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Gerar Minha Recomendação'}
          </button>

          {leadSaved && (
            <div className="text-xs text-green-600 font-bold bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
              Lead salvo com sucesso para acompanhamento comercial.
            </div>
          )}
        </div>

        <div className="space-y-6 min-w-0">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-brand-black p-6 rounded-3xl text-white">
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-3">Diagnóstico comercial</p>
                <h3 className="text-2xl font-black mb-3">{result.primaryProduct?.name || 'Produto recomendado'}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                <p className="text-brand-orange text-sm font-bold mt-4">{result.leadHook}</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <h3 className="font-bold text-brand-orange uppercase text-xs tracking-widest mb-4">Dicas de Alimentação</h3>
                <ul className="space-y-3">
                  {result.dietTips.map((tip: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-brand-orange font-bold">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-900 p-6 rounded-3xl text-white">
                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-4">Dicas de Treino</h3>
                <ul className="space-y-3">
                  {result.trainingTips.map((tip: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-brand-orange font-bold">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Cardápio base sugerido</h3>
                  <ul className="space-y-3">
                    {result.mealPlan.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-brand-orange font-bold">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Treino ideal para começar</h3>
                  <ul className="space-y-3">
                    {result.workoutPlan.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-brand-orange font-bold">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Rotina semanal sugerida</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.weeklyRoutine.map((item: string, i: number) => (
                    <div key={i} className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700 leading-relaxed">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Por que essa recomendação faz sentido</h3>
                <ul className="space-y-3">
                  {result.whyItMatches.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-brand-orange font-bold">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {result.primaryProduct && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Produto principal recomendado</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img src={result.primaryProduct.image} alt={result.primaryProduct.name} className="w-full sm:w-28 h-48 sm:h-28 rounded-2xl object-cover bg-gray-50" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg mb-1 leading-tight">{result.primaryProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{getProductMarketingSummary(result.primaryProduct).summary}</p>
                      <p className="text-xs text-gray-500 mb-1 leading-relaxed"><span className="font-bold text-gray-700">Para que serve:</span> {truncateText(getProductMarketingSummary(result.primaryProduct).purpose, 180)}</p>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed"><span className="font-bold text-gray-700">Composição:</span> {truncateText(getProductMarketingSummary(result.primaryProduct).composition, 180)}</p>
                      {result.primaryProduct.promotionLabel && (
                        <span className="inline-flex mb-3 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-orange-100">
                          {result.primaryProduct.promotionLabel}
                        </span>
                      )}
                      {hasProductPromotion(result.primaryProduct) && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 line-through">{formatPriceBRL(result.primaryProduct.compareAtPrice)}</span>
                          <span className="px-2 py-1 rounded-full bg-brand-black text-white text-[10px] font-black uppercase tracking-widest">-{result.primaryProduct.discountPercentage}%</span>
                        </div>
                      )}
                      <p className="text-2xl font-black text-brand-orange mb-4">{formatPriceBRL(result.primaryProduct.price)}</p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <button onClick={() => onProductClick(result.primaryProduct)} className="btn-secondary text-sm w-full sm:w-auto">
                          Ver produto
                        </button>
                        <button onClick={() => onAddToCart(result.primaryProduct)} className="btn-primary text-sm w-full sm:w-auto">
                          Adicionar ao carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.secondaryProduct && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Produto complementar</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img src={result.secondaryProduct.image} alt={result.secondaryProduct.name} className="w-full sm:w-24 h-44 sm:h-24 rounded-2xl object-cover bg-gray-50" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base mb-1 leading-tight">{result.secondaryProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{getProductMarketingSummary(result.secondaryProduct).summary}</p>
                      <p className="text-xs text-gray-500 mb-1 leading-relaxed"><span className="font-bold text-gray-700">Para que serve:</span> {truncateText(getProductMarketingSummary(result.secondaryProduct).purpose, 160)}</p>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed"><span className="font-bold text-gray-700">Composição:</span> {truncateText(getProductMarketingSummary(result.secondaryProduct).composition, 160)}</p>
                      {result.secondaryProduct.promotionLabel && (
                        <span className="inline-flex mb-2 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-orange-100">
                          {result.secondaryProduct.promotionLabel}
                        </span>
                      )}
                      {hasProductPromotion(result.secondaryProduct) && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 line-through">{formatPriceBRL(result.secondaryProduct.compareAtPrice)}</span>
                          <span className="px-2 py-1 rounded-full bg-brand-black text-white text-[10px] font-black uppercase tracking-widest">-{result.secondaryProduct.discountPercentage}%</span>
                        </div>
                      )}
                      <p className="text-lg font-black text-brand-orange mb-3">{formatPriceBRL(result.secondaryProduct.price)}</p>
                      <button onClick={() => onAddToCart(result.secondaryProduct)} className="btn-primary text-sm w-full sm:w-auto">
                        Adicionar complementar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <h3 className="font-bold text-brand-orange uppercase text-xs tracking-widest mb-4">Fechamento comercial</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{result.cta}</p>
                {result.primaryProduct && (
                  <button onClick={() => onAddToCart(result.primaryProduct)} className="btn-primary w-full py-4 text-base">
                    Quero começar agora
                  </button>
                )}
              </div>

              <div className="bg-brand-black p-6 rounded-3xl text-white border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-3">Oferta premium</p>
                <h3 className="text-2xl font-black mb-3">Plano mensal de acompanhamento</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{result.monthlyPlanOffer}</p>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{result.monthlyPlanPitch}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  {['Ajustes semanais', 'Direcionamento alimentar', 'Suporte e rotina de treino'].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                      {item}
                    </div>
                  ))}
                </div>
                <a href={getMonthlyPlanWhatsAppLink(form.phone, result)} target="_blank" rel="noreferrer" className="btn-primary w-full py-4 text-base text-center inline-flex items-center justify-center">
                  Quero saber do plano mensal
                </a>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm mb-2">Preencha seus dados para receber uma recomendação de produto da loja com apoio da IA.</p>
              <p className="text-xs text-gray-300">Esse fluxo também já captura o lead para acompanhamento comercial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductDetailsPage: React.FC<{ product: Product, onAddToCart: (p: Product) => void, onBack: () => void, onNavigate: (page: string) => void, onShowToast: (msg: string) => void }> = ({ product, onAddToCart, onBack, onNavigate, onShowToast }) => {
  const [activeImage, setActiveImage] = useState(product.image);
  const allImages = [product.image, ...(product.images || [])];

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors mb-8 font-bold uppercase text-xs tracking-widest"
      >
        <ChevronRight className="rotate-180" size={16} /> Voltar para a Loja
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <motion.div 
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100"
          >
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-brand-orange' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <span className="text-brand-orange font-bold uppercase text-xs tracking-widest mb-4">
            {product.category}
          </span>
          {product.promotionLabel && (
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="px-4 py-2 rounded-full bg-orange-50 text-brand-orange text-xs font-black uppercase tracking-widest border border-orange-100">
                {product.promotionLabel}
              </span>
              {hasProductPromotion(product) && (
                <span className="px-4 py-2 rounded-full bg-brand-black text-white text-xs font-black uppercase tracking-widest">
                  {product.discountPercentage}% OFF REAL
                </span>
              )}
            </div>
          )}
          <h1 className="text-5xl font-black mb-6 uppercase leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex text-yellow-400 text-xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}>★</span>
              ))}
            </div>
            <span className="text-gray-400 font-medium">({product.reviews} avaliações de clientes)</span>
          </div>

          <div className="mb-10 space-y-4">
            <p className="text-gray-600 text-lg leading-relaxed">
              {getProductMarketingSummary(product).summary || "Este produto premium da Halex Shop foi desenvolvido com os mais altos padrões de qualidade para garantir que você alcance seus objetivos físicos com eficiência e segurança."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Para que serve</p>
                <p className="text-sm text-gray-600 leading-relaxed">{getProductMarketingSummary(product).purpose}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Composição</p>
                <p className="text-sm text-gray-600 leading-relaxed">{getProductMarketingSummary(product).composition}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mb-10">
            <div>
              {hasProductPromotion(product) && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg text-gray-400 line-through font-bold">{formatPriceBRL(product.compareAtPrice)}</span>
                  <span className="px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-xs font-black uppercase tracking-widest border border-orange-100">
                    Economize {product.discountPercentage}%
                  </span>
                </div>
              )}
              <span className="text-4xl font-black text-brand-orange">
                {formatPriceBRL(product.price)}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            {product.stock > 0 ? (
              <span className="text-green-500 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                {product.stock} em estoque
              </span>
            ) : (
              <span className="text-red-500 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" /> Esgotado
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => { onAddToCart(product); onShowToast('Adicionado ao carrinho!'); }}
              disabled={product.stock <= 0}
              className="flex-grow bg-brand-orange text-white py-5 text-xl font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all disabled:opacity-50"
            >
              <ShoppingBag size={24} /> Adicionar ao Carrinho
            </button>
            <button 
              onClick={() => { onAddToCart(product); onNavigate('cart'); }}
              disabled={product.stock <= 0}
              className="flex-grow bg-brand-black text-white py-5 text-xl font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50"
            >
              Comprar Agora
            </button>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-100 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-brand-orange font-black text-xl mb-1">100%</div>
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Puro</div>
            </div>
            <div className="text-center">
              <div className="text-brand-orange font-black text-xl mb-1">Elite</div>
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Qualidade</div>
            </div>
            <div className="text-center">
              <div className="text-brand-orange font-black text-xl mb-1">Fast</div>
              <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Entrega</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface LeadCrmDraft {
  status: string;
  internalNote: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  monthlyPlanInterest: string;
  planOfferedAt: string;
}

interface LeadHistoryEntry {
  id?: string;
  type?: string;
  channel?: string;
  template?: string;
  summary?: string;
  note?: string;
  createdAt?: string;
}

const initialCheckoutForm: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  document: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const brazilStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const getWhatsAppLink = (phone?: string, orderNsu?: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const message = encodeURIComponent(`Olá! Aqui é da L7 Fitness sobre o seu pedido ${orderNsu || ''}. Estamos entrando em contato para acompanhar sua entrega.`);
  return `https://wa.me/${normalized}?text=${message}`;
};

const getLeadWhatsAppLink = (phone?: string, lead?: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const productName = lead?.recommendedProduct?.name || lead?.recommendedProductName || 'a recomendação ideal';
  const message = encodeURIComponent(`Olá, ${lead?.name || 'tudo bem'}! Aqui é da L7 Fitness. Vi seu quiz de ${lead?.goal || 'objetivo fitness'} e separei ${productName} para o seu perfil. Se quiser, posso te explicar como usar e montar um plano inicial.`);
  return `https://wa.me/${normalized}?text=${message}`;
};

const getMonthlyPlanWhatsAppLink = (phone?: string, result?: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalized = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '5551999999999';
  const productName = result?.primaryProduct?.name || 'o produto recomendado';
  const message = encodeURIComponent(`Olá! Quero saber mais sobre o plano mensal de acompanhamento da L7 Fitness. Vi minha recomendação com ${productName} e quero entender como funciona o suporte com alimentação, treino e ajustes semanais.`);
  return `https://wa.me/${normalized}?text=${message}`;
};

const getLeadMonthlyPlanWhatsAppLink = (phone?: string, lead?: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const productName = lead?.recommendedProduct?.name || lead?.recommendedProductName || 'o produto recomendado';
  const message = encodeURIComponent(`Olá, ${lead?.name || 'tudo bem'}! Além da recomendação com ${productName}, temos um plano mensal de acompanhamento com ajustes semanais de alimentação, treino e suporte próximo. Se quiser, te explico como funciona e os valores.`);
  return `https://wa.me/${normalized}?text=${message}`;
};

const normalizeLeadText = (value?: string | null) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const getLeadProfileContext = (lead?: any) => {
  const goal = normalizeLeadText(lead?.goal);
  const restrictions = normalizeLeadText(lead?.restrictions);
  const activity = normalizeLeadText(lead?.activity_level);

  const traits: string[] = [];

  if (goal.includes('emag')) traits.push('foco em emagrecimento');
  else if (goal.includes('hipertrof')) traits.push('foco em ganho de massa');
  else if (goal.includes('performance')) traits.push('foco em performance');
  else if (goal.includes('saude')) traits.push('foco em saúde e constância');

  if (activity.includes('baixo')) traits.push('rotina com atividade física baixa');
  if (activity.includes('moderado')) traits.push('rotina com atividade moderada');
  if (restrictions.includes('corrida') || restrictions.includes('sem tempo') || restrictions.includes('rotina')) traits.push('dia a dia corrido');
  if (restrictions.includes('noite')) traits.push('treina ou organiza rotina mais à noite');
  if (restrictions.includes('cafeina')) traits.push('atenção com sensibilidade à cafeína');
  if (restrictions.includes('pos parto') || restrictions.includes('pos-parto') || restrictions.includes('matern')) traits.push('momento de pós-parto ou maternidade');

  return traits.slice(0, 3);
};

const getLeadProfileBadges = (lead?: any) => {
  return getLeadProfileContext(lead).map((item) => item.replace(/^foco em /, '').replace(/^rotina com /, '')).slice(0, 3);
};

const getLeadTemplateWhatsAppLink = (phone?: string, lead?: any, template?: 'first-contact' | 'checkout-recovery' | 'follow-up' | 'plan-follow-up') => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const name = lead?.name || 'tudo bem';
  const goal = lead?.goal || 'seu objetivo';
  const productName = lead?.recommendedProduct?.name || lead?.recommendedProductName || 'o produto recomendado';
  const profileContext = getLeadProfileContext(lead);
  const contextLine = profileContext.length > 0 ? `Considerando seu perfil (${profileContext.join(', ')}), ` : '';

  const templates: Record<string, string> = {
    'first-contact': `Olá, ${name}! Aqui é da L7 Fitness. Vi seu resultado no quiz para ${goal} e separei ${productName} como melhor ponto de partida. ${contextLine}posso te explicar como usar e te orientar no começo.`,
    'checkout-recovery': `Olá, ${name}! Vi que você chegou perto de concluir sua compra na L7 Fitness. ${contextLine}se quiser, eu posso te ajudar a finalizar ${productName} e tirar qualquer dúvida antes de fechar.`,
    'follow-up': `Olá, ${name}! Passando para acompanhar sua recomendação da L7 Fitness. ${contextLine}você ainda quer ajuda para escolher a melhor forma de começar com ${productName}?`,
    'plan-follow-up': `Olá, ${name}! Além do ${productName}, queria te mostrar nosso acompanhamento mensal com alimentação, treino e ajustes semanais. ${contextLine}se fizer sentido para você, te explico como funciona.`
  };

  return `https://wa.me/${normalized}?text=${encodeURIComponent(templates[template || 'follow-up'])}`;
};

const formatLeadDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
};

const getLeadHistoryTone = (entry?: LeadHistoryEntry) => {
  const channel = String(entry?.channel || '').toLowerCase();
  const template = String(entry?.template || '').toLowerCase();

  if (channel === 'email') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (template.includes('plan')) return 'bg-purple-50 text-purple-600 border-purple-100';
  if (template.includes('checkout')) return 'bg-orange-50 text-orange-600 border-orange-100';
  if (channel === 'whatsapp') return 'bg-green-50 text-green-600 border-green-100';

  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const getTrackingWhatsAppLink = (
  phone?: string,
  order?: any,
  draft?: { status: string; trackingCode: string; trackingUrl: string; internalNote: string }
) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits || !order) return '';

  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const trackingLink = getTrackingLink(draft?.trackingCode, draft?.trackingUrl);
  const customerName = order.customer?.name || 'cliente';
  const statusLabel = fulfillmentLabels[draft?.status || order.fulfillment?.status || 'aguardando-envio'] || 'Aguardando envio';
  const lines = [
    `Olá, ${customerName}!`,
    `Aqui é da L7 Fitness. Atualizamos o seu pedido ${order.order_nsu}.`,
    `Status do pedido: ${statusLabel}.`,
  ];

  if (draft?.trackingCode) {
    lines.push(`Código de rastreio: ${draft.trackingCode}`);
  }

  if (trackingLink) {
    lines.push(`Acompanhe sua entrega aqui: ${trackingLink}`);
  }

  if (draft?.internalNote?.trim()) {
    lines.push(`Observação: ${draft.internalNote.trim()}`);
  }

  lines.push('Se precisar, estou à disposição.');

  return `https://wa.me/${normalized}?text=${encodeURIComponent(lines.join('\n'))}`;
};

const fulfillmentLabels: Record<string, string> = {
  'aguardando-envio': 'Aguardando envio',
  'separando': 'Separando',
  'postado': 'Postado',
  'entregue': 'Entregue',
};

const fulfillmentBadgeClasses: Record<string, string> = {
  'aguardando-envio': 'bg-gray-100 text-gray-600',
  'separando': 'bg-blue-100 text-blue-600',
  'postado': 'bg-purple-100 text-purple-600',
  'entregue': 'bg-emerald-100 text-emerald-600',
};

const getTrackingLink = (trackingCode?: string, trackingUrl?: string) => {
  if (trackingUrl) return trackingUrl;
  if (!trackingCode) return '';
  return `https://melhorrastreio.com.br/rastreio/${encodeURIComponent(trackingCode)}`;
};

const CheckoutPage = ({
  cart,
  selectedFrete,
  formData,
  onFieldChange,
  onBack,
  onSubmit,
  isProcessing,
  themePreference,
  resolvedTheme,
  onThemeChange,
}: {
  cart: CartItem[];
  selectedFrete: FreteOption | null;
  formData: CheckoutFormData;
  onFieldChange: (field: keyof CheckoutFormData, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
  themePreference: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}) => {
  const [cepLoading, setCepLoading] = useState(false);
  const isDark = resolvedTheme === 'dark';

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (!data.erro) {
        if (!formData.street) onFieldChange('street', data.logradouro || '');
        if (!formData.neighborhood) onFieldChange('neighborhood', data.bairro || '');
        if (!formData.city) onFieldChange('city', data.localidade || '');
        if (!formData.state) onFieldChange('state', data.uf || '');
      }
    } catch (error) {
      console.warn('Falha ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  const freteValue = selectedFrete?.value ?? (Number.parseFloat(String((selectedFrete as any)?.custom_price ?? (selectedFrete as any)?.price ?? '0')) || 0);
  const productsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = productsTotal + freteValue;
  const pageClasses = isDark ? 'min-h-screen bg-[#050505] text-white' : 'min-h-screen bg-[#f8f8f8] text-brand-black';
  const heroCardClasses = isDark ? 'bg-[#101010] border border-white/10 shadow-2xl' : 'bg-white border border-gray-100 shadow-sm';
  const sectionCardClasses = isDark ? 'bg-[#101010] border border-white/10 shadow-xl' : 'bg-white border border-gray-100 shadow-sm';
  const inputClasses = isDark ? 'w-full px-4 py-3 border-2 border-white/10 bg-[#171717] text-white rounded-2xl focus:border-brand-orange focus:outline-none placeholder:text-gray-500' : 'w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-brand-orange focus:outline-none';
  const mutedTextClasses = isDark ? 'text-gray-400' : 'text-gray-500';
  const labelClasses = isDark ? 'text-sm font-bold text-gray-200 mb-2 block' : 'text-sm font-bold text-gray-700 mb-2 block';
  const titleClasses = isDark ? 'text-white' : 'text-brand-black';

  return (
    <div className={pageClasses}>
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className={`mb-8 rounded-[28px] px-5 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4 flex-wrap ${heroCardClasses}`}>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'border border-gray-200 hover:border-brand-orange hover:text-brand-orange'}`}>
              <ArrowLeft size={18} /> Voltar ao carrinho
            </button>
            <button onClick={onBack} className={`text-2xl font-display font-black tracking-tighter transition-colors ${isDark ? 'text-white hover:text-brand-orange' : 'text-brand-black hover:text-brand-orange'}`}>
              HALEX<span className="text-brand-orange">SHOP</span>
            </button>
          </div>

          <ThemeToggle themePreference={themePreference} resolvedTheme={resolvedTheme} onThemeChange={onThemeChange} compact />
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>Contato</span>
            <ChevronRight size={14} />
            <span>Entrega</span>
            <ChevronRight size={14} />
            <span>Pagamento</span>
          </div>
            <h1 className={`text-4xl font-black uppercase ${titleClasses}`}>Checkout</h1>
            <p className={`mt-2 ${mutedTextClasses}`}>Preencha seus dados completos para envio antes de seguir para a InfinitePay.</p>
          </div>
        </div>

      {cart.length === 0 ? (
        <div className={`rounded-[32px] p-10 text-center ${sectionCardClasses}`}>
          <ShoppingBag size={56} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-200'}`} />
          <h2 className={`text-2xl font-black mb-2 ${titleClasses}`}>Seu carrinho está vazio</h2>
          <p className={`${mutedTextClasses} mb-6`}>Adicione produtos ao carrinho para continuar com o checkout.</p>
          <button onClick={onBack} className="btn-primary px-8 py-3">Voltar</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="space-y-6">
            <div className={`rounded-[32px] p-8 ${sectionCardClasses}`}>
              <div className="flex items-center gap-3 mb-6">
                <Mail className="text-brand-orange" size={24} />
                <div>
                  <h2 className={`text-2xl font-black ${titleClasses}`}>Dados de contato</h2>
                  <p className={`text-sm ${mutedTextClasses}`}>Esses dados serão salvos junto ao pedido para contato posterior.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <span className={labelClasses}>Nome completo</span>
                  <input value={formData.name} onChange={(e) => onFieldChange('name', e.target.value)} className={inputClasses} placeholder="Digite seu nome completo" />
                </label>
                <label className="block">
                  <span className={labelClasses}>E-mail</span>
                  <input type="email" value={formData.email} onChange={(e) => onFieldChange('email', e.target.value)} className={inputClasses} placeholder="seunome@provedor.com" />
                </label>
                <label className="block">
                  <span className={labelClasses}>Telefone / WhatsApp</span>
                  <input value={formData.phone} onChange={(e) => onFieldChange('phone', formatPhone(e.target.value))} className={inputClasses} placeholder="(00) 00000-0000" />
                </label>
                <label className="block md:col-span-2">
                  <span className={labelClasses}>CPF</span>
                  <input value={formData.document} onChange={(e) => onFieldChange('document', formatDocument(e.target.value))} className={inputClasses} placeholder="000.000.000-00" />
                </label>
              </div>
            </div>

            <div className={`rounded-[32px] p-8 ${sectionCardClasses}`}>
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="text-brand-orange" size={24} />
                <div>
                  <h2 className={`text-2xl font-black ${titleClasses}`}>Endereço de entrega</h2>
                  <p className={`text-sm ${mutedTextClasses}`}>Entrega somente no Brasil. O CEP pode preencher parte do endereço automaticamente.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClasses}>CEP</span>
                  <input value={formData.cep} onChange={(e) => onFieldChange('cep', formatCep(e.target.value))} onBlur={handleCepBlur} className={inputClasses} placeholder="00000-000" />
                  <span className={`text-xs mt-2 block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{cepLoading ? 'Buscando endereço pelo CEP...' : 'Somente endereços do Brasil'}</span>
                </label>
                <label className="block">
                  <span className={labelClasses}>País</span>
                  <input value="Brasil" disabled className={`w-full px-4 py-3 border-2 rounded-2xl ${isDark ? 'border-white/5 bg-[#171717] text-gray-400' : 'border-gray-100 bg-gray-50 text-gray-500'}`} />
                </label>
                <label className="block md:col-span-2">
                  <span className={labelClasses}>Rua / Logradouro</span>
                  <input value={formData.street} onChange={(e) => onFieldChange('street', e.target.value)} className={inputClasses} placeholder="Rua, avenida, travessa..." />
                </label>
                <label className="block">
                  <span className={labelClasses}>Número</span>
                  <input value={formData.number} onChange={(e) => onFieldChange('number', e.target.value)} className={inputClasses} placeholder="123" />
                </label>
                <label className="block">
                  <span className={labelClasses}>Complemento</span>
                  <input value={formData.complement} onChange={(e) => onFieldChange('complement', e.target.value)} className={inputClasses} placeholder="Apto, bloco, referência..." />
                </label>
                <label className="block">
                  <span className={labelClasses}>Bairro</span>
                  <input value={formData.neighborhood} onChange={(e) => onFieldChange('neighborhood', e.target.value)} className={inputClasses} placeholder="Seu bairro" />
                </label>
                <label className="block">
                  <span className={labelClasses}>Cidade</span>
                  <input value={formData.city} onChange={(e) => onFieldChange('city', e.target.value)} className={inputClasses} placeholder="Sua cidade" />
                </label>
                <label className="block md:max-w-[180px]">
                  <span className={labelClasses}>UF</span>
                  <select value={formData.state} onChange={(e) => onFieldChange('state', e.target.value)} className={`w-full px-4 py-3 border-2 rounded-2xl focus:border-brand-orange focus:outline-none ${isDark ? 'border-white/10 bg-[#171717] text-white' : 'border-gray-200 bg-white'}`}>
                    <option value="">Selecione</option>
                    {brazilStates.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 space-y-6">
            <div className={`rounded-[32px] p-8 shadow-2xl ${isDark ? 'bg-white text-brand-black' : 'bg-brand-black text-white'}`}>
              <div className="flex items-center gap-3 mb-6">
                <CreditCard size={22} className="text-brand-orange" />
                <div>
                  <h2 className="text-2xl font-black">Resumo do pedido</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Confira seus dados antes de seguir para o pagamento.</p>
                </div>
              </div>

              <div className={`space-y-4 pb-6 mb-6 ${isDark ? 'border-b border-black/10' : 'border-b border-white/10'}`}>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-bold">{item.quantity}x {item.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>R$ {item.price.toFixed(2)} cada</p>
                    </div>
                    <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className={`space-y-3 text-sm pb-6 mb-6 ${isDark ? 'border-b border-black/10' : 'border-b border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Subtotal</span>
                  <span>R$ {productsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Frete</p>
                    {selectedFrete && <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{selectedFrete.carrier?.name || selectedFrete.company?.name} {selectedFrete.name}</p>}
                  </div>
                  <span>R$ {freteValue.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black text-brand-orange">R$ {total.toFixed(2)}</span>
              </div>

              <button onClick={onSubmit} disabled={isProcessing || !selectedFrete} className={`w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 ${(isProcessing || !selectedFrete) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isProcessing ? 'Processando...' : 'Ir para pagamento'}
              </button>

              <div className={`mt-4 text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Seus dados de contato e entrega serão vinculados ao pedido e poderão ser consultados depois no painel administrativo.
              </div>
            </div>

            {selectedFrete && (
              <div className={`rounded-[28px] p-6 ${sectionCardClasses}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Frete selecionado</p>
                <p className={`font-black text-lg ${titleClasses}`}>{selectedFrete.carrier?.name || selectedFrete.company?.name} {selectedFrete.name}</p>
                <p className="text-brand-orange font-black text-2xl mt-2">R$ {freteValue.toFixed(2)}</p>
                <p className={`text-sm mt-1 ${mutedTextClasses}`}>Entrega estimada em {selectedFrete.delivery_time} dia(s).</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const AdminPage = ({ products, posts, orders, onRefresh }: { products: Product[], posts: BlogPost[], orders: any[], onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'posts' | 'orders' | 'affiliates' | 'categories' | 'leads'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderFulfillmentDrafts, setOrderFulfillmentDrafts] = useState<Record<string, { status: string; trackingCode: string; trackingUrl: string; internalNote: string }>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'paid' | 'pending' | 'aguardando-envio' | 'separando' | 'postado' | 'entregue'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [quizLeads, setQuizLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | 'no-purchase' | 'paid' | 'pending'>('all');
  const [leadCrmDrafts, setLeadCrmDrafts] = useState<Record<string, LeadCrmDraft>>({});
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/affiliates').then(res => res.json()).then(setAffiliates);
  }, []);

  const fetchQuizLeads = async () => {
    setLeadsLoading(true);
    try {
      const response = await fetch('/api/quiz-leads');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar leads');
      }
      setQuizLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (error) {
      console.error('Erro ao carregar leads do quiz:', error);
      setQuizLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  // --- Dashboard Metrics Calculation ---
  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;
    
    // Sales by Date
    const salesByDate: Record<string, number> = {};
    paidOrders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesByDate[date] = (salesByDate[date] || 0) + o.total;
    });
    const salesChartData = Object.entries(salesByDate).map(([date, total]) => ({ date, total })).reverse().slice(0, 7).reverse();

    // Sales by Category
    const categorySales: Record<string, number> = {};
    paidOrders.forEach(o => {
      o.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.id);
        const cat = product?.category || 'Outros';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
      });
    });
    const categoryChartData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

    // Popular Products
    const productSales: Record<string, number> = {};
    paidOrders.forEach(o => {
      o.items.forEach((item: any) => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    });
    const popularProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalSales, paidOrdersCount: paidOrders.length, avgOrderValue, salesChartData, categoryChartData, popularProducts };
  }, [orders, products]);

  useEffect(() => {
    if (activeTab === 'dashboard' && orders.length > 0) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        const insight = await generateSalesInsight(metrics);
        setAiInsight(insight);
        setLoadingInsight(false);
      };
      fetchInsight();
    }
  }, [activeTab, metrics]);

  useEffect(() => {
    if (activeTab !== 'orders') return;

    onRefresh();

    const intervalId = window.setInterval(() => {
      onRefresh();
    }, 20000);

    const handleFocus = () => onRefresh();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab, onRefresh]);

  useEffect(() => {
    if (activeTab !== 'leads' && activeTab !== 'dashboard') return;
    fetchQuizLeads();
  }, [activeTab]);

  useEffect(() => {
    setOrderFulfillmentDrafts(prev => {
      const next = { ...prev };
      orders.forEach((order: any) => {
        next[order.id] = {
          status: prev[order.id]?.status || order.fulfillment?.status || 'aguardando-envio',
          trackingCode: prev[order.id]?.trackingCode || order.fulfillment?.trackingCode || '',
          trackingUrl: prev[order.id]?.trackingUrl || order.fulfillment?.trackingUrl || '',
          internalNote: prev[order.id]?.internalNote || order.internalNote || '',
        };
      });
      return next;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const byStatus = orderStatusFilter === 'all'
      ? orders
      : orderStatusFilter === 'paid' || orderStatusFilter === 'pending'
        ? orders.filter((order: any) => order.status === orderStatusFilter)
        : orders.filter((order: any) => (order.fulfillment?.status || 'aguardando-envio') === orderStatusFilter);

    const query = orderSearch.trim().toLowerCase();
    if (!query) return byStatus;

    return byStatus.filter((order: any) => {
      const haystack = [
        order.order_nsu,
        order.customer_email,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.document,
        order.shipping?.city,
        order.shipping?.cep,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const COLORS = ['#FF6321', '#141414', '#10B981', '#6366F1', '#F59E0B'];

  const leadOrderSummaryByEmail = useMemo(() => {
    const summary = new Map<string, { hasPaid: boolean; hasPending: boolean; orderCount: number }>();

    orders.forEach((order: any) => {
      const email = String(order.customer_email || order.customer?.email || '').trim().toLowerCase();
      if (!email) return;

      const current = summary.get(email) || { hasPaid: false, hasPending: false, orderCount: 0 };
      current.orderCount += 1;
      if (order.status === 'paid') current.hasPaid = true;
      if (order.status === 'pending') current.hasPending = true;
      summary.set(email, current);
    });

    return summary;
  }, [orders]);

  const leadsWithStatus = useMemo(() => {
    return quizLeads.map((lead: any) => {
      const email = String(lead.email || '').trim().toLowerCase();
      const orderSummary = leadOrderSummaryByEmail.get(email) || { hasPaid: false, hasPending: false, orderCount: 0 };
      const recommendedProduct = products.find((product) => product.id === lead.recommendedProductId) || null;
      const status = orderSummary.hasPaid ? 'paid' : orderSummary.hasPending ? 'pending' : 'no-purchase';

      return {
        ...lead,
        recommendedProduct,
        recommendedProductName: recommendedProduct?.name || lead?.metadata?.primaryProductName || 'Produto recomendado',
        purchaseStatus: status,
        orderCount: orderSummary.orderCount,
      };
    });
  }, [quizLeads, leadOrderSummaryByEmail, products]);

  useEffect(() => {
    setLeadCrmDrafts(prev => {
      const next = { ...prev };
      leadsWithStatus.forEach((lead: any) => {
        next[lead.id] = {
          status: prev[lead.id]?.status || lead.crm?.status || 'new',
          internalNote: prev[lead.id]?.internalNote || lead.crm?.internalNote || '',
          lastContactAt: prev[lead.id]?.lastContactAt || lead.crm?.lastContactAt || '',
          nextFollowUpAt: prev[lead.id]?.nextFollowUpAt || (lead.crm?.nextFollowUpAt ? String(lead.crm.nextFollowUpAt).slice(0, 10) : ''),
          monthlyPlanInterest: prev[lead.id]?.monthlyPlanInterest || lead.crm?.monthlyPlanInterest || 'unknown',
          planOfferedAt: prev[lead.id]?.planOfferedAt || lead.crm?.planOfferedAt || '',
        };
      });
      return next;
    });
  }, [leadsWithStatus]);

  const filteredLeads = useMemo(() => {
    const query = leadsSearch.trim().toLowerCase();
    const byStatus = leadStatusFilter === 'all'
      ? leadsWithStatus
      : leadsWithStatus.filter((lead: any) => lead.purchaseStatus === leadStatusFilter);

    if (!query) return byStatus;

    return byStatus.filter((lead: any) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.goal,
      lead.gender,
      lead.activity_level,
      lead.recommendedProductName,
      lead.restrictions,
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [leadsWithStatus, leadsSearch, leadStatusFilter]);

  const leadMetrics = useMemo(() => {
    const totalLeads = leadsWithStatus.length;
    const noPurchase = leadsWithStatus.filter((lead: any) => lead.purchaseStatus === 'no-purchase').length;
    const checkoutStarted = leadsWithStatus.filter((lead: any) => lead.purchaseStatus === 'pending').length;
    const paidCustomers = leadsWithStatus.filter((lead: any) => lead.purchaseStatus === 'paid').length;
    const contacted = leadsWithStatus.filter((lead: any) => ['contacted', 'interested', 'won'].includes(lead.crm?.status)).length;
    const interestedPlan = leadsWithStatus.filter((lead: any) => lead.crm?.monthlyPlanInterest === 'interested').length;
    const closedPlan = leadsWithStatus.filter((lead: any) => lead.crm?.monthlyPlanInterest === 'closed').length;
    const offeredPlan = leadsWithStatus.filter((lead: any) => !!lead.crm?.planOfferedAt).length;

    return {
      totalLeads,
      noPurchase,
      checkoutStarted,
      paidCustomers,
      contacted,
      interestedPlan,
      closedPlan,
      offeredPlan,
      quizConversionRate: totalLeads > 0 ? (paidCustomers / totalLeads) * 100 : 0,
      contactRate: totalLeads > 0 ? (contacted / totalLeads) * 100 : 0,
      planInterestRate: totalLeads > 0 ? (interestedPlan / totalLeads) * 100 : 0,
      planCloseRate: offeredPlan > 0 ? (closedPlan / offeredPlan) * 100 : 0,
    };
  }, [leadsWithStatus]);

  const updateLeadDraft = (leadId: string, patch: Partial<LeadCrmDraft>) => {
    setLeadCrmDrafts(prev => ({
      ...prev,
      [leadId]: {
        status: prev[leadId]?.status || 'new',
        internalNote: prev[leadId]?.internalNote || '',
        lastContactAt: prev[leadId]?.lastContactAt || '',
        nextFollowUpAt: prev[leadId]?.nextFollowUpAt || '',
        monthlyPlanInterest: prev[leadId]?.monthlyPlanInterest || 'unknown',
        planOfferedAt: prev[leadId]?.planOfferedAt || '',
        ...patch,
      }
    }));
  };

  const handleSaveLeadCrm = async (leadId: string, override?: Partial<LeadCrmDraft>, historyEntry?: LeadHistoryEntry) => {
    const base = leadCrmDrafts[leadId] || { status: 'new', internalNote: '', lastContactAt: '', nextFollowUpAt: '', monthlyPlanInterest: 'unknown', planOfferedAt: '' };
    const draft = { ...base, ...(override || {}) };

    if (override) {
      updateLeadDraft(leadId, override);
    }

    setSavingLeadId(leadId);
    try {
      const response = await fetch(`/api/quiz-leads/${leadId}/crm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmStatus: draft.status,
          internalNote: draft.internalNote,
          lastContactAt: draft.lastContactAt || null,
          nextFollowUpAt: draft.nextFollowUpAt || null,
          monthlyPlanInterest: draft.monthlyPlanInterest,
          planOfferedAt: draft.planOfferedAt || null,
          historyEntry: historyEntry || null,
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar CRM do lead');
      }

      await fetchQuizLeads();
    } catch (error) {
      console.error('Erro ao salvar CRM do lead:', error);
      alert(error instanceof Error ? error.message : 'Falha ao salvar CRM do lead.');
    } finally {
      setSavingLeadId(null);
    }
  };

  const registerLeadAction = (lead: any, options: {
    url?: string;
    sameTab?: boolean;
    override?: Partial<LeadCrmDraft>;
    historyEntry?: LeadHistoryEntry;
  }) => {
    if (options.url) {
      if (options.sameTab) {
        window.location.href = options.url;
      } else {
        window.open(options.url, '_blank', 'noopener,noreferrer');
      }
    }

    void handleSaveLeadCrm(lead.id, options.override, options.historyEntry);
  };

  // Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, description: '', category: 'suplementos', image: 'https://picsum.photos/seed/new/600/600', images: [], stock: 0, rating: 5, reviews: 0
  });

  // Post Form State
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe Halex', date: new Date().toISOString().split('T')[0], image: 'https://picsum.photos/seed/post/800/400', readTime: '5 min'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
    } else {
      const product = { ...newProduct, id: Date.now().toString() };
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
    }
    resetForm();
    await onRefresh();
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/posts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
    } else {
      const post = { ...newPost, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] };
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Erro ao criar post: ${errorData.error}`);
        return;
      }
    }
    resetForm();
    await onRefresh();
    alert('Post criado com sucesso!');
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewProduct({ name: '', price: 0, description: '', category: 'suplementos', image: 'https://picsum.photos/seed/new/600/600', images: [], stock: 0, rating: 5, reviews: 0 });
    setNewPost({ title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe Halex', date: new Date().toISOString().split('T')[0], image: 'https://picsum.photos/seed/post/800/400', readTime: '5 min' });
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setNewPost(post);
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'post') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'product') {
          setNewProduct({ ...newProduct, image: base64String });
        } else {
          setNewPost({ ...newPost, image: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  const updateOrderDraft = (orderId: string, patch: Partial<{ status: string; trackingCode: string; trackingUrl: string; internalNote: string }>) => {
    setOrderFulfillmentDrafts(prev => ({
      ...prev,
      [orderId]: {
        status: prev[orderId]?.status || 'aguardando-envio',
        trackingCode: prev[orderId]?.trackingCode || '',
        trackingUrl: prev[orderId]?.trackingUrl || '',
        internalNote: prev[orderId]?.internalNote || '',
        ...patch,
      }
    }));
  };

  const handleSaveFulfillment = async (orderId: string) => {
    const draft = orderFulfillmentDrafts[orderId];
    if (!draft) return;

    setSavingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/fulfillment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus: draft.status,
          trackingCode: draft.trackingCode,
          trackingUrl: draft.trackingUrl,
          internalNote: draft.internalNote,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao atualizar logística');
      }

      await onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar logística:', error);
      alert(error instanceof Error ? error.message : 'Falha ao atualizar logística do pedido.');
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-4 uppercase flex items-center gap-4">
            Painel ADM <LayoutDashboard className="text-brand-orange" size={40} />
          </h1>
          <p className="text-gray-500">Gerencie seus produtos, conteúdo do blog e pedidos.</p>
        </div>
        {activeTab !== 'orders' && activeTab !== 'affiliates' && activeTab !== 'leads' && (
          <button 
            onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> {showForm ? 'Cancelar' : activeTab === 'products' ? 'Novo Produto' : 'Novo Post'}
          </button>
        )}
        {activeTab === 'orders' && (
          <button 
            onClick={onRefresh}
            className="btn-secondary border border-gray-200 flex items-center gap-2"
          >
            <Upload size={20} className="rotate-180" /> Atualizar Pedidos
          </button>
        )}
        {activeTab === 'affiliates' && (
          <button 
            onClick={onRefresh}
            className="btn-secondary border border-gray-200 flex items-center gap-2"
          >
            <Upload size={20} className="rotate-180" /> Atualizar
          </button>
        )}
        {activeTab === 'leads' && (
          <button 
            onClick={fetchQuizLeads}
            className="btn-secondary border border-gray-200 flex items-center gap-2"
          >
            <Upload size={20} className="rotate-180" /> {leadsLoading ? 'Atualizando...' : 'Atualizar Leads'}
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => { setActiveTab('dashboard'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <BarChart3 size={16} /> Dashboard
        </button>
        <button 
          onClick={() => { setActiveTab('products'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <Package size={16} /> Produtos
        </button>
        <button 
          onClick={() => { setActiveTab('posts'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <FileText size={16} /> Blog
        </button>
        <button 
          onClick={() => { setActiveTab('categories'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <Tag size={16} /> Categorias
        </button>
        <button 
          onClick={() => { setActiveTab('orders'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <ShoppingBag size={16} /> Pedidos
        </button>
        <button 
          onClick={() => { setActiveTab('affiliates'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'affiliates' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <Users size={16} /> Afiliados
        </button>
        <button 
          onClick={() => { setActiveTab('leads'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all whitespace-nowrap ${activeTab === 'leads' ? 'bg-brand-black text-white' : 'text-gray-400 hover:text-brand-orange'}`}
        >
          <Mail size={16} /> Leads Quiz
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-black mb-6 uppercase">
              {editingId ? 'Editar' : 'Adicionar'} {activeTab === 'products' ? 'Produto' : 'Post'}
            </h2>
            
            <form onSubmit={activeTab === 'products' ? handleAddProduct : handleAddPost} className="space-y-4">
              {activeTab === 'products' ? (
                <>
                  <input 
                    placeholder="Nome do Produto" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Preço" 
                      type="number" step="0.01"
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      required
                    />
                    <select 
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                    >
                      <option value="suplementos">Suplementos</option>
                      <option value="acessorios">Acessórios</option>
                      <option value="vestuario">Vestuário</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative group">
                      <input 
                        placeholder="Imagem Principal (URL)" 
                        className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none pr-12"
                        value={newProduct.image}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                        required
                      />
                      <label className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-brand-orange transition-colors">
                        <Upload size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} />
                      </label>
                    </div>
                    {newProduct.image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                        <img src={newProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <input 
                      placeholder="Estoque" 
                      type="number"
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <textarea 
                    placeholder="Imagens Adicionais (uma URL por linha)" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none h-24"
                    value={newProduct.images?.join('\n')}
                    onChange={e => setNewProduct({...newProduct, images: e.target.value.split('\n').filter(url => url.trim() !== '')})}
                  />
                  <textarea 
                    placeholder="Descrição" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none h-32"
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </>
              ) : (
                <>
                  <input 
                    placeholder="Título do Post" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                    value={newPost.title}
                    onChange={e => setNewPost({...newPost, title: e.target.value})}
                    required
                  />
                  <input 
                    placeholder="Resumo (Excerpt)" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                    value={newPost.excerpt}
                    onChange={e => setNewPost({...newPost, excerpt: e.target.value})}
                  />
                  <select 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                    value={newPost.category}
                    onChange={e => setNewPost({...newPost, category: e.target.value as any})}
                  >
                    <option value="alimentacao">Alimentação</option>
                    <option value="treino">Treino</option>
                    <option value="dieta">Dieta</option>
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Autor" 
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                      value={newPost.author}
                      onChange={e => setNewPost({...newPost, author: e.target.value})}
                    />
                    <input 
                      placeholder="Tempo de Leitura (ex: 5 min)" 
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none"
                      value={newPost.readTime}
                      onChange={e => setNewPost({...newPost, readTime: e.target.value})}
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      placeholder="Imagem do Post (URL)" 
                      className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none pr-12"
                      value={newPost.image}
                      onChange={e => setNewPost({...newPost, image: e.target.value})}
                    />
                    <label className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-brand-orange transition-colors">
                      <Upload size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'post')} />
                    </label>
                  </div>
                  {newPost.image && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-100">
                      <img src={newPost.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <textarea 
                    placeholder="Conteúdo" 
                    className="w-full p-4 bg-gray-50 rounded-xl border-none outline-none h-32"
                    value={newPost.content}
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                  />
                </>
              )}
              <button type="submit" className="w-full btn-primary py-4">Salvar</button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-8"
          >
            {activeTab === 'dashboard' ? (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-orange">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Vendas Totais</span>
                    </div>
                    <p className="text-3xl font-black">R$ {metrics.totalSales.toFixed(2)}</p>
                    <p className="text-xs text-green-500 font-bold mt-2">+12% vs mês anterior</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <ShoppingBag size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Pedidos Pagos</span>
                    </div>
                    <p className="text-3xl font-black">{metrics.paidOrdersCount}</p>
                    <p className="text-xs text-blue-500 font-bold mt-2">Taxa de conversão: 3.2%</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <DollarSign size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Ticket Médio</span>
                    </div>
                    <p className="text-3xl font-black">R$ {metrics.avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-emerald-500 font-bold mt-2">Otimizado via AI</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                        <Users size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Visitas Blog</span>
                    </div>
                    <p className="text-3xl font-black">1.2k</p>
                    <p className="text-xs text-purple-500 font-bold mt-2">Top: Dicas de Massa</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-orange">
                        <Mail size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Leads Quiz</span>
                    </div>
                    <p className="text-3xl font-black">{leadMetrics.totalLeads}</p>
                    <p className="text-xs text-gray-500 font-bold mt-2">{leadMetrics.noPurchase} ainda sem compra</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <Phone size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Leads abordados</span>
                    </div>
                    <p className="text-3xl font-black">{leadMetrics.contacted}</p>
                    <p className="text-xs text-blue-500 font-bold mt-2">Taxa de contato: {leadMetrics.contactRate.toFixed(1)}%</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                        <Users size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Plano mensal</span>
                    </div>
                    <p className="text-3xl font-black">{leadMetrics.interestedPlan}</p>
                    <p className="text-xs text-purple-500 font-bold mt-2">Interessados no acompanhamento</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <CheckCircle size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Conversão Quiz</span>
                    </div>
                    <p className="text-3xl font-black">{leadMetrics.quizConversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-emerald-500 font-bold mt-2">{leadMetrics.paidCustomers} leads já viraram clientes</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-8 uppercase">Vendas nos Últimos 7 Dias</h3>
                    <div className="h-[300px] w-full">
                      {metrics.salesChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" key={`sales-${metrics.salesChartData.length}`}>
                          <LineChart data={metrics.salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontWeight: 'bold', color: '#FF6321' }}
                            />
                            <Line type="monotone" dataKey="total" stroke="#FF6321" strokeWidth={4} dot={{ r: 6, fill: '#FF6321', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Sem dados de vendas</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-8 uppercase">Vendas por Categoria</h3>
                    <div className="h-[300px] w-full">
                      {metrics.categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" key={`cat-${metrics.categoryChartData.length}`}>
                          <PieChart>
                            <Pie
                              data={metrics.categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {metrics.categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Sem dados de categoria</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-8 uppercase">Produtos Mais Vendidos</h3>
                    <div className="space-y-6">
                      {metrics.popularProducts.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs">
                              {i + 1}
                            </div>
                            <span className="font-bold text-gray-700">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-orange" 
                                style={{ width: `${(p.qty / metrics.popularProducts[0].qty) * 100}%` }} 
                              />
                            </div>
                            <span className="font-black text-brand-orange">{p.qty} un.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-brand-black p-8 rounded-[40px] text-white flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black mb-4 uppercase flex items-center gap-2">
                        Insight AI Halex {loadingInsight && <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed italic">
                        {aiInsight || "Analisando seus dados para gerar estratégias de crescimento..."}
                      </p>
                    </div>
                    <button onClick={() => setActiveTab('posts')} className="btn-primary w-full mt-8 py-3 text-sm">Ver Estratégia Completa</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6 uppercase">Funil do Quiz</h3>
                    <div className="space-y-5">
                      {[
                        ['Leads captados', leadMetrics.totalLeads, '#FF6321'],
                        ['Sem compra', leadMetrics.noPurchase, '#3B82F6'],
                        ['Checkout iniciado', leadMetrics.checkoutStarted, '#F59E0B'],
                        ['Cliente pago', leadMetrics.paidCustomers, '#10B981'],
                      ].map(([label, value, color]) => (
                        <div key={String(label)}>
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="font-bold text-gray-700">{label}</span>
                            <span className="font-black" style={{ color: String(color) }}>{value}</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${leadMetrics.totalLeads > 0 ? (Number(value) / leadMetrics.totalLeads) * 100 : 0}%`, backgroundColor: String(color) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6 uppercase">Plano Mensal</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-700">Ofertas enviadas</span>
                        <span className="text-2xl font-black text-brand-orange">{leadMetrics.offeredPlan}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-700">Interessados</span>
                        <span className="text-2xl font-black text-purple-600">{leadMetrics.interestedPlan}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-700">Fechados</span>
                        <span className="text-2xl font-black text-emerald-600">{leadMetrics.closedPlan}</span>
                      </div>
                      <div className="p-5 rounded-3xl bg-brand-black text-white">
                        <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-2">Taxa de fechamento</p>
                        <p className="text-4xl font-black mb-2">{leadMetrics.planCloseRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-400">Com base nas ofertas do plano mensal já enviadas pelo CRM.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'products' ? (
              products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <img src={p.image} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold">{p.name}</h4>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">
                        {p.category} • R$ {p.price.toFixed(2)} • Estoque: {p.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditProduct(p)}
                      className="p-2 text-gray-300 hover:text-brand-orange transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : activeTab === 'categories' ? (
              <CategoryManagement onRefresh={onRefresh} />
            ) : activeTab === 'posts' ? (
              posts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <img src={p.image} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold">{p.title}</h4>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">{p.category} • {p.author} • {p.readTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditPost(p)}
                      className="p-2 text-gray-300 hover:text-brand-orange transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeletePost(p.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : activeTab === 'affiliates' ? (
              <AffiliatesManagement affiliates={affiliates} onRefresh={onRefresh} />
            ) : activeTab === 'leads' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                  <input
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    placeholder="Buscar por nome, e-mail, WhatsApp, objetivo ou produto recomendado"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-brand-orange focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['all', 'Todos'],
                      ['no-purchase', 'Sem compra'],
                      ['pending', 'Checkout iniciado'],
                      ['paid', 'Pagos'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setLeadStatusFilter(value as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${leadStatusFilter === value ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {leadsLoading ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-500">
                    Carregando leads do quiz...
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <Mail className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Nenhum lead encontrado para esse filtro.</p>
                  </div>
                ) : (
                  filteredLeads.map((lead: any) => {
                    const whatsappLink = getLeadWhatsAppLink(lead.phone, lead);
                    const crmDraft = leadCrmDrafts[lead.id] || { status: lead.crm?.status || 'new', internalNote: lead.crm?.internalNote || '', lastContactAt: lead.crm?.lastContactAt || '', nextFollowUpAt: lead.crm?.nextFollowUpAt ? String(lead.crm.nextFollowUpAt).slice(0, 10) : '', monthlyPlanInterest: lead.crm?.monthlyPlanInterest || 'unknown', planOfferedAt: lead.crm?.planOfferedAt || '' };
                    const statusClasses = lead.purchaseStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-600'
                      : lead.purchaseStatus === 'pending'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600';
                    const statusLabel = lead.purchaseStatus === 'paid'
                      ? 'Cliente pago'
                      : lead.purchaseStatus === 'pending'
                        ? 'Checkout iniciado'
                        : 'Sem compra';
                    const monthlyPlanLink = getLeadMonthlyPlanWhatsAppLink(lead.phone, lead);
                    const firstContactLink = getLeadTemplateWhatsAppLink(lead.phone, lead, 'first-contact');
                    const checkoutRecoveryLink = getLeadTemplateWhatsAppLink(lead.phone, lead, 'checkout-recovery');
                    const followUpLink = getLeadTemplateWhatsAppLink(lead.phone, lead, 'follow-up');
                    const planFollowUpLink = getLeadTemplateWhatsAppLink(lead.phone, lead, 'plan-follow-up');
                    const profileBadges = getLeadProfileBadges(lead);
                    const mailtoLink = `mailto:${encodeURIComponent(lead.email || '')}?subject=${encodeURIComponent('Sua recomendação L7 Fitness')}`;
                    const leadHistory = Array.isArray(lead.crm?.history)
                      ? [...lead.crm.history].sort((a: LeadHistoryEntry, b: LeadHistoryEntry) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      : [];

                    return (
                      <div key={lead.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="text-xl font-black">{lead.name || 'Lead sem nome'}</h3>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusClasses}`}>{statusLabel}</span>
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">{lead.goal || 'Objetivo não informado'}</span>
                            </div>
                            <p className="text-sm text-gray-500">{lead.email || 'Sem e-mail'}{lead.phone ? ` • ${lead.phone}` : ''}</p>
                            <p className="text-xs text-gray-400 mt-1">Criado em {new Date(lead.created_at).toLocaleString('pt-BR')}</p>
                            {profileBadges.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {profileBadges.map((badge) => (
                                  <span key={badge} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-brand-orange border border-orange-100">
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-left lg:text-right">
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Produto recomendado</p>
                            <p className="font-bold text-brand-orange">{lead.recommendedProductName}</p>
                            <p className="text-xs text-gray-400 mt-1">Pedidos vinculados: {lead.orderCount}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Perfil</p>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p><span className="font-bold text-gray-900">Idade:</span> {lead.age || '—'}</p>
                              <p><span className="font-bold text-gray-900">Sexo:</span> {lead.gender || '—'}</p>
                              <p><span className="font-bold text-gray-900">Peso/Altura:</span> {lead.weight || '—'}kg • {lead.height || '—'}cm</p>
                              <p><span className="font-bold text-gray-900">Atividade:</span> {lead.activity_level || '—'}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-gray-100 bg-orange-50/40 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Observações</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{lead.restrictions || 'Sem observações registradas.'}</p>
                          </div>
                          <div className="rounded-2xl border border-gray-100 bg-white p-4">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Abordagem comercial</p>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">{lead.metadata?.summary || 'Lead capturado pelo quiz com recomendação personalizada.'}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">CTA sugerido: {lead.metadata?.cta || 'Entrar em contato para explicar uso e fechar pedido.'}</p>
                            {lead.metadata?.monthly_plan_offer && (
                              <p className="text-xs text-brand-orange leading-relaxed mt-3 font-medium">Plano mensal: {lead.metadata.monthly_plan_offer}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-3">Oferta enviada: {formatLeadDate(crmDraft.planOfferedAt || lead.crm?.planOfferedAt)}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Mini CRM</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  ['new', 'Novo'],
                                  ['contacted', 'Abordado'],
                                  ['interested', 'Interessado'],
                                  ['won', 'Fechado'],
                                  ['lost', 'Perdido'],
                                ].map(([value, label]) => (
                                  <button
                                    key={value}
                                    onClick={() => updateLeadDraft(lead.id, { status: value })}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${crmDraft.status === value ? 'bg-brand-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p><span className="font-bold text-gray-700">Último contato:</span> {formatLeadDate(crmDraft.lastContactAt || lead.crm?.lastContactAt)}</p>
                              <p><span className="font-bold text-gray-700">Próximo follow-up:</span> {crmDraft.nextFollowUpAt ? new Date(`${crmDraft.nextFollowUpAt}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</p>
                              <p><span className="font-bold text-gray-700">Plano mensal:</span> {crmDraft.monthlyPlanInterest === 'interested' ? 'Interessado' : crmDraft.monthlyPlanInterest === 'not_interested' ? 'Sem interesse' : crmDraft.monthlyPlanInterest === 'closed' ? 'Fechado' : 'Não mapeado'}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Interesse no plano mensal</span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                ['unknown', 'Não mapeado'],
                                ['interested', 'Interessado'],
                                ['not_interested', 'Sem interesse'],
                                ['closed', 'Fechado'],
                              ].map(([value, label]) => (
                                <button
                                  key={value}
                                  onClick={() => updateLeadDraft(lead.id, { monthlyPlanInterest: value })}
                                  className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${crmDraft.monthlyPlanInterest === value ? 'bg-brand-orange text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Ações rápidas</span>
                            <div className="flex flex-wrap gap-2">
                              {firstContactLink && (
                                <button
                                  onClick={() => {
                                    registerLeadAction(lead, {
                                      url: firstContactLink,
                                      override: {
                                        lastContactAt: new Date().toISOString(),
                                        status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                      },
                                      historyEntry: {
                                        type: 'outreach',
                                        channel: 'whatsapp',
                                        template: 'first-contact',
                                        summary: 'Primeiro contato enviado pelo WhatsApp.',
                                      }
                                    });
                                  }}
                                  className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  1º contato
                                </button>
                              )}
                              {lead.purchaseStatus === 'pending' && checkoutRecoveryLink && (
                                <button
                                  onClick={() => {
                                    registerLeadAction(lead, {
                                      url: checkoutRecoveryLink,
                                      override: {
                                        lastContactAt: new Date().toISOString(),
                                        status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                      },
                                      historyEntry: {
                                        type: 'recovery',
                                        channel: 'whatsapp',
                                        template: 'checkout-recovery',
                                        summary: 'Mensagem de recuperação de checkout enviada.',
                                      }
                                    });
                                  }}
                                  className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors"
                                >
                                  Recuperar checkout
                                </button>
                              )}
                              {followUpLink && (
                                <button
                                  onClick={() => {
                                    registerLeadAction(lead, {
                                      url: followUpLink,
                                      override: {
                                        lastContactAt: new Date().toISOString(),
                                        status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                      },
                                      historyEntry: {
                                        type: 'follow_up',
                                        channel: 'whatsapp',
                                        template: 'follow-up',
                                        summary: 'Follow-up comercial enviado pelo WhatsApp.',
                                      }
                                    });
                                  }}
                                  className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                                >
                                  Follow-up
                                </button>
                              )}
                              {planFollowUpLink && (
                                <button
                                  onClick={() => {
                                    registerLeadAction(lead, {
                                      url: planFollowUpLink,
                                      override: {
                                        lastContactAt: new Date().toISOString(),
                                        planOfferedAt: new Date().toISOString(),
                                        monthlyPlanInterest: crmDraft.monthlyPlanInterest === 'unknown' ? 'interested' : crmDraft.monthlyPlanInterest,
                                        status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                      },
                                      historyEntry: {
                                        type: 'offer',
                                        channel: 'whatsapp',
                                        template: 'plan-follow-up',
                                        summary: 'Oferta do plano mensal enviada pelo WhatsApp.',
                                      }
                                    });
                                  }}
                                  className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors"
                                >
                                  Follow-up plano
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Histórico de contato</span>
                            {leadHistory.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
                                Nenhum contato registrado ainda para este lead.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {leadHistory.slice(0, 5).map((entry: LeadHistoryEntry, index: number) => (
                                  <div key={entry.id || `${lead.id}-history-${index}`} className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
                                      <p className="text-sm font-bold text-gray-800">{entry.summary || 'Interação registrada no CRM.'}</p>
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getLeadHistoryTone(entry)}`}>
                                        {entry.channel === 'email' ? 'E-mail' : entry.template === 'plan-follow-up' ? 'Plano mensal' : entry.template === 'checkout-recovery' ? 'Recuperação' : entry.channel === 'whatsapp' ? 'WhatsApp' : 'CRM'}
                                      </span>
                                    </div>
                                    {entry.note && <p className="text-sm text-gray-600 leading-relaxed mb-2">{entry.note}</p>}
                                    <p className="text-xs text-gray-400">{formatLeadDate(entry.createdAt)}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_auto] gap-3 items-end">
                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Observação interna</span>
                              <textarea
                                value={crmDraft.internalNote}
                                onChange={(e) => updateLeadDraft(lead.id, { internalNote: e.target.value })}
                                placeholder="Ex: prefere contato à noite, gostou do kit, pediu desconto, quer plano mensal..."
                                className="w-full min-h-[96px] px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-orange focus:outline-none resize-y bg-white"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Próximo follow-up</span>
                              <input
                                type="date"
                                value={crmDraft.nextFollowUpAt}
                                onChange={(e) => updateLeadDraft(lead.id, { nextFollowUpAt: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-orange focus:outline-none bg-white"
                              />
                            </label>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleSaveLeadCrm(lead.id, {
                                  lastContactAt: new Date().toISOString(),
                                  status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                }, {
                                  type: 'manual',
                                  channel: 'crm',
                                  summary: 'Contato manual marcado no CRM.',
                                })}
                                disabled={savingLeadId === lead.id}
                                className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest ${savingLeadId === lead.id ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700 transition-colors'}`}
                              >
                                Marcar contato agora
                              </button>
                              <button
                                onClick={() => handleSaveLeadCrm(lead.id)}
                                disabled={savingLeadId === lead.id}
                                className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest ${savingLeadId === lead.id ? 'bg-gray-200 text-gray-500' : 'btn-primary'}`}
                              >
                                {savingLeadId === lead.id ? 'Salvando...' : 'Salvar CRM'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => registerLeadAction(lead, {
                              url: mailtoLink,
                              sameTab: true,
                              override: {
                                lastContactAt: new Date().toISOString(),
                                status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                              },
                              historyEntry: {
                                type: 'outreach',
                                channel: 'email',
                                template: 'recommendation-email',
                                summary: 'E-mail de recomendação iniciado pelo CRM.',
                              }
                            })}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-black text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                          >
                            <Mail size={14} /> E-mail
                          </button>
                          {whatsappLink && (
                            <button
                              onClick={() => registerLeadAction(lead, {
                                url: whatsappLink,
                                override: {
                                  lastContactAt: new Date().toISOString(),
                                  status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                },
                                historyEntry: {
                                  type: 'outreach',
                                  channel: 'whatsapp',
                                  template: 'generic-whatsapp',
                                  summary: 'WhatsApp genérico aberto a partir do CRM.',
                                }
                              })}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors"
                            >
                              <Phone size={14} /> WhatsApp
                            </button>
                          )}
                          {monthlyPlanLink && (
                            <button
                              onClick={() => {
                                registerLeadAction(lead, {
                                  url: monthlyPlanLink,
                                  override: {
                                    planOfferedAt: new Date().toISOString(),
                                    monthlyPlanInterest: crmDraft.monthlyPlanInterest === 'unknown' ? 'interested' : crmDraft.monthlyPlanInterest,
                                    lastContactAt: new Date().toISOString(),
                                    status: crmDraft.status === 'new' ? 'contacted' : crmDraft.status,
                                  },
                                  historyEntry: {
                                    type: 'offer',
                                    channel: 'whatsapp',
                                    template: 'monthly-plan-offer',
                                    summary: 'Oferta direta do plano mensal enviada.',
                                  }
                                });
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors"
                            >
                              <Phone size={14} /> Ofertar plano mensal
                            </button>
                          )}
                          {lead.recommendedProduct && (
                            <button onClick={() => handleEditProduct(lead.recommendedProduct)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                              <Edit size={14} /> Ver produto recomendado
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="flex-1 max-w-xl">
                    <input
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Buscar por pedido, nome, e-mail, telefone, CPF, cidade ou CEP"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    ['all', 'Todos'],
                    ['paid', 'Pagos'],
                    ['pending', 'Pendentes'],
                    ['aguardando-envio', 'Aguardando envio'],
                    ['separando', 'Separando'],
                    ['postado', 'Postados'],
                    ['entregue', 'Entregues'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setOrderStatusFilter(value as any)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${orderStatusFilter === value ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Nenhum pedido encontrado para esse filtro.</p>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      {(() => {
                        const draft = orderFulfillmentDrafts[order.id] || {
                          status: order.fulfillment?.status || 'aguardando-envio',
                          trackingCode: order.fulfillment?.trackingCode || '',
                          trackingUrl: order.fulfillment?.trackingUrl || '',
                          internalNote: order.internalNote || '',
                        };
                        const trackingLink = getTrackingLink(draft.trackingCode, draft.trackingUrl);
                        const trackingWhatsAppLink = getTrackingWhatsAppLink(order.customer?.phone, order, draft);

                        return (
                          <>
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-black">{order.order_nsu}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${order.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {order.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${fulfillmentBadgeClasses[draft.status] || fulfillmentBadgeClasses['aguardando-envio']}`}>
                              {fulfillmentLabels[draft.status] || 'Aguardando envio'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{order.customer?.name || 'Cliente não informado'} • {order.customer_email}</p>
                          {order.customer?.phone && (
                            <p className="text-xs text-gray-400 mt-1">Tel/WhatsApp: {order.customer.phone}</p>
                          )}
                          {order.customer?.document && (
                            <p className="text-xs text-gray-400">CPF: {order.customer.document}</p>
                          )}
                          {order.shipping && (
                            <p className="text-xs text-gray-400 mt-1">
                              Entrega: {order.shipping.street}, {order.shipping.number}
                              {order.shipping.complement ? `, ${order.shipping.complement}` : ''}
                              {' • '}{order.shipping.neighborhood} • {order.shipping.city}/{order.shipping.state} • CEP {order.shipping.cep}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-brand-orange">R$ {order.total.toFixed(2)}</p>
                          {order.frete && (
                            <p className="text-xs text-gray-400 mt-1">Frete: {(order.frete.carrier || '').trim()} {order.frete.name} • R$ {Number(order.frete.price || 0).toFixed(2)}</p>
                          )}
                          {draft.trackingCode && (
                            <p className="text-xs text-gray-400 mt-1">Rastreio: {draft.trackingCode}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid lg:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                            <Mail size={14} /> Contato do Cliente
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-bold text-gray-900">Nome:</span> {order.customer?.name || 'Não informado'}</p>
                            <p><span className="font-bold text-gray-900">E-mail:</span> {order.customer_email}</p>
                            <p><span className="font-bold text-gray-900">Telefone:</span> {order.customer?.phone || 'Não informado'}</p>
                            <p><span className="font-bold text-gray-900">CPF:</span> {order.customer?.document || 'Não informado'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            <a href={`mailto:${encodeURIComponent(order.customer_email)}?subject=${encodeURIComponent(`Pedido ${order.order_nsu} - L7 Fitness`)}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-black text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                              <Mail size={14} /> E-mail
                            </a>
                            {getWhatsAppLink(order.customer?.phone, order.order_nsu) && (
                              <a href={getWhatsAppLink(order.customer?.phone, order.order_nsu)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors">
                                <Phone size={14} /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-orange-50/40 p-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                            <MapPin size={14} /> Entrega
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-bold text-gray-900">Endereço:</span> {order.shipping?.street || 'Não informado'}, {order.shipping?.number || '-'}</p>
                            <p><span className="font-bold text-gray-900">Complemento:</span> {order.shipping?.complement || '—'}</p>
                            <p><span className="font-bold text-gray-900">Bairro:</span> {order.shipping?.neighborhood || 'Não informado'}</p>
                            <p><span className="font-bold text-gray-900">Cidade/UF:</span> {order.shipping?.city || 'Não informado'}/{order.shipping?.state || '-'}</p>
                            <p><span className="font-bold text-gray-900">CEP:</span> {order.shipping?.cep || 'Não informado'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                          <Package size={14} /> Logística e rastreio
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {['aguardando-envio', 'separando', 'postado', 'entregue'].map(status => (
                            <button
                              key={status}
                              onClick={() => updateOrderDraft(order.id, { status })}
                              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${draft.status === status ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {fulfillmentLabels[status]}
                            </button>
                          ))}
                        </div>
                        <div className="grid lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Código de rastreio</span>
                            <input
                              value={draft.trackingCode}
                              onChange={(e) => updateOrderDraft(order.id, { trackingCode: e.target.value })}
                              placeholder="Ex: QG123456789BR"
                              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-orange focus:outline-none"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Link de rastreio</span>
                            <input
                              value={draft.trackingUrl}
                              onChange={(e) => updateOrderDraft(order.id, { trackingUrl: e.target.value })}
                              placeholder="Opcional"
                              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-orange focus:outline-none"
                            />
                          </label>
                          <button
                            onClick={() => handleSaveFulfillment(order.id)}
                            disabled={savingOrderId === order.id}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${savingOrderId === order.id ? 'bg-gray-200 text-gray-500' : 'btn-primary'}`}
                          >
                            {savingOrderId === order.id ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                        <label className="block mt-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Observação interna</span>
                          <textarea
                            value={draft.internalNote}
                            onChange={(e) => updateOrderDraft(order.id, { internalNote: e.target.value })}
                            placeholder="Ex: separar brindes, confirmar complemento, cliente pediu contato antes da postagem..."
                            className="w-full min-h-[96px] px-4 py-3 rounded-2xl border border-gray-200 focus:border-brand-orange focus:outline-none resize-y"
                          />
                        </label>
                        {order.internalNote && !draft.internalNote && (
                          <p className="text-xs text-gray-400 mt-2">Observação salva: {order.internalNote}</p>
                        )}
                        {trackingLink && (
                          <div className="mt-3 flex flex-wrap gap-3 items-center">
                            <a href={trackingLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-orange hover:underline">
                              Abrir rastreio
                            </a>
                            {trackingWhatsAppLink && (
                              <a href={trackingWhatsAppLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors">
                                <Phone size={14} /> Enviar rastreio no WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                        {!trackingLink && trackingWhatsAppLink && (
                          <div className="mt-3">
                            <a href={trackingWhatsAppLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors">
                              <Phone size={14} /> Enviar atualização no WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-50 pt-4">
                        <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Itens do Pedido</h5>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm rounded-xl px-3 py-2 bg-gray-50">
                              <span className="text-gray-600">{item.quantity}x {item.name}</span>
                              <span className={`font-medium ${item.type === 'frete' ? 'text-brand-orange' : ''}`}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckoutSuccessPage = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-xl max-w-xl mx-auto"
      >
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="text-green-500" size={48} />
        </div>
        <h1 className="text-4xl font-black mb-4 uppercase">Pagamento Confirmado!</h1>
        <p className="text-gray-500 text-lg mb-10">
          Seu pedido foi processado com sucesso. Você receberá um e-mail com os detalhes da entrega em instantes.
        </p>
        <button 
          onClick={onContinue}
          className="btn-primary w-full py-4 text-lg"
        >
          Continuar Comprando
        </button>
      </motion.div>
    </div>
  );
};

// --- Main App ---

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (user) onClose();
  }, [user]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verifique seu e-mail para confirmar o cadastro!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[40px] p-8 relative z-10 overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-black transition-colors">
          <X size={24} />
        </button>
        
        <div className="mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter mb-2">HALEX <span className="text-brand-orange">AUTH</span></h2>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Entre na sua conta para continuar.' : 'Crie sua conta para salvar favoritos.'}
          </p>
        </div>

        {supabase ? (
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-1">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium text-sm"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 text-sm font-bold disabled:opacity-50"
            >
              {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
            
            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-xs text-gray-400 hover:text-brand-orange transition-colors font-bold"
              >
                {mode === 'login' ? 'Não tem uma conta? Crie agora' : 'Já tem uma conta? Entre'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold">
            Supabase não configurado no servidor.
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, favorites, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorites' | 'orders'>('favorites');
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products').then(res => res.json()).then(data => setProducts(data.products));
      fetch('/api/posts').then(res => res.json()).then(data => setPosts(data.posts));
      if (user) {
        fetch(`/api/orders/${user.email}`).then(res => res.json()).then(setUserOrders);
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const favoriteProducts = products.filter(p => favorites.some(f => f.item_id === p.id && f.item_type === 'product'));
  const favoritePosts = posts.filter(p => favorites.some(f => f.item_id === p.id && f.item_type === 'post'));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[40px] p-8 relative z-10 max-h-[80vh] overflow-y-auto scrollbar-hide"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-brand-black transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-brand-orange rounded-3xl flex items-center justify-center text-white text-3xl font-black">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black">{user.email.split('@')[0]}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <button onClick={logout} className="text-brand-orange text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-1 hover:underline">
              <LogOut size={12} /> Sair da Conta
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'favorites' ? 'text-brand-orange' : 'text-gray-400'}`}
          >
            Meus Favoritos
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'text-brand-orange' : 'text-gray-400'}`}
          >
            Meus Pedidos
          </button>
        </div>

        {activeTab === 'favorites' ? (
          <div className="space-y-8">
            {favoriteProducts.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-4">Produtos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {favoriteProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-2 border border-gray-100 rounded-2xl">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                        <p className="text-[10px] text-brand-orange font-black">R$ {p.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {favoritePosts.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-4">Artigos do Blog</h3>
                <div className="space-y-4">
                  {favoritePosts.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-2 border border-gray-100 rounded-2xl">
                      <img src={p.image} alt={p.title} className="w-16 h-12 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-400">{p.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {favoriteProducts.length === 0 && favoritePosts.length === 0 && (
              <div className="text-center py-12">
                <Heart className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold">Você ainda não salvou nada.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold">Você ainda não fez nenhum pedido.</p>
              </div>
            ) : (
              userOrders.map(order => (
                <div key={order.id} className="p-4 border border-gray-100 rounded-3xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-widest">{order.order_nsu}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${order.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {order.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${fulfillmentBadgeClasses[order.fulfillment?.status || 'aguardando-envio'] || fulfillmentBadgeClasses['aguardando-envio']}`}>
                        {fulfillmentLabels[order.fulfillment?.status || 'aguardando-envio'] || 'Aguardando envio'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm font-black text-brand-orange">R$ {order.total.toFixed(2)}</p>
                  </div>
                  {order.shipping && (
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                      Entrega em {order.shipping.city}/{order.shipping.state} • CEP {order.shipping.cep}
                    </p>
                  )}
                  {order.fulfillment?.trackingCode && (
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                      <p>Código de rastreio: <span className="font-bold text-gray-700">{order.fulfillment.trackingCode}</span></p>
                      <a href={getTrackingLink(order.fulfillment.trackingCode, order.fulfillment.trackingUrl)} target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline">
                        Acompanhar entrega
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);
  const [selectedAffiliateRef, setSelectedAffiliateRef] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>(initialCheckoutForm);
  const [lastPageBeforeCheckout, setLastPageBeforeCheckout] = useState('/');
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const getPathForPage = (page: string, options?: { productId?: string | null; postId?: string | null; affiliateRef?: string | null }) => {
    if (page === 'store') return '/loja';
    if (page === 'tips') return '/dicas-ai';
    if (page === 'blog') return '/blog';
    if (page === 'blog-details' && options?.postId) return `/blog/${encodeURIComponent(options.postId)}`;
    if (page === 'product-details' && options?.productId) return `/produto/${encodeURIComponent(options.productId)}`;
    if (page === 'admin') return '/admin';
    if (page === 'checkout') return '/checkout';
    if (page === 'checkout-success') return '/checkout/success';
    if (page === 'affiliate-dashboard' && options?.affiliateRef) return `/afiliado/${encodeURIComponent(options.affiliateRef)}`;
    return '/';
  };

  const syncStateWithPath = (pathname: string) => {
    if (pathname.startsWith('/afiliado/')) {
      const refCode = decodeURIComponent(pathname.split('/')[2] || '');
      setSelectedAffiliateRef(refCode || null);
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('affiliate-dashboard');
      return;
    }

    if (pathname === '/checkout/success') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('checkout-success');
      setCart([]);
      setSelectedFrete(null);
      return;
    }

    if (pathname === '/checkout') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('checkout');
      return;
    }

    if (pathname.startsWith('/produto/')) {
      const productId = decodeURIComponent(pathname.split('/')[2] || '');
      setSelectedProductId(productId || null);
      setSelectedPostId(null);
      setCurrentPage('product-details');
      return;
    }

    if (pathname.startsWith('/blog/')) {
      const postId = decodeURIComponent(pathname.split('/')[2] || '');
      setSelectedPostId(postId || null);
      setSelectedProductId(null);
      setCurrentPage('blog-details');
      return;
    }

    if (pathname === '/blog') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('blog');
      return;
    }

    if (pathname === '/loja') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('store');
      return;
    }

    if (pathname === '/dicas-ai') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('tips');
      return;
    }

    if (pathname === '/admin') {
      setSelectedProductId(null);
      setSelectedPostId(null);
      setCurrentPage('admin');
      return;
    }

    setSelectedProductId(null);
    setSelectedPostId(null);
    setCurrentPage('home');
  };

  const navigateTo = (page: string, options?: { productId?: string | null; postId?: string | null; affiliateRef?: string | null; replace?: boolean }) => {
    const nextPath = getPathForPage(page, options);
    const historyMethod = options?.replace ? 'replaceState' : 'pushState';
    if (window.location.pathname !== nextPath) {
      window.history[historyMethod]({}, '', nextPath);
    }
    syncStateWithPath(nextPath);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('affiliate_ref', ref);
    }

    syncStateWithPath(window.location.pathname);

    const handlePopState = () => syncStateWithPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    try {
      const savedCheckoutData = localStorage.getItem('l7_checkout_data');
      if (savedCheckoutData) {
        const parsed = JSON.parse(savedCheckoutData);
        setCheckoutForm({ ...initialCheckoutForm, ...parsed, email: user?.email || parsed.email || '' });
      }
    } catch (error) {
      console.warn('Falha ao carregar dados salvos do checkout:', error);
    }

    try {
      const savedThemePreference = localStorage.getItem('l7_theme_preference');
      if (savedThemePreference === 'light' || savedThemePreference === 'dark' || savedThemePreference === 'system') {
        setThemePreference(savedThemePreference);
      }
    } catch (error) {
      console.warn('Falha ao carregar tema do site:', error);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    setCheckoutForm(prev => ({
      ...prev,
      email: user?.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('l7_checkout_data', JSON.stringify(checkoutForm));
    } catch (error) {
      console.warn('Falha ao salvar dados do checkout:', error);
    }
  }, [checkoutForm]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      setResolvedTheme(themePreference === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : themePreference);
    };

    syncTheme();
    localStorage.setItem('l7_theme_preference', themePreference);

    const listener = () => syncTheme();
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themePreference]);

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${resolvedTheme}`);
    return () => {
      document.body.classList.remove('theme-light', 'theme-dark');
    };
  }, [resolvedTheme]);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const [prodRes, postRes, orderRes] = await Promise.all([
        fetch(`/api/products?t=${timestamp}`),
        fetch(`/api/posts?t=${timestamp}`),
        fetch(`/api/orders?t=${timestamp}`)
      ]);
      
      if (!prodRes.ok || !postRes.ok || !orderRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const prodData = await prodRes.json();
      const postData = await postRes.json();
      const orderData = await orderRes.json();
      
      setProducts(prodData.products || []);
      setPosts(postData.posts || []);
      setOrders(orderData.orders || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const handleProductClick = (product: Product) => {
    navigateTo('product-details', { productId: product.id });
  };

  const handlePostClick = (post: BlogPost) => {
    navigateTo('blog-details', { postId: post.id });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedFrete) {
      alert('Por favor, selecione uma opção de frete.');
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.email.trim());
    const phoneDigits = checkoutForm.phone.replace(/\D/g, '');
    const documentDigits = checkoutForm.document.replace(/\D/g, '');
    const cepDigits = checkoutForm.cep.replace(/\D/g, '');
    const requiredFields = [checkoutForm.name, checkoutForm.street, checkoutForm.number, checkoutForm.neighborhood, checkoutForm.city, checkoutForm.state];

    if (requiredFields.some(field => !field.trim()) || !emailOk || phoneDigits.length < 10 || documentDigits.length !== 11 || cepDigits.length !== 8 || !brazilStates.includes(checkoutForm.state)) {
      alert('Preencha todos os dados de contato e entrega corretamente antes de seguir para o pagamento.');
      return;
    }

    const freteValue = selectedFrete.value ?? (Number.parseFloat(String((selectedFrete as any).custom_price ?? (selectedFrete as any).price ?? '0')) || 0);
    const normalizedCustomer = {
      ...checkoutForm,
      email: checkoutForm.email.trim(),
      name: checkoutForm.name.trim(),
      phone: phoneDigits,
      document: documentDigits,
      cep: cepDigits,
      street: checkoutForm.street.trim(),
      number: checkoutForm.number.trim(),
      complement: checkoutForm.complement.trim(),
      neighborhood: checkoutForm.neighborhood.trim(),
      city: checkoutForm.city.trim(),
      state: checkoutForm.state.trim().toUpperCase(),
    };
    
    setIsCheckingOut(true);
    try {
      const affiliateId = localStorage.getItem('affiliate_ref');
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customer_email: normalizedCustomer.email,
          affiliate_id: affiliateId,
          customer: normalizedCustomer,
          frete: {
            id: selectedFrete.id,
            name: selectedFrete.name,
            carrier: selectedFrete.carrier?.name || selectedFrete.company?.name || '',
            price: freteValue,
            estimatedDays: selectedFrete.delivery_time,
            cep: selectedFrete.cep || ''
          }
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        // Clear cart and frete selection after successful checkout initiation
        setCart([]);
        setSelectedFrete(null);
        setIsCartOpen(false);
        setCheckoutForm({ ...initialCheckoutForm, email: user?.email || '' });
        localStorage.removeItem('l7_checkout_data');
        // Redirect to InfinitePay checkout
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar o checkout. Tente novamente.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    if (!selectedFrete) {
      alert('Por favor, selecione uma opção de frete.');
      return;
    }

    setLastPageBeforeCheckout(window.location.pathname || '/');
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (selectedFrete?.value ?? (Number.parseFloat(String((selectedFrete as any)?.custom_price ?? (selectedFrete as any)?.price ?? '0')) || 0));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isCheckoutFlowPage = currentPage === 'checkout' || currentPage === 'checkout-success';

  return (
    <div className={`min-h-screen flex flex-col theme-${resolvedTheme}`}>
        {!isCheckoutFlowPage && (
          <Navbar 
            cartCount={cartCount} 
            onCartClick={() => setIsCartOpen(true)} 
            onNavigate={navigateTo} 
            themePreference={themePreference}
            resolvedTheme={resolvedTheme}
            onThemeChange={setThemePreference}
          />
        )}

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomePage onNavigate={navigateTo} onAddToCart={addToCart} products={products} posts={posts} onProductClick={handleProductClick} onPostClick={handlePostClick} />
            </motion.div>
          )}
          {currentPage === 'store' && (
            <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StorePage onAddToCart={addToCart} products={products} onProductClick={handleProductClick} />
            </motion.div>
          )}
          {currentPage === 'product-details' && selectedProductId && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(() => {
                const product = products.find(p => p.id === selectedProductId);
                if (!product) return null;
                return (
                  <ProductDetailsPage 
                    key={product.id}
                    product={product} 
                    onAddToCart={addToCart} 
                    onBack={() => navigateTo('store')} 
                    onNavigate={navigateTo}
                    onShowToast={showToast}
                  />
                );
              })()}
            </motion.div>
          )}
          {currentPage === 'blog' && (
            <motion.div key="blog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BlogPage posts={posts} onPostClick={handlePostClick} />
            </motion.div>
          )}
          {currentPage === 'blog-details' && selectedPostId && (
            <motion.div key="blog-details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(() => {
                const post = posts.find(p => p.id === selectedPostId);
                if (!post) return null;
                return (
                  <BlogPostDetailsPage 
                    key={post.id}
                    post={post} 
                    onBack={() => navigateTo('blog')} 
                  />
                );
              })()}
            </motion.div>
          )}
          {currentPage === 'tips' && (
            <motion.div key="tips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TipsPage products={products} onProductClick={handleProductClick} onAddToCart={addToCart} />
            </motion.div>
          )}
          {currentPage === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {user?.email === 'alexdjmp3@gmail.com' ? (
                <AdminPage products={products} posts={posts} orders={orders} onRefresh={fetchData} />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                  <X size={64} className="text-red-500 mb-4" />
                  <h2 className="text-2xl font-black mb-2">Acesso Negado</h2>
                  <p className="text-gray-500 mb-6">Você não tem permissão para acessar esta página.</p>
                  <button onClick={() => navigateTo('home')} className="btn-primary px-8 py-3">Voltar para Home</button>
                </div>
              )}
            </motion.div>
          )}
          {currentPage === 'affiliate-dashboard' && selectedAffiliateRef && (
            <motion.div key="affiliate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AffiliateDashboard refCode={selectedAffiliateRef} />
            </motion.div>
          )}
          {currentPage === 'checkout' && (
            <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckoutPage
                cart={cart}
                selectedFrete={selectedFrete}
                formData={checkoutForm}
                onFieldChange={(field, value) => setCheckoutForm(prev => ({ ...prev, [field]: value }))}
                onBack={() => {
                  if (window.location.pathname !== lastPageBeforeCheckout) {
                    window.history.pushState({}, '', lastPageBeforeCheckout);
                  }
                  syncStateWithPath(lastPageBeforeCheckout);
                  setIsCartOpen(true);
                }}
                onSubmit={handleCheckout}
                isProcessing={isCheckingOut}
                themePreference={themePreference}
                resolvedTheme={resolvedTheme}
                onThemeChange={setThemePreference}
              />
            </motion.div>
          )}
          {currentPage === 'checkout-success' && (
            <motion.div key="checkout-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckoutSuccessPage onContinue={() => navigateTo('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isCheckoutFlowPage && <Footer />}

      {!isCheckoutFlowPage && <SupportChat products={products} />}

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase">Seu Carrinho</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <ShoppingBag size={64} className="text-gray-200" />
                    <p className="text-gray-500 font-medium">Seu carrinho está vazio.</p>
                    <button onClick={() => { setIsCartOpen(false); navigateTo('store'); }} className="btn-primary">
                      Começar a Comprar
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">-</button>
                            <span className="font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">+</button>
                          </div>
                          <span className="font-bold text-brand-orange">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline mt-2">Remover</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                    <FreteCalculator cartItems={cart} onFreteSelect={setSelectedFrete} />
                  </div>
                  
                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total ({cart.reduce((sum, item) => sum + item.quantity, 0)} itens)</span>
                      <span className="text-2xl font-black">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={handleStartCheckout}
                      disabled={isCheckingOut || !selectedFrete}
                      className={`w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 ${(isCheckingOut || !selectedFrete) ? 'opacity-70 cursor-not-allowed' : ''}`}
                      title={!selectedFrete ? 'Selecione uma opção de frete' : ''}
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Continuar para Entrega'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-brand-black text-white px-6 py-3 rounded-full shadow-xl z-[100]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
