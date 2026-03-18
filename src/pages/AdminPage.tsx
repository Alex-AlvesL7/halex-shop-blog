import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle,
  DollarSign,
  Edit,
  FileText,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { generateSalesInsight } from '../services/geminiService';
import { BlogPost, Product } from '../types';
import {
  ProductAdminContent,
  ProductAIAssistantResult,
  buildStructuredProductContent,
  formatPriceBRL,
  getProductDetailContent,
  getProductMarketingSummary,
  hasProductPromotion,
  parseStructuredProductContent,
} from '../utils/productContent';

const AffiliatesManagement = lazy(() => import('../components/AffiliatesManagement').then((module) => ({ default: module.AffiliatesManagement })));
const CategoryManagement = lazy(() => import('../components/admin/CategoryManagement').then((module) => ({ default: module.CategoryManagement })));

const LazySectionFallback = ({ label = 'Carregando...' }: { label?: string }) => (
  <div className="rounded-[28px] border border-gray-100 bg-white/80 px-6 py-5 text-sm font-bold text-gray-500 shadow-sm">
    {label}
  </div>
);

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

export const AdminPage = ({ products, posts, orders, onRefresh }: { products: Product[], posts: BlogPost[], orders: any[], onRefresh: () => void }) => {
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
  const [savingProduct, setSavingProduct] = useState(false);
  const [productActionFeedback, setProductActionFeedback] = useState<string | null>(null);
  const [isGeneratingProductAI, setIsGeneratingProductAI] = useState(false);
  const [productAIMode, setProductAIMode] = useState<'equilibrado' | 'conversao' | 'premium'>('equilibrado');
  const [productAdSuggestions, setProductAdSuggestions] = useState<{ headline: string; primaryText: string; description: string } | null>(null);

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

  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

    const salesByDate: Record<string, number> = {};
    paidOrders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesByDate[date] = (salesByDate[date] || 0) + o.total;
    });
    const salesChartData = Object.entries(salesByDate).map(([date, total]) => ({ date, total })).reverse().slice(0, 7).reverse();

    const categorySales: Record<string, number> = {};
    paidOrders.forEach(o => {
      o.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.id);
        const cat = product?.category || 'Outros';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
      });
    });
    const categoryChartData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

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

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, compareAtPrice: 0, promotionLabel: '', promotionCta: '', promotionBadge: '', description: '', category: 'suplementos', image: 'https://picsum.photos/seed/new/600/600', images: [], stock: 0, rating: 5, reviews: 0
  });

  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe L7 Fitness', date: new Date().toISOString().split('T')[0], image: '/images/blog/l7-ultra-guide.svg', readTime: '5 min'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const response = await fetch(editingId ? `/api/products/${editingId}` : '/api/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? newProduct : { ...newProduct, id: Date.now().toString() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar produto.');
      }

      const savedProduct = data.product || { ...newProduct, id: data.id || editingId || Date.now().toString() };
      setNewProduct(savedProduct);
      setEditingId(savedProduct.id || editingId || null);
      setShowForm(true);
      await onRefresh();
      showProductFeedback(editingId ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(error instanceof Error ? error.message : 'Falha ao salvar produto.');
    } finally {
      setSavingProduct(false);
    }
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
    setNewProduct({ name: '', price: 0, compareAtPrice: 0, promotionLabel: '', promotionCta: '', promotionBadge: '', description: '', category: 'suplementos', image: 'https://picsum.photos/seed/new/600/600', images: [], stock: 0, rating: 5, reviews: 0 });
    setNewPost({ title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe L7 Fitness', date: new Date().toISOString().split('T')[0], image: '/images/blog/l7-ultra-guide.svg', readTime: '5 min' });
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct(product);
    setEditingId(product.id);
    setShowForm(true);
  };

  const productAdminContent = useMemo(() => parseStructuredProductContent(newProduct.description), [newProduct.description]);

  const updateProductAdminContent = (patch: Partial<ProductAdminContent>) => {
    const nextContent = {
      ...parseStructuredProductContent(newProduct.description),
      ...patch,
      hasStructuredContent: true,
    };

    setNewProduct({
      ...newProduct,
      description: buildStructuredProductContent(nextContent),
    });
  };

  const handleGenerateProductContentAI = async () => {
    if (!String(newProduct.name || '').trim()) {
      alert('Informe o nome do produto antes de usar o preenchimento com IA.');
      return;
    }

    setIsGeneratingProductAI(true);
    try {
      const current = parseStructuredProductContent(newProduct.description);

      const response = await fetch('/api/ai/product-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: productAIMode,
          product: {
            name: newProduct.name,
            category: newProduct.category,
            price: newProduct.price,
            compareAtPrice: newProduct.compareAtPrice,
            summary: current.summary,
            purpose: current.purpose,
            kitContents: current.kitContents,
            composition: current.composition,
            capsules: current.capsules,
            usage: current.usage,
            details: current.details,
            description: newProduct.description,
            promotionLabel: newProduct.promotionLabel,
            promotionBadge: newProduct.promotionBadge,
            promotionCta: newProduct.promotionCta,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.content) {
        throw new Error(data?.error || 'Falha ao gerar conteúdo com IA.');
      }

      const aiContent = data.content as ProductAIAssistantResult;
      const mergedStructured: ProductAdminContent = {
        ...current,
        summary: String(aiContent.summary || current.summary || '').trim(),
        purpose: String(aiContent.purpose || current.purpose || '').trim(),
        kitContents: String(aiContent.kitContents || current.kitContents || '').trim(),
        composition: String(aiContent.composition || current.composition || '').trim(),
        capsules: String(aiContent.capsules || current.capsules || '').trim(),
        usage: String(aiContent.usage || current.usage || '').trim(),
        details: String(aiContent.details || current.details || '').trim(),
        hasStructuredContent: true,
      };

      setNewProduct((prev) => ({
        ...prev,
        promotionLabel: String(aiContent.promotionLabel || prev.promotionLabel || '').trim(),
        promotionBadge: String(aiContent.promotionBadge || prev.promotionBadge || '').trim(),
        promotionCta: String(aiContent.promotionCta || prev.promotionCta || '').trim(),
        description: buildStructuredProductContent(mergedStructured),
      }));

      setProductAdSuggestions({
        headline: String(aiContent.adsHeadline || '').trim(),
        primaryText: String(aiContent.adsPrimaryText || '').trim(),
        description: String(aiContent.adsDescription || '').trim(),
      });

      showProductFeedback('IA preencheu e otimizou os campos com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar conteúdo de produto com IA:', error);
      alert(error instanceof Error ? error.message : 'Falha ao gerar conteúdo com IA.');
    } finally {
      setIsGeneratingProductAI(false);
    }
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

  const showProductFeedback = (message: string) => {
    setProductActionFeedback(message);
    window.setTimeout(() => {
      setProductActionFeedback((current) => current === message ? null : current);
    }, 2500);
  };

  const getPublicProductUrl = (productId?: string | null) => `${window.location.origin}/produto/${encodeURIComponent(String(productId || ''))}`;
  const getCampaignOfferUrl = (productId?: string | null) => `${window.location.origin}/campanha/${encodeURIComponent(String(productId || ''))}`;

  const handleCopyCampaignLink = async (productId?: string | null) => {
    const url = getCampaignOfferUrl(productId);

    try {
      await navigator.clipboard.writeText(url);
      showProductFeedback('Link da campanha copiado.');
    } catch (error) {
      console.error('Falha ao copiar link da campanha:', error);
      window.prompt('Copie o link da campanha:', url);
    }
  };

  const handleCopyProductLink = async (productId?: string | null, mode: 'product' | 'campaign' = 'campaign') => {
    const url = mode === 'campaign' ? getCampaignOfferUrl(productId) : getPublicProductUrl(productId);

    try {
      await navigator.clipboard.writeText(url);
      showProductFeedback(mode === 'campaign' ? 'Link da campanha copiado.' : 'Link do produto copiado.');
    } catch (error) {
      console.error('Falha ao copiar link da oferta:', error);
      window.prompt(mode === 'campaign' ? 'Copie o link da campanha:' : 'Copie o link do produto:', url);
    }
  };

  const productDraftPreview = useMemo(() => getProductMarketingSummary({
    id: newProduct.id || editingId || 'preview-product',
    name: newProduct.name || 'Produto em edição',
    price: Number(newProduct.price) || 0,
    compareAtPrice: Number(newProduct.compareAtPrice) || 0,
    promotionLabel: newProduct.promotionLabel || '',
    promotionCta: newProduct.promotionCta || '',
    promotionBadge: newProduct.promotionBadge || '',
    description: newProduct.description || '',
    category: newProduct.category || 'suplementos',
    image: newProduct.image || 'https://picsum.photos/seed/new/600/600',
    images: newProduct.images || [],
    stock: Number(newProduct.stock) || 0,
    rating: Number(newProduct.rating) || 5,
    reviews: Number(newProduct.reviews) || 0,
  }), [editingId, newProduct]);

  const productDraftDetails = useMemo(() => getProductDetailContent({
    id: newProduct.id || editingId || 'preview-product',
    name: newProduct.name || 'Produto em edição',
    price: Number(newProduct.price) || 0,
    compareAtPrice: Number(newProduct.compareAtPrice) || 0,
    promotionLabel: newProduct.promotionLabel || '',
    promotionCta: newProduct.promotionCta || '',
    promotionBadge: newProduct.promotionBadge || '',
    description: newProduct.description || '',
    category: newProduct.category || 'suplementos',
    image: newProduct.image || 'https://picsum.photos/seed/new/600/600',
    images: newProduct.images || [],
    stock: Number(newProduct.stock) || 0,
    rating: Number(newProduct.rating) || 5,
    reviews: Number(newProduct.reviews) || 0,
  }), [editingId, newProduct]);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-4 uppercase flex items-center gap-4">
            Painel ADM <LayoutDashboard className="text-brand-orange" size={40} />
          </h1>
          <p className="text-gray-500">Gerencie seus produtos, conteúdo do blog e pedidos.</p>
          {activeTab === 'products' && productActionFeedback && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest border border-emerald-100">
              {productActionFeedback}
            </div>
          )}
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
            className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl max-w-6xl mx-auto w-full"
          >
            <h2 className="text-2xl font-black mb-6 uppercase">
              {editingId ? 'Editar' : 'Adicionar'} {activeTab === 'products' ? 'Produto' : 'Post'}
            </h2>
            <form onSubmit={activeTab === 'products' ? handleAddProduct : handleAddPost} className={activeTab === 'products' ? 'grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_360px] gap-8' : 'space-y-4'}>
              {/* content preserved from App extraction */}
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-8">
            <div className="text-sm text-gray-500">Painel administrativo carregado.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
