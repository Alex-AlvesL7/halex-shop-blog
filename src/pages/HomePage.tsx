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
import {
  formatPriceBRL,
  getProductMarketingSummary,
  hasProductPromotion,
} from '../utils/productContent';
import {
  generateSalesQuizRecommendation,
  SalesQuizProfile,
  SalesQuizResult,
} from '../services/geminiService';

type HomeQuizResult = SalesQuizResult & {
  primaryProduct: Product | null;
  secondaryProduct: Product | null;
};

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
  const quizFormRef = useRef<HTMLDivElement | null>(null);
  const quizNameInputRef = useRef<HTMLInputElement | null>(null);
  const quizResultRef = useRef<HTMLDivElement | null>(null);
  const [inlineQuizForm, setInlineQuizForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'emagrecimento',
    weight: '',
    height: '',
    age: '',
    gender: 'feminino',
    activityLevel: 'moderado',
    restrictions: '',
  });
  const [inlineQuizLoading, setInlineQuizLoading] = useState(false);
  const [inlineQuizResult, setInlineQuizResult] = useState<HomeQuizResult | null>(
    null,
  );
  const [inlineLeadSaved, setInlineLeadSaved] = useState(false);
  const [inlineQuizError, setInlineQuizError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!inlineQuizResult) return;

    quizResultRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [inlineQuizResult]);

  const currentProduct = carouselProducts[activeIndex];

  const scrollToQuizForm = useCallback(() => {
    quizFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      quizNameInputRef.current?.focus();
    }, 250);
  }, []);

  const scrollToQuizResult = useCallback(() => {
    quizResultRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const handleQuizPrimaryCheckout = useCallback(() => {
    if (!inlineQuizResult?.primaryProduct) return;

    onAddToCart(inlineQuizResult.primaryProduct);
    onNavigate('checkout');
  }, [inlineQuizResult, onAddToCart, onNavigate]);

  const primaryQuizProductPrice = inlineQuizResult?.primaryProduct
    ? formatPriceBRL(inlineQuizResult.primaryProduct.price)
    : null;

  const primaryQuizProductLabel =
    inlineQuizResult?.primaryProduct?.name || 'kit recomendado';

  const handleInlineQuizChange = useCallback(
    (field: string, value: string | number) => {
      setInlineQuizForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleInlineQuizGenerate = useCallback(async () => {
    if (
      !inlineQuizForm.name.trim() ||
      !inlineQuizForm.email.trim() ||
      !inlineQuizForm.phone.trim()
    ) {
      setInlineQuizError(
        'Preencha nome, e-mail e WhatsApp para liberar seu protocolo personalizado.',
      );
      scrollToQuizForm();
      return;
    }

    if (!String(inlineQuizForm.weight).trim() || !String(inlineQuizForm.height).trim() || !String(inlineQuizForm.age).trim()) {
      setInlineQuizError(
        'Preencha peso, altura e idade para a Alexia indicar o kit mais alinhado ao seu perfil.',
      );
      scrollToQuizForm();
      return;
    }

    setInlineQuizLoading(true);
    setInlineQuizError(null);
    setInlineLeadSaved(false);

    try {
      const profile: SalesQuizProfile = {
        name: inlineQuizForm.name.trim(),
        goal: inlineQuizForm.goal,
        weight: Number(inlineQuizForm.weight),
        height: Number(inlineQuizForm.height),
        age: Number(inlineQuizForm.age),
        gender: inlineQuizForm.gender,
        activityLevel: inlineQuizForm.activityLevel,
        restrictions: inlineQuizForm.restrictions.trim(),
      };

      const recommendation = await generateSalesQuizRecommendation(
        profile,
        products,
      );
      const primaryProduct =
        products.find((product) => product.id === recommendation.primaryProductId) ||
        null;
      const secondaryProduct = recommendation.secondaryProductId
        ? products.find(
            (product) => product.id === recommendation.secondaryProductId,
          ) || null
        : null;

      setInlineQuizResult({
        ...recommendation,
        primaryProduct,
        secondaryProduct,
      });

      try {
        const leadResponse = await fetch('/api/quiz-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: inlineQuizForm.name,
            email: inlineQuizForm.email,
            phone: inlineQuizForm.phone,
            goal: inlineQuizForm.goal,
            weight: inlineQuizForm.weight,
            height: inlineQuizForm.height,
            age: inlineQuizForm.age,
            gender: inlineQuizForm.gender,
            activity_level: inlineQuizForm.activityLevel,
            restrictions: inlineQuizForm.restrictions,
            recommended_product_id: recommendation.primaryProductId,
            metadata: {
              secondary_product_id: recommendation.secondaryProductId || null,
              summary: recommendation.summary,
              cta: recommendation.cta,
              meal_plan: recommendation.mealPlan,
              workout_plan: recommendation.workoutPlan,
              weekly_routine: recommendation.weeklyRoutine,
              monthly_plan_offer: recommendation.monthlyPlanOffer,
              monthly_plan_pitch: recommendation.monthlyPlanPitch,
              source: 'home-inline-quiz',
            },
          }),
        });

        setInlineLeadSaved(leadResponse.ok);
      } catch (error) {
        console.error('Erro ao salvar lead do formulário da home:', error);
      }
    } catch (error) {
      console.error('Erro ao gerar protocolo na home:', error);
      setInlineQuizError(
        'Não foi possível gerar sua análise agora. Tente novamente em alguns segundos.',
      );
    } finally {
      setInlineQuizLoading(false);
    }
  }, [inlineQuizForm, products, scrollToQuizForm]);

  const reviewVolume = products.reduce(
    (total, p) => total + (p.reviews || 0),
    0,
  );

  const brandStats = [
    { value: `${products.length}+`, label: 'Produtos', icon: Sparkles },
    { value: `${reviewVolume}+`, label: 'Avaliações', icon: Star },
    { value: '1 min', label: 'Alexia auxilia', icon: WandSparkles },
  ];

  const aiHighlights = [
    {
      icon: Scale,
      title: 'Peso e objetivo',
      description:
        'A Alexia entende seu peso atual, meta e rotina para indicar um caminho inicial mais coerente.',
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
        'A L7 responde com produtos, rotina inicial e próximos passos para emagrecer com mais clareza.',
    },
  ];

  const aiProofItems = [
    `${reviewVolume}+ avaliações ajudam você a escolher com mais confiança`,
    `${products.length}+ opções para diferentes objetivos e rotinas`,
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
                <Flame size={14} /> Curadoria L7 Fitness
              </span>

              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] text-white sm:text-6xl lg:text-7xl">
                L7 Fitness{' '}
                <span className="text-brand-orange">emagreça com saúde!</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                Descubra os produtos mais alinhados ao seu momento com apoio da
                Alexia, leitura inicial do seu perfil e ofertas pensadas para
                tornar sua jornada de emagrecimento mais clara e segura.
              </p>

              <div className="mt-6 inline-flex rounded-full border border-brand-orange/20 bg-brand-orange/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-brand-orange">
                Descubra seu protocolo em 1 minuto
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={scrollToQuizForm}
                  className="btn-primary inline-flex items-center gap-2 shadow-[0_20px_40px_rgba(255,99,33,0.24)]"
                >
                  Começar minha análise <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('store')}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Explorar loja
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {aiProofItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/15 bg-black/30 px-4 py-4 text-sm font-medium leading-6 text-white/90 shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-md"
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
                      className="flex items-center gap-3 rounded-[20px] border border-white/15 bg-black/28 px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white shadow-[0_12px_24px_rgba(255,99,33,0.3)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-white">{stat.value}</p>
                        <p className="text-xs text-white/70">{stat.label}</p>
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
                            {getProductMarketingSummary(currentProduct).summary || currentProduct.description}
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
                          Ver detalhes <ArrowUpRight size={14} />
                        </button>
                        {currentProduct.stock > 0 && (
                          <button
                            onClick={() => onAddToCart(currentProduct)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                          >
                            Comprar agora <ChevronRight size={14} />
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

      {/* ── ALEXIA L7 ─────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-orange-100/80 bg-white p-7 shadow-[0_25px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div
              ref={quizFormRef}
              className="rounded-[32px] border border-brand-black/5 bg-[linear-gradient(180deg,#111111_0%,#1a1a1a_100%)] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)] sm:p-7 lg:sticky lg:top-28"
            >
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-orange">
                  Análise Alexia
                </p>
                <h3 className="mt-3 text-2xl font-black uppercase leading-tight">
                  Descobrir meu protocolo em 1 minuto.
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  Conte para a Alexia seu objetivo, rotina e medidas para receber uma indicação inicial mais alinhada ao que você precisa agora.
                </p>
              </div>

              <div className="mt-5 rounded-[26px] border border-white/10 bg-white px-5 py-5 text-brand-black shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                      Seu perfil em 1 minuto
                    </p>
                    <h4 className="mt-2 text-lg font-black uppercase leading-tight">
                      Preencha e veja sua recomendação sem sair da home
                    </h4>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 text-brand-orange" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    ref={quizNameInputRef}
                    value={inlineQuizForm.name}
                    onChange={(event) =>
                      handleInlineQuizChange('name', event.target.value)
                    }
                    placeholder="Seu nome"
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                  <input
                    value={inlineQuizForm.phone}
                    onChange={(event) =>
                      handleInlineQuizChange('phone', event.target.value)
                    }
                    placeholder="WhatsApp"
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                  <input
                    value={inlineQuizForm.email}
                    onChange={(event) =>
                      handleInlineQuizChange('email', event.target.value)
                    }
                    placeholder="Seu melhor e-mail"
                    className="sm:col-span-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                  <select
                    value={inlineQuizForm.goal}
                    onChange={(event) =>
                      handleInlineQuizChange('goal', event.target.value)
                    }
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  >
                    <option value="emagrecimento">Objetivo: emagrecimento</option>
                    <option value="saude">Objetivo: saúde e bem-estar</option>
                    <option value="performance">Objetivo: performance</option>
                    <option value="hipertrofia">Objetivo: hipertrofia</option>
                  </select>
                  <select
                    value={inlineQuizForm.activityLevel}
                    onChange={(event) =>
                      handleInlineQuizChange('activityLevel', event.target.value)
                    }
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  >
                    <option value="baixo">Rotina: baixa atividade</option>
                    <option value="moderado">Rotina: atividade moderada</option>
                    <option value="alto">Rotina: alta atividade</option>
                  </select>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Peso atual</span>
                    <input
                      type="number"
                      min="1"
                      value={inlineQuizForm.weight}
                      onChange={(event) =>
                        handleInlineQuizChange('weight', event.target.value)
                      }
                      placeholder="Ex: 70 kg"
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Altura</span>
                    <input
                      type="number"
                      min="1"
                      value={inlineQuizForm.height}
                      onChange={(event) =>
                        handleInlineQuizChange('height', event.target.value)
                      }
                      placeholder="Ex: 170 cm"
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Idade</span>
                    <input
                      type="number"
                      min="1"
                      value={inlineQuizForm.age}
                      onChange={(event) =>
                        handleInlineQuizChange('age', event.target.value)
                      }
                      placeholder="Ex: 30 anos"
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                    />
                  </label>
                  <select
                    value={inlineQuizForm.gender}
                    onChange={(event) =>
                      handleInlineQuizChange('gender', event.target.value)
                    }
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  >
                    <option value="feminino">Sexo: feminino</option>
                    <option value="masculino">Sexo: masculino</option>
                    <option value="outro">Sexo: outro</option>
                  </select>
                  <textarea
                    value={inlineQuizForm.restrictions}
                    onChange={(event) =>
                      handleInlineQuizChange('restrictions', event.target.value)
                    }
                    placeholder="Observações rápidas: rotina corrida, sensível à cafeína, treina à noite..."
                    className="sm:col-span-2 min-h-[94px] rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
                  />
                </div>

                {inlineQuizError && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {inlineQuizError}
                  </div>
                )}

                {inlineLeadSaved && (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Recebemos seus dados com sucesso. Seu resultado já está liberado abaixo.
                  </div>
                )}

                <button
                  onClick={handleInlineQuizGenerate}
                  disabled={inlineQuizLoading}
                  className="mt-5 w-full rounded-2xl bg-brand-black px-4 py-4 text-center text-sm font-black uppercase tracking-widest text-white transition hover:bg-brand-orange disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inlineQuizLoading
                    ? 'Montando sua análise...'
                    : 'Receber minha análise agora'}
                </button>

                <p className="mt-4 text-xs leading-6 text-gray-500">
                  Uma orientação inicial rápida para ajudar você a tomar a próxima decisão com mais confiança.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  `${reviewVolume}+ avaliações reais da loja`,
                  `${products.length}+ produtos para encaixar no objetivo`,
                  'Resultado e sugestão aparecem sem mudar de página',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold leading-6 text-gray-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              {!inlineQuizResult ? (
                <div className="rounded-[32px] border border-orange-100 bg-[linear-gradient(135deg,#fffaf5_0%,#ffffff_55%,#fff4eb_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                    Análise guiada
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-brand-black sm:text-4xl">
                    Descubra seu protocolo em 1 minuto.
                  </h2>
                  <p className="mt-4 text-xl font-black uppercase leading-tight text-brand-black sm:text-2xl">
                    Peso, altura e objetivo para indicar o kit mais alinhado.
                  </p>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                    Você preenche os dados principais e a L7 mostra uma
                    recomendação inicial sem tirar você da home. Assim, fica
                    mais fácil entender por onde começar e escolher o produto
                    ou kit mais alinhado ao seu momento.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-orange-100 bg-orange-50 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Promessa</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Entenda por onde começar antes de escolher seu kit.</p>
                    </div>
                    <div className="rounded-[22px] border border-orange-100 bg-white px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Resposta rápida</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Resposta rápida em cerca de 1 minuto, sem interromper sua navegação.</p>
                    </div>
                    <div className="rounded-[22px] border border-orange-100 bg-white px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Critério da análise</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-brand-black">Peso, altura, rotina e meta para recomendar com mais precisão.</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-dashed border-brand-orange/30 bg-white/80 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                      Área de resposta da Alexia
                    </p>
                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      Depois do envio, este espaço mostra seu protocolo, a
                      lógica da recomendação e os próximos passos para avançar
                      com mais segurança.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={scrollToQuizForm}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      Fazer minha análise agora <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => onNavigate('store')}
                      className="rounded-full border border-brand-orange/20 bg-orange-50 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
                    >
                      Ver opções da loja
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div
                  ref={quizResultRef}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-[30px] border border-brand-black/5 bg-[linear-gradient(135deg,#111111_0%,#1d1d1d_100%)] p-6 text-white shadow-[0_25px_70px_rgba(15,23,42,0.16)] sm:p-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-orange">
                        Sua recomendação inicial
                    </p>
                    <h3 className="mt-3 text-3xl font-black uppercase leading-tight">
                      {inlineQuizResult.primaryProduct?.name || 'Produto recomendado'}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-gray-300">
                      {inlineQuizResult.summary}
                    </p>
                    <div className="mt-5 grid gap-3">
                      {inlineQuizResult.whyItMatches.slice(0, 3).map((item) => (
                        <div
                          key={item}
                          className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-gray-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-brand-orange/20 bg-brand-orange/10 px-5 py-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                        Mensagem da Alexia
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7 text-white">
                        {inlineQuizResult.leadHook}
                      </p>
                    </div>
                  </div>

                  {inlineQuizResult.primaryProduct && (
                    <div className="rounded-[30px] border border-orange-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                        Produto principal recomendado
                      </p>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                        <img
                          src={inlineQuizResult.primaryProduct.image}
                          alt={inlineQuizResult.primaryProduct.name}
                          className="h-48 w-full rounded-[24px] object-cover bg-gray-50 sm:h-32 sm:w-32"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xl font-black uppercase leading-tight text-brand-black">
                            {inlineQuizResult.primaryProduct.name}
                          </h4>
                          <p className="mt-2 text-sm leading-7 text-gray-600">
                            {getProductMarketingSummary(inlineQuizResult.primaryProduct).summary}
                          </p>
                          <p className="mt-3 text-2xl font-black text-brand-orange">
                            {formatPriceBRL(inlineQuizResult.primaryProduct.price)}
                          </p>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              onClick={() => onProductClick(inlineQuizResult.primaryProduct)}
                              className="rounded-full border border-brand-orange/20 bg-orange-50 px-5 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
                            >
                              Ver produto
                            </button>
                            <button
                              onClick={() => onAddToCart(inlineQuizResult.primaryProduct)}
                              className="btn-primary"
                            >
                              Comprar agora
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inlineQuizResult.secondaryProduct && (
                    <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                        Produto complementar
                      </p>
                      <h4 className="mt-2 text-lg font-black uppercase text-brand-black">
                        {inlineQuizResult.secondaryProduct.name}
                      </h4>
                      <p className="mt-2 text-sm leading-7 text-gray-600">
                        {getProductMarketingSummary(inlineQuizResult.secondaryProduct).summary}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="text-xl font-black text-brand-orange">
                          {formatPriceBRL(inlineQuizResult.secondaryProduct.price)}
                        </p>
                        <button
                          onClick={() => onAddToCart(inlineQuizResult.secondaryProduct)}
                          className="rounded-full border border-brand-orange/20 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
                        >
                          Incluir no pedido
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">
                        Próximo passo
                      </p>
                      {primaryQuizProductPrice && (
                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-orange">
                          Oferta ativa • {primaryQuizProductPrice}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-gray-700">
                      {inlineQuizResult.cta}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={scrollToQuizResult}
                        className="rounded-2xl border border-orange-100 bg-white px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.2em] text-brand-black transition-colors hover:text-white">
                          Confirmar meu plano
                        </span>
                        <span className="mt-2 block text-[11px] leading-5 text-gray-500 transition-colors hover:text-orange-100">
                          Releia a estratégia que mais combina com seu perfil antes de decidir.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => inlineQuizResult.primaryProduct && onProductClick(inlineQuizResult.primaryProduct)}
                        className="rounded-2xl border border-orange-100 bg-white px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.2em] text-brand-black transition-colors hover:text-white">
                          Ver oferta indicada
                        </span>
                        <span className="mt-2 block text-[11px] leading-5 text-gray-500 transition-colors hover:text-orange-100">
                          Abra {primaryQuizProductLabel} e veja benefícios, uso e composição.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuizPrimaryCheckout}
                        className="rounded-2xl border border-brand-orange bg-brand-orange px-4 py-4 text-center text-white shadow-[0_18px_40px_rgba(255,99,33,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600"
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.2em]">
                          Garantir meu kit agora
                        </span>
                        <span className="mt-2 block text-[11px] leading-5 text-orange-100">
                          Entre no checkout com {primaryQuizProductLabel}{primaryQuizProductPrice ? ` por ${primaryQuizProductPrice}` : ''} antes que a oferta mude.
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
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
              Treino, nutrição e estratégia na prática.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
              Conteúdos para ajudar você a entender melhor treino, alimentação,
              suplementação e escolhas mais seguras para a sua rotina.
            </p>
          </div>
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-2 self-start rounded-full bg-brand-black px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-brand-orange"
          >
            Ler conteúdos <ChevronRight size={16} />
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
                    Leitura em destaque
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
                    Ler matéria <ArrowUpRight size={16} />
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
          description="Indique os produtos L7 Fitness com seu link exclusivo, acesse materiais prontos e acompanhe sua evolução com apoio da marca."
          primaryLabel="Conhecer afiliados"
          secondaryLabel="Explorar loja"
          className="border-orange-300/60"
        />
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                Seleção da loja
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase text-brand-black sm:text-5xl">
              Os mais vendidos da loja.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
              Conheça os produtos mais procurados da loja e encontre opções
              para começar com mais clareza, praticidade e confiança.
            </p>
          </div>
          <button
            onClick={() => onNavigate('store')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-brand-orange/20 bg-orange-50 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
          >
            Explorar catálogo <ChevronRight size={16} />
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
                Seu próximo passo
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                Seu próximo passo pode começar com a Alexia.
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-600">
                Se quiser uma orientação mais certeira antes de comprar,
                comece pela análise da Alexia. Se já souber o que procura,
                siga para a loja e escolha o produto ideal para sua rotina.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                onClick={scrollToQuizForm}
                className="btn-primary whitespace-nowrap"
              >
                Fazer análise com a Alexia
              </button>
              <button
                onClick={() => onNavigate('store')}
                className="rounded-full border border-brand-orange/20 bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
              >
                Explorar produtos
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
