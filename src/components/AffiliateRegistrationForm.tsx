import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/authContext';
import { CheckCircle2, LoaderCircle, X } from 'lucide-react';

export const AffiliateRegistrationForm = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', whatsapp: '', spam_check: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const suggestedRefCode = useMemo(() => {
    const base = String(formData.name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toUpperCase()
      .slice(0, 10);

    return base ? `${base}10` : 'SEUNOME10';
  }, [formData.name]);

  const normalizedWhatsapp = String(formData.whatsapp || '').replace(/\D/g, '').slice(0, 11);

  const buildFriendlyError = (message?: string) => {
    const normalized = String(message || '').toLowerCase();
    if (normalized.includes('código de afiliado já está em uso') || normalized.includes('codigo de afiliado ja esta em uso')) {
      return 'Já existe um código parecido em uso, mas não se preocupe: você pode tentar novamente e o sistema vai gerar outro automaticamente.';
    }
    if (normalized.includes('e-mail já está cadastrado') || normalized.includes('e-mail ja esta cadastrado')) {
      return 'Este e-mail já possui cadastro no programa de afiliados. Faça login com ele para acompanhar seu acesso.';
    }
    return message || 'Não foi possível enviar sua solicitação agora.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!user?.email) {
      setStatus({ type: 'error', message: 'Faça login com seu e-mail antes de solicitar participação no programa.' });
      return;
    }

    if (normalizedWhatsapp.length < 10) {
      setStatus({ type: 'error', message: 'Informe um WhatsApp válido com DDD para receber contato e aprovação.' });
      return;
    }

    // Anti-spam check
    if (formData.spam_check !== '5') {
      setStatus({ type: 'error', message: 'Confirme a verificação rápida respondendo corretamente quanto é 2 + 3.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          whatsapp: normalizedWhatsapp,
          email: user?.email,
          commission_rate: 10,
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setStatus({ type: 'error', message: buildFriendlyError(error.error) });
        return;
      }

      setStatus({ type: 'success', message: 'Solicitação enviada com sucesso. Seu cadastro entrou em análise e o retorno será enviado para seu e-mail.' });
      setFormData({ name: '', whatsapp: '', spam_check: '' });
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
            Preencha apenas os dados essenciais para análise. O sistema gera automaticamente seu código de afiliado e, se aprovado, você recebe acesso ao painel e aos links de divulgação.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-orange mb-1">E-mail da conta</p>
          <p className="text-sm font-semibold text-gray-700 break-all">{user?.email || 'Faça login para continuar'}</p>
          <p className="text-xs text-gray-500 mt-2">A aprovação e os avisos do programa serão enviados para esse e-mail.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Nome completo</span>
            <input
              placeholder="Ex.: Josemar Henrique Carvalho"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">WhatsApp com DDD</span>
            <input
              placeholder="Ex.: 22997618207"
              inputMode="numeric"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
            />
            <p className="mt-2 text-xs text-gray-500">Esse número será usado para contato e orientações iniciais do programa.</p>
          </label>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Código de afiliado gerado automaticamente</span>
            <p className="text-base font-black tracking-wide text-brand-black uppercase">{suggestedRefCode}</p>
            <p className="mt-2 text-xs text-gray-500">Seu código será gerado com base no seu nome e ajustado automaticamente se já existir outro parecido.</p>
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Verificação rápida</span>
            <input
              placeholder="Quanto é 2 + 3?"
              inputMode="numeric"
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200"
              required
              value={formData.spam_check}
              onChange={e => setFormData({ ...formData, spam_check: e.target.value })}
            />
          </label>

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
