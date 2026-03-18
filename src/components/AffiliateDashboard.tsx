import React, { useEffect, useMemo, useState } from 'react';
import { BadgePercent, CheckCircle2, Clock3, Copy, DollarSign, Link2, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';

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

export const AffiliateDashboard = ({ refCode }: { refCode: string }) => {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
  const recentOrders = Array.isArray(affiliate?.recentOrders) ? affiliate.recentOrders : [];
  const topProducts = Array.isArray(affiliate?.topProducts) ? affiliate.topProducts : [];
  const shareLinks = affiliate?.shareLinks || {
    home: `${window.location.origin}/?ref=${affiliate?.ref_code || refCode}`,
    store: `${window.location.origin}/loja?ref=${affiliate?.ref_code || refCode}`,
  };

  const quickTips = useMemo(() => [
    'Compartilhe primeiro a campanha mais forte e depois o link geral da loja.',
    'Use depoimento, urgência e benefício antes de mandar o link.',
    'Foque nos produtos com mais conversão para aumentar seu ticket.',
  ], []);

  if (loading) return <div className="p-12 text-center">Carregando painel do afiliado...</div>;
  if (!affiliate) return <div className="p-12 text-center text-red-500">Afiliado não encontrado.</div>;

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
                <p className="text-3xl font-black text-white">{formatPrice(stats.paidCommission)}</p>
                <p className="text-xs text-gray-400 mt-2">ganho já confirmado</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><Clock3 className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Comissão pendente</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(stats.pendingCommission)}</p>
                <p className="text-xs text-gray-400 mt-2">aguardando aprovação</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><TrendingUp className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Vendas geradas</p></div>
                <p className="text-3xl font-black text-white">{formatPrice(stats.grossSales)}</p>
                <p className="text-xs text-gray-400 mt-2">ticket médio {formatPrice(stats.averageTicket)}</p>
              </div>
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3"><ShoppingBag className="text-brand-orange" size={22} /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Pedidos atribuídos</p></div>
                <p className="text-3xl font-black text-white">{Number(stats.totalOrders) || 0}</p>
                <p className="text-xs text-gray-400 mt-2">{Number(stats.approvedOrders) || 0} pagos • {Number(stats.pendingOrders) || 0} pendentes</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6 mb-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Pedidos e comissões</p>
              <h3 className="text-2xl font-black uppercase text-brand-black">Conversões recentes</h3>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-500">
              Ainda não há pedidos vinculados ao seu código. Use seus links acima para começar a divulgar.
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order: any) => {
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
              {topProducts.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-500">
                  Assim que os pedidos entrarem, mostramos aqui os produtos mais vendidos pelo seu código.
                </div>
              ) : topProducts.map((product: any, index: number) => (
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
    </div>
  );
};
