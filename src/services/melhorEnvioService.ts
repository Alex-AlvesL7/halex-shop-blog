import axios from 'axios';

const MELHOR_ENVIO_API = 'https://api.melhorenvio.com.br/v2';

// Tipo de frete retornado
export interface FreteOption {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  arrival_at: string;
  carrier: {
    id: number;
    name: string;
    picture?: string;
  };
  packages?: any[];
}

// Interface de produto para cálculo
export interface ProdutoFrete {
  peso: number;      // em kilos
  altura: number;    // em cm
  largura: number;   // em cm
  profundidade: number; // em cm
  quantidade?: number;
}

/**
 * Calcula opções de frete via Melhor Envio
 */
export const calcularFrete = async (
  cepDestino: string,
  produtos: ProdutoFrete[],
  apiKey: string,
  cepOrigem: string
): Promise<FreteOption[] | { error: string }> => {
  try {
    // Validar CEPs
    const cepOrigemLimpo = cepOrigem.replace(/\D/g, '');
    const cepDestinoLimpo = cepDestino.replace(/\D/g, '');

    if (cepOrigemLimpo.length !== 8 || cepDestinoLimpo.length !== 8) {
      return { error: 'CEP inválido' };
    }

    // Preparar produtos para API
    const produtosApi = produtos.map((p, idx) => ({
      id: `${idx + 1}`,
      width: p.largura,
      height: p.altura,
      length: p.profundidade,
      weight: p.peso,
      quantity: p.quantidade || 1,
    }));

    console.log('📦 Calculando frete...', {
      origem: cepOrigemLimpo,
      destino: cepDestinoLimpo,
      produtos: produtosApi.length,
    });

    const response = await axios.post(
      `${MELHOR_ENVIO_API}/shipment/calculate`,
      {
        from: {
          postal_code: cepOrigemLimpo,
        },
        to: {
          postal_code: cepDestinoLimpo,
        },
        products: produtosApi,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Halex-Shop/1.0',
        },
        timeout: 10000,
      }
    );

    console.log('✅ Frete calculado:', response.data.length, 'opção(ões)');
    return response.data || [];
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro ao calcular frete';

    console.error('❌ Erro ao calcular frete:', errorMsg);
    return { error: errorMsg };
  }
};

/**
 * Formata CEP para o padrão XXXXX-XXX
 */
export const formatarCEP = (value: string): string => {
  const numeros = value.replace(/\D/g, '');
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
};

/**
 * Remove formatação do CEP
 */
export const limparCEP = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Valida CEP
 */
export const validarCEP = (cep: string): boolean => {
  const cepLimpo = limparCEP(cep);
  return cepLimpo.length === 8;
};

/**
 * Formata preço para BRL
 */
export const formatarPreco = (preco: string | number): string => {
  const valor = typeof preco === 'string' ? parseFloat(preco) : preco;
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Calcula data de entrega
 */
export const calcularDataEntrega = (dias: number): Date => {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data;
};
