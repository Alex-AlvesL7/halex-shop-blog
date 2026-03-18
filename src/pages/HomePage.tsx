import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Ruler,
  Scale,
  Sparkles,
  Star,
  WandSparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  const heroPost = latestPosts[0];

  // Carousel: promoted products first, fill up to 5
  const carouselProducts = [
    ...products.filter((p) => hasProductPromotion(p)),
    ...products.filter((p) => !hasProductPromotion(p)),
  ].slice(0, 5);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number, dir: 1 | -1 = 1) => {
      setDirection(dir);
      setActiveIndex(
        (index + carouselProducts.length) % carouselProducts.length,
      );
    },
    [carouselProducts.length],
  );

  const next = useCallback(() => {
    goTo(activeIndex + 1, 1);
  }, [activeIndex, goTo]);

  const prev = useCallback(() => {
    goTo(activeIndex - 1, -1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (paused || carouselProducts.length <= 1) return;
    intervalRef.current = setInterval(next, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next, paused, carouselProducts.length]);

  const currentProduct = carouselProducts[activeIndex];

  const reviewVolume = products.reduce(
    (total, p) => total + (p.reviews || 0),
    0,
  );

  const brandStats = [
    { value: `${products.length}+`, label: 'Produtos', icon: Sparkles },
    { value: `${reviewVolume}+`, label: 'Avaliações', icon: Star },
    { value: '1 min', label: 'Análise com IA', icon: WandSparkles },
  ];

  const aiHighlights = [
    {
      icon: Scale,
      title: 'Peso e objetivo',
      description:
        'A IA entende seu peso atual, meta e rotina para indicar um caminho inicial mais coerente.',
    },
    {
      icon: Ruler,
      title: 'Altura e medidas',
      description:
        'Você informa altura e dados corporais para receber uma leitura mais personalizada do seu perfil.',
    },
    {
      icon: WandSparkles,
      title: 'Recomendação inteligente',
      description:
        'A consultora IA sugere produtos, rotina inicial e próximos passos para emagrecer com mais clareza.',
    },
  ];

  const aiProofItems = [
    `${reviewVolume}+ avaliações ajudam a destacar os produtos com mais confiança`,
    `${products.length}+ opções na loja para encaixar no seu objetivo`,
    'Leitura inicial em cerca de 1 minuto com peso, altura e meta',
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
                L7 Fitness{' '}
                <span className="text-brand-orange">emagreça com saúde!</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                Descubra o suplemento ideal para seu momento com ajuda da nossa
                consultora IA, análise de peso e medidas e ofertas pensadas para
                acelerar seu emagrecimento com mais segurança.
              </p>

              <div className="mt-6 inline-flex rounded-full border border-brand-orange/20 bg-brand-orange/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-brand-orange">
                Descubra seu protocolo em 1 minuto
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('tips')}
                  className="btn-primary inline-flex items-center gap-2 shadow-[0_20px_40px_rgba(255,99,33,0.24)]"
                >
                  Descobrir meu protocolo <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('store')}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Ver produtos
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {aiProofItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-gray-300 backdrop-blur-sm"
                  >
                    {item}
                  </div>
                ))}
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

            {/* Right column — product carousel */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="absolute -left-8 top-8 hidden h-36 w-36 rounded-full bg-brand-orange/20 blur-3xl lg:block" />

              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/6 p-4 shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-md">
                {/* Slides */}
                <div className="relative h-[480px] overflow-hidden rounded-[30px] border border-white/10 bg-[#161616]">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    {currentProduct ? (
                      <motion.img
                        key={currentProduct.id}
                        src={currentProduct.image}
                        alt={currentProduct.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        custom={direction}
                        initial={{ x: direction * 60, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction * -60, opacity: 0 }}
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold uppercase tracking-widest text-gray-500">
                        Produtos em destaque
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Arrow buttons */}
                  {carouselProducts.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition hover:bg-brand-orange hover:border-brand-orange"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition hover:bg-brand-orange hover:border-brand-orange"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Gradient overlay */}
                <div className="pointer-events-none absolute inset-x-4 bottom-4 top-4 rounded-[30px] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Product info overlay */}
                {currentProduct && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProduct.id + '-info'}
                      className="absolute inset-x-8 bottom-8 text-white"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                        <div className="max-w-xs">
                          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-orange">
                            {hasProductPromotion(currentProduct)
                              ? currentProduct.promotionLabel || 'Oferta especial'
                              : 'Produto em destaque'}
                          </p>
                          <h2 className="mt-2 text-2xl font-black uppercase leading-tight">
                            {currentProduct.name}
                          </h2>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-300">
                            {currentProduct.description}
                          </p>
                        </div>

                        <div className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-300">
                            Preço
                          </p>
                          <p className="mt-1 text-2xl font-black text-brand-orange">
                            {formatPriceBRL(currentProduct.price)}
                          </p>
                          {hasProductPromotion(currentProduct) && (
                            <div className="mt-1 flex items-center justify-end gap-2">
                              <span className="text-xs font-bold text-gray-400 line-through">
                                {formatPriceBRL(currentProduct.compareAtPrice)}
                              </span>
                              <span className="rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                {currentProduct.discountPercentage}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => onProductClick(currentProduct)}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-brand-black transition hover:bg-brand-orange hover:text-white"
                        >
                          Ver oferta <ArrowUpRight size={14} />
                        </button>
                        {currentProduct.stock > 0 && (
                          <button
                            onClick={() => onAddToCart(currentProduct)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                          >
                            Adicionar ao carrinho <ChevronRight size={14} />
                          </button>
                        )}

                        {/* Dots */}
                        {carouselProducts.length > 1 && (
                          <div className="ml-auto flex gap-1.5">
                            {carouselProducts.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  i === activeIndex
                                    ? 'w-6 bg-brand-orange'
                                    : 'w-2 bg-white/30 hover:bg-white/60'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONSULTORA IA ─────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-orange-100/80 bg-white p-7 shadow-[0_25px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                Consultora IA L7 Fitness
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                Analise peso, altura e objetivo antes de comprar.
              </h2>
              <p className="mt-4 text-xl font-black uppercase leading-tight text-brand-black sm:text-2xl">
                Menos dúvida, mais clique no produto certo.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                Em vez de sair clicando sem direção, a cliente informa peso,
                altura, idade e objetivo. A IA devolve uma leitura inicial,
                recomendações e o produto mais alinhado para emagrecimento com
                saúde.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-orange-100 bg-orange-50 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Promessa</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Receba uma direção inicial antes de comprar qualquer kit.</p>
                </div>
                <div className="rounded-[22px] border border-orange-100 bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Tempo</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Fluxo rápido para aumentar conversão sem cansar a visitante.</p>
                </div>
                <div className="rounded-[22px] border border-orange-100 bg-white px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Foco</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Peso, altura, medidas e meta de emagrecimento em destaque.</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('tips')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Descobrir meu protocolo em 1 minuto <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('store')}
                  className="rounded-full border border-brand-orange/20 bg-orange-50 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
                >
                  Ver produtos para emagrecimento
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-brand-black/5 bg-[linear-gradient(180deg,#111111_0%,#1a1a1a_100%)] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)] sm:p-7">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-orange">
                  Consultoria guiada por IA
                </p>
                <h3 className="mt-3 text-2xl font-black uppercase leading-tight">
                  Diagnóstico inicial em poucos passos.
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  Uma experiência pensada para aumentar CTR e conversão: primeiro
                  a pessoa entende seu perfil, depois recebe a oferta certa.
                </p>
              </div>

              <button
                onClick={() => onNavigate('tips')}
                className="mt-5 block w-full rounded-[26px] border border-white/10 bg-white px-5 py-5 text-left text-brand-black shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                      Prévia do formulário
                    </p>
                    <h4 className="mt-2 text-lg font-black uppercase leading-tight">
                      Monte sua análise em segundos
                    </h4>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 text-brand-orange" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    'Objetivo: emagrecimento',
                    'Peso atual',
                    'Altura e idade',
                    'Medidas e rotina',
                  ].map((field) => (
                    <div
                      key={field}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600"
                    >
                      {field}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-brand-black px-4 py-4 text-center text-sm font-black uppercase tracking-widest text-white">
                  Descobrir meu protocolo em 1 minuto
                </div>
              </button>

              <div className="mt-5 grid gap-4">
                {aiHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase text-white">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-gray-300">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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

      {/* ── AFFILIATE PROMO ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <AffiliatePromoCard
          onNavigate={onNavigate}
          badge="Programa de afiliados"
          title="Ganhe até 50% de comissão indicando produtos L7 Fitness."
          description="Depois de educar e converter a audiência com conteúdo e ofertas, a home também convida criadores, parceiros e social sellers para monetizar com a marca."
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
              Depois da análise e do conteúdo, aqui ficam os produtos com maior
              potencial de clique e conversão.
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

      {/* ── CTA FOOTER ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[40px] border border-orange-100 bg-[linear-gradient(135deg,#fff7f0_0%,#ffffff_42%,#fff2e7_100%)] p-8 shadow-[0_25px_70px_rgba(255,99,33,0.08)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">
                Comece agora
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                O próximo passo pode ser sua análise com IA.
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-600">
                Se quiser uma orientação mais certeira antes de comprar,
                comece pela consultora IA. Se já estiver pronta, avance para a
                loja e escolha seu kit ideal.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                onClick={() => onNavigate('tips')}
                className="btn-primary whitespace-nowrap"
              >
                Fazer análise com IA
              </button>
              <button
                onClick={() => onNavigate('store')}
                className="rounded-full border border-brand-orange/20 bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
              >
                Ir para a loja
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
