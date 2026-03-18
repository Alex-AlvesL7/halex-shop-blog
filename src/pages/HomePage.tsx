import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  DollarSign,
  Flame,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost, Product } from '../types';
import { AffiliatePromoCard } from '../components/AffiliatePromoCard';
import { BlogPostCard } from '../components/BlogPostCard';
import { ProductCard } from '../components/ProductCard';
import { formatPriceBRL, hasProductPromotion } from '../utils/productContent';

export const HomePage = ({
  onNavigate,
  onAddToCart,
  products,
  posts,
  onProductClick,
  onPostClick,
}: {
  onNavigate: (page: string) => void;
  onAddToCart: (product: Product) => void;
  products: Product[];
  posts: BlogPost[];
  onProductClick: (product: Product) => void;
  onPostClick: (post: BlogPost) => void;
}) => {
  const featuredProducts = products.slice(0, 4);
  const latestPosts = posts.slice(0, 3);
  const secondaryPosts = latestPosts.slice(1, 3);
  const spotlightProduct =
    products.find((p) => hasProductPromotion(p)) || products[0];
  const heroPost = latestPosts[0];

  const reviewVolume = products.reduce(
    (total, p) => total + (p.reviews || 0),
    0,
  );

  const brandStats = [
    { value: `${products.length}+`, label: 'Produtos', icon: Sparkles },
    { value: `${reviewVolume}+`, label: 'Avaliações', icon: Star },
    { value: '50%', label: 'Comissão afiliado', icon: DollarSign },
  ];

  const brandPillars = [
    {
      icon: ShieldCheck,
      title: 'Suplementos selecionados',
      description:
        'Curadoria rigorosa focada em qualidade, resultado e procedência. Produtos que entregam o que prometem.',
    },
    {
      icon: Zap,
      title: 'Performance comprovada',
      description:
        'Fórmulas desenvolvidas para acelerar resultados — seja no ganho de massa, definição ou emagrecimento.',
    },
    {
      icon: BookOpen,
      title: 'Conteúdo que converte',
      description:
        'Guias, dicas e artigos para você entender o que toma e comprar com mais segurança e consciência.',
    },
    {
      icon: Users,
      title: 'Programa de afiliados',
      description:
        'Indique produtos L7 Fitness, ganhe até 50% de comissão por venda e construa uma renda recorrente.',
    },
  ];

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#070707_0%,#111111_16%,#f7f3ee_16%,#fffaf6_46%,#ffffff_100%)] pb-24">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-14 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
          <div className="absolute right-[-4%] top-10 h-96 w-96 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-[62%] h-48 bg-gradient-to-b from-transparent to-[#f7f3ee]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                <Flame size={14} /> L7 Fitness Performance Store
              </span>

              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] text-white sm:text-6xl lg:text-7xl">
                Suplementos para quem{' '}
                <span className="text-brand-orange">treina de verdade.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                Performance, emagrecimento e ganho de massa com produtos
                selecionados, entrega rápida e conteúdo estratégico para
                acelerar seus resultados.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('store')}
                  className="btn-primary inline-flex items-center gap-2 shadow-[0_20px_40px_rgba(255,99,33,0.24)]"
                >
                  Ver produtos <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('affiliate-program')}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Quero ser afiliado
                </button>
              </div>

              {/* Stats row */}
              <div className="mt-10 flex flex-wrap gap-4">
                {brandStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_24px_rgba(255,99,33,0.3)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-white">{stat.value}</p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right column — spotlight product */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-8 top-8 hidden h-36 w-36 rounded-full bg-brand-orange/20 blur-3xl lg:block" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/6 p-4 shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#161616]">
                  {spotlightProduct ? (
                    <img
                      src={spotlightProduct.image}
                      alt={spotlightProduct.name}
                      className="h-[480px] w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-[480px] items-center justify-center text-sm font-bold uppercase tracking-widest text-gray-500">
                      Produto em destaque
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-x-4 bottom-4 top-4 rounded-[30px] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {spotlightProduct && (
                  <div className="absolute inset-x-8 bottom-8 text-white">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                      <div className="max-w-xs">
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-orange">
                          {hasProductPromotion(spotlightProduct)
                            ? spotlightProduct.promotionLabel || 'Oferta especial'
                            : 'Produto em destaque'}
                        </p>
                        <h2 className="mt-2 text-2xl font-black uppercase leading-tight">
                          {spotlightProduct.name}
                        </h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-300">
                          {spotlightProduct.description}
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-300">
                          Preço
                        </p>
                        <p className="mt-1 text-2xl font-black text-brand-orange">
                          {formatPriceBRL(spotlightProduct.price)}
                        </p>
                        {hasProductPromotion(spotlightProduct) && (
                          <div className="mt-1 flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-gray-400 line-through">
                              {formatPriceBRL(spotlightProduct.compareAtPrice)}
                            </span>
                            <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              {spotlightProduct.discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => onProductClick(spotlightProduct)}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-brand-black transition hover:bg-brand-orange hover:text-white"
                      >
                        Ver oferta <ArrowUpRight size={14} />
                      </button>
                      {spotlightProduct.stock > 0 && (
                        <button
                          onClick={() => onAddToCart(spotlightProduct)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                        >
                          Adicionar ao carrinho <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BRAND PILLARS ─────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-orange-100/80 bg-white p-7 shadow-[0_25px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                Por que L7 Fitness
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                Tudo que você precisa para evoluir.
              </h2>
            </div>
            <button
              onClick={() => onNavigate('store')}
              className="self-start text-sm font-black uppercase tracking-wider text-brand-orange transition hover:underline"
            >
              Ver catálogo →
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {brandPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-[28px] border border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff8f3_100%)] p-6"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-orange to-orange-400 text-white shadow-[0_18px_40px_rgba(255,99,33,0.2)]">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-black text-brand-black">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-7 text-gray-600">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AFFILIATE PROMO ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <AffiliatePromoCard
          onNavigate={onNavigate}
          badge="Programa de afiliados"
          title="Ganhe até 50% de comissão indicando produtos L7 Fitness."
          description="Crie sua conta, compartilhe seu link e receba comissão aprovada por cada venda realizada. Construa uma renda recorrente sem estoque e sem complicação."
          primaryLabel="Conhecer programa"
          secondaryLabel="Ver produtos"
          className="border-orange-300/60"
        />
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
              Produtos em destaque
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase text-brand-black sm:text-5xl">
              Os mais vendidos da loja.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
              Suplementos com maior demanda, melhores avaliações e resultados
              comprovados pelos nossos clientes.
            </p>
          </div>
          <button
            onClick={() => onNavigate('store')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-brand-orange/20 bg-orange-50 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
          >
            Ver catálogo completo <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onClick={onProductClick}
            />
          ))}
        </div>
      </section>

      {/* ── BLOG ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
              Conteúdo e dicas
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase text-brand-black sm:text-5xl">
              Treino, dieta e nutrição na prática.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
              Artigos escritos para quem quer resultados reais — sem enrolação e
              com embasamento para cada escolha.
            </p>
          </div>
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-2 self-start rounded-full bg-brand-black px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-brand-orange"
          >
            Acessar blog <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Hero post */}
          <div className="overflow-hidden rounded-[36px] bg-brand-black text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            {heroPost ? (
              <>
                <div className="aspect-[16/9] overflow-hidden border-b border-white/10">
                  <img
                    src={heroPost.image}
                    alt={heroPost.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 sm:p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">
                    Post em destaque
                  </p>
                  <h3 className="mt-4 text-2xl font-black uppercase leading-tight sm:text-3xl">
                    {heroPost.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-gray-300">
                    {heroPost.excerpt}
                  </p>
                  <button
                    onClick={() => onPostClick(heroPost)}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
                  >
                    Ler artigo <ArrowUpRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-sm text-gray-300">
                Adicione conteúdos para destacar o blog na home.
              </div>
            )}
          </div>

          {/* Secondary posts */}
          <div className="flex flex-col gap-6">
            {(secondaryPosts.length ? secondaryPosts : latestPosts).map(
              (post) => (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]"
                >
                  <BlogPostCard
                    post={post}
                    onClick={onPostClick}
                    onAffiliateClick={() => onNavigate('affiliate-program')}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[40px] border border-orange-100 bg-[linear-gradient(135deg,#fff7f0_0%,#ffffff_42%,#fff2e7_100%)] p-8 shadow-[0_25px_70px_rgba(255,99,33,0.08)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">
                Comece agora
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                Sua evolução começa com a escolha certa.
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-600">
                Entre na loja e explore nossos produtos — ou cadastre-se como
                afiliado e comece a gerar renda com a L7 Fitness.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                onClick={() => onNavigate('store')}
                className="btn-primary whitespace-nowrap"
              >
                Ir para a loja
              </button>
              <button
                onClick={() => onNavigate('affiliate-program')}
                className="rounded-full border border-brand-orange/20 bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
              >
                Virar afiliado
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
