import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CheckCircle2,
  Clock3,
  Crown,
  HandCoins,
  Megaphone,
  Rocket,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { AffiliateRegistrationForm } from './AffiliateRegistrationForm';

const formatPrice = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

type AffiliateLandingProps = {
  onNavigate?: (page: string) => void;
};

const benefits = [
  {
    icon: BadgePercent,
    title: 'Comissão inicial de 10%',
    description: 'Cada venda aprovada gera comissão e pode crescer conforme volume, campanha e performance do afiliado.',
  },
  {
    icon: Megaphone,
    title: 'Materiais para divulgação',
    description: 'Você recebe apoio com argumentos, posicionamento, ideias de conteúdo, chamadas e links prontos para compartilhar.',
  },
  {
    icon: Clock3,
    title: 'Entrada rápida no programa',
    description: 'Depois do cadastro, o time analisa seu perfil e libera o acesso para começar a divulgar com mais segurança.',
  },
  {
    icon: Wallet,
    title: 'Escala de faturamento',
    description: 'Com rotina de conteúdo e tráfego orgânico ou pago, o programa pode virar uma nova frente de receita.',
  },
];

const steps = [
  {
    title: '1. Faça seu cadastro',
    description: 'Envie seus dados, e-mail, WhatsApp e o código de referência que deseja usar nos seus links.',
  },
  {
    title: '2. Receba aprovação',
    description: 'Após análise, seu perfil entra no programa e você passa a divulgar com rastreamento das vendas.',
  },
  {
    title: '3. Compartilhe seus links',
    description: 'Use o link da home, da loja e das ofertas para captar leads nas páginas, no blog e nas redes sociais.',
  },
  {
    title: '4. Acompanhe pedidos e ganhos',
    description: 'No painel do afiliado você acompanha cliques convertidos, pedidos, comissões e solicitações de saque.',
  },
];

const faq = [
  {
    question: 'Quem pode ser afiliado da L7 Fitness?',
    answer: 'Criadores de conteúdo, vendedores, influenciadores, profissionais do fitness, alunos, clientes e parceiros com audiência ou rede de contatos que combine com o público da marca.',
  },
  {
    question: 'Preciso comprar produtos para participar?',
    answer: 'Não. O foco do programa é indicação com link rastreável. Comprar pode ajudar na autoridade, mas não é obrigatório para entrar.',
  },
  {
    question: 'Como funciona o faturamento?',
    answer: 'Cada pedido aprovado vinculado ao seu código gera comissão. O valor final do mês depende de quantidade de vendas, ticket médio e taxa de conversão do seu tráfego.',
  },
  {
    question: 'Recebo suporte para divulgar?',
    answer: 'Sim. O objetivo é não deixar o afiliado sem direção. O programa prevê materiais, ideias de abordagem e apoio para acelerar suas primeiras vendas.',
  },
];

