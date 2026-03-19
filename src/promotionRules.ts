import { Product } from './types';

export type ProductPromotionRule = {
  compareAtPrice?: number;
  campaignLabel?: string;
  ctaLabel?: string;
  customBadge?: string;
};

export const PRODUCT_PROMOTION_RULES: Record<string, ProductPromotionRule> = {
  'l7-ultra-450-kit': {
    compareAtPrice: 199.9,
    campaignLabel: 'Oferta da semana',
    ctaLabel: 'Quero este kit',
    customBadge: 'Kit econômico',
  },
  'l7-turbo-500-kit': {
    compareAtPrice: 229.9,
    campaignLabel: 'Mais pedido',
    ctaLabel: 'Escolher meu kit',
    customBadge: 'Energia + detox',
  },
  'l7-nitro-750-kit': {
    compareAtPrice: 249.9,
    campaignLabel: 'Alta intensidade',
    ctaLabel: 'Quero este combo',
    customBadge: 'Escolha avançada',
  },
  'l7-nitro-750-full': {
    compareAtPrice: 299.9,
    campaignLabel: 'Cuidado completo',
    ctaLabel: 'Garantir meu kit',
    customBadge: 'Rotina premium',
  },
  'l7-turbo-500-full': {
    compareAtPrice: 279.9,
    campaignLabel: 'Seleção premium',
    ctaLabel: 'Comprar com desconto',
    customBadge: 'Pele + resultado',
  },
};

export const getPromotionRuleForProduct = (product?: Partial<Product> | null): ProductPromotionRule | null => {
  if (!product?.id) return null;
  return PRODUCT_PROMOTION_RULES[String(product.id)] || null;
};

export const getDiscountPercentage = (price?: number | null, compareAtPrice?: number | null) => {
  const current = Number(price) || 0;
  const compare = Number(compareAtPrice) || 0;
  if (compare <= current || current <= 0) return 0;
  return Math.round(((compare - current) / compare) * 100);
};

export const applyPromotionToProduct = <T extends Partial<Product>>(product: T): T & {
  compareAtPrice?: number;
  discountPercentage?: number;
  promotionLabel?: string;
  promotionCta?: string;
  promotionBadge?: string;
} => {
  const rule = getPromotionRuleForProduct(product);
  const currentPrice = Number(product?.price) || 0;
  const compareAtPrice = Number((product as any)?.compareAtPrice ?? rule?.compareAtPrice) || 0;
  const discountPercentage = getDiscountPercentage(currentPrice, compareAtPrice);

  return {
    ...product,
    compareAtPrice: compareAtPrice > currentPrice ? compareAtPrice : undefined,
    discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
    promotionLabel: rule?.campaignLabel || (product as any)?.promotionLabel,
    promotionCta: rule?.ctaLabel || (product as any)?.promotionCta,
    promotionBadge: rule?.customBadge || (product as any)?.promotionBadge,
  };
};
