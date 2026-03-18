import React from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
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
  const spotlightProduct = products.find((product) => hasProductPromotion(product)) || products[0];
  const heroPost = latestPosts[0];
  const catalogCategories = Array.from(
    new Set(
      products.flatMap((product) => (
        product.categories?.length
          ? product.categories
          : product.category
            ? [product.category]
            : []
      )),
    ),
  );
  const reviewVolume = products.reduce((total, product) => total + (product.reviews || 0), 0);

  const quickStats = [
    {
      value: `${products.length}+`,
      label: 'produtos com oferta mais clara e percepção premium',
      icon: Sparkles,
    },
    {
      value: `${catalogCategories.length || 1}`,
      label: 'frentes de catálogo organizadas para facilitar decisão',
      icon: BarChart3,
    },
    {
      value: `${reviewVolume}+`,
      label: 'avaliações somadas para reforçar confiança de compra',
      icon: Star,
    },
  ];

  const experienceBlocks = [
    {
      title: 'Direção de arte mais premium',
      description: 'Camadas, contraste e hierarquia visual para transformar a primeira impressão em desejo real de compra.',
      icon: Sparkles,
    },
    {
      title: 'Jornada comercial organizada',
      description: 'A home conduz para loja, conteúdo e programa de afiliados com blocos mais limpos e estratégicos.',
      icon: BarChart3,
    },
    {
      title: 'Oferta com mais autoridade',
      description: 'Produtos e conteúdos aparecem com mais contexto, valor percebido e gatilhos de confiança.',
      icon: ShieldCheck,
    },
    {
      title: 'Programa de afiliados visível',
      description: 'Captação posicionada como nova fonte de receita para aumentar ticket e recorrência do tráfego.',
      icon: Users,
    },
  ];

  const brandPillars = [
    'Curadoria de suplementos para performance e rotina',
    'Conteúdo que prepara a decisão antes do checkout',
    'Afiliados como canal de crescimento e recorrência',
  ];

  const storeBenefits = [
    'Produtos destacados com preço, benefício e prova social na mesma dobra.',
    'Transição clara entre descoberta, detalhes do produto e checkout.',
    'Visual mais consistente para elevar percepção de marca e ticket médio.',
  ];

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#070707_0%,#101010_14%,#f6f1eb_14%,#fffaf6_45%,#ffffff_100%)] pb-24">
      <section className="relative overflow-hidden pt-32 pb-20 lg:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-14 h-72 w-72 rounded-full bg-brand-orange/20 blur-3xl" />
          <div className="absolute right-[-4%] top-10 h-96 w-96 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-[58%] h-48 bg-gradient-to-b from-transparent to-[#f6f1eb]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">
                <Flame size={14} /> L7 Fitness Performance Store
              </span>

              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] text-white sm:text-6xl lg:text-7xl">
                Uma home mais <span className="text-brand-orange">premium</span>, organizada e pronta para vender melhor.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
                Reestruturamos a experiência para deixar a marca mais profissional, destacar produtos com mais valor percebido e abrir caminhos claros para compra, conteúdo e afiliados.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('store')}
                  className="btn-primary inline-flex items-center gap-2 shadow-[0_20px_40px_rgba(255,99,33,0.24)]"
                >
                  Comprar agora <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('affiliate-program')}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Quero faturar como afiliado
                </button>
                <button
                  onClick={() => onNavigate('blog')}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-200 transition hover:border-white/30 hover:text-white"
                >
                  Ler conteúdos estratégicos
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {quickStats.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-[0_15px_30px_rgba(255,99,33,0.3)]">
                        <Icon size={18} />
                      </div>
                      <p className="text-2xl font-black text-white">{item.value}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-400">{item.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {brandPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 backdrop-blur-sm"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-8 top-8 hidden h-36 w-36 rounded-full bg-brand-orange/20 blur-3xl lg:block" />
              <div className="relative rounded-[36px] border border-white/10 bg-white/6 p-4 shadow-[0_35px_100px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#161616]">
                  {spotlightProduct ? (
                    <img
                      src={spotlightProduct.image}
                      alt={spotlightProduct.name}
                      className="h-[500px] w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-[500px] items-center justify-center text-sm font-bold uppercase tracking-widest text-gray-500">
                      Produto em destaque
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-x-4 bottom-4 top-4 rounded-[30px] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {spotlightProduct && (
                  <div className="absolute inset-x-8 bottom-8 text-white">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-orange">Produto em destaque</p>
                        <h2 className="mt-3 text-3xl font-black uppercase leading-tight">{spotlightProduct.name}</h2>
                        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-7 text-gray-300">
                          {spotlightProduct.description}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-300">Oferta atual</p>
                        <p className="mt-2 text-3xl font-black text-brand-orange">{formatPriceBRL(spotlightProduct.price)}</p>
                        {hasProductPromotion(spotlightProduct) && (
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-gray-400 line-through">
                              {formatPriceBRL(spotlightProduct.compareAtPrice)}
                            </span>
                            <span className="rounded-full bg-brand-orange px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                              {spotlightProduct.discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => onProductClick(spotlightProduct)}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-brand-black transition hover:bg-brand-orange hover:text-white"
                      >
                        Ver oferta <ArrowUpRight size={14} />
                      </button>
                      {spotlightProduct.stock > 0 && (
                        <button
                          onClick={() => onAddToCart(spotlightProduct)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                        >
                          Adicionar ao carrinho <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[28px] border border-white/10 bg-[#121212] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Leitura da marca</p>
                  <div className="mt-4 space-y-3">
                    {[
                      'Hero mais limpo com CTA imediato para compra.',
                      'Oferta, conteúdo e afiliação na mesma narrativa visual.',
                      'Mais contraste e profundidade para parecer uma marca maior.',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                        <CheckCircle2 size={16} className="mt-0.5 text-brand-orange" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {heroPost && (
                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 text-white backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-orange">Conteúdo para aquecer audiência</p>
                    <p className="mt-3 text-xl font-black leading-tight">{heroPost.title}</p>
                    <p className="mt-3 text-sm leading-7 text-gray-300">{heroPost.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 text-xs uppercase tracking-widest text-gray-400">
                      <span>{heroPost.category}</span>
                      <span>{heroPost.readTime}</span>
                    </div>
                    <button
                      onClick={() => onPostClick(heroPost)}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/85 transition hover:text-brand-orange"
                    >
                      Ler agora <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-2 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[34px] border border-orange-100 bg-white p-7 shadow-[0_25px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">Arquitetura da experiência</p>
                <h2 className="mt-3 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                  A primeira dobra ficou mais sólida, elegante e comercial.
                </h2>
              </div>
              <div className="rounded-[22px] bg-orange-50 px-4 py-3 text-sm font-semibold text-brand-orange">
                Visual mais limpo, mais premium e com CTA mais claro.
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {experienceBlocks.map((block) => {
                const Icon = block.icon;

                return (
                  <div
                    key={block.title}
                    className="rounded-[28px] border border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff8f3_100%)] p-6"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-orange to-orange-400 text-white shadow-[0_18px_40px_rgba(255,99,33,0.2)]">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-black text-brand-black">{block.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{block.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[34px] bg-brand-black p-7 text-white shadow-[0_25px_60px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">Leituras rápidas da nova home</p>
            <div className="mt-6 space-y-4">
              {[
                {
                  label: 'Catálogo destacado',
                  value: `${featuredProducts.length} cards iniciais`,
                  icon: Zap,
                },
                {
                  label: 'Conteúdo em evidência',
                  value: `${latestPosts.length} pautas logo na home`,
                  icon: BarChart3,
                },
                {
                  label: 'Canal de crescimento',
                  value: 'Afiliados com visibilidade comercial',
                  icon: DollarSign,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-white">{item.label}</p>
                      <p className="mt-1 text-sm leading-7 text-gray-300">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <AffiliatePromoCard
          onNavigate={onNavigate}
          badge="Captação de afiliados"
          title="A home agora apresenta a parceria L7 Fitness com mais autoridade e muito mais apelo comercial."
          description="Quem entra no site já percebe uma marca mais estruturada, uma oferta mais refinada e um caminho direto para entender o programa, visualizar ganhos e iniciar o cadastro."
          primaryLabel="Conhecer programa"
          secondaryLabel="Ver produtos"
          className="border-orange-300/60"
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:items-start">
          <div className="rounded-[34px] border border-orange-100 bg-white p-7 shadow-[0_25px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">Loja em destaque</p>
            <h2 className="mt-3 text-4xl font-black uppercase text-brand-black">
              Vitrine com mais impacto visual e cara de marca premium.
            </h2>
            <p className="mt-4 text-base leading-8 text-gray-600">
              O foco aqui é abrir a jornada com produtos fortes, prova social e atalhos claros para avançar com mais confiança até o checkout.
            </p>

            <div className="mt-8 space-y-3">
              {storeBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-orange-50 px-4 py-4 text-sm leading-7 text-gray-700">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-brand-orange" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('store')}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-orange-50 px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
            >
              Ver catálogo completo <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">Conteúdo com função comercial</p>
            <h2 className="mt-3 text-4xl font-black uppercase text-brand-black sm:text-5xl">
              Artigos que reforçam autoridade, aquecem lead e sustentam conversão.
            </h2>
          </div>
          <button
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-2 self-start rounded-full bg-brand-black px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-brand-orange"
          >
            Acessar blog <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="overflow-hidden rounded-[36px] bg-brand-black text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            {heroPost ? (
              <>
                <div className="aspect-[16/10] overflow-hidden border-b border-white/10">
                  <img
                    src={heroPost.image}
                    alt={heroPost.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 sm:p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">Post em destaque</p>
                  <h3 className="mt-4 text-3xl font-black uppercase leading-tight">{heroPost.title}</h3>
                  <p className="mt-5 text-base leading-8 text-gray-300">{heroPost.excerpt}</p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {[
                      'Temas que educam antes da compra',
                      'Autoridade para a marca parecer maior',
                      'Gancho natural para afiliados e ofertas',
                    ].map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onPostClick(heroPost)}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
                  >
                    Ler artigo <ArrowUpRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-sm text-gray-300">Adicione conteúdos para destacar o blog na home.</div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {(secondaryPosts.length ? secondaryPosts : latestPosts).map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                onClick={onPostClick}
                onAffiliateClick={() => onNavigate('affiliate-program')}
              />
            ))}

            <div className="rounded-[30px] border border-orange-100 bg-[linear-gradient(180deg,#fff8f3_0%,#ffffff_100%)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] md:col-span-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-orange">Por que isso melhora a home</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: 'Mais autoridade',
                    description: 'Conteúdo bem posicionado faz a marca parecer mais sólida e confiável.',
                  },
                  {
                    title: 'Mais retenção',
                    description: 'O visitante encontra motivo para continuar navegando sem se perder.',
                  },
                  {
                    title: 'Mais conversão',
                    description: 'A jornada ganha contexto antes do clique em produto ou afiliados.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
                    <p className="text-lg font-black text-brand-black">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[40px] border border-orange-100 bg-[linear-gradient(135deg,#fff7f0_0%,#ffffff_42%,#fff2e7_100%)] p-8 shadow-[0_25px_70px_rgba(255,99,33,0.08)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-orange">Próximo passo</p>
              <h2 className="mt-3 text-3xl font-black uppercase text-brand-black sm:text-4xl">
                A home já passa mais confiança. Agora ela também fecha a jornada com clareza.
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-600 sm:text-lg">
                O visitante escolhe rapidamente entre entrar na loja ou ativar uma frente de receita com o programa de afiliados, sem ruído visual e com muito mais consistência de marca.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button onClick={() => onNavigate('store')} className="btn-primary whitespace-nowrap">
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
