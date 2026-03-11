import React, { useState } from 'react';
import { Plus, Edit2, Save, X, UserPlus, Users } from 'lucide-react';

export const AffiliatesManagement = ({ affiliates, onRefresh }: { affiliates: any[], onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [newAffiliate, setNewAffiliate] = useState({ name: '', email: '', whatsapp: '', ref_code: '', commission_rate: 10 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '', whatsapp: '', commission_rate: 10 });

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
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Afiliados Cadastrados</h3>
          <div className="space-y-4">
            {affiliates.map(a => (
              <div key={a.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
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
                  <div className="flex justify-between w-full items-center">
                    <div>
                      <p className="font-bold text-lg">{a.name}</p>
                      <p className="text-sm text-gray-500">{a.email} • <span className="font-medium text-gray-700">WhatsApp:</span> {a.whatsapp} • <span className="font-medium text-gray-700">Ref:</span> {a.ref_code}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-bold text-xl text-brand-orange">{a.commission_rate}%</p>
                      <button onClick={() => { setEditingId(a.id); setEditData({ name: a.name, email: a.email, whatsapp: a.whatsapp, commission_rate: a.commission_rate }); }} className="text-gray-400 hover:text-brand-orange transition-colors">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