export const AffiliateLanding: React.FC<AffiliateLandingProps> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);

  const earningScenarios = useMemo(
    () => [
      {
        label: 'Início consistente',
        sales: 10,
        ticket: 159.9,
        summary: 'Para quem quer validar o canal e aprender a converter com constância.',
      },
      {
        label: 'Operação em crescimento',
        sales: 30,
        ticket: 189.9,
        summary: 'Indicado para afiliado com rotina de postagens, blog ou listas de transmissão.',
      },
      {
        label: 'Escala forte',
        sales: 60,
        ticket: 199.9,
        summary: 'Perfil de quem já tem audiência, bom volume de leads e campanhas recorrentes.',
      },
    ].map((scenario) => ({
      ...scenario,
      revenue: scenario.sales * scenario.ticket,
      commission: scenario.sales * scenario.ticket * 0.1,
    })),
    []
  );

  return (
    <div className="bg-white pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        <section className="overflow-hidden rounded-[40px] border border-orange-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.22),_transparent_30%),linear-gradient(135deg,_#0A0A0A_0%,_#1C1C1C_60%,_#2A2A2A_100%)] p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">
                <Crown size={14} className="text-brand-orange" /> Programa de afiliados L7 Fitness
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
                  Uma página feita para captar afiliados e explicar como transformar indicação em faturamento.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-gray-300">
                  Aqui o visitante entende por que vale a pena ser afiliado, como o programa funciona, qual é o potencial de ganhos e quais passos precisa seguir para entrar com segurança.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
                >
                  Quero me cadastrar <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => onNavigate?.('store')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Ver loja
                </button>
                <button
                  onClick={() => onNavigate?.('blog')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
                >
                  Ver blog
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">Posicionamento</p>
                <h2 className="mt-3 text-2xl font-black uppercase">Você divulga. O site vende. O sistema rastreia.</h2>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  A proposta é simples: levar visitantes para páginas preparadas para converter, capturar o código do afiliado e atribuir a venda quando o pedido for aprovado.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">10%</p>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-orange-200">Comissão inicial</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">24h/72h</p>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-orange-200">Análise e ativação</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[30px] border border-gray-100 bg-white p-7 shadow-sm">
                <div className="mb-5 inline-flex rounded-2xl bg-orange-50 p-3 text-brand-orange">
                  <Icon size={22} />
                </div>
                <h2 className="mb-3 text-xl font-black uppercase text-brand-black">{item.title}</h2>
                <p className="text-sm leading-7 text-gray-600">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[36px] border border-gray-100 bg-gray-50 p-8">
            <div className="max-w-xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange border border-orange-100">
                <Rocket size={14} /> Por que entrar agora
              </span>
              <h2 className="text-3xl font-black uppercase text-brand-black">Por que ser afiliado da L7 Fitness?</h2>
              <p className="text-base leading-8 text-gray-600">
                Porque a operação já pode usar a estrutura do site para converter: home, loja, blog, campanhas e checkout registram a referência do afiliado. Isso reduz atrito, melhora rastreio e cria uma jornada clara para o visitante comprar.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {[
                'Você monetiza audiência, conteúdo, grupos, listas e indicações pessoais.',
                'Pode trabalhar com tráfego orgânico, blog, redes sociais, WhatsApp ou atendimento direto.',
                'Tem apoio com discurso comercial e páginas preparadas para conversão.',
                'Consegue acompanhar performance no painel e visualizar potencial de escala.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-100">
                  <CheckCircle2 size={18} className="text-brand-orange mt-1 shrink-0" />
                  <p className="text-sm leading-7 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-orange-100 bg-white p-8 shadow-sm">
            <div className="space-y-3 mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange">
                <Users size={14} /> Como funciona
              </span>
              <h2 className="text-3xl font-black uppercase text-brand-black">Da inscrição ao primeiro saque</h2>
            </div>

            <div className="space-y-5">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-[28px] border border-gray-100 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-black text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase text-brand-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[40px] border border-gray-100 bg-brand-black p-8 sm:p-10 text-white shadow-2xl">
          <div className="max-w-3xl space-y-4 mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 border border-white/10">
              <BarChart3 size={14} className="text-brand-orange" /> Simulação de faturamento
            </span>
            <h2 className="text-3xl font-black uppercase">Quanto dá para faturar como afiliado?</h2>
            <p className="text-base leading-8 text-gray-300">
              Os valores abaixo são simulações simples com comissão inicial de 10%. O resultado real depende do ticket médio, qualidade do tráfego, consistência das ofertas e taxa de aprovação dos pedidos.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {earningScenarios.map((scenario) => (
              <div key={scenario.label} className="rounded-[30px] border border-white/10 bg-white/5 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">{scenario.label}</p>
                <h3 className="mt-3 text-2xl font-black uppercase">{scenario.sales} vendas/mês</h3>
                <p className="mt-3 text-sm leading-7 text-gray-300">{scenario.summary}</p>

                <div className="mt-6 space-y-3 rounded-[24px] bg-black/20 p-4 border border-white/5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-400">Ticket médio</span>
                    <strong className="text-white">{formatPrice(scenario.ticket)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-400">Faturamento gerado</span>
                    <strong className="text-white">{formatPrice(scenario.revenue)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-400">Comissão estimada</span>
                    <strong className="text-brand-orange">{formatPrice(scenario.commission)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="space-y-3 mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange">
                <HandCoins size={14} /> O que você recebe
              </span>
              <h2 className="text-3xl font-black uppercase text-brand-black">Estrutura para vender com mais confiança</h2>
            </div>

            <div className="space-y-4">
              {[
                'Link rastreável da home e da loja para divulgar em qualquer canal.',
                'Páginas com argumento comercial, produtos e ofertas já preparadas.',
                'Painel com pedidos, ganhos, comissões pendentes e valores disponíveis.',
                'Solicitação de saque e acompanhamento do histórico financeiro.',
                'Apoio para posicionamento, criativos e chamadas de conversão.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <ShieldCheck size={18} className="mt-1 shrink-0 text-brand-orange" />
                  <p className="text-sm leading-7 text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-gray-100 bg-gray-50 p-8">
            <div className="space-y-3 mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange border border-orange-100">
                <CheckCircle2 size={14} /> Perfil ideal
              </span>
              <h2 className="text-3xl font-black uppercase text-brand-black">Quem tende a performar melhor</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Influenciadores e creators de nicho fitness',
                'Blogueiros e editores de conteúdo',
                'Profissionais que atendem clientes no WhatsApp',
                'Afiliados com foco em tráfego pago ou orgânico',
                'Clientes satisfeitos que gostam de indicar',
                'Parceiros comerciais com base ativa de contatos',
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-gray-100 bg-white p-4 text-sm font-semibold leading-7 text-gray-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[40px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 sm:p-10">
          <div className="max-w-3xl space-y-4 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange border border-orange-100">
              <Users size={14} /> Perguntas frequentes
            </span>
            <h2 className="text-3xl font-black uppercase text-brand-black">Tudo o que o futuro afiliado precisa entender antes de entrar</h2>
          </div>

          <div className="space-y-4">
            {faq.map((item) => (
              <details key={item.question} className="group rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
                <summary className="cursor-pointer list-none text-lg font-black uppercase text-brand-black">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-[40px] border border-gray-100 bg-brand-black p-8 sm:p-10 text-white shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 border border-white/10">
                <Rocket size={14} className="text-brand-orange" /> Próximo passo
              </span>
              <h2 className="text-3xl font-black uppercase">Se fizer sentido para seu perfil, a melhor hora de entrar é agora.</h2>
              <p className="text-base leading-8 text-gray-300">
                Cadastre-se para análise e comece com uma estrutura já pronta para captar leads, apresentar produtos e acompanhar o crescimento das suas comissões.
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-7 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
            >
              Solicitar entrada <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      {showForm && <AffiliateRegistrationForm onClose={() => setShowForm(false)} />}
    </div>
  );
};
