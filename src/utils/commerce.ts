import { Product } from '../types';

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const initialCheckoutForm: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  document: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export const brazilStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const getMonthlyPlanWhatsAppLink = (phone?: string, result?: any) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalized = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '5551999999999';
  const productName = result?.primaryProduct?.name || 'o produto recomendado';
  const message = encodeURIComponent(`Olá! Quero saber mais sobre o plano mensal de acompanhamento da L7 Fitness. Vi minha recomendação com ${productName} e quero entender como funciona o suporte com alimentação, treino e ajustes semanais.`);
  return `https://wa.me/${normalized}?text=${message}`;
};

export const getProductOfferWhatsAppLink = (product?: Product | null) => {
  const digits = '5551999999999';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  const productName = product?.name || 'o produto da oferta';
  const cta = product?.promotionCta || 'Quero aproveitar a oferta';
  const campaignUrl = product?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.l7fitness.com.br'}/campanha/${encodeURIComponent(String(product.id))}`
    : '';
  const message = encodeURIComponent(
    campaignUrl
      ? `${campaignUrl}\n\nTenho interesse em ${productName}. ${cta}.`
      : `Tenho interesse em ${productName}. ${cta}.`
  );
  return `https://wa.me/${normalized}?text=${message}`;
};
