import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product } from '../types';
import { formatPriceBRL, getProductDetailContent, getProductMarketingSummary, hasProductPromotion, normalizeMarkdownContent } from '../utils/productContent';

export const ProductInfoPage: React.FC<{ product: Product, onAddToCart: (p: Product) => void, onBack: () => void, onNavigate: (page: string, options?: any) => void, onShowToast: (msg: string) => void }> = ({ product, onAddToCart, onBack, onNavigate, onShowToast }) => {
  const detailContent = useMemo(() => getProductDetailContent(product), [product]);
  const marketing = useMemo(() => getProductMarketingSummary(product), [product]);

  return (
    <div className="pt-32 pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange transition-colors mb-8 font-bold uppercase text-xs tracking-widest">
        <ChevronRight className="rotate-180" size={16} /> Voltar para o produto
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 lg:sticky lg:top-28">
          <div className="aspect-square rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 mb-5">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <span className="inline-flex px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-orange-100 mb-3">Informações completas</span>
          <h1 className="text-3xl font-black uppercase leading-tight mb-3">{product.name}</h1>
          <p className="text-gray-600 leading-relaxed mb-4">{detailContent.summary || marketing.summary}</p>
          <div className="flex items-end gap-3 mb-5">
            <span className="text-3xl font-black text-brand-orange">{formatPriceBRL(product.price)}</span>
            {hasProductPromotion(product) && <span className="text-sm text-gray-400 line-through font-bold">{formatPriceBRL(product.compareAtPrice)}</span>}
          </div>
          <div className="space-y-3">
            <button onClick={() => { onAddToCart(product); onShowToast('Adicionado ao carrinho!'); }} className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-orange/90 transition-colors">Adicionar ao carrinho</button>
            <button onClick={() => onNavigate('product-details', { productId: product.id })} className="w-full bg-brand-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black/90 transition-colors">Voltar para página de compra</button>
          </div>
        </div>

        <div className="space-y-5">
          {[
            ['Para que serve', detailContent.purpose],
            ['O que vem no kit', detailContent.kitContents],
            ['Composição detalhada', detailContent.composition],
            ['Quantidade / cápsulas', detailContent.capsules],
            ['Como usar', detailContent.usage],
            ['Informações completas', detailContent.details],
          ].filter(([, value]) => String(value || '').trim()).map(([title, value]) => {
            const isFullDetails = title === 'Informações completas';
            const normalizedContent = normalizeMarkdownContent(String(value || ''));

            return (
              <div key={title} className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-brand-orange font-black mb-3">{title}</p>
                <div className={`markdown-body ${isFullDetails ? 'product-details-markdown' : 'text-sm text-gray-600 leading-7'}`}>
                  <ReactMarkdown>{normalizedContent}</ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
