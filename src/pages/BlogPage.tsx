import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AffiliatePromoCard } from '../components/AffiliatePromoCard';
import { BlogPostCard } from '../components/BlogPostCard';
import { BlogPost } from '../types';

export const BlogPage = ({
  posts,
  onPostClick,
  onNavigate,
}: {
  posts: BlogPost[];
  onPostClick: (post: BlogPost) => void;
  onNavigate: (page: string) => void;
}) => (
  <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-16">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-black mb-4 uppercase">Blog L7 Fitness</h1>
        <p className="text-gray-500 text-lg">
          Conteúdo pensado para orientar suas escolhas em treino, nutrição, suplementação e rotina.
        </p>
      </div>
      <button
        onClick={() => onNavigate('affiliate-program')}
        className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
      >
        Conhecer programa de afiliados <ChevronRight size={16} />
      </button>
    </div>

    <AffiliatePromoCard
      onNavigate={onNavigate}
      variant="inline"
      className="mb-12"
      badge="Programa de afiliados"
      title="Gostou do conteúdo? Conheça também o programa de afiliados da L7 Fitness."
      description="Se você produz conteúdo, atende clientes ou gosta de indicar bons produtos, pode participar do programa e divulgar a marca com suporte, materiais e link exclusivo."
      primaryLabel="Conhecer afiliados"
      secondaryLabel="Explorar loja"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} onClick={onPostClick} onAffiliateClick={() => onNavigate('affiliate-program')} />
      ))}
    </div>
  </div>
);
