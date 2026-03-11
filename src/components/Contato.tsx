import React, { useState } from 'react';

export const Contato = () => {
  const [formData, setFormData] = useState({ nome: '', email: '', mensagem: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const response = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setFormData({ nome: '', email: '', mensagem: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Erro ao enviar' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Erro ao enviar' });
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Contato</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Nome" className="w-full p-3 border rounded-xl" required onChange={e => setFormData({...formData, nome: e.target.value})} value={formData.nome} />
        <input type="email" placeholder="E-mail" className="w-full p-3 border rounded-xl" required onChange={e => setFormData({...formData, email: e.target.value})} value={formData.email} />
        <textarea placeholder="Mensagem" className="w-full p-3 border rounded-xl" required onChange={e => setFormData({...formData, mensagem: e.target.value})} value={formData.mensagem} />
        <button type="submit" className="w-full bg-orange-600 text-white p-3 rounded-xl font-bold">Enviar</button>
      </form>
      {status && <p className={`mt-4 p-3 rounded-xl ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.message}</p>}
    </div>
  );
};
