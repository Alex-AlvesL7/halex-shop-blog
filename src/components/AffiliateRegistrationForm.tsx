import React, { useState } from 'react';
import { CheckCircle2, LoaderCircle, X } from 'lucide-react';

export const AffiliateRegistrationForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', whatsapp: '', ref_code: '', spam_check: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Anti-spam check
    if (formData.spam_check !== '5') {
      setStatus({ type: 'error', message: 'Erro de verificação anti-spam. Responda corretamente para continuar.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ref_code: formData.ref_code.trim().toUpperCase().replace(/\s+/g, ''),
          commission_rate: 10,
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setStatus({ type: 'error', message: error.error || 'Não foi possível enviar sua solicitação agora.' });
        return;
      }

      setStatus({ type: 'success', message: 'Solicitação enviada com sucesso. Aguarde a aprovação por e-mail.' });
      setFormData({ name: '', email: '', whatsapp: '', ref_code: '', spam_check: '' });
      window.setTimeout(() => onClose(), 1600);
    } catch (error) {
      setStatus({ type: 'error', message: 'Falha de conexão. Tente novamente em instantes.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-[28px] w-full max-w-lg relative shadow-2xl border border-orange-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-brand-orange transition-colors"><X /></button>
        <div className="mb-6">
          <span className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange">Cadastro de afiliado</span>
          <h2 className="text-2xl font-black mt-4 mb-3 uppercase">Entre para o programa L7 Fitness</h2>
          <p className="text-sm text-gray-600 leading-7">
            Preencha os dados abaixo para análise. Se aprovado, você recebe seu link, entra no fluxo de divulgação e acompanha tudo no painel do afiliado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Nome completo"
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            placeholder="WhatsApp com DDD"
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
            value={formData.whatsapp}
            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
          />
          <div className="space-y-2">
            <input
              placeholder="Código de referência (ex: SEUNOME)"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
              value={formData.ref_code}
              onChange={e => setFormData({ ...formData, ref_code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
            />
            <p className="text-xs text-gray-500">Esse código será usado nos seus links e no rastreamento das vendas.</p>
          </div>
          <input
            placeholder="Quanto é 2 + 3?"
            className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
            required
            value={formData.spam_check}
            onChange={e => setFormData({ ...formData, spam_check: e.target.value })}
          />

          {status && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <div className="flex items-center gap-2">
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                <span>{status.message}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
            {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </form>
      </div>
    </div>
  );
};
