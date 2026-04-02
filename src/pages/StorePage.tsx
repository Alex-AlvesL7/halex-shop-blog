import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AffiliatePromoCard } from '../components/AffiliatePromoCard';
import { ProductCard } from '../components/ProductCard';
import { Category, Product } from '../types';

export const StorePage = ({
  onAddToCart,
  products,
  categories,
  onProductClick,
  onNavigate,
}: {
  onAddToCart: (product: Product) => void;
  products: Product[];
  categories: Category[];
  onProductClick: (product: Product) => void;
  onNavigate: (page: string) => void;
}) => {
  const [filter, setFilter] = useState('todos');

  const availableFilters = useMemo(() => {
    const productCategoryMap = new Map<string, string>();

    products.forEach((product) => {
      const categoryName = String(product.category || '').trim();
      if (!categoryName) return;
      productCategoryMap.set(categoryName.toLowerCase(), categoryName);
    });

    const mergedCategories = categories
      .map((category) => String(category.name || '').trim())
      .filter((categoryName) => categoryName && productCategoryMap.has(categoryName.toLowerCase()))
      .map((categoryName) => productCategoryMap.get(categoryName.toLowerCase()) || categoryName);

    const uncataloguedCategories = Array.from(productCategoryMap.entries())
      .filter(([key]) => !mergedCategories.some((categoryName) => categoryName.toLowerCase() === key))
      .map(([, value]) => value);

    return ['todos', ...mergedCategories, ...uncataloguedCategories];
  }, [categories, products]);

  useEffect(() => {
    if (!availableFilters.some((category) => category.toLowerCase() === filter.toLowerCase())) {
      setFilter('todos');
    }
  }, [availableFilters, filter]);

  const filteredProducts = filter === 'todos'
    ? products
    : products.filter((product) => String(product.category || '').trim().toLowerCase() === filter.toLowerCase());

  const getFilterLabel = (category: string) => {
    if (category === 'todos') return 'Todos';
    return category;
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black mb-4 uppercase">Nossa Loja</h1>
          <p className="text-gray-500">Suplementos, kits e acessórios para diferentes objetivos, rotinas e fases da sua jornada.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filter.toLowerCase() === category.toLowerCase() ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {getFilterLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <AffiliatePromoCard
        onNavigate={onNavigate}
        variant="inline"
        className="mb-12"
        badge="Programa de afiliados"
        title="Gostou dos produtos? Você também pode indicar a L7 Fitness com seu link exclusivo."
        description="Entre no programa de afiliados, receba materiais de divulgação e acompanhe seus ganhos conforme suas indicações forem aprovadas."
        primaryLabel="Quero indicar produtos"
        secondaryLabel="Seguir na loja"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
        ))}
      </div>
    </div>
  );
};
