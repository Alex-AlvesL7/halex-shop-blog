import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

export const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/affiliates')
      .then(res => res.json())
      .then(data => setAffiliates(data));
  }, []);

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/admin/affiliates/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setAffiliates(affiliates.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Solicitações de Afiliados</h2>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {affiliates.map(a => (
          <div key={a.id} className="p-4 border-b flex justify-between items-center">
            <div>
              <p className="font-bold">{a.name}</p>
              <p className="text-sm text-gray-600">{a.email} - {a.whatsapp}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(a.id, 'approved')} className="bg-green-600 text-white p-2 rounded-full"><Check size={18} /></button>
              <button onClick={() => handleApprove(a.id, 'rejected')} className="bg-red-600 text-white p-2 rounded-full"><X size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
