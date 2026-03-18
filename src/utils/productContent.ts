import type { ComponentType } from 'react';
import { Droplets, Leaf, Pill, Sparkles } from 'lucide-react';
import { Product } from '../types';

export type ProductSalesCopy = {
  summary: string;
  purpose: string;
  composition: string;
};

export type ProductDescriptionSections = {
  summary: string;
  purpose: string;
  composition: string;
};

export type ProductAdminContent = {
  summary: string;
  purpose: string;
  kitContents: string;
  composition: string;
  capsules: string;
  usage: string;
  details: string;
  hasStructuredContent: boolean;
};

export type ProductAIAssistantResult = {
  summary: string;
  purpose: string;
  kitContents: string;
  composition: string;
  capsules: string;
  usage: string;
  details: string;
  promotionLabel: string;
  promotionBadge: string;
  promotionCta: string;
  adsHeadline: string;
  adsPrimaryText: string;
  adsDescription: string;
};

export type ProductCompositionPanel = {
  id: string;
  label: string;
  title: string;
  purpose: string;
  composition: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconAccent: string;
  surfaceAccent: string;
};

const PRODUCT_COPY: Record<string, ProductSalesCopy> = {
  'l7-ultra-450-kit': {
    summary: 'Kit pensado para quem busca emagrecimento com mais equilíbrio, combinando controle do apetite com suporte detox na rotina.',
    purpose: 'O L7 Ultra 450mg ajuda na saciedade e no controle da fome. O Detox entra como apoio para rotina digestiva, sensação de leveza e constância no processo.',
    composition: 'Composição principal: L7 Ultra 450mg + Detox. Destaques citados no produto: Laranja Moro, L-Carnitina e Psyllium.',
  },
  'l7-turbo-500-kit': {
    summary: 'Kit voltado para quem quer emagrecer com mais energia no dia a dia e um apoio detox complementar.',
    purpose: 'O L7 Turbo 500mg é indicado para acelerar a rotina e melhorar disposição. O Detox complementa com suporte para retenção, leveza e aderência ao plano.',
    composition: 'Composição principal: L7 Turbo 500mg + Detox.',
  },
  'l7-ultra-450': {
    summary: 'Produto para quem quer um apoio mais equilibrado no controle do apetite e na constância da dieta.',
    purpose: 'Ajuda a reduzir fome excessiva e melhorar saciedade, favorecendo adesão alimentar ao longo do dia.',
    composition: 'Composição destacada: Laranja Moro, L-Carnitina e Psyllium.',
  },
  'l7-nitro-750-kit': {
    summary: 'Kit mais forte para quem quer foco maior em saciedade, metabolismo e resultado mais agressivo no emagrecimento.',
    purpose: 'O L7 Nitro 750mg atua como produto principal para controle do apetite e apoio à queima de gordura. O Detox complementa ajudando na rotina digestiva e na sensação de menos inchaço.',
    composition: 'Composição principal: L7 Nitro 750mg + Detox Shake.',
  },
  'l7-nitro-750': {
    summary: 'Versão individual para quem busca um termogênico com foco em saciedade alta e apoio na gordura abdominal.',
    purpose: 'Indicado para controlar fome, manter foco no plano e intensificar o suporte ao emagrecimento.',
    composition: 'Composição principal: L7 Nitro 750mg.',
  },
  'l7-turbo-500': {
    summary: 'Produto individual para quem quer emagrecimento com mais energia e melhor rendimento na rotina.',
    purpose: 'Ajuda a dar disposição para o dia a dia e apoia o gasto calórico com uso mais prático e direto.',
    composition: 'Composição principal: L7 Turbo 500mg.',
  },
  'l7-nitro-750-full': {
    summary: 'Combo mais completo para emagrecimento, unindo produto principal forte, detox e suporte extra para pele e articulações.',
    purpose: 'O L7 Nitro 750mg foca em saciedade e queima de gordura. O Detox ajuda na rotina digestiva e sensação de leveza. O Colágeno entra como apoio para firmeza da pele e cuidado articular durante o processo.',
    composition: 'Composição principal: L7 Nitro 750mg + Detox + Colágeno.',
  },
  'l7-turbo-500-full': {
    summary: 'Kit completo para quem quer emagrecer com energia, suporte detox e cuidado complementar com pele e articulações.',
    purpose: 'O L7 Turbo 500mg apoia disposição e rotina de queima calórica. O Detox ajuda na sensação de leveza. O Colágeno complementa com suporte para firmeza da pele e articulações.',
    composition: 'Composição principal: L7 Turbo 500mg + Detox + Colágeno.',
  },
};

