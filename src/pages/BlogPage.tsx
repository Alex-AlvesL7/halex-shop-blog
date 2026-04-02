import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AffiliatePromoCard } from '../components/AffiliatePromoCard';
import { BlogPostCard } from '../components/BlogPostCard';
import { BlogPost } from '../types';

const blogCategoryLabels: Record<string, string> = {
  alimentacao: 'Nutrição',
  treino: 'Treino',
  dieta: 'Estratégia alimentar',
  negocios: 'Afiliados',
};

export const BlogPage = ({
  posts,
  onPostClick,
  onNavigate,
}: {
  posts: BlogPost[];
  onPostClick: (post: BlogPost) => void;
  onNavigate: (page: string) => void;
}) => {
  const [activeCategory, setActiveCategory] = useState('todos');

  const categoryOptions = useMemo(() => {
    const categories = posts
      .map((post) => String(post.category || '').trim())
      .filter(Boolean)
      .reduce<string[]>((acc, category) => {
        if (!acc.some((item) => item.toLowerCase() === category.toLowerCase())) {
          acc.push(category);
        }
        return acc;
      }, []);

    return ['todos', ...categories];
  }, [posts]);

  useEffect(() => {
    if (!categoryOptions.some((category) => category.toLowerCase() === activeCategory.toLowerCase())) {
      setActiveCategory('todos');
    }
  }, [activeCategory, categoryOptions]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'todos') return posts;
    return posts.filter((post) => String(post.category || '').trim().toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, posts]);

  const getCategoryLabel = (category: string) => {
    if (category === 'todos') return 'Todos';
    return blogCategoryLabels[category.toLowerCase()] || category;
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-black mb-4 uppercase">Blog L7 Fitness</h1>
          <p className="text-gray-500 text-lg">
            Conteúdo pensado para orientar suas escolhas em treino, nutrição, suplementação e rotina.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${activeCategory.toLowerCase() === category.toLowerCase() ? 'bg-brand-orange text-white shadow-[0_10px_24px_rgba(255,99,33,0.22)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onNavigate('affiliate-program')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
        >
          Ganhar dinheiro com a L7 <ChevronRight size={16} />
        </button>
      </div>

      <AffiliatePromoCard
        onNavigate={onNavigate}
        variant="inline"
        className="mb-12"
        badge="Programa de afiliados"
        title="Gostou do conteúdo? Conheça também o programa de afiliados da L7 Fitness."
        description="Se você produz conteúdo, atende clientes ou gosta de indicar bons produtos, pode participar do programa e divulgar a marca com suporte, materiais e link exclusivo."
        primaryLabel="Ganhar dinheiro com a L7"
        secondaryLabel="Explorar loja"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {filteredPosts.map((post) => (
          <BlogPostCard key={post.id} post={post} onClick={onPostClick} onAffiliateClick={() => onNavigate('affiliate-program')} />
        ))}
      </div>
      {filteredPosts.length === 0 && (
        <div className="mt-8 rounded-[28px] border border-gray-100 bg-white px-6 py-5 text-sm font-bold text-gray-500 shadow-sm">
          Ainda não há artigos neste assunto.
        </div>
      )}
    </div>
  );
};
