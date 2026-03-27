import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Edit2, Plus, Save, TrendingUp, UserPlus, Users, Wallet, X } from 'lucide-react';
import { Product } from '../types';

type AffiliateInsight = {
  ref_code: string;
  shareLinks?: {
    home?: string;
    store?: string;
  };
  stats?: {
    grossSales?: number;
    paidCommission?: number;
    pendingCommission?: number;
    totalOrders?: number;
    averageTicket?: number;
    availableToWithdraw?: number;
    approvedOrders?: number;
    pendingOrders?: number;
  };
  topProducts?: Array<{ name: string; revenue: number; quantity: number }>;
};

export const AffiliatesManagement = ({ affiliates, products, onRefresh }: { affiliates: any[], products: Product[], onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'payouts'>('list');
  const [newAffiliate, setNewAffiliate] = useState({ name: '', email: '', whatsapp: '', ref_code: '', commission_rate: 10 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '', whatsapp: '', commission_rate: 10 });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [pendingAffiliates, setPendingAffiliates] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [affiliateInsights, setAffiliateInsights] = useState<Record<string, AffiliateInsight>>({});
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadPendingAffiliates = async () => {
    setLoadingPending(true);
    try {
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      setPendingAffiliates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar afiliados pendentes:', error);
      setPendingAffiliates([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const response = await fetch('/api/admin/affiliate-payouts');
      const data = await response.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar saques:', error);
      setPayouts([]);
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payouts') {
      loadPayouts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'list') {
      loadPendingAffiliates();
    }
  }, [activeTab]);

  const approvedAffiliates = affiliates.filter((affiliate) => String(affiliate.status || 'approved') === 'approved');
  const rejectedAffiliates = affiliates.filter((affiliate) => String(affiliate.status || '') === 'rejected');

  const loadAffiliateInsights = async () => {
    if (approvedAffiliates.length === 0) {
      setAffiliateInsights({});
      return;
    }

    setLoadingInsights(true);
    try {
      const results = await Promise.all(
        approvedAffiliates.map(async (affiliate) => {
          try {
            const response = await fetch(`/api/affiliates/${encodeURIComponent(affiliate.ref_code)}`);
            if (!response.ok) throw new Error('Falha ao carregar insight do afiliado');
            const data = await response.json();
            return [affiliate.ref_code, data] as const;
          } catch (error) {
            console.error(`Erro ao carregar insight do afiliado ${affiliate.ref_code}:`, error);
            return [affiliate.ref_code, null] as const;
          }
        }),
      );

      setAffiliateInsights(
        results.reduce<Record<string, AffiliateInsight>>((acc, [refCode, data]) => {
          if (data) acc[refCode] = data;
          return acc;
        }, {}),
      );
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      loadAffiliateInsights();
    }
  }, [activeTab, affiliates, products]);

  const affiliateControlSummary = useMemo(() => {
    return approvedAffiliates.reduce(
      (acc, affiliate) => {
        const insight = affiliateInsights[affiliate.ref_code];
        acc.approved += 1;
        acc.grossSales += Number(insight?.stats?.grossSales || 0);
        acc.paidCommission += Number(insight?.stats?.paidCommission || 0);
        acc.orders += Number(insight?.stats?.totalOrders || 0);
        return acc;
      },
      { approved: 0, grossSales: 0, paidCommission: 0, orders: 0 },
    );
  }, [affiliateInsights, approvedAffiliates]);

  const handleAddAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAffiliate.commission_rate < 1 || newAffiliate.commission_rate > 100) {
      alert('A comissão deve estar entre 1 e 100.');
      return;
    }
    const response = await fetch('/api/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAffiliate)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      alert(`Erro ao criar afiliado: ${errorData.error}`);
      return;
    }

    alert(`Afiliado ${newAffiliate.name} criado com sucesso!`);
    setNewAffiliate({ name: '', email: '', whatsapp: '', ref_code: '', commission_rate: 10 });
    onRefresh();
    setActiveTab('list');
  };

  const handleUpdateAffiliate = async (id: string) => {
    if (editData.commission_rate < 1 || editData.commission_rate > 100) {
      alert('A comissão deve estar entre 1 e 100.');
      return;
    }
    const response = await fetch(`/api/affiliates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    
    if (!response.ok) {
      alert('Erro ao atualizar afiliado');
      return;
    }
    setEditingId(null);
    onRefresh();
  };

  const handleUpdatePayout = async (id: string, status: 'processing' | 'paid' | 'rejected') => {
    const admin_note = window.prompt('Observação do admin (opcional):', '') || '';
    const response = await fetch(`/api/admin/affiliate-payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_note })
    });

    if (!response.ok) {
      alert('Erro ao atualizar saque');
      return;
    }

    loadPayouts();
  };

  const handleModerateAffiliate = async (id: string, status: 'approved' | 'rejected') => {
    const response = await fetch(`/api/admin/affiliates/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      alert(`Erro ao atualizar afiliado: ${errorData.error || 'falha na aprovação'}`);
      return;
    }

    await onRefresh();
    loadPendingAffiliates();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >
          <Users size={18} /> Afiliados
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >
          <UserPlus size={18} /> Novo Afiliado
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'payouts' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >
          <Wallet size={18} /> Saques
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleAddAffiliate} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-2xl font-bold">Cadastrar Novo Afiliado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input placeholder="Nome" className="p-4 bg-gray-50 rounded-xl border border-gray-100" value={newAffiliate.name} onChange={e => setNewAffiliate({...newAffiliate, name: e.target.value})} required />
            <input placeholder="Email" type="email" className="p-4 bg-gray-50 rounded-xl border border-gray-100" value={newAffiliate.email} onChange={e => setNewAffiliate({...newAffiliate, email: e.target.value})} required />
            <input placeholder="WhatsApp" type="tel" className="p-4 bg-gray-50 rounded-xl border border-gray-100" value={newAffiliate.whatsapp} onChange={e => setNewAffiliate({...newAffiliate, whatsapp: e.target.value})} required />
            <input placeholder="Código de Referência" className="p-4 bg-gray-50 rounded-xl border border-gray-100" value={newAffiliate.ref_code} onChange={e => setNewAffiliate({...newAffiliate, ref_code: e.target.value})} required />
            <input placeholder="Comissão (%)" type="number" className="p-4 bg-gray-50 rounded-xl border border-gray-100" value={newAffiliate.commission_rate} onChange={e => setNewAffiliate({...newAffiliate, commission_rate: Number(e.target.value)})} required />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 px-8 py-3"><Plus size={20} /> Salvar Afiliado</button>
        </form>
      ) : activeTab === 'payouts' ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold">Solicitações de saque</h3>
              <p className="text-sm text-gray-500 mt-1">Gerencie pedidos de repasse, marque como pago e acompanhe o histórico.</p>
            </div>
            <button onClick={loadPayouts} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
              Atualizar
            </button>
          </div>

          {loadingPayouts ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Carregando solicitações...</div>
          ) : payouts.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Nenhuma solicitação de saque encontrada.</div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="font-bold text-lg text-gray-900">{payout.affiliate_name || 'Afiliado'}</p>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${payout.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payout.status === 'processing' ? 'bg-sky-50 text-sky-700' : payout.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                          {payout.status === 'paid' ? 'Pago' : payout.status === 'processing' ? 'Em análise' : payout.status === 'rejected' ? 'Rejeitado' : 'Solicitado'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{payout.affiliate_email} • Ref: {payout.affiliate_ref_code || '—'}</p>
                      <p className="text-sm text-gray-500 mt-2">Pix ({payout.pix_key_type || 'pix'}): <span className="font-semibold text-gray-700">{payout.pix_key || '—'}</span></p>
                      {payout.note && <p className="text-sm text-gray-500 mt-2">Obs. afiliado: {payout.note}</p>}
                      {payout.admin_note && <p className="text-sm text-gray-500 mt-1">Obs. admin: {payout.admin_note}</p>}
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-black mb-1">Valor</p>
                        <p className="text-2xl font-black text-brand-orange">R$ {Number(payout.amount || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">Solicitado em {new Date(payout.requested_at || payout.created_at || Date.now()).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleUpdatePayout(payout.id, 'processing')} className="px-3 py-2 rounded-xl bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest hover:bg-sky-200 transition-colors">
                          Em análise
                        </button>
                        <button onClick={() => handleUpdatePayout(payout.id, 'paid')} className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-colors">
                          Marcar pago
                        </button>
                        <button onClick={() => handleUpdatePayout(payout.id, 'rejected')} className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-colors">
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Solicitações pendentes</h3>
                  <p className="text-sm text-gray-500 mt-1">Afiliados novos entram como pendentes até você aprovar ou rejeitar.</p>
                </div>
                <button onClick={loadPendingAffiliates} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                  Atualizar pendências
                </button>
              </div>

              {loadingPending ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Carregando solicitações pendentes...</div>
              ) : pendingAffiliates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">Nenhum afiliado pendente no momento.</div>
              ) : (
                <div className="space-y-4 mb-8">
                  {pendingAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-bold text-lg text-gray-900">{affiliate.name}</p>
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">Pendente</span>
                          </div>
                          <p className="text-sm text-gray-500">{affiliate.email} • <span className="font-medium text-gray-700">WhatsApp:</span> {affiliate.whatsapp || '—'} • <span className="font-medium text-gray-700">Ref:</span> {affiliate.ref_code}</p>
                          <p className="text-sm text-gray-500 mt-2">Comissão inicial: <span className="font-bold text-brand-orange">{affiliate.commission_rate}%</span></p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleModerateAffiliate(affiliate.id, 'approved')} className="px-4 py-3 rounded-xl bg-green-600 text-white text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-colors">
                            Aprovar afiliado
                          </button>
                          <button onClick={() => handleModerateAffiliate(affiliate.id, 'rejected')} className="px-4 py-3 rounded-xl bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-widest hover:bg-rose-200 transition-colors">
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Afiliados aprovados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 mb-3"><Users size={18} className="text-brand-orange" /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Afiliados ativos</p></div>
                  <p className="text-2xl font-black text-brand-black">{affiliateControlSummary.approved}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 mb-3"><TrendingUp size={18} className="text-brand-orange" /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Vendas geradas</p></div>
                  <p className="text-2xl font-black text-brand-black">R$ {affiliateControlSummary.grossSales.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 mb-3"><Wallet size={18} className="text-brand-orange" /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Comissão aprovada</p></div>
                  <p className="text-2xl font-black text-brand-black">R$ {affiliateControlSummary.paidCommission.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3 mb-3"><BarChart3 size={18} className="text-brand-orange" /><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Pedidos atribuídos</p></div>
                  <p className="text-2xl font-black text-brand-black">{affiliateControlSummary.orders}</p>
                </div>
              </div>

              <div className="space-y-4">
            {approvedAffiliates.map(a => (
              <div key={a.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                {editingId === a.id ? (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="grid grid-cols-2 gap-3">
                      <input className="p-2 rounded-lg border" placeholder="Nome" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                      <input className="p-2 rounded-lg border" placeholder="Email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                      <input className="p-2 rounded-lg border" placeholder="WhatsApp" value={editData.whatsapp} onChange={e => setEditData({...editData, whatsapp: e.target.value})} />
                      <input type="number" className="p-2 rounded-lg border" placeholder="Comissão (%)" value={editData.commission_rate} onChange={e => setEditData({...editData, commission_rate: Number(e.target.value)})} />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdateAffiliate(a.id)} className="bg-green-500 text-white p-2 rounded-lg flex-1 flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
                      <button onClick={() => setEditingId(null)} className="bg-red-500 text-white p-2 rounded-lg flex-1 flex items-center justify-center gap-2"><X size={18} /> Cancelar</button>
                    </div>
                  </div>
                ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-lg">{a.name}</p>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">Aprovado</span>
                            <span className="px-3 py-1 rounded-full bg-white text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-200">Ref {a.ref_code}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{a.email} • <span className="font-medium text-gray-700">WhatsApp:</span> {a.whatsapp}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="font-bold text-xl text-brand-orange">{a.commission_rate}%</p>
                          <button onClick={() => { setEditingId(a.id); setEditData({ name: a.name, email: a.email, whatsapp: a.whatsapp, commission_rate: a.commission_rate }); }} className="text-gray-400 hover:text-brand-orange transition-colors">
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const insight = affiliateInsights[a.ref_code];
                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Vendas</p>
                                <p className="text-lg font-black text-brand-black">R$ {Number(insight?.stats?.grossSales || 0).toFixed(2)}</p>
                              </div>
                              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Comissão paga</p>
                                <p className="text-lg font-black text-brand-black">R$ {Number(insight?.stats?.paidCommission || 0).toFixed(2)}</p>
                              </div>
                              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Pedidos</p>
                                <p className="text-lg font-black text-brand-black">{Number(insight?.stats?.totalOrders || 0)}</p>
                              </div>
                              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Ticket médio</p>
                                <p className="text-lg font-black text-brand-black">R$ {Number(insight?.stats?.averageTicket || 0).toFixed(2)}</p>
                              </div>
                              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Disponível p/ saque</p>
                                <p className="text-lg font-black text-brand-black">R$ {Number(insight?.stats?.availableToWithdraw || 0).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              <div className="rounded-2xl bg-white border border-gray-100 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Resumo operacional</p>
                                    <p className="text-sm text-gray-500 mt-1">Visão do que já foi vendido, aprovado e ainda está pendente.</p>
                                  </div>
                                  <button onClick={loadAffiliateInsights} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                    {loadingInsights ? 'Atualizando...' : 'Atualizar dados'}
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Pedidos aprovados</p>
                                    <p className="text-lg font-black text-brand-black">{Number(insight?.stats?.approvedOrders || 0)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Pedidos pendentes</p>
                                    <p className="text-lg font-black text-brand-black">{Number(insight?.stats?.pendingOrders || 0)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Comissão pendente</p>
                                    <p className="text-lg font-black text-brand-black">R$ {Number(insight?.stats?.pendingCommission || 0).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-brand-black px-5 py-4 text-white">
                                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-black mb-2">Leitura rápida</p>
                                <div className="space-y-3 text-sm text-gray-300">
                                  <p>{loadingInsights ? 'Atualizando visão financeira do afiliado...' : `Vendas totais: R$ ${Number(insight?.stats?.grossSales || 0).toFixed(2)}`}</p>
                                  <p>{`Comissão aprovada: R$ ${Number(insight?.stats?.paidCommission || 0).toFixed(2)}`}</p>
                                  <p>{`Disponível para saque: R$ ${Number(insight?.stats?.availableToWithdraw || 0).toFixed(2)}`}</p>
                                  <p>{`Ticket médio: R$ ${Number(insight?.stats?.averageTicket || 0).toFixed(2)}`}</p>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                )}
              </div>
            ))}
              {approvedAffiliates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">Nenhum afiliado aprovado ainda.</div>
              )}
              </div>
            </div>

            {rejectedAffiliates.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-6">Afiliados rejeitados</h3>
                <div className="space-y-4">
                  {rejectedAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="flex justify-between items-center p-5 bg-rose-50 rounded-2xl border border-rose-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-lg">{affiliate.name}</p>
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">Rejeitado</span>
                        </div>
                        <p className="text-sm text-gray-500">{affiliate.email} • <span className="font-medium text-gray-700">WhatsApp:</span> {affiliate.whatsapp || '—'} • <span className="font-medium text-gray-700">Ref:</span> {affiliate.ref_code}</p>
                      </div>
                      <button onClick={() => handleModerateAffiliate(affiliate.id, 'approved')} className="px-4 py-3 rounded-xl bg-brand-black text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                        Aprovar agora
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
