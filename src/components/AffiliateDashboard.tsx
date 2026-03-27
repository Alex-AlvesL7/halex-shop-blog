import React, { useEffect, useMemo, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/authContext';
import { PRODUCTS } from '../data';
import { BadgePercent, CheckCircle2, Clock3, Copy, DollarSign, Link2, Package, ShoppingBag, TrendingUp, Users, Wallet, CalendarDays, ExternalLink } from 'lucide-react';

const formatPrice = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(value) || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const statusMap: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-rose-50 text-rose-700 border border-rose-100',
  },
};

const commissionStatusMap: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Liberado',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  failed: {
    label: 'Não aprovado',
    className: 'bg-rose-50 text-rose-700 border border-rose-100',
  },
};

const periodOptions = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'all', label: 'Todo período' },
] as const;

const isWithinPeriod = (value: string | undefined, period: '7d' | '30d' | '90d' | 'all') => {
  if (period === 'all') return true;
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return false;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  threshold.setHours(0, 0, 0, 0);
  return date >= threshold;
};


export const AffiliateDashboard = ({ refCode }: { refCode: string }) => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<string | null>(null);

  // Se não estiver autenticado, mostra tela de login do Supabase
  if (!user) {
    return (
      <div className="pt-32 pb-24 max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-gray-100 shadow-lg p-8 text-center">
          <h2 className="text-2xl font-black mb-4 text-brand-black">Acesso ao Painel do Afiliado</h2>
          <p className="mb-6 text-gray-500">Faça login para acessar seu painel de afiliado.</p>
          <Auth supabaseClient={supabase} appearance={{}} providers={[]} />
        </div>
      </div>
    );
  }

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/affiliates/${refCode}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao carregar painel');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAffiliate(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAffiliate(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refCode]);

  useEffect(() => {
    setPixKey(String(affiliate?.payoutDefaults?.pixKey || ''));
    setPixKeyType(String(affiliate?.payoutDefaults?.pixKeyType || 'cpf'));
  }, [affiliate?.payoutDefaults?.pixKey, affiliate?.payoutDefaults?.pixKeyType]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copiado.`);
      window.setTimeout(() => setCopyFeedback((current) => current === `${label} copiado.` ? null : current), 2200);
    } catch {
      window.prompt(`Copie ${label.toLowerCase()}:`, text);
    }
  };

  const stats = affiliate?.stats || {};
  const allOrders = Array.isArray(affiliate?.orders)
    ? affiliate.orders
    : (Array.isArray(affiliate?.recentOrders) ? affiliate.recentOrders : []);
  const allPayoutHistory = Array.isArray(affiliate?.payoutHistory) ? affiliate.payoutHistory : [];
  const shareLinks = affiliate?.shareLinks || {
    home: `${window.location.origin}/?ref=${affiliate?.ref_code || refCode}`,
    store: `${window.location.origin}/loja?ref=${affiliate?.ref_code || refCode}`,
  };
  const financialSummary = {
    availableToWithdraw: Number(stats.availableToWithdraw) || 0,
    paidOutTotal: Number(stats.paidOutTotal) || 0,
    pendingPayoutAmount: Number(stats.pendingPayoutAmount) || 0,
    lastPaymentAt: stats.lastPaymentAt || null,
  };

  const filteredOrders = useMemo(
    () => allOrders.filter((order: any) => isWithinPeriod(order.createdAt, period)),
    [allOrders, period]
  );

  const filteredStats = useMemo(() => {
    const validOrders = filteredOrders.filter((order: any) => order.status !== 'failed');
    const paidOrders = filteredOrders.filter((order: any) => order.status === 'paid');
    const pendingOrders = filteredOrders.filter((order: any) => order.status === 'pending');

    const grossSales = validOrders.reduce((acc: number, order: any) => acc + (Number(order.total) || 0), 0);
    const paidCommission = paidOrders.reduce((acc: number, order: any) => acc + (Number(order.commission) || 0), 0);
    const pendingCommission = pendingOrders.reduce((acc: number, order: any) => acc + (Number(order.commission) || 0), 0);

    return {
      grossSales,
      paidCommission,
      pendingCommission,
      totalOrders: filteredOrders.length,
      approvedOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      averageTicket: validOrders.length ? grossSales / validOrders.length : 0,
      availableToWithdraw: paidCommission,
      payableSoon: pendingCommission,
      lastPaidAt: paidOrders[0]?.createdAt || null,
    };
  }, [filteredOrders]);

  const filteredTopProducts = useMemo(() => {
    const productsMap = new Map<string, { name: string; orders: number; quantity: number; revenue: number }>();

    filteredOrders
      .filter((order: any) => order.status !== 'failed')
      .forEach((order: any) => {
        const seen = new Set<string>();
        (order.items || []).forEach((item: any) => {
          const name = String(item?.name || 'Produto').trim() || 'Produto';
          const quantity = Number(item?.quantity) || 1;
          const revenue = (Number(order.total) || 0) / Math.max(1, (order.items || []).length);
          const current = productsMap.get(name) || { name, orders: 0, quantity: 0, revenue: 0 };
          current.quantity += quantity;
          current.revenue += revenue;
          if (!seen.has(name)) {
            current.orders += 1;
            seen.add(name);
          }
          productsMap.set(name, current);
        });
      });

    return Array.from(productsMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  const filteredPayoutHistory = useMemo(
    () => allPayoutHistory
      .filter((item: any) => isWithinPeriod(item.requestedAt || item.processedAt, period))
      .slice(0, 12),
    [allPayoutHistory, period]
  );

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(String(requestAmount).replace(',', '.'));
    if (!pixKey.trim()) {
      setPayoutFeedback('Informe sua chave Pix.');
      return;
    }
    if (!amount || amount <= 0) {
      setPayoutFeedback('Informe um valor válido para saque.');
      return;
    }

    setIsSubmittingPayout(true);
    setPayoutFeedback(null);

    try {
      const response = await fetch(`/api/affiliates/${encodeURIComponent(refCode)}/payout-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          note: requestNote,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Falha ao solicitar saque.');
      }

      setPayoutFeedback('Solicitação de saque enviada com sucesso.');
      setRequestAmount('');
      setRequestNote('');

      const refreshed = await fetch(`/api/affiliates/${encodeURIComponent(refCode)}`);
      const refreshedData = await refreshed.json();
      setAffiliate(refreshedData);
    } catch (error: any) {
      setPayoutFeedback(error?.message || 'Falha ao solicitar saque.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const quickTips = useMemo(() => [
    'Compartilhe primeiro a campanha mais forte e depois o link geral da loja.',
    'Use depoimento, urgência e benefício antes de mandar o link.',
    'Foque nos produtos com mais conversão para aumentar seu ticket.',
  ], []);


  if (loading) return <div className="p-12 text-center">Carregando painel do afiliado...</div>;

  if (!affiliate) {
    return (
      <div className="p-12 text-center text-amber-500 flex flex-col items-center gap-6">
        <div>
          <div className="text-4xl mb-2">⚠️</div>
          <div>Você ainda não é afiliado.</div>
          <div className="text-gray-500 text-base mt-2 mb-4">Complete seu cadastro para acessar o painel de afiliado e gerar seus links de divulgação.</div>
        </div>
        <a href="/" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('openAffiliateRegistration')); }}
          className="btn-primary px-8 py-3 rounded-full text-white font-bold bg-brand-orange hover:bg-orange-600 transition-colors">
          Quero ser afiliado
        </a>
      </div>
    );
  }

  // Protege o painel: só o próprio afiliado (por e-mail) pode acessar
  if (affiliate?.email && user?.email && affiliate.email !== user.email) {
    return (
      <div className="p-12 text-center text-red-500">
        Você não tem permissão para acessar este painel de afiliado.<br />
        Faça login com o e-mail cadastrado do afiliado.
      </div>
    );
  }

  // Se o afiliado não estiver aprovado, mostra aviso e não exibe links
  if (affiliate.status !== 'approved') {
    return (
      <div className="p-12 text-center text-amber-500">
        Seu cadastro de afiliado está aguardando aprovação.<br />
        Assim que for aprovado, seu painel e links de divulgação ficarão disponíveis.
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[36px] overflow-hidden bg-brand-black text-white border border-white/5 shadow-2xl mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
          <div className="p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="px-4 py-2 rounded-full bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest">
                Painel do afiliado
              </span>
              <span className="px-4 py-2 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                comissão {Number(affiliate.commission_rate) || 0}%
              </span>
              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${affiliate.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' : 'bg-amber-500/10 text-amber-300 border-amber-400/20'}`}>
                {affiliate.status === 'approved' ? 'Afiliação aprovada' : 'Aguardando aprovação'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-tight mb-4">Olá, {affiliate.name}</h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mb-6">
              Aqui você acompanha seus ganhos, pedidos atribuídos e os links mais importantes para divulgar e vender mais.
            </p>

            {copyFeedback && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-300 text-sm font-bold mb-6 border border-emerald-400/20">
                <CheckCircle2 size={16} /> {copyFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><DollarSign className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Comissão paga</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(filteredStats.paidCommission)}</p>
                <p className="text-xs text-gray-400 mt-2">ganho já confirmado</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><Clock3 className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Comissão pendente</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(filteredStats.pendingCommission)}</p>
                <p className="text-xs text-gray-400 mt-2">aguardando aprovação</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><TrendingUp className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Vendas geradas</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(filteredStats.grossSales)}</p>
                <p className="text-xs text-gray-400 mt-2">ticket médio {formatPrice(filteredStats.averageTicket)}</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><ShoppingBag className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Pedidos atribuídos</p></div>
                <p className="text-3xl font-black text-white">{Number(filteredStats.totalOrders) || 0}</p>
                <p className="text-xs text-gray-400 mt-2">{Number(filteredStats.approvedOrders) || 0} pagos • {Number(filteredStats.pendingOrders) || 0} pendentes</p>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-10 bg-gradient-to-br from-[#111318] to-[#0b0b0f] border-t lg:border-t-0 lg:border-l border-white/5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-orange font-black mb-3">Links para divulgar</p>
            <h2 className="text-2xl font-black uppercase mb-6">Seu arsenal de vendas</h2>

            <div className="space-y-4">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3"><Link2 className="text-brand-orange" size={18} /><p className="text-sm font-black uppercase tracking-widest">Link principal</p></div>
                  <button onClick={() => copyText(shareLinks.home, 'Link principal')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-brand-black text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
                    <Copy size={14} /> Copiar
                  </button>
                </div>
                <p className="text-sm text-gray-300 break-all">{shareLinks.home}</p>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3"><Users className="text-brand-orange" size={18} /><p className="text-sm font-black uppercase tracking-widest">Link da loja</p></div>
                  <button onClick={() => copyText(shareLinks.store, 'Link da loja')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-brand-black text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
                    <Copy size={14} /> Copiar
                  </button>
                </div>
                <p className="text-sm text-gray-300 break-all">{shareLinks.store}</p>
              </div>

              <div className="rounded-3xl bg-brand-orange/10 border border-brand-orange/15 p-5">
                <div className="flex items-center gap-3 mb-3"><BadgePercent className="text-brand-orange" size={18} /><p className="text-sm font-black uppercase tracking-widest text-white">Meta do mês</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(stats.monthlyCommission)}</p>
                <p className="text-sm text-gray-300 mt-2">comissão gerada neste mês em pedidos pagos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 lg:p-6 mb-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Arsenal completo</p>
        <h2 className="text-2xl font-black uppercase text-brand-black mb-6">Produtos para divulgar</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => {
            const productLink = `${window.location.origin}/loja/${product.id}?ref=${affiliate?.ref_code || refCode}`;
            
            return (
              <div key={product.id} className="rounded-3xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow">
                <div className="relative overflow-hidden bg-gray-100 aspect-square">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                <div className="p-4">
                  <p className="text-sm font-black text-brand-black leading-snug mb-2 line-clamp-2">{product.name}</p>
                  <p className="text-lg font-black text-brand-orange mb-3">{formatPrice(product.price)}</p>
                  
                  <button 
                    onClick={() => copyText(productLink, 'Link do produto')}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-black text-white text-xs font-black uppercase tracking-widest hover:bg-black/90 transition-colors"
                  >
                    <Copy size={14} /> Copiar link
                  </button>

                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-brand-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors mt-2"
                  >
                    <ExternalLink size={14} /> Ver produto
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 lg:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Análise por período</p>
            <h3 className="text-2xl font-black uppercase text-brand-black">Filtrar ganhos e pedidos</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${period === option.value ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-500 hover:text-brand-orange'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6 mb-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Pedidos e comissões</p>
              <h3 className="text-2xl font-black uppercase text-brand-black">Conversões recentes</h3>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-500">
              Ainda não há pedidos vinculados ao seu código. Use seus links acima para começar a divulgar.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.slice(0, 12).map((order: any) => {
                const statusInfo = statusMap[order.status] || statusMap.pending;

                return (
                  <div key={order.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="text-sm font-black text-brand-black">{order.customerName || order.customerEmail || order.orderNsu}</p>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusInfo.className}`}>{statusInfo.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Pedido {order.orderNsu || order.id} • {formatDate(order.createdAt)}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {(order.items || []).slice(0, 3).map((item: any) => `${item.name} x${item.quantity}`).join(' • ') || 'Sem itens visíveis'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 min-w-[220px]">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Venda</p>
                          <p className="text-lg font-black text-brand-black">{formatPrice(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Sua comissão</p>
                          <p className="text-lg font-black text-brand-orange">{formatPrice(order.commission)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Seus destaques</p>
            <h3 className="text-2xl font-black uppercase text-brand-black mb-5">Produtos que mais giram</h3>

            <div className="space-y-3">
              {filteredTopProducts.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-500">
                  Assim que os pedidos entrarem, mostramos aqui os produtos mais vendidos pelo seu código.
                </div>
              ) : filteredTopProducts.map((product: any, index: number) => (
                <div key={product.name} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-brand-orange font-black mb-1">Top {index + 1}</p>
                      <p className="font-black text-brand-black leading-snug">{product.name}</p>
                    </div>
                    <Package className="text-brand-orange flex-shrink-0" size={18} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-gray-500">
                    <div>
                      <p className="font-black text-brand-black">{product.orders}</p>
                      <p>pedidos</p>
                    </div>
                    <div>
                      <p className="font-black text-brand-black">{product.quantity}</p>
                      <p>itens</p>
                    </div>
                    <div>
                      <p className="font-black text-brand-black">{formatPrice(product.revenue)}</p>
                      <p>receita</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Como vender mais</p>
            <h3 className="text-2xl font-black uppercase text-brand-black mb-5">Checklist rápido</h3>

            <div className="space-y-3">
              {quickTips.map((tip) => (
                <div key={tip} className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
                  <CheckCircle2 className="text-brand-orange mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Financeiro</p>
          <h3 className="text-2xl font-black uppercase text-brand-black mb-6">Saldo e saque</h3>

          <div className="space-y-4">
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
              <div className="flex items-center gap-3 mb-2"><Wallet className="text-emerald-600" size={20} /><p className="text-[10px] uppercase tracking-widest text-emerald-700 font-black">Disponível para saque</p></div>
              <p className="text-3xl font-black text-emerald-700">{formatPrice(financialSummary.availableToWithdraw)}</p>
              <p className="text-sm text-emerald-700/80 mt-2">valor real liberado para saque</p>
            </div>

            <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
              <div className="flex items-center gap-3 mb-2"><Clock3 className="text-amber-700" size={20} /><p className="text-[10px] uppercase tracking-widest text-amber-700 font-black">Pendente de liberação</p></div>
              <p className="text-3xl font-black text-amber-700">{formatPrice(financialSummary.pendingPayoutAmount)}</p>
              <p className="text-sm text-amber-700/80 mt-2">solicitações em análise ou aguardando pagamento</p>
            </div>

            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2"><CalendarDays className="text-brand-orange" size={20} /><p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Última comissão liberada</p></div>
              <p className="text-xl font-black text-brand-black">{formatDate(financialSummary.lastPaymentAt)}</p>
              <p className="text-sm text-gray-500 mt-2">total já pago: {formatPrice(financialSummary.paidOutTotal)}</p>
            </div>
          </div>

          <form onSubmit={handlePayoutRequest} className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-orange font-black mb-2">Solicitar saque</p>
              <h4 className="text-lg font-black text-brand-black">Peça seu repasse</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black block mb-2">Tipo de chave Pix</span>
                <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700">
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave aleatória</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black block mb-2">Valor desejado</span>
                <input value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder="Ex: 150,00" className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700" />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black block mb-2">Chave Pix</span>
              <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite a chave para receber" className="w-full p-4 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700" />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black block mb-2">Observação para o admin</span>
              <textarea value={requestNote} onChange={(e) => setRequestNote(e.target.value)} placeholder="Ex: conta da titularidade do afiliado" className="w-full min-h-[92px] p-4 bg-white rounded-2xl border border-gray-200 text-sm text-gray-700 resize-y" />
            </label>

            {payoutFeedback && (
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${payoutFeedback.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {payoutFeedback}
              </div>
            )}

            <button type="submit" disabled={isSubmittingPayout || financialSummary.availableToWithdraw <= 0} className="w-full bg-brand-black text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmittingPayout ? 'Enviando solicitação...' : 'Solicitar saque'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Histórico financeiro</p>
          <h3 className="text-2xl font-black uppercase text-brand-black mb-6">Repasses e status</h3>

          {filteredPayoutHistory.length === 0 ? (
            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-500">
              Ainda não há comissões no período selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayoutHistory.map((order: any) => {
                const commissionStatus = commissionStatusMap[order.status] || commissionStatusMap.pending;

                return (
                  <div key={`payout-${order.id}`} className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="text-sm font-black text-brand-black">{order.orderNsu || order.id}</p>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${commissionStatus.className}`}>{commissionStatus.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{formatDate(order.createdAt)} • {order.customerName || order.customerEmail || 'Cliente identificado'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 min-w-[220px]">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Venda</p>
                          <p className="text-lg font-black text-brand-black">{formatPrice(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Repasse</p>
                          <p className="text-lg font-black text-brand-orange">{formatPrice(order.commission)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
