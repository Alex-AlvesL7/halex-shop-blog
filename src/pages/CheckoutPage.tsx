import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, CreditCard, Mail, MapPin, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { FreteOption } from '../services/melhorEnvioService';
import { brazilStates, CheckoutFormData } from '../utils/commerce';

export const CheckoutPage = ({
  cart,
  selectedFrete,
  formData,
  onFieldChange,
  onBack,
  onSubmit,
  isProcessing,
}: {
  cart: CartItem[];
  selectedFrete: FreteOption | null;
  formData: CheckoutFormData;
  onFieldChange: (field: keyof CheckoutFormData, value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
}) => {
  const [cepLoading, setCepLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (!data.erro) {
        if (!formData.street) onFieldChange('street', data.logradouro || '');
        if (!formData.neighborhood) onFieldChange('neighborhood', data.bairro || '');
        if (!formData.city) onFieldChange('city', data.localidade || '');
        if (!formData.state) onFieldChange('state', data.uf || '');
      }
    } catch (error) {
      console.warn('Falha ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  const freteValue = selectedFrete?.value ?? (Number.parseFloat(String((selectedFrete as any)?.custom_price ?? (selectedFrete as any)?.price ?? '0')) || 0);
  const productsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = productsTotal + freteValue;
  const pageClasses = 'min-h-screen bg-[#f8f8f8] text-brand-black';
  const heroCardClasses = 'bg-white border border-gray-100 shadow-sm';
  const sectionCardClasses = 'bg-white border border-gray-100 shadow-sm';
  const inputClasses = 'w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-brand-orange focus:outline-none';
  const mutedTextClasses = 'text-gray-500';
  const labelClasses = 'text-sm font-bold text-gray-700 mb-2 block';
  const titleClasses = 'text-brand-black';

  return (
    <div className={pageClasses}>
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className={`mb-8 rounded-[28px] px-5 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4 flex-wrap ${heroCardClasses}`}>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 hover:border-brand-orange hover:text-brand-orange transition-colors"><ArrowLeft size={18} /> Voltar ao carrinho</button>
            <button onClick={onBack} className="text-2xl font-display font-black tracking-tighter text-brand-black hover:text-brand-orange transition-colors">HALEX<span className="text-brand-orange">SHOP</span></button>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] mb-4 text-gray-400"><span>Contato</span><ChevronRight size={14} /><span>Entrega</span><ChevronRight size={14} /><span>Pagamento</span></div>
            <h1 className={`text-4xl font-black uppercase ${titleClasses}`}>Checkout</h1>
            <p className={`mt-2 ${mutedTextClasses}`}>Preencha seus dados completos para envio antes de seguir para a InfinitePay.</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className={`rounded-[32px] p-10 text-center ${sectionCardClasses}`}><ShoppingBag size={56} className="mx-auto mb-4 text-gray-200" /><h2 className={`text-2xl font-black mb-2 ${titleClasses}`}>Seu carrinho está vazio</h2><p className={`${mutedTextClasses} mb-6`}>Adicione produtos ao carrinho para continuar com o checkout.</p><button onClick={onBack} className="btn-primary px-8 py-3">Voltar</button></div>
        ) : (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
            <div className="space-y-6">
              <div className={`rounded-[32px] p-8 ${sectionCardClasses}`}>
                <div className="flex items-center gap-3 mb-6"><Mail className="text-brand-orange" size={24} /><div><h2 className={`text-2xl font-black ${titleClasses}`}>Dados de contato</h2><p className={`text-sm ${mutedTextClasses}`}>Esses dados serão salvos junto ao pedido para contato posterior.</p></div></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block md:col-span-2"><span className={labelClasses}>Nome completo</span><input value={formData.name} onChange={(e) => onFieldChange('name', e.target.value)} className={inputClasses} placeholder="Digite seu nome completo" /></label>
                  <label className="block"><span className={labelClasses}>E-mail</span><input type="email" value={formData.email} onChange={(e) => onFieldChange('email', e.target.value)} className={inputClasses} placeholder="seunome@provedor.com" /></label>
                  <label className="block"><span className={labelClasses}>Telefone / WhatsApp</span><input value={formData.phone} onChange={(e) => onFieldChange('phone', formatPhone(e.target.value))} className={inputClasses} placeholder="(00) 00000-0000" /></label>
                  <label className="block md:col-span-2"><span className={labelClasses}>CPF</span><input value={formData.document} onChange={(e) => onFieldChange('document', formatDocument(e.target.value))} className={inputClasses} placeholder="000.000.000-00" /></label>
                </div>
              </div>

              <div className={`rounded-[32px] p-8 ${sectionCardClasses}`}>
                <div className="flex items-center gap-3 mb-6"><MapPin className="text-brand-orange" size={24} /><div><h2 className={`text-2xl font-black ${titleClasses}`}>Endereço de entrega</h2><p className={`text-sm ${mutedTextClasses}`}>Entrega somente no Brasil. O CEP pode preencher parte do endereço automaticamente.</p></div></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block"><span className={labelClasses}>CEP</span><input value={formData.cep} onChange={(e) => onFieldChange('cep', formatCep(e.target.value))} onBlur={handleCepBlur} className={inputClasses} placeholder="00000-000" /><span className="text-xs mt-2 block text-gray-400">{cepLoading ? 'Buscando endereço pelo CEP...' : 'Somente endereços do Brasil'}</span></label>
                  <label className="block"><span className={labelClasses}>País</span><input value="Brasil" disabled className="w-full px-4 py-3 border-2 rounded-2xl border-gray-100 bg-gray-50 text-gray-500" /></label>
                  <label className="block md:col-span-2"><span className={labelClasses}>Rua / Logradouro</span><input value={formData.street} onChange={(e) => onFieldChange('street', e.target.value)} className={inputClasses} placeholder="Rua, avenida, travessa..." /></label>
                  <label className="block"><span className={labelClasses}>Número</span><input value={formData.number} onChange={(e) => onFieldChange('number', e.target.value)} className={inputClasses} placeholder="123" /></label>
                  <label className="block"><span className={labelClasses}>Complemento</span><input value={formData.complement} onChange={(e) => onFieldChange('complement', e.target.value)} className={inputClasses} placeholder="Apto, bloco, referência..." /></label>
                  <label className="block"><span className={labelClasses}>Bairro</span><input value={formData.neighborhood} onChange={(e) => onFieldChange('neighborhood', e.target.value)} className={inputClasses} placeholder="Seu bairro" /></label>
                  <label className="block"><span className={labelClasses}>Cidade</span><input value={formData.city} onChange={(e) => onFieldChange('city', e.target.value)} className={inputClasses} placeholder="Sua cidade" /></label>
                  <label className="block md:max-w-[180px]"><span className={labelClasses}>UF</span><select value={formData.state} onChange={(e) => onFieldChange('state', e.target.value)} className="w-full px-4 py-3 border-2 rounded-2xl focus:border-brand-orange focus:outline-none border-gray-200 bg-white"><option value="">Selecione</option>{brazilStates.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="rounded-[32px] p-8 shadow-2xl bg-brand-black text-white">
                <div className="flex items-center gap-3 mb-6"><CreditCard size={22} className="text-brand-orange" /><div><h2 className="text-2xl font-black">Resumo do pedido</h2><p className="text-sm text-gray-400">Confira seus dados antes de seguir para o pagamento.</p></div></div>
                <div className="space-y-4 pb-6 mb-6 border-b border-white/10">{cart.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 text-sm"><div><p className="font-bold">{item.quantity}x {item.name}</p><p className="text-xs text-gray-400">R$ {item.price.toFixed(2)} cada</p></div><span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span></div>)}</div>
                <div className="space-y-3 text-sm pb-6 mb-6 border-b border-white/10"><div className="flex items-center justify-between"><span className="text-gray-400">Subtotal</span><span>R$ {productsTotal.toFixed(2)}</span></div><div className="flex items-center justify-between"><div><p className="text-gray-400">Frete</p>{selectedFrete && <p className="text-xs text-gray-500">{selectedFrete.carrier?.name || selectedFrete.company?.name} {selectedFrete.name}</p>}</div><span>R$ {freteValue.toFixed(2)}</span></div></div>
                <div className="flex items-center justify-between mb-6"><span className="text-lg font-bold">Total</span><span className="text-3xl font-black text-brand-orange">R$ {total.toFixed(2)}</span></div>
                <button onClick={onSubmit} disabled={isProcessing || !selectedFrete} className={`w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 ${(isProcessing || !selectedFrete) ? 'opacity-70 cursor-not-allowed' : ''}`}>{isProcessing ? 'Processando...' : 'Ir para pagamento'}</button>
                <div className="mt-4 text-xs leading-relaxed text-gray-400">Seus dados de contato e entrega serão vinculados ao pedido e poderão ser consultados depois no painel administrativo.</div>
              </div>

              {selectedFrete && <div className={`rounded-[28px] p-6 ${sectionCardClasses}`}><p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">Frete selecionado</p><p className={`font-black text-lg ${titleClasses}`}>{selectedFrete.carrier?.name || selectedFrete.company?.name} {selectedFrete.name}</p><p className="text-brand-orange font-black text-2xl mt-2">R$ {freteValue.toFixed(2)}</p><p className={`text-sm mt-1 ${mutedTextClasses}`}>Entrega estimada em {selectedFrete.delivery_time} dia(s).</p></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
