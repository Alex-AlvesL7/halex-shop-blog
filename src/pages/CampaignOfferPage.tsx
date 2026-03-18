import React from 'react';
import { ChevronRight, Phone, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { getProductOfferWhatsAppLink } from '../utils/commerce';
import { formatPriceBRL, getProductMarketingSummary, hasProductPromotion, toPlainProductCopy } from '../utils/productContent';

export const CampaignOfferPage: React.FC<{ product: Product, onAddToCart: (p: Product) => void, onBack: () => void, onShowToast: (msg: string) => void, onNavigate: (page: string, options?: any) => void }> = ({ product, onAddToCart, onBack, onShowToast, onNavigate }) => {
  const marketing = getProductMarketingSummary(product);
  const whatsappLink = getProductOfferWhatsAppLink(product);
  const promiseCopy = toPlainProductCopy(marketing.purpose || marketing.summary || `Oferta especial de ${product.name}`);
  const urgencyCopy = product.stock > 0 ? `${product.stock} unidades em estoque • frete rápido` : 'Oferta ativa por tempo limitado';
  const primaryCta = product.promotionCta || 'Garantir oferta agora';

  return (
    <div className="pt-24 pb-24 bg-gradient-to-b from-[#fff7ed] via-white to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors mb-8 font-bold uppercase text-xs tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <div className="rounded-[40px] overflow-hidden bg-brand-black text-white border border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-0">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex flex-wrap gap-3 mb-6">
                {product.promotionLabel && <span className="px-4 py-2 rounded-full bg-brand-orange text-white text-xs font-black uppercase tracking-widest">{product.promotionLabel}</span>}
                {hasProductPromotion(product) && <span className="px-4 py-2 rounded-full bg-white text-brand-black text-xs font-black uppercase tracking-widest">{product.discountPercentage}% OFF REAL</span>}
                {product.promotionBadge && <span className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/10">{product.promotionBadge}</span>}
              </div>

              <p className="text-[11px] uppercase tracking-[0.3em] text-brand-orange font-black mb-4">Oferta dedicada</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.05] mb-6">{product.name}</h1>
              <p className="text-xl sm:text-2xl text-white font-semibold leading-tight mb-3 max-w-2xl">{promiseCopy}</p>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 max-w-2xl">{marketing.summary}</p>

              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-4 py-2 rounded-full bg-brand-orange/15 text-brand-orange text-[11px] font-black uppercase tracking-widest border border-brand-orange/20">Oferta ativa hoje</span>
                <span className="px-4 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-widest border border-white/10">{urgencyCopy}</span>
              </div>

              <div className="flex flex-wrap items-end gap-4 mb-8">
                <span className="text-5xl font-black text-brand-orange">{formatPriceBRL(product.price)}</span>
                {hasProductPromotion(product) && <div className="pb-1"><p className="text-sm text-gray-400 line-through font-bold">{formatPriceBRL(product.compareAtPrice)}</p><p className="text-sm text-emerald-400 font-black uppercase tracking-widest">Economize {product.discountPercentage}%</p></div>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Prova social</p><p className="text-2xl font-black text-white">{product.reviews || 0}</p><p className="text-xs text-gray-400">avaliações de clientes</p></div>
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Nota média</p><p className="text-2xl font-black text-white">{Number(product.rating || 0).toFixed(1)} ★</p><p className="text-xs text-gray-400">produto premium</p></div>
                <div className="rounded-3xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Disponibilidade</p><p className="text-2xl font-black text-white">{product.stock}</p><p className="text-xs text-gray-400">unidades em estoque</p></div>
              </div>

              <div className="rounded-[28px] bg-white/5 border border-white/10 p-4 sm:p-5">
                <button onClick={() => { onAddToCart(product); onShowToast('Oferta adicionada ao carrinho.'); }} className="w-full bg-brand-orange text-white py-5 text-base sm:text-lg font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-orange/90 transition-all shadow-[0_18px_40px_rgba(249,115,22,0.3)]"><ShoppingBag size={22} /> {primaryCta}</button>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-300 font-semibold">Compra segura • estoque atual • envio rápido</p>
                  <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-white/80 hover:text-white transition-colors"><Phone size={16} /> Tirar dúvida rápida no WhatsApp</a>
                </div>
              </div>
            </div>

            <div className="relative min-h-[420px] lg:min-h-full bg-gradient-to-br from-[#111318] to-[#0b0b0f] p-8 lg:p-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,99,33,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,99,33,0.18),transparent_28%)]" />
              <div className="relative w-full max-w-lg lg:max-w-md">
                <div className="rounded-[36px] overflow-hidden border border-white/10 bg-white shadow-2xl"><img src={product.image} alt={product.name} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" /></div>
                {hasProductPromotion(product) && <div className="absolute -top-4 -right-4 bg-brand-orange text-white px-5 py-3 rounded-2xl shadow-xl text-center"><p className="text-[10px] uppercase tracking-widest font-black">Desconto ativo</p><p className="text-2xl font-black">-{product.discountPercentage}%</p></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-3">Por que essa oferta converte</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Para que serve</p><p className="text-sm text-gray-600 leading-relaxed">{marketing.purpose}</p></div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5"><p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Composição</p><p className="text-sm text-gray-600 leading-relaxed">{marketing.composition}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-3">Próxima ação</p>
            <div className="space-y-4">
              <button onClick={() => { onAddToCart(product); onShowToast('Oferta adicionada ao carrinho.'); }} className="w-full bg-brand-black text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-colors">Adicionar ao carrinho</button>
              <button onClick={() => onNavigate('product-details', { productId: product.id })} className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">Ver detalhes completos</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
