import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { generateSalesQuizRecommendation, SalesQuizProfile } from '../services/geminiService';
import { Product } from '../types';
import { getMonthlyPlanWhatsAppLink } from '../utils/commerce';
import { formatPriceBRL, getProductMarketingSummary, hasProductPromotion } from '../utils/productContent';

export const TipsPage = ({
  products,
  onProductClick,
  onAddToCart,
}: {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'emagrecimento',
    weight: 70,
    height: 170,
    age: 30,
    gender: 'feminino',
    activityLevel: 'moderado',
    restrictions: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [leadSaved, setLeadSaved] = useState(false);

  const truncateText = (value: string, maxLength: number) => {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Preencha nome, e-mail e WhatsApp para receber sua recomendação personalizada.');
      return;
    }

    setLoading(true);
    try {
      const profile: SalesQuizProfile = {
        name: form.name.trim(),
        goal: form.goal,
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age),
        gender: form.gender,
        activityLevel: form.activityLevel,
        restrictions: form.restrictions.trim(),
      };

      const recommendation = await generateSalesQuizRecommendation(profile, products);
      const primaryProduct = products.find((product) => product.id === recommendation.primaryProductId) || null;
      const secondaryProduct = recommendation.secondaryProductId
        ? products.find((product) => product.id === recommendation.secondaryProductId) || null
        : null;

      setResult({ ...recommendation, primaryProduct, secondaryProduct });

      const leadResponse = await fetch('/api/quiz-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          goal: form.goal,
          weight: form.weight,
          height: form.height,
          age: form.age,
          gender: form.gender,
          activity_level: form.activityLevel,
          restrictions: form.restrictions,
          recommended_product_id: recommendation.primaryProductId,
          metadata: {
            secondary_product_id: recommendation.secondaryProductId || null,
            summary: recommendation.summary,
            cta: recommendation.cta,
            meal_plan: recommendation.mealPlan,
            workout_plan: recommendation.workoutPlan,
            weekly_routine: recommendation.weeklyRoutine,
            monthly_plan_offer: recommendation.monthlyPlanOffer,
            monthly_plan_pitch: recommendation.monthlyPlanPitch,
          },
        }),
      });

      setLeadSaved(leadResponse.ok);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black mb-4 uppercase">Análise Inteligente L7</h1>
        <p className="text-gray-500 text-lg">Receba uma recomendação mais alinhada ao seu perfil, objetivo e rotina.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-8 xl:gap-12 items-start">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 xl:sticky xl:top-28">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Nome</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="Seu nome completo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail</label>
                <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="voce@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">WhatsApp</label>
                <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Seu Objetivo</label>
            <select value={form.goal} onChange={(e) => handleChange('goal', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium">
              <option value="emagrecimento">Emagrecimento</option>
              <option value="hipertrofia">Hipertrofia (Ganho de Massa)</option>
              <option value="performance">Performance Atlética</option>
              <option value="saude">Saúde e Bem-estar</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Peso (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => handleChange('weight', Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Altura (cm)</label>
              <input type="number" value={form.height} onChange={(e) => handleChange('height', Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Idade</label>
              <input type="number" value={form.age} onChange={(e) => handleChange('age', Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Sexo</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium">
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Nível de atividade</label>
            <select value={form.activityLevel} onChange={(e) => handleChange('activityLevel', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium">
              <option value="baixo">Baixo</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Restrições / Observações</label>
            <textarea value={form.restrictions} onChange={(e) => handleChange('restrictions', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-orange outline-none font-medium min-h-[96px] resize-y" placeholder="Ex: sensível à cafeína, rotina corrida, treina à noite..." />
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full btn-primary py-4 text-lg disabled:opacity-50">
            {loading ? 'Analisando seu perfil...' : 'Receber minha recomendação'}
          </button>

          {leadSaved && <div className="text-xs text-green-600 font-bold bg-green-50 border border-green-100 rounded-2xl px-4 py-3">Seus dados foram recebidos com sucesso. Sua recomendação já está disponível.</div>}
        </div>

        <div className="space-y-6 min-w-0">
          {result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-brand-black p-6 rounded-3xl text-white">
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-3">Sua recomendação inicial</p>
                <h3 className="text-2xl font-black mb-3">{result.primaryProduct?.name || 'Produto recomendado'}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                <p className="text-brand-orange text-sm font-bold mt-4">{result.leadHook}</p>
              </div>

              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <h3 className="font-bold text-brand-orange uppercase text-xs tracking-widest mb-4">Ajustes de alimentação</h3>
                <ul className="space-y-3">
                  {result.dietTips.map((tip: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-brand-orange font-bold">•</span> {tip}</li>)}
                </ul>
              </div>

              <div className="bg-gray-900 p-6 rounded-3xl text-white">
                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest mb-4">Direção de treino</h3>
                <ul className="space-y-3">
                  {result.trainingTips.map((tip: string, i: number) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-brand-orange font-bold">•</span> {tip}</li>)}
                </ul>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Sugestão de cardápio base</h3>
                  <ul className="space-y-3">{result.mealPlan.map((item: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-brand-orange font-bold">•</span> {item}</li>)}</ul>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Sugestão de treino inicial</h3>
                  <ul className="space-y-3">{result.workoutPlan.map((item: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-brand-orange font-bold">•</span> {item}</li>)}</ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Sugestão de rotina semanal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{result.weeklyRoutine.map((item: string, i: number) => <div key={i} className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700 leading-relaxed">{item}</div>)}</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Por que esta sugestão combina com você</h3>
                <ul className="space-y-3">{result.whyItMatches.map((item: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-brand-orange font-bold">•</span> {item}</li>)}</ul>
              </div>

              {result.primaryProduct && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Produto mais indicado para você</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img src={result.primaryProduct.image} alt={result.primaryProduct.name} className="w-full sm:w-28 h-48 sm:h-28 rounded-2xl object-cover bg-gray-50" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg mb-1 leading-tight">{result.primaryProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{getProductMarketingSummary(result.primaryProduct).summary}</p>
                      <p className="text-xs text-gray-500 mb-1 leading-relaxed"><span className="font-bold text-gray-700">Para que serve:</span> {truncateText(getProductMarketingSummary(result.primaryProduct).purpose, 180)}</p>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed"><span className="font-bold text-gray-700">Composição:</span> {truncateText(getProductMarketingSummary(result.primaryProduct).composition, 180)}</p>
                      {result.primaryProduct.promotionLabel && <span className="inline-flex mb-3 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-orange-100">{result.primaryProduct.promotionLabel}</span>}
                      {hasProductPromotion(result.primaryProduct) && <div className="flex items-center gap-2 mb-1"><span className="text-xs text-gray-400 line-through">{formatPriceBRL(result.primaryProduct.compareAtPrice)}</span><span className="px-2 py-1 rounded-full bg-brand-black text-white text-[10px] font-black uppercase tracking-widest">-{result.primaryProduct.discountPercentage}%</span></div>}
                      <p className="text-2xl font-black text-brand-orange mb-4">{formatPriceBRL(result.primaryProduct.price)}</p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <button onClick={() => onProductClick(result.primaryProduct)} className="btn-secondary text-sm w-full sm:w-auto">Ver detalhes</button>
                        <button onClick={() => onAddToCart(result.primaryProduct)} className="btn-primary text-sm w-full sm:w-auto">Comprar agora</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.secondaryProduct && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Complemento opcional</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <img src={result.secondaryProduct.image} alt={result.secondaryProduct.name} className="w-full sm:w-24 h-44 sm:h-24 rounded-2xl object-cover bg-gray-50" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base mb-1 leading-tight">{result.secondaryProduct.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{getProductMarketingSummary(result.secondaryProduct).summary}</p>
                      <p className="text-xs text-gray-500 mb-1 leading-relaxed"><span className="font-bold text-gray-700">Para que serve:</span> {truncateText(getProductMarketingSummary(result.secondaryProduct).purpose, 160)}</p>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed"><span className="font-bold text-gray-700">Composição:</span> {truncateText(getProductMarketingSummary(result.secondaryProduct).composition, 160)}</p>
                      {result.secondaryProduct.promotionLabel && <span className="inline-flex mb-2 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-orange-100">{result.secondaryProduct.promotionLabel}</span>}
                      {hasProductPromotion(result.secondaryProduct) && <div className="flex items-center gap-2 mb-1"><span className="text-xs text-gray-400 line-through">{formatPriceBRL(result.secondaryProduct.compareAtPrice)}</span><span className="px-2 py-1 rounded-full bg-brand-black text-white text-[10px] font-black uppercase tracking-widest">-{result.secondaryProduct.discountPercentage}%</span></div>}
                      <p className="text-lg font-black text-brand-orange mb-3">{formatPriceBRL(result.secondaryProduct.price)}</p>
                      <button onClick={() => onAddToCart(result.secondaryProduct)} className="btn-primary text-sm w-full sm:w-auto">Incluir no pedido</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <h3 className="font-bold text-brand-orange uppercase text-xs tracking-widest mb-4">Próximo passo</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{result.cta}</p>
                {result.primaryProduct && <button onClick={() => onAddToCart(result.primaryProduct)} className="btn-primary w-full py-4 text-base">Escolher este produto</button>}
              </div>

              <div className="bg-brand-black p-6 rounded-3xl text-white border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-3">Acompanhamento premium</p>
                <h3 className="text-2xl font-black mb-3">Plano mensal de acompanhamento</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{result.monthlyPlanOffer}</p>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{result.monthlyPlanPitch}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">{['Ajustes semanais', 'Direcionamento alimentar', 'Suporte e rotina de treino'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">{item}</div>)}</div>
                <a href={getMonthlyPlanWhatsAppLink(form.phone, result)} target="_blank" rel="noreferrer" className="btn-primary w-full py-4 text-base text-center inline-flex items-center justify-center">Falar sobre o plano mensal</a>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Search className="text-gray-300" /></div>
              <p className="text-gray-400 text-sm mb-2">Preencha seus dados para receber uma recomendação de produto da loja com apoio da IA.</p>
              <p className="text-xs text-gray-300">Quanto mais completo o perfil, mais precisa tende a ser a recomendação inicial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
