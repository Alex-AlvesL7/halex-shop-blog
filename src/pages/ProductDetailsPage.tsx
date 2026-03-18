import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { Product } from '../types';
import { formatPriceBRL, getProductCompositionPanels, getProductDetailContent, getProductMarketingSummary, hasProductPromotion, normalizeProductText, toPlainProductCopy } from '../utils/productContent';

export const ProductDetailsPage: React.FC<{ product: Product, onAddToCart: (p: Product) => void, onBack: () => void, onNavigate: (page: string, options?: any) => void, onShowToast: (msg: string) => void }> = ({ product, onAddToCart, onBack, onNavigate, onShowToast }) => {
  const [activeImage, setActiveImage] = useState(product.image);
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number>(0);
  const slidesPaused = useRef(false);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compositionPanels = useMemo(() => getProductCompositionPanels(product), [product]);
  const allImages = [product.image, ...(product.images || [])];
  const marketing = useMemo(() => getProductMarketingSummary(product), [product]);
  const detailContent = useMemo(() => getProductDetailContent(product), [product]);
  const infoSlides = useMemo(() => [
    { title: 'Para que serve', content: detailContent.purpose },
    { title: 'Como usar', content: detailContent.usage },
    { title: 'O que vem no kit', content: detailContent.kitContents },
    { title: 'Composição', content: detailContent.composition },
    { title: 'Qtd / Cápsulas', content: detailContent.capsules },
  ].filter((slide) => String(slide.content || '').trim()), [detailContent]);
  const productBenefits = useMemo(() => {
    const source = normalizeProductText(`${product.name} ${product.description}`);
    const isKit = compositionPanels.length > 1;
    const hasCollagen = source.includes('colageno');

    return [
      {
        title: isKit ? 'Kit Inteligente' : 'Fórmula Premium',
        subtitle: isKit ? `${compositionPanels.length} ativos em uma única compra` : 'Seleção com foco em performance',
        icon: Sparkles,
        iconAccent: 'from-orange-500 via-amber-400 to-yellow-300',
        surfaceAccent: 'from-orange-50 via-white to-yellow-50',
      },
      {
        title: hasCollagen ? 'Cuidado Completo' : 'Qualidade Elite',
        subtitle: hasCollagen ? 'Emagrecimento com suporte extra para pele' : 'Rotina pensada para resultado com constância',
        icon: ShieldCheck,
        iconAccent: hasCollagen ? 'from-pink-500 via-rose-400 to-orange-300' : 'from-emerald-500 via-green-400 to-lime-300',
        surfaceAccent: hasCollagen ? 'from-pink-50 via-white to-rose-50' : 'from-emerald-50 via-white to-lime-50',
      },
      {
        title: 'Entrega Ágil',
        subtitle: 'Compra rápida para começar sua rotina sem demora',
        icon: Truck,
        iconAccent: 'from-sky-500 via-cyan-400 to-teal-300',
        surfaceAccent: 'from-sky-50 via-white to-cyan-50',
      },
    ];
  }, [compositionPanels, product.description, product.name]);

  useEffect(() => {
    setActiveImage(product.image);
    setActiveSlide(0);
  }, [product.id, product.image]);

  useEffect(() => {
    if (infoSlides.length <= 1) return;
    const interval = setInterval(() => {
      if (!slidesPaused.current) {
        setActiveSlide((prev) => (prev + 1) % infoSlides.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [infoSlides.length]);

  const pauseAutoPlay = () => {
    slidesPaused.current = true;
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => { slidesPaused.current = false; }, 8000);
  };

  return (
    <div className="pt-32 pb-40 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors mb-8 font-bold uppercase text-xs tracking-widest">
        <ChevronRight className="rotate-180" size={16} /> Voltar para a Loja
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <motion.div key={activeImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>

          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(img)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-brand-orange' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
          <span className="text-brand-orange font-bold uppercase text-xs tracking-widest mb-4">{product.category}</span>
          {product.promotionLabel && (
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="px-4 py-2 rounded-full bg-orange-50 text-brand-orange text-xs font-black uppercase tracking-widest border border-orange-100">{product.promotionLabel}</span>
              {hasProductPromotion(product) && <span className="px-4 py-2 rounded-full bg-brand-black text-white text-xs font-black uppercase tracking-widest">{product.discountPercentage}% OFF REAL</span>}
            </div>
          )}
          <h1 className="text-5xl font-black mb-6 uppercase leading-tight">{product.name}</h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex text-yellow-400 text-xl">{[...Array(5)].map((_, i) => <span key={i} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}>★</span>)}</div>
            <span className="text-gray-400 font-medium">({product.reviews} avaliações de clientes)</span>
          </div>

          <div className="mb-10 space-y-4">
            <p className="text-gray-600 text-lg leading-relaxed line-clamp-5 md:line-clamp-none">{marketing.summary || 'Este produto premium da Halex Shop foi desenvolvido com os mais altos padrões de qualidade para garantir que você alcance seus objetivos físicos com eficiência e segurança.'}</p>
            {infoSlides.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden select-none">
                <AnimatePresence mode="wait">
                  <motion.div key={activeSlide} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22, ease: 'easeInOut' }} className="px-5 pt-5 pb-4 min-h-[130px]"
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                      const diff = touchStartX.current - e.changedTouches[0].clientX;
                      if (Math.abs(diff) > 40) {
                        pauseAutoPlay();
                        if (diff > 0) setActiveSlide((prev) => Math.min(prev + 1, infoSlides.length - 1));
                        else setActiveSlide((prev) => Math.max(prev - 1, 0));
                      }
                    }}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-brand-orange font-black mb-2">{infoSlides[activeSlide].title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{toPlainProductCopy(infoSlides[activeSlide].content)}</p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
                  <button onClick={() => { pauseAutoPlay(); setActiveSlide((prev) => Math.max(prev - 1, 0)); }} disabled={activeSlide === 0} className="p-1.5 rounded-xl text-gray-400 hover:text-brand-orange disabled:opacity-25 transition-colors"><ChevronRight className="rotate-180" size={16} /></button>
                  <div className="flex items-center gap-1.5">{infoSlides.map((_, i) => <button key={i} onClick={() => { pauseAutoPlay(); setActiveSlide(i); }} className={`rounded-full transition-all ${i === activeSlide ? 'w-5 h-2 bg-brand-orange' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`} />)}</div>
                  <button onClick={() => { pauseAutoPlay(); setActiveSlide((prev) => Math.min(prev + 1, infoSlides.length - 1)); }} disabled={activeSlide === infoSlides.length - 1} className="p-1.5 rounded-xl text-gray-400 hover:text-brand-orange disabled:opacity-25 transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 mb-10">
            <div>
              {hasProductPromotion(product) && <div className="flex items-center gap-3 mb-2"><span className="text-lg text-gray-400 line-through font-bold">{formatPriceBRL(product.compareAtPrice)}</span><span className="px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-xs font-black uppercase tracking-widest border border-orange-100">Economize {product.discountPercentage}%</span></div>}
              <span className="text-4xl font-black text-brand-orange">{formatPriceBRL(product.price)}</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            {product.stock > 0 ? <span className="text-green-500 font-bold flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> {product.stock} em estoque</span> : <span className="text-red-500 font-bold flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" /> Esgotado</span>}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => { onAddToCart(product); onShowToast('Adicionado ao carrinho!'); }} disabled={product.stock <= 0} className="flex-grow bg-brand-orange text-white py-5 text-xl font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all disabled:opacity-50"><ShoppingBag size={24} /> Adicionar ao Carrinho</button>
            <button onClick={() => { onAddToCart(product); onNavigate('cart'); }} disabled={product.stock <= 0} className="flex-grow bg-brand-black text-white py-5 text-xl font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">Comprar Agora</button>
          </div>

          <button onClick={() => onNavigate('product-info', { productId: product.id })} className="mt-4 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-brand-orange hover:text-brand-orange/80 transition-colors">Ver composição completa e mais informações <ChevronRight size={16} /></button>

          <div className="mt-12 pt-12 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {productBenefits.map((benefit) => {
              const BenefitIcon = benefit.icon;
              return <div key={benefit.title} className={`relative overflow-hidden rounded-[28px] border border-white bg-gradient-to-br ${benefit.surfaceAccent} p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_38%)] pointer-events-none" /><div className="relative flex items-center gap-4"><div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${benefit.iconAccent} text-white flex items-center justify-center shadow-[0_16px_35px_rgba(249,115,22,0.26)]`}><BenefitIcon size={26} /></div><div><div className="text-brand-black font-black text-sm uppercase tracking-wide">{benefit.title}</div><div className="text-gray-500 text-xs leading-relaxed mt-1">{benefit.subtitle}</div></div></div></div>;
            })}
          </div>
        </motion.div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Oferta de hoje</p><p className="text-2xl font-black text-brand-orange leading-none">{formatPriceBRL(product.price)}</p></div>
          <button onClick={() => { onAddToCart(product); onNavigate('cart'); }} disabled={product.stock <= 0} className="flex-1 bg-brand-orange text-white py-3 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50">Comprar agora</button>
        </div>
      </div>
    </div>
  );
};
