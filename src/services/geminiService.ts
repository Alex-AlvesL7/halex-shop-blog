import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateHealthTips = async (goal: string, weight: number, height: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere um plano simplificado de alimentação e treino para uma pessoa com o objetivo de ${goal}. 
      Dados: Peso ${weight}kg, Altura ${height}cm. 
      Retorne um JSON com:
      - dietTips: array de strings com 3 dicas de dieta
      - trainingTips: array de strings com 3 dicas de treino
      - recommendedSupplements: array de strings com 2 suplementos da loja Halex (Whey, Creatina, Pré-treino, BCAA)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dietTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            trainingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedSupplements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["dietTips", "trainingTips", "recommendedSupplements"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating tips:", error);
    return null;
  }
};

export interface SalesQuizProfile {
  name: string;
  goal: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  restrictions: string;
}

export interface SalesQuizResult {
  summary: string;
  dietTips: string[];
  trainingTips: string[];
  whyItMatches: string[];
  leadHook: string;
  primaryProductId: string;
  secondaryProductId?: string;
  cta: string;
}

const buildFallbackRecommendation = (profile: SalesQuizProfile, products: Product[]): SalesQuizResult => {
  const bmi = profile.height > 0 ? profile.weight / ((profile.height / 100) ** 2) : 0;
  const normalizedGoal = profile.goal.toLowerCase();
  const sortedProducts = [...products].sort((a, b) => b.price - a.price);

  const primary = normalizedGoal.includes('emag') || bmi >= 27
    ? products.find(p => p.id === 'l7-nitro-750-kit') || products.find(p => p.id === 'l7-turbo-500-kit') || sortedProducts[0]
    : products.find(p => p.id === 'l7-ultra-450-kit') || products.find(p => p.id === 'l7-turbo-500') || sortedProducts[0];

  const secondary = products.find(p => p.id !== primary?.id && p.category === primary?.category) || products.find(p => p.id !== primary?.id);

  return {
    summary: `${profile.name}, seu perfil mostra foco em ${profile.goal}. A melhor entrada é um produto que ajude consistência, saciedade e rotina diária.` ,
    dietTips: [
      'Priorize refeições com proteína e fibras para melhorar saciedade ao longo do dia.',
      'Mantenha hidratação constante e reduza bebidas muito calóricas na rotina.',
      'Organize horários de refeição para evitar picos de fome e perda de controle.'
    ],
    trainingTips: [
      'Faça caminhadas ou cardio leve 3 a 5 vezes por semana para aumentar gasto calórico.',
      'Inclua treino de força para preservar massa magra e melhorar resultado visual.',
      'Busque regularidade: treinos simples e frequentes convertem mais do que excesso eventual.'
    ],
    whyItMatches: [
      `O ${primary?.name || 'produto recomendado'} combina com o objetivo de ${profile.goal}.`,
      'Ajuda a manter rotina mais consistente, que é o principal fator de resultado.',
      'Foi priorizado um produto da loja com melhor aderência comercial para esse perfil.'
    ],
    leadHook: 'Se seguir esse plano por 30 dias com constância, você já consegue perceber mudança de ritmo e disciplina.',
    primaryProductId: primary?.id || products[0]?.id || '',
    secondaryProductId: secondary?.id,
    cta: `Comece pelo ${primary?.name || 'produto recomendado'} e, se quiser potencializar, leve também o complementar sugerido.`
  };
};

export const generateSalesQuizRecommendation = async (profile: SalesQuizProfile, products: Product[]): Promise<SalesQuizResult> => {
  try {
    const productCatalog = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      stock: product.stock,
      rating: product.rating,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um consultor comercial da L7 Fitness. Seu objetivo é recomendar SEMPRE produtos da nossa própria loja para aumentar conversão.

Perfil do cliente:
- Nome: ${profile.name}
- Objetivo: ${profile.goal}
- Peso: ${profile.weight}kg
- Altura: ${profile.height}cm
- Idade: ${profile.age}
- Sexo: ${profile.gender}
- Nível de atividade: ${profile.activityLevel}
- Restrições/observações: ${profile.restrictions || 'nenhuma'}

Catálogo disponível:
${JSON.stringify(productCatalog)}

Retorne uma recomendação comercial em português, objetiva e persuasiva. Regras:
- escolha obrigatoriamente um produto principal usando o campo primaryProductId
- escolha opcionalmente um segundo produto complementar em secondaryProductId
- não invente produtos fora do catálogo
- explique por que o produto combina com o perfil
- dê dicas simples e seguras de rotina/alimentação/treino
- CTA deve incentivar compra do produto principal e do complementar, se existir
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            dietTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            trainingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyItMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            leadHook: { type: Type.STRING },
            primaryProductId: { type: Type.STRING },
            secondaryProductId: { type: Type.STRING },
            cta: { type: Type.STRING },
          },
          required: ["summary", "dietTips", "trainingTips", "whyItMatches", "leadHook", "primaryProductId", "cta"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const existsPrimary = products.some(product => product.id === parsed.primaryProductId);
    if (!existsPrimary) {
      return buildFallbackRecommendation(profile, products);
    }

    return parsed as SalesQuizResult;
  } catch (error) {
    console.error("Error generating quiz recommendation:", error);
    return buildFallbackRecommendation(profile, products);
  }
};

export const generateSalesInsight = async (metrics: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise os seguintes dados de vendas de uma loja fitness (Halex Shop) e forneça um insight estratégico curto (máximo 200 caracteres) em português.
      Dados:
      - Vendas Totais: R$ ${metrics.totalSales.toFixed(2)}
      - Pedidos Pagos: ${metrics.paidOrdersCount}
      - Ticket Médio: R$ ${metrics.avgOrderValue.toFixed(2)}
      - Produtos Populares: ${metrics.popularProducts.map((p: any) => `${p.name} (${p.qty} un.)`).join(', ')}
      - Categorias: ${metrics.categoryChartData.map((c: any) => `${c.name} (R$ ${c.value.toFixed(2)})`).join(', ')}
      
      Sugira uma ação prática baseada nesses dados para aumentar o faturamento ou engajamento.`,
    });

    return response.text || "Continue monitorando suas vendas para obter novos insights.";
  } catch (error) {
    console.error("Error generating sales insight:", error);
    return "Ocorreu um erro ao gerar o insight. Tente novamente mais tarde.";
  }
};
