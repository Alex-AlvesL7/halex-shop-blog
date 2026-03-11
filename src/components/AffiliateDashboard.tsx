import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

export const AffiliateDashboard = ({ refCode }: { refCode: string }) => {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/affiliates/${refCode}`)
      .then(res => res.json())
      .then(data => {
        setAffiliate(data);
        setLoading(false);
      });
  }, [refCode]);

  if (loading) return <div className="p-12 text-center">Carregando...</div>;
  if (!affiliate) return <div className="p-12 text-center text-red-500">Afiliado não encontrado.</div>;

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black mb-8 uppercase">Painel do Afiliado: {affiliate.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <DollarSign className="text-brand-orange" size={32} />
            <h3 className="text-xl font-bold">Comissão Total</h3>
          </div>
          <p className="text-4xl font-black">R$ {(affiliate.totalSales * (affiliate.commission_rate / 100)).toFixed(2)}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="text-brand-orange" size={32} />
            <h3 className="text-xl font-bold">Total em Vendas</h3>
          </div>
          <p className="text-4xl font-black">R$ {affiliate.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Users className="text-brand-orange" size={32} />
            <h3 className="text-xl font-bold">Seu Link</h3>
          </div>
          <p className="text-sm font-mono bg-gray-50 p-2 rounded-lg">{window.location.origin}/?ref={affiliate.ref_code}</p>
        </div>
      </div>
    </div>
  );
};