const EMPTY_PRODUCT_ADMIN_CONTENT: ProductAdminContent = {
  summary: '',
  purpose: '',
  kitContents: '',
  composition: '',
  capsules: '',
  usage: '',
  details: '',
  hasStructuredContent: false,
};

export const normalizeProductText = (value: string) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const normalizeMarkdownContent = (value: string) => String(value || '')
  .replace(/\r/g, '')
  .replace(/\\n/g, '\n')
  .replace(/\\t/g, '  ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const toPlainProductCopy = (value: string) => String(value || '')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
  .replace(/[•\-]\s*/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export const parseStructuredProductContent = (description?: string | null): ProductAdminContent => {
  const raw = String(description || '').replace(/\r/g, '').trim();

  if (!raw) return { ...EMPTY_PRODUCT_ADMIN_CONTENT };

  const markerPattern = /\[\[(summary|purpose|kitContents|composition|capsules|usage|details)\]\]\s*([\s\S]*?)(?=\n\[\[|$)/gi;
  const markerMatches = [...raw.matchAll(markerPattern)];

  if (markerMatches.length > 0) {
    const structured = markerMatches.reduce((acc, match) => {
      const key = String(match[1] || '').trim() as keyof ProductAdminContent;
      const value = String(match[2] || '').trim();

      if (key in acc) {
        (acc as any)[key] = value;
      }

      return acc;
    }, { ...EMPTY_PRODUCT_ADMIN_CONTENT, hasStructuredContent: true });

    return structured;
  }

  const basic = extractProductDescriptionSections(raw);

  return {
    ...EMPTY_PRODUCT_ADMIN_CONTENT,
    summary: basic.summary,
    purpose: basic.purpose,
    composition: basic.composition,
    details: raw,
  };
};

export const buildStructuredProductContent = (content: ProductAdminContent) => {
  const sections: Array<[Exclude<keyof ProductAdminContent, 'hasStructuredContent'>, string]> = [
    ['summary', content.summary],
    ['purpose', content.purpose],
    ['kitContents', content.kitContents],
    ['composition', content.composition],
    ['capsules', content.capsules],
    ['usage', content.usage],
    ['details', content.details],
  ];

  return sections
    .map(([key, value]) => [key, String(value || '').trim()] as const)
    .filter(([, value]) => value)
    .map(([key, value]) => `[[${key}]]\n${value}`)
    .join('\n\n');
};

export const extractProductDescriptionSections = (description?: string | null): ProductDescriptionSections => {
  const raw = String(description || '').trim();

  if (!raw) {
    return {
      summary: '',
      purpose: '',
      composition: '',
    };
  }

  const normalized = raw.replace(/\r/g, '');
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanLine = (value: string) => value
    .replace(/^[•*\-#\d.\s]+/, '')
    .replace(/^para que serve\s*:?\s*/i, '')
    .replace(/^funcao\s*:?\s*/i, '')
    .replace(/^fun[cç][aã]o\s*:?\s*/i, '')
    .replace(/^composi[cç][aã]o\s*:?\s*/i, '')
    .replace(/^ingredientes\s*:?\s*/i, '')
    .trim();

  const purposeLine = lines.find((line) => /^para que serve\s*:|^funcao\s*:|^fun[cç][aã]o\s*:/i.test(line));
  const compositionLine = lines.find((line) => /^composi[cç][aã]o\s*:|^ingredientes\s*:/i.test(line));
  const unlabeledLines = lines.filter((line) => !/^para que serve\s*:|^funcao\s*:|^fun[cç][aã]o\s*:|^composi[cç][aã]o\s*:|^ingredientes\s*:/i.test(line));
  const summary = unlabeledLines.length > 0 ? unlabeledLines.join(' ') : cleanLine(lines[0] || '');

  return {
    summary,
    purpose: purposeLine ? cleanLine(purposeLine) : '',
    composition: compositionLine ? cleanLine(compositionLine) : '',
  };
};

export const getProductMarketingSummary = (product?: Product | null): ProductSalesCopy => {
  if (!product) {
    return { summary: '', purpose: '', composition: '' };
  }

  const structuredContent = parseStructuredProductContent(product.description);

  if (structuredContent.hasStructuredContent) {
    const fallbackSource = normalizeProductText(`${product.name} ${product.description} ${product.category || ''}`);
    const hasDetox = fallbackSource.includes('detox');
    const hasCollagen = fallbackSource.includes('colageno');

    return {
      summary: structuredContent.summary || 'Produto premium da L7 Fitness com foco em resultado e rotina consistente.',
      purpose: structuredContent.purpose || `Indicado para ${product.category || 'rotina fitness'}${hasDetox ? ' com apoio detox' : ''}${hasCollagen ? ' e suporte complementar para pele e articulações' : ''}.`,
      composition: structuredContent.kitContents || structuredContent.composition || `Composição principal: ${product.name.replace(/^1\s*/i, '')}.`,
    };
  }

  if (PRODUCT_COPY[product.id]) return PRODUCT_COPY[product.id];

  const descriptionSections = extractProductDescriptionSections(product.description);

  if (descriptionSections.summary) {
    const fallbackSource = normalizeProductText(`${product.name} ${product.description} ${product.category || ''}`);
    const hasDetox = fallbackSource.includes('detox');
    const hasCollagen = fallbackSource.includes('colageno');

    return {
      summary: descriptionSections.summary,
      purpose: descriptionSections.purpose || `Indicado para ${product.category || 'rotina fitness'}${hasDetox ? ' com apoio detox' : ''}${hasCollagen ? ' e suporte complementar para pele e articulações' : ''}.`,
      composition: descriptionSections.composition || `Composição principal: ${product.name.replace(/^1\s*/i, '')}.`,
    };
  }

  const firstSentence = String(product.description || '').split(/[.!?]/).find(Boolean)?.trim() || 'Produto indicado para uma rotina mais consistente e objetiva';
  const source = normalizeProductText(`${product.name} ${product.description} ${product.category || ''}`);
  const hasDetox = source.includes('detox');
  const hasCollagen = source.includes('colageno');

  return {
    summary: `${firstSentence}.`,
    purpose: `Indicado para ${product.category || 'rotina fitness'}${hasDetox ? ' com apoio detox' : ''}${hasCollagen ? ' e suporte complementar para pele e articulações' : ''}.`,
    composition: `Composição principal: ${product.name.replace(/^1\s*/i, '')}.`,
  };
};

export const getProductDetailContent = (product?: Product | null) => {
  const marketing = getProductMarketingSummary(product);
  const structured = parseStructuredProductContent(product?.description);
  const source = normalizeProductText(`${product?.name || ''} ${product?.description || ''}`);
  const isKit = source.includes('kit') || source.includes('combo') || source.includes('full') || source.includes('detox') || source.includes('colageno');

  return {
    summary: structured.summary || marketing.summary,
    purpose: structured.purpose || marketing.purpose,
    kitContents: structured.kitContents || marketing.composition || (isKit ? 'Veja os itens incluídos neste kit.' : `O que vem: ${String(product?.name || '').replace(/^1\s*/i, '')}.`),
    composition: structured.composition || marketing.composition,
    capsules: structured.capsules || 'Confira a embalagem para a quantidade por cápsula, porção e volume total do frasco.',
    usage: structured.usage || 'Use conforme a orientação do rótulo e com acompanhamento profissional quando necessário.',
    details: structured.details || structured.summary || marketing.summary,
  };
};

export const getProductCompositionPanels = (product?: Product | null): ProductCompositionPanel[] => {
  if (!product) return [];

  const structured = parseStructuredProductContent(product.description);
  const summary = getProductMarketingSummary(product);

  if (structured.hasStructuredContent) {
    const kitItems = String(structured.kitContents || '')
      .replace(/\r/g, '')
      .split(/\n|\+/)
      .map((item) => item.replace(/^[•*\-\d.\s]+/, '').trim())
      .filter(Boolean);

    if (kitItems.length > 1) {
      return kitItems.slice(0, 4).map((item, index) => ({
        id: `${product.id}-item-${index}`,
        label: index === 0 ? 'Principal' : 'Complemento',
        title: item,
        purpose: structured.purpose || summary.purpose,
        composition: structured.composition || structured.kitContents || summary.composition,
        icon: index === 0 ? Pill : index % 2 === 0 ? Droplets : Leaf,
        iconAccent: index === 0 ? 'from-orange-500 via-amber-400 to-yellow-300' : index % 2 === 0 ? 'from-cyan-500 via-sky-400 to-teal-300' : 'from-emerald-500 via-lime-400 to-green-300',
        surfaceAccent: index === 0 ? 'from-orange-50 via-white to-amber-50' : index % 2 === 0 ? 'from-cyan-50 via-white to-teal-50' : 'from-emerald-50 via-white to-lime-50',
      }));
    }

    return [{
      id: product.id,
      label: 'Fórmula',
      title: product.name.replace(/^1\s*/i, ''),
      purpose: structured.purpose || summary.purpose,
      composition: structured.composition || structured.kitContents || summary.composition,
      icon: Pill,
      iconAccent: 'from-orange-500 via-amber-400 to-yellow-300',
      surfaceAccent: 'from-orange-50 via-white to-amber-50',
    }];
  }

  switch (product.id) {
    case 'l7-ultra-450-kit':
      return [
        { id: 'l7-ultra', label: 'Principal', title: 'L7 Ultra 450mg', purpose: 'Ajuda na saciedade, no controle da fome e na constância da dieta ao longo do dia.', composition: 'Destaques citados no produto: Laranja Moro, L-Carnitina e Psyllium.', icon: Pill, iconAccent: 'from-orange-500 via-amber-400 to-yellow-300', surfaceAccent: 'from-orange-50 via-white to-amber-50' },
        { id: 'detox', label: 'Complemento', title: 'Detox', purpose: 'Complementa a rotina com apoio digestivo, sensação de leveza e menor percepção de inchaço.', composition: 'Blend detox para reforçar leveza, regularidade e aderência ao processo de emagrecimento.', icon: Leaf, iconAccent: 'from-emerald-500 via-lime-400 to-green-300', surfaceAccent: 'from-emerald-50 via-white to-lime-50' },
      ];
    case 'l7-turbo-500-kit':
      return [
        { id: 'l7-turbo', label: 'Principal', title: 'L7 Turbo 500mg', purpose: 'Foi pensado para quem quer mais energia no dia a dia e apoio à rotina de queima calórica.', composition: 'Fórmula principal 500mg com foco em disposição, rotina ativa e emagrecimento mais dinâmico.', icon: Pill, iconAccent: 'from-orange-500 via-rose-400 to-yellow-300', surfaceAccent: 'from-orange-50 via-white to-rose-50' },
        { id: 'detox', label: 'Complemento', title: 'Detox', purpose: 'Ajuda na sensação de leveza, retenção e consistência durante o uso do kit.', composition: 'Blend detox pensado para rotina digestiva mais confortável e percepção corporal mais leve.', icon: Leaf, iconAccent: 'from-emerald-500 via-lime-400 to-green-300', surfaceAccent: 'from-emerald-50 via-white to-lime-50' },
      ];
    case 'l7-nitro-750-kit':
      return [
        { id: 'l7-nitro', label: 'Principal', title: 'L7 Nitro 750mg', purpose: 'Entrega foco mais intenso em saciedade, metabolismo e apoio ao emagrecimento mais agressivo.', composition: 'Fórmula concentrada 750mg com perfil voltado para controle do apetite e suporte termogênico.', icon: Pill, iconAccent: 'from-fuchsia-500 via-orange-400 to-amber-300', surfaceAccent: 'from-fuchsia-50 via-white to-orange-50' },
        { id: 'detox-shake', label: 'Complemento', title: 'Detox Shake', purpose: 'Ajuda a complementar a rotina digestiva, melhorar a sensação de leveza e reduzir a percepção de inchaço.', composition: 'Shake detox complementar para suporte diário, retenção e constância no processo.', icon: Droplets, iconAccent: 'from-cyan-500 via-sky-400 to-teal-300', surfaceAccent: 'from-cyan-50 via-white to-teal-50' },
      ];
    case 'l7-nitro-750-full':
      return [
        { id: 'l7-nitro', label: 'Principal', title: 'L7 Nitro 750mg', purpose: 'É o núcleo do kit para saciedade, rotina metabólica forte e apoio no emagrecimento.', composition: 'Fórmula principal 750mg com atuação mais intensa no controle da fome e suporte à queima de gordura.', icon: Pill, iconAccent: 'from-fuchsia-500 via-orange-400 to-amber-300', surfaceAccent: 'from-fuchsia-50 via-white to-orange-50' },
        { id: 'detox', label: 'Complemento', title: 'Detox', purpose: 'Complementa com leveza digestiva, apoio à retenção e sensação corporal mais confortável.', composition: 'Blend detox para uso complementar durante o processo de emagrecimento.', icon: Leaf, iconAccent: 'from-emerald-500 via-lime-400 to-green-300', surfaceAccent: 'from-emerald-50 via-white to-lime-50' },
        { id: 'colageno', label: 'Extra', title: 'Colágeno', purpose: 'Entra como suporte para firmeza da pele e cuidado articular enquanto o corpo muda.', composition: 'Complemento com foco em pele, elasticidade e suporte para a rotina de cuidado integral.', icon: Sparkles, iconAccent: 'from-pink-500 via-rose-400 to-orange-300', surfaceAccent: 'from-pink-50 via-white to-rose-50' },
      ];
    case 'l7-turbo-500-full':
      return [
        { id: 'l7-turbo', label: 'Principal', title: 'L7 Turbo 500mg', purpose: 'Sustenta energia e ritmo no dia a dia para quem quer emagrecer sem perder disposição.', composition: 'Fórmula principal 500mg com foco em energia, rendimento e rotina mais ativa.', icon: Pill, iconAccent: 'from-orange-500 via-rose-400 to-yellow-300', surfaceAccent: 'from-orange-50 via-white to-rose-50' },
        { id: 'detox', label: 'Complemento', title: 'Detox', purpose: 'Ajuda no conforto digestivo, leveza e percepção de menos inchaço no decorrer do uso.', composition: 'Blend detox complementar para uma jornada de emagrecimento mais confortável.', icon: Leaf, iconAccent: 'from-emerald-500 via-lime-400 to-green-300', surfaceAccent: 'from-emerald-50 via-white to-lime-50' },
        { id: 'colageno', label: 'Extra', title: 'Colágeno', purpose: 'Oferece apoio adicional para pele e articulações, deixando o kit mais completo.', composition: 'Complemento voltado para firmeza da pele, elasticidade e cuidado articular.', icon: Sparkles, iconAccent: 'from-pink-500 via-rose-400 to-orange-300', surfaceAccent: 'from-pink-50 via-white to-rose-50' },
      ];
    default:
      return [{ id: product.id, label: 'Fórmula', title: product.name.replace(/^1\s*/i, ''), purpose: summary.purpose, composition: summary.composition, icon: Pill, iconAccent: 'from-orange-500 via-amber-400 to-yellow-300', surfaceAccent: 'from-orange-50 via-white to-amber-50' }];
  }
};

export const formatPriceBRL = (value?: number | null) => `R$ ${Number(value || 0).toFixed(2)}`;

export const hasProductPromotion = (product?: Product | null) => Boolean(product?.compareAtPrice && product.compareAtPrice > product.price && product.discountPercentage);
