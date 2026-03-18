import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AffiliatePromoCard } from '../components/AffiliatePromoCard';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

export const StorePage = ({
  onAddToCart,
  products,
  onProductClick,
  onNavigate,
}: {
  onAddToCart: (product: Product) => void;
  products: Product[];
  onProductClick: (product: Product) => void;
  onNavigate: (page: string) => void;
}) => {
  const [filter, setFilter] = useState('todos');

  const filteredProducts = filter === 'todos'
    ? products
    : products.filter((product) => product.category === filter);

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-4 uppercase">Nossa Loja</h1>
          <p className="text-gray-500">Suplementos e acessórios de alta performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['todos', 'emagrecedores', 'suplementos', 'acessorios', 'vestuario'].map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filter === category ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <AffiliatePromoCard
        onNavigate={onNavigate}
        variant="inline"
        className="mb-12"
        badge="Monetize a loja"
        title="Gostou da vitrine? Agora imagine divulgar esses produtos com seu link exclusivo."
        description="A loja também virou ponto de captação: quem tiver perfil comercial pode entrar no programa, acessar material de divulgação e transformar tráfego em comissão."
        primaryLabel="Quero vender como afiliado"
        secondaryLabel="Continuar comprando"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
        ))}
      </div>
    </div>
  );
};
