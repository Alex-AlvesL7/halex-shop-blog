import React, { useState } from 'react';
import { X } from 'lucide-react';

export const AffiliateRegistrationForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', ref_code: '', spam_check: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Anti-spam check
    if (formData.spam_check !== '5') {
      alert('Erro de verificação anti-spam. Por favor, responda corretamente.');
      return;
    }

    const response = await fetch('/api/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      alert(`Erro: ${error.error}`);
      return;
    }

    alert('Solicitação enviada com sucesso! Aguarde a aprovação por e-mail.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X /></button>
        <h2 className="text-2xl font-bold mb-4">Cadastro de Afiliado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Nome" className="w-full p-3 bg-gray-50 rounded-xl border" required onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="email" placeholder="E-mail" className="w-full p-3 bg-gray-50 rounded-xl border" required onChange={e => setFormData({...formData, email: e.target.value})} />
          <input placeholder="WhatsApp" className="w-full p-3 bg-gray-50 rounded-xl border" required onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          <input placeholder="Código de Referência (ex: SEUNOME)" className="w-full p-3 bg-gray-50 rounded-xl border" required onChange={e => setFormData({...formData, ref_code: e.target.value})} />
          <input placeholder="Quanto é 2 + 3? (Anti-spam)" className="w-full p-3 bg-gray-50 rounded-xl border" required onChange={e => setFormData({...formData, spam_check: e.target.value})} />
          <button type="submit" className="w-full bg-orange-600 text-white p-3 rounded-xl font-bold hover:bg-orange-700">Enviar Solicitação</button>
        </form>
      </div>
    </div>
  );
};
