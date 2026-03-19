import React from 'react';
import { ArrowRight, BadgePercent, Gift, Megaphone, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

type AffiliatePromoCardProps = {
  onNavigate: (page: string) => void;
  badge?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  variant?: 'full' | 'inline';
  className?: string;
};

const highlights = [
  {
    icon: BadgePercent,
    title: 'Comissão real',
    description: 'Comece com 10% por venda aprovada e evolua conforme seu volume crescer.',
  },
  {
    icon: Megaphone,
    title: 'Materiais prontos',
    description: 'Receba criativos, argumentos e links para divulgar com mais facilidade.',
  },
  {
    icon: Wallet,
    title: 'Escala de ganhos',
    description: 'Quanto mais você indicar, maior pode ser o potencial de ganhos.',
  },
];

export const AffiliatePromoCard: React.FC<AffiliatePromoCardProps> = ({
  onNavigate,
  badge = 'Programa de afiliados',
  title = 'Indique produtos L7 Fitness e acompanhe seus ganhos com apoio da marca.',
  description = 'Divulgue com seu link exclusivo, use materiais prontos e acompanhe a evolução das suas indicações com mais clareza.',
  primaryLabel = 'Quero ser afiliado',
  secondaryLabel = 'Ver produtos da loja',
  variant = 'full',
  className = '',
}) => {
  if (variant === 'inline') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={`rounded-[28px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm ${className}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white">
              <Gift size={14} /> {badge}
            </span>
            <h3 className="text-2xl font-black leading-tight text-brand-black">
              {title}
            </h3>
            <p className="text-sm leading-7 text-gray-600">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[240px]">
            <button
              onClick={() => onNavigate('affiliate-program')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
            >
              {primaryLabel} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('store')}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-6 py-3 text-sm font-black uppercase tracking-widest text-gray-700 transition hover:border-brand-orange hover:text-brand-orange"
            >
              {secondaryLabel}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.section
      whileHover={{ y: -4 }}
      className={`overflow-hidden rounded-[36px] border border-orange-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,0,0.18),_transparent_35%),linear-gradient(135deg,_#0A0A0A_0%,_#171717_55%,_#262626_100%)] p-8 text-white shadow-2xl ${className}`}
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 border border-white/10">
            <Gift size={14} className="text-brand-orange" /> {badge}
          </span>
          <div className="space-y-4">
            <h2 className="max-w-3xl text-3xl font-black uppercase leading-tight sm:text-4xl">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-8 text-gray-300">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('affiliate-program')}
              className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-orange-600"
            >
              {primaryLabel} <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('store')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:border-brand-orange hover:text-brand-orange"
            >
              {secondaryLabel}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-3 inline-flex rounded-2xl bg-brand-orange/15 p-3 text-brand-orange">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-black uppercase">{item.title}</h3>
                <p className="text-sm leading-7 text-gray-300">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};