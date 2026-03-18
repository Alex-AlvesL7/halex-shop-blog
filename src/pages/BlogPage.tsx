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
        <h1 className="text-5xl font-black mb-4 uppercase">Halex Blog</h1>
        <p className="text-gray-500 text-lg">
          Sua fonte de conhecimento para otimizar cada aspecto da sua vida fitness.
        </p>
      </div>
      <button
        onClick={() => onNavigate('affiliate-program')}
        className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
      >
        Quero faturar como afiliado <ChevronRight size={16} />
      </button>
    </div>

    <AffiliatePromoCard
      onNavigate={onNavigate}
      variant="inline"
      className="mb-12"
      badge="Blog que converte"
      title="Cada artigo agora também ajuda a captar novos afiliados para a L7 Fitness."
      description="Além de educar e engajar a audiência, o blog convida leitores com perfil comercial a entrar no programa e monetizar conteúdo, social media e indicação direta."
      primaryLabel="Ver página de afiliados"
      secondaryLabel="Ir para loja"
    />

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} onClick={onPostClick} onAffiliateClick={() => onNavigate('affiliate-program')} />
      ))}
    </div>
  </div>
);
