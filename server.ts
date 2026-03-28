import express from "express";
import axios from "axios";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { enviarEmail } from "./mailer.js";
import { PRODUCTS, POSTS } from "./src/data.js";
import { applyPromotionToProduct } from "./src/promotionRules.js";
import sharp from "sharp";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis do .env.local
const envPath = path.join(__dirname, '.env.local');
console.log("Loading .env.local from:", envPath);
dotenv.config({ path: envPath });

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let db: any;
try {
  const dbPath = process.env.VERCEL ? "/tmp/halex.db" : path.join(__dirname, "halex.db");
  console.log(`Initializing SQLite at: ${dbPath}`);
  db = new Database(dbPath);
  
  // Initialize Database Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      compare_at_price REAL,
      promotion_label TEXT,
      promotion_cta TEXT,
      promotion_badge TEXT,
      description TEXT,
      category TEXT,
      image TEXT,
      images TEXT,
      stock INTEGER DEFAULT 0,
      rating REAL,
      reviews INTEGER
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      category TEXT,
      author TEXT,
      date TEXT,
      image TEXT,
      read_time TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_nsu TEXT UNIQUE,
      customer_email TEXT,
      items TEXT,
      total REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_id, item_type)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      product_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (product_id, category_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS affiliates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT,
      ref_code TEXT NOT NULL UNIQUE,
      tag TEXT,
      commission_rate REAL DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      amount REAL NOT NULL,
      pix_key TEXT,
      pix_key_type TEXT,
      status TEXT DEFAULT 'requested',
      note TEXT,
      admin_note TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      goal TEXT,
      weight REAL,
      height REAL,
      age INTEGER,
      gender TEXT,
      activity_level TEXT,
      restrictions TEXT,
      recommended_product_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add missing columns if they don't exist
  try {
    db.exec("ALTER TABLE products ADD COLUMN images TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliates ADD COLUMN status TEXT DEFAULT 'pending'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliates ADD COLUMN tag TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE orders ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE posts ADD COLUMN read_time TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN rating REAL");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN reviews INTEGER");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN compare_at_price REAL");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN promotion_label TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN promotion_cta TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE products ADD COLUMN promotion_badge TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE orders ADD COLUMN affiliate_id TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliate_payout_requests ADD COLUMN note TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliate_payout_requests ADD COLUMN admin_note TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliate_payout_requests ADD COLUMN requested_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE affiliate_payout_requests ADD COLUMN processed_at DATETIME");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE quiz_leads ADD COLUMN recommended_product_id TEXT");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE quiz_leads ADD COLUMN metadata TEXT");
  } catch (e) {}

  // Seed initial data if empty
  if (db) {
    try {
      db.prepare("SELECT 1").get();
      console.log("SQLite connection verified.");
    } catch (e) {
      console.error("SQLite connection verification failed:", e);
      db = null;
    }
  }

  if (db) {
    try {
      const productCount = db.prepare("SELECT count(*) as count FROM products").get() as { count: number };
      if (productCount.count === 0) {
        const insertProduct = db.prepare("INSERT INTO products (id, name, price, description, category, image, images, stock, rating, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        const initialProducts = [
          ['l7-ultra-450-kit', '1 Kit L7 ULTRA 450mg + Detox', 159.90, 'Combo completo para emagrecimento com L7 Ultra 450mg e Detox para resultados rápidos e naturais.', 'emagrecedores', 'https://picsum.photos/seed/l7ultra-kit/600/600', JSON.stringify(['https://picsum.photos/seed/l7ultra-kit1/600/600']), 50, 4.9, 156],
          ['l7-turbo-500-kit', 'Kit L7 TURBO 500mg + Detox', 189.90, 'Potencialize sua queima de gordura com o Kit L7 Turbo 500mg e Detox. Energia e saciedade.', 'emagrecedores', 'https://picsum.photos/seed/l7turbo-kit/600/600', JSON.stringify(['https://picsum.photos/seed/l7turbo-kit1/600/600']), 40, 4.8, 92],
          ['l7-ultra-450', 'L7 Ultra 450mg', 149.00, 'Inibidor de apetite natural com Laranja Moro, L-Carnitina e Psyllium para queima de gordura.', 'emagrecedores', 'https://picsum.photos/seed/l7ultra/600/600', JSON.stringify([]), 100, 4.9, 210],
          ['l7-nitro-750-kit', 'Kit L7 Nitro 750mg + Detox Shake', 199.90, 'A fórmula mais potente: L7 Nitro 750mg combinada com Detox Shake para resultados máximos.', 'emagrecedores', 'https://picsum.photos/seed/l7nitro-kit/600/600', JSON.stringify([]), 25, 5.0, 78],
          ['l7-nitro-750', 'L7 NITRO 750mg', 169.00, 'Máxima concentration para queima de gordura abdominal e controle total do apetite.', 'emagrecedores', 'https://picsum.photos/seed/l7nitro/600/600', JSON.stringify([]), 60, 4.9, 134],
          ['l7-turbo-500', 'L7 TURBO 500mg', 159.00, 'Equilíbrio perfeito entre energia e queima calórica para o seu dia a dia.', 'emagrecedores', 'https://picsum.photos/seed/l7turbo/600/600', JSON.stringify([]), 80, 4.7, 115],
          ['l7-nitro-750-full', '1 Kit L7 NITRO 750mg + Detox + Colágeno', 239.00, 'O combo definitivo: Emagrecimento potente, detoxificação e cuidado com a pele e articulações.', 'emagrecedores', 'https://picsum.photos/seed/l7nitro-full/600/600', JSON.stringify([]), 15, 5.0, 45],
          ['l7-turbo-500-full', '1 Kit L7 TURBO 500mg + Detox + Colágeno', 229.00, 'Emagreça com saúde e mantenha a firmeza da pele com este kit completo de L7 Turbo e Colágeno.', 'emagrecedores', 'https://picsum.photos/seed/l7turbo-full/600/600', JSON.stringify([]), 20, 4.9, 38]
        ];

        for (const p of initialProducts) {
          insertProduct.run(...p);
        }
      }

      const postCount = db.prepare("SELECT count(*) as count FROM posts").get() as { count: number };
      if (postCount.count === 0) {
        const insertPost = db.prepare("INSERT INTO posts (id, title, excerpt, content, category, author, date, image, read_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        const initialPosts = [
          ['1', '5 Dicas de Alimentação para Ganho de Massa', 'Descubra como estruturar sua dieta.', 'Conteúdo completo aqui...', 'alimentacao', 'Equipe Halex', '2024-03-01', 'https://picsum.photos/seed/food1/800/400', '5 min'],
          ['2', 'Treino de Pernas: O Guia Definitivo', 'Não pule o dia de pernas!', 'Conteúdo completo aqui...', 'treino', 'Coach Halex', '2024-02-28', 'https://picsum.photos/seed/gym1/800/400', '8 min'],
          ['3', 'Dieta Flexível: Funciona Mesmo?', 'Entenda os conceitos da dieta flexível.', 'Conteúdo completo aqui...', 'dieta', 'Nutri Halex', '2024-02-25', 'https://picsum.photos/seed/diet1/800/400', '6 min']
        ];

        for (const p of initialPosts) {
          try {
            insertPost.run(...p);
          } catch (e) {
            console.warn("Failed to seed post:", p[0], e);
          }
        }
      }
      const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
      if (categoryCount.count === 0) {
        const insertCategory = db.prepare("INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)");
        const initialCategories = [
          ['emagrecedores', 'Emagrecedores', 'Produtos para auxiliar na perda de peso.', '#FF6321'],
          ['suplementos', 'Suplementos', 'Suplementos alimentares para performance.', '#4F46E5'],
          ['acessorios', 'Acessórios', 'Equipamentos e acessórios para treino.', '#10B981'],
          ['vestuario', 'Vestuário', 'Roupas fitness de alta qualidade.', '#F59E0B']
        ];
        for (const cat of initialCategories) {
          insertCategory.run(...cat);
        }
      }
    } catch (e) {
      console.error("Error seeding initial data:", e);
    }
  }
} catch (e) {
  console.error("SQLite initialization failed:", e);
  db = null;
}

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.URL_Supabase;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
const isEphemeralSQLiteRuntime = Boolean(process.env.VERCEL);
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log(`Supabase integrated successfully using ${supabaseServiceRoleKey ? 'service role' : 'anon key'}.`);
  if (!supabaseServiceRoleKey) {
    console.warn('Supabase is running with anon key only. Apply SUPABASE_QUIZ_LEADS.sql or configure SUPABASE_SERVICE_ROLE_KEY for the quiz leads flow.');
  }
} else {
  console.warn("Supabase credentials missing. Using local SQLite only.");
}

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is missing. Affiliate/admin confirmation emails will not be sent.');
}

if (!process.env.EMAIL_FROM) {
  console.warn('EMAIL_FROM is not configured. Configure a verified sender domain for reliable email delivery.');
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use((err: any, req: any, res: any, next: any) => {
  const parseError = err as { type?: string; status?: number; body?: unknown; message?: string };

  if (parseError?.type === 'entity.parse.failed' || (err instanceof SyntaxError && parseError?.status === 400 && 'body' in parseError)) {
    console.error('JSON parse error:', err);
    return res.status(400).json({
      error: 'JSON inválido no envio.',
      message: 'Bad Unicode escape in JSON. Revise caracteres copiados na descrição, especialmente barras invertidas (\\).',
      details: parseError.message || 'Falha ao interpretar o corpo da requisição.',
    });
  }

  next(err);
});

const escapeHtml = (value: any) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatBRL = (value: number) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const escapeXml = (value: any) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const serializeProductImages = (images: any) => {
  if (Array.isArray(images)) return JSON.stringify(images.filter(Boolean));

  if (typeof images === 'string') {
    const raw = images.trim();
    if (!raw) return JSON.stringify([]);

    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
    } catch {
      return JSON.stringify(raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean));
    }
  }

  return JSON.stringify([]);
};

const buildFallbackAICopy = (product: any) => {
  const safeName = String(product?.name || 'Produto L7 Fitness').trim();
  const safeCategory = String(product?.category || 'emagrecimento').trim();
  const rawDescription = String(product?.description || '').trim();
  const shortDescription = rawDescription.split(/[.!?]/).find(Boolean)?.trim() || `${safeName} com foco em ${safeCategory}.`;
  const isKit = /kit|combo|full|\+/i.test(`${safeName} ${rawDescription}`);

  return {
    summary: shortDescription,
    purpose: `Indicado para rotina de ${safeCategory}, com foco em consistência e melhor aderência ao plano diário.`,
    kitContents: isKit ? `Itens do kit: ${safeName.replace(/^1\s*/i, '')}.` : `Produto principal: ${safeName.replace(/^1\s*/i, '')}.`,
    composition: `Composição principal: ${safeName.replace(/^1\s*/i, '')}.`,
    capsules: 'Consulte o rótulo para quantidade por cápsula, porção diária e volume total do frasco.',
    usage: 'Use conforme orientação do rótulo e, quando necessário, com acompanhamento profissional.',
    details: rawDescription || `${safeName} foi desenvolvido para apoiar uma rotina com mais constância, foco e praticidade.`,
    promotionLabel: 'OFERTA LIMITADA',
    promotionBadge: 'Combo inteligente',
    promotionCta: 'GARANTIR AGORA',
    adsHeadline: `${safeName}: resultado com constância`,
    adsPrimaryText: `Aposte em ${safeName} para uma rotina mais focada, com estratégia e praticidade no dia a dia.`,
    adsDescription: 'Frete rápido, pagamento facilitado e suporte para você manter consistência.',
  };
};

const mergeAICopyWithCurrent = (current: any, generated: any) => {
  const fallback = buildFallbackAICopy(current);
  const pick = (value: any, fallbackValue: string) => {
    const normalized = String(value || '').trim();
    return normalized || String(fallbackValue || '').trim();
  };

  return {
    summary: pick(generated?.summary, current?.summary || fallback.summary),
    purpose: pick(generated?.purpose, current?.purpose || fallback.purpose),
    kitContents: pick(generated?.kitContents, current?.kitContents || fallback.kitContents),
    composition: pick(generated?.composition, current?.composition || fallback.composition),
    capsules: pick(generated?.capsules, current?.capsules || fallback.capsules),
    usage: pick(generated?.usage, current?.usage || fallback.usage),
    details: pick(generated?.details, current?.details || fallback.details),
    promotionLabel: pick(generated?.promotionLabel, current?.promotionLabel || fallback.promotionLabel),
    promotionBadge: pick(generated?.promotionBadge, current?.promotionBadge || fallback.promotionBadge),
    promotionCta: pick(generated?.promotionCta, current?.promotionCta || fallback.promotionCta),
    adsHeadline: pick(generated?.adsHeadline, fallback.adsHeadline),
    adsPrimaryText: pick(generated?.adsPrimaryText, fallback.adsPrimaryText),
    adsDescription: pick(generated?.adsDescription, fallback.adsDescription),
  };
};

const buildSupabaseProductPayloadVariants = (payload: {
  id: string;
  name: any;
  price: any;
  compareAtPrice: any;
  promotionLabel: any;
  promotionCta: any;
  promotionBadge: any;
  description: any;
  category: any;
  image: any;
  images: any;
  stock: any;
  rating: any;
  reviews: any;
}) => {
  const core = {
    name: payload.name,
    price: payload.price,
    description: payload.description,
    category: payload.category,
    image: payload.image,
    images: payload.images,
    stock: payload.stock,
    rating: payload.rating,
    reviews: payload.reviews,
  };

  return [
    {
      label: 'snake_case',
      insert: {
        id: payload.id,
        ...core,
        compare_at_price: payload.compareAtPrice,
        promotion_label: payload.promotionLabel,
        promotion_cta: payload.promotionCta,
        promotion_badge: payload.promotionBadge,
      },
      update: {
        ...core,
        compare_at_price: payload.compareAtPrice,
        promotion_label: payload.promotionLabel,
        promotion_cta: payload.promotionCta,
        promotion_badge: payload.promotionBadge,
      },
    },
    {
      label: 'camelCase',
      insert: {
        id: payload.id,
        ...core,
        compareAtPrice: payload.compareAtPrice,
        promotionLabel: payload.promotionLabel,
        promotionCta: payload.promotionCta,
        promotionBadge: payload.promotionBadge,
      },
      update: {
        ...core,
        compareAtPrice: payload.compareAtPrice,
        promotionLabel: payload.promotionLabel,
        promotionCta: payload.promotionCta,
        promotionBadge: payload.promotionBadge,
      },
    },
    {
      label: 'core_only',
      insert: {
        id: payload.id,
        ...core,
      },
      update: {
        ...core,
      },
    },
  ];
};

const normalizeProductRecord = (product: any) => {
  let images: string[] = [];
  try {
    images = typeof product?.images === 'string'
      ? JSON.parse(product.images || '[]')
      : (Array.isArray(product?.images) ? product.images : []);
  } catch (error) {
    images = [];
  }

  return applyPromotionToProduct({
    ...product,
    images,
    compareAtPrice: Number(product?.compare_at_price ?? product?.compareAtPrice) || undefined,
    promotionLabel: String(product?.promotion_label ?? product?.promotionLabel ?? '').trim() || undefined,
    promotionCta: String(product?.promotion_cta ?? product?.promotionCta ?? '').trim() || undefined,
    promotionBadge: String(product?.promotion_badge ?? product?.promotionBadge ?? '').trim() || undefined,
    categories: product?.category ? [product.category] : (Array.isArray(product?.categories) ? product.categories : []),
  });
};

const getProductsCatalog = () => {
  if (db) {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      if (Array.isArray(products) && products.length > 0) return products.map((product: any) => normalizeProductRecord(product));
    } catch (error) {
      console.warn('Falha ao carregar catálogo de produtos para SEO:', error);
    }
  }

  return PRODUCTS.map((product) => normalizeProductRecord(product));
};

const getPostsCatalog = () => {
  if (db) {
    try {
      const posts = db.prepare('SELECT * FROM posts').all();
      if (Array.isArray(posts) && posts.length > 0) return posts;
    } catch (error) {
      console.warn('Falha ao carregar posts para SEO:', error);
    }
  }

  return POSTS;
};

const getProductByIdForMeta = (id?: string | null) => {
  if (!id) return null;
  return getProductsCatalog().find((product: any) => String(product.id) === String(id)) || null;
};

const getProductByIdForMetaAsync = async (id?: string | null): Promise<any | null> => {
  if (!id) return null;
  // Try Supabase first so we always get fresh data (even on Vercel ephemeral SQLite)
  if (supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return normalizeProductRecord(data);
    } catch { /* fall through */ }
  }
  return getProductByIdForMeta(id);
};

const getPostByIdForMeta = (id?: string | null) => {
  if (!id) return null;
  return getPostsCatalog().find((post: any) => String(post.id) === String(id)) || null;
};

const truncateText = (value: any, maxLength: number) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const stripStructuredMarkers = (text: string) => text.replace(/\[\[[^\]]*\]\]\s*/g, '').trim();

const getProductBenefitLine = (product: any) => {
  const rawDesc = String(product?.description || '').trim();
  // Extract [[summary]] field if present (AI-filled structured content)
  const summaryMatch = rawDesc.match(/\[\[summary\]\]\s*([\s\S]*?)(?=\[\[|$)/i);
  const description = summaryMatch
    ? summaryMatch[1].trim()
    : stripStructuredMarkers(rawDesc);

  if (!description) return 'Oferta especial com frete rápido e atendimento direto no WhatsApp.';
  const sentence = description.split(/[.!?]/).map((item) => item.trim()).find(Boolean) || description;
  return truncateText(sentence, 88);
};

const getProductOfferLine = (product: any) => {
  const discountPercentage = Number(product?.discountPercentage) || 0;
  const reviews = Number(product?.reviews) || 0;
  const rating = Number(product?.rating) || 0;
  const stock = Number(product?.stock) || 0;

  if (discountPercentage > 0) {
    return `${discountPercentage}% OFF hoje`;
  }

  if (reviews > 0 && rating > 0) {
    return `${rating.toFixed(1)} ★ com ${reviews} avaliações`;
  }

  if (stock > 0) {
    return `${stock} unidades em estoque`;
  }

  return 'Parcele em até 12x com compra segura';
};

const getProductSocialDescription = (product: any) => {
  const benefit = getProductBenefitLine(product);
  const stock = Number(product?.stock) || 0;
  const discountPercentage = Number(product?.discountPercentage) || 0;
  const urgency = stock > 0 && stock <= 20 ? ` Restam ${stock} unidades.` : ' Estoque limitado.';
  const discountCopy = discountPercentage > 0 ? ` Aproveite ${discountPercentage}% de desconto nesta promoção.` : '';
  return `${benefit}${discountCopy} Compre hoje com frete rápido, parcelamento em até 12x e atendimento no WhatsApp.${urgency}`;
};

const getProductCampaignLabel = (product: any) => {
  if (product?.promotionLabel) return String(product.promotionLabel);
  const reviews = Number(product?.reviews) || 0;
  const rating = Number(product?.rating) || 0;
  const stock = Number(product?.stock) || 0;
  const name = String(product?.name || '').toLowerCase();

  if (stock > 0 && stock <= 20) return 'ESTOQUE LIMITADO';
  if (reviews >= 150) return 'MAIS VENDIDO';
  if (name.includes('kit') || name.includes('combo') || name.includes('full')) return 'PROMOÇÃO RELÂMPAGO';
  if (rating >= 4.9) return 'ESCOLHA PREMIUM';
  return 'OFERTA ESPECIAL';
};

const getProductCtaLabel = (product: any) => {
  if (product?.promotionCta) return String(product.promotionCta);
  const campaign = getProductCampaignLabel(product);

  if (campaign === 'ESTOQUE LIMITADO') return 'GARANTIR AGORA';
  if (campaign === 'PROMOÇÃO RELÂMPAGO') return 'APROVEITAR OFERTA';
  if (campaign === 'MAIS VENDIDO') return 'COMPRAR O QUERIDINHO';
  return 'COMPRAR AGORA';
};

const getProductBadgeList = (product: any) => {
  const discountPercentage = Number(product?.discountPercentage) || 0;
  const badges = [
    discountPercentage > 0 ? `${discountPercentage}% OFF` : product?.promotionBadge,
    getProductOfferLine(product),
    'Frete rápido',
    'Até 12x',
  ].filter(Boolean);

  const campaign = getProductCampaignLabel(product);
  if (campaign && !badges.includes(campaign)) {
    badges.unshift(campaign);
  }

  return badges.slice(0, 3);
};

const getProductComparePriceLabel = (product: any) => {
  const compareAtPrice = Number(product?.compareAtPrice) || 0;
  const price = Number(product?.price) || 0;
  if (compareAtPrice > price) {
    return `de ${formatBRL(compareAtPrice)}`;
  }

  return undefined;
};

const buildMetaBlock = (meta: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageType?: string;
  type?: string;
}) => `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="keywords" content="L7 Fitness, suplementos, emagrecedores, loja fitness, frete rápido, parcelamento, acompanhamento mensal" />
    <meta name="robots" content="index,follow" />
    <meta name="theme-color" content="#111111" />
    <link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />

    <meta property="og:locale" content="pt_BR" />
    <meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />
    <meta property="og:site_name" content="L7 Fitness" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:type" content="${escapeHtml(meta.imageType || 'image/png')}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />
  `;

const getRouteMetaAsync = async (pathname: string, appUrl: string) => {
  const normalizedPath = String(pathname || '/').split('?')[0] || '/';
  const productMatch = normalizedPath.match(/^\/produto\/([^/]+)$/);
  const offerMatch = normalizedPath.match(/^\/(?:campanha|oferta)\/([^/]+)$/);

  if (offerMatch) {
    const productId = decodeURIComponent(offerMatch[1]);
    const product = await getProductByIdForMetaAsync(productId);
    if (product) {
      const campaignLabel = getProductCampaignLabel(product);
      return {
        title: `${campaignLabel}: ${product.name} | Oferta L7 Fitness`,
        description: `${getProductSocialDescription(product)} Página dedicada da campanha com CTA forte para conversão.`,
        canonicalUrl: `${appUrl}/campanha/${encodeURIComponent(productId)}`,
        imageUrl: `${appUrl}/og/product/${encodeURIComponent(productId)}.png`,
        imageAlt: `${product.name} em página de campanha da L7 Fitness`,
        imageType: 'image/png',
        type: 'product',
      };
    }
  }

  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    const product = await getProductByIdForMetaAsync(productId);
    if (product) {
      return {
        title: `${product.name} | Compre agora na L7 Fitness`,
        description: getProductSocialDescription(product),
        canonicalUrl: `${appUrl}/produto/${encodeURIComponent(productId)}`,
        imageUrl: `${appUrl}/og/product/${encodeURIComponent(productId)}.png`,
        imageAlt: `${product.name} com CTA de compra da L7 Fitness`,
        imageType: 'image/png',
        type: 'product',
      };
    }
  }

  return getRouteMeta(pathname, appUrl);
};

const getRouteMeta = (pathname: string, appUrl: string) => {
  const normalizedPath = String(pathname || '/').split('?')[0] || '/';
  const productMatch = normalizedPath.match(/^\/produto\/([^/]+)$/);
  const offerMatch = normalizedPath.match(/^\/(?:campanha|oferta)\/([^/]+)$/);
  const blogDetailMatch = normalizedPath.match(/^\/blog\/([^/]+)$/);

  const defaultMeta = {
    title: 'L7 Fitness | Garanta seu suplemento com frete rápido',
    description: 'Garanta hoje seus suplementos L7 Fitness com frete rápido, parcelamento em até 12x e atendimento direto no WhatsApp. Estoque limitado.',
    canonicalUrl: `${appUrl}${normalizedPath === '/' ? '/' : normalizedPath}`,
    imageUrl: `${appUrl}/og/default.png`,
    imageAlt: 'Arte promocional da L7 Fitness com CTA de compra',
    imageType: 'image/png',
    type: 'website',
  };

  if (offerMatch) {
    const productId = decodeURIComponent(offerMatch[1]);
    const product = getProductByIdForMeta(productId);
    if (product) {
      const campaignLabel = getProductCampaignLabel(product);
      return {
        title: `${campaignLabel}: ${product.name} | Oferta L7 Fitness`,
        description: `${getProductSocialDescription(product)} Página dedicada da campanha com CTA forte para conversão.`,
        canonicalUrl: `${appUrl}/campanha/${encodeURIComponent(productId)}`,
        imageUrl: `${appUrl}/og/product/${encodeURIComponent(productId)}.png`,
        imageAlt: `${product.name} em página de campanha da L7 Fitness`,
        imageType: 'image/png',
        type: 'product',
      };
    }
  }

  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    const product = getProductByIdForMeta(productId);
    if (product) {
      return {
        title: `${product.name} | Compre agora na L7 Fitness`,
        description: getProductSocialDescription(product),
        canonicalUrl: `${appUrl}/produto/${encodeURIComponent(productId)}`,
        imageUrl: `${appUrl}/og/product/${encodeURIComponent(productId)}.png`,
        imageAlt: `${product.name} com CTA de compra da L7 Fitness`,
        imageType: 'image/png',
        type: 'product',
      };
    }
  }

  if (blogDetailMatch) {
    const postId = decodeURIComponent(blogDetailMatch[1]);
    const post = getPostByIdForMeta(postId);
    if (post) {
      return {
        title: `${post.title} | Blog L7 Fitness`,
        description: `${String(post.excerpt || post.content || '').trim()} Leia agora no blog da L7 Fitness e descubra a melhor estratégia para acelerar seus resultados.`,
        canonicalUrl: `${appUrl}/blog/${encodeURIComponent(postId)}`,
        imageUrl: `${appUrl}/og/blog/${encodeURIComponent(postId)}.png`,
        imageAlt: `${post.title} no blog da L7 Fitness`,
        imageType: 'image/png',
        type: 'article',
      };
    }
  }

  if (normalizedPath === '/loja') {
    return {
      ...defaultMeta,
      title: 'Loja L7 Fitness | Ofertas fortes e frete rápido',
      description: 'Veja os suplementos e kits da L7 Fitness com ofertas fortes, frete rápido e parcelamento em até 12x.',
      canonicalUrl: `${appUrl}/loja`,
      imageUrl: `${appUrl}/og/store.png`,
      imageAlt: 'Loja L7 Fitness com ofertas e frete rápido',
      imageType: 'image/png',
    };
  }

  if (normalizedPath === '/dicas-ai') {
    return {
      ...defaultMeta,
      title: 'Quiz AI L7 Fitness | Descubra sua melhor recomendação',
      description: 'Faça o quiz da L7 Fitness e receba uma recomendação personalizada com produto, alimentação, treino e oferta especial.',
      canonicalUrl: `${appUrl}/dicas-ai`,
      imageUrl: `${appUrl}/og/quiz.png`,
      imageAlt: 'Quiz AI da L7 Fitness com recomendação personalizada',
      imageType: 'image/png',
    };
  }

  if (normalizedPath === '/blog') {
    return {
      ...defaultMeta,
      title: 'Blog L7 Fitness | Dicas de treino, dieta e resultados',
      description: 'Leia dicas práticas de emagrecimento, treino e alimentação no blog da L7 Fitness e acelere seus resultados.',
      canonicalUrl: `${appUrl}/blog`,
      imageUrl: `${appUrl}/og/blog.png`,
      imageAlt: 'Blog L7 Fitness com dicas de treino e alimentação',
      imageType: 'image/png',
    };
  }

  return defaultMeta;
};

const renderOgSvg = ({
  eyebrow,
  title,
  subtitle,
  cta,
  footer,
  imageUrl,
  priceLabel,
  comparePriceLabel,
  badges = [],
  highlightLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  footer: string;
  imageUrl?: string;
  priceLabel?: string;
  comparePriceLabel?: string;
  badges?: string[];
  highlightLabel?: string;
}) => {
  const words = String(title || '').trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= 22) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === 2) break;
    }
  }

  if (currentLine && lines.length < 3) lines.push(currentLine);

  const visibleLines = lines.slice(0, 3);
  const titleSvg = visibleLines.map((line, index) => `<text x="100" y="${210 + (index * 76)}" fill="${index === visibleLines.length - 1 ? '#FF6321' : '#FFFFFF'}" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="900">${escapeXml(line)}</text>`).join('');
  const safeBadges = badges.slice(0, 3).filter(Boolean);
  const badgeSvg = safeBadges.map((badge, index) => {
    const x = 100 + (index * 184);
    return `
      <rect x="${x}" y="470" width="168" height="42" rx="21" fill="#161922" stroke="rgba(255,255,255,0.08)" />
      <text x="${x + 84}" y="497" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800">${escapeXml(truncateText(badge, 18))}</text>
    `;
  }).join('');

  const imagePanelSvg = imageUrl
    ? `
  <rect x="710" y="128" width="410" height="374" rx="34" fill="#0F1118" stroke="rgba(255,255,255,0.10)"/>
  <rect x="732" y="150" width="366" height="330" rx="26" fill="#FFFFFF"/>
  <image href="${escapeXml(imageUrl)}" x="732" y="150" width="366" height="330" preserveAspectRatio="xMidYMid meet"/>
  ${highlightLabel ? `<rect x="828" y="166" width="254" height="44" rx="22" fill="#FF6321"/><text x="955" y="194" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900">${escapeXml(truncateText(highlightLabel, 24))}</text>` : ''}
  <rect x="742" y="400" width="150" height="52" rx="18" fill="#111318" opacity="0.92"/>
  <text x="817" y="433" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900">L7 FITNESS</text>
  `
    : `
  <rect x="714" y="190" width="196" height="220" rx="32" fill="url(#accent)"/>
  <rect x="742" y="218" width="140" height="164" rx="24" fill="#111318"/>
  <text x="812" y="285" text-anchor="middle" fill="#FF6321" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="900">L7</text>
  <text x="812" y="324" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="4">FITNESS</text>
  <text x="812" y="356" text-anchor="middle" fill="#D1D5DB" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">FRETE RÁPIDO</text>
  <rect x="748" y="410" width="128" height="12" rx="6" fill="#2A2D35"/>
  `;

  const priceSvg = priceLabel
    ? `
  <rect x="714" y="520" width="240" height="64" rx="24" fill="#FF6321"/>
  <text x="834" y="560" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900">${escapeXml(priceLabel)}</text>
  ${comparePriceLabel ? `<text x="970" y="558" fill="#D1D5DB" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeXml(comparePriceLabel)}</text>` : ''}
  `
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="60" y1="40" x2="1120" y2="600" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B0B0F"/>
      <stop offset="1" stop-color="#1D1D27"/>
    </linearGradient>
    <linearGradient id="accent" x1="712" y1="180" x2="988" y2="470" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF7A1A"/>
      <stop offset="1" stop-color="#FF4D00"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
  <circle cx="1050" cy="118" r="180" fill="#FF6321" opacity="0.10"/>
  <circle cx="140" cy="560" r="200" fill="#FF6321" opacity="0.08"/>
  <rect x="62" y="58" width="1076" height="514" rx="30" fill="white" fill-opacity="0.03" stroke="white" stroke-opacity="0.08"/>
  <rect x="100" y="96" width="210" height="46" rx="23" fill="#FF6321"/>
  <text x="205" y="126" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">${escapeXml(eyebrow)}</text>
  ${titleSvg}
  <text x="100" y="440" fill="#D1D5DB" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="500">${escapeXml(subtitle)}</text>
  ${badgeSvg}
  <rect x="100" y="528" width="360" height="64" rx="32" fill="#FF6321"/>
  <text x="280" y="570" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900">${escapeXml(cta)}</text>
  <text x="100" y="618" fill="#9CA3AF" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeXml(footer)}</text>
  ${imagePanelSvg}
  ${priceSvg}
</svg>`;
};

const renderOgPngBuffer = async (options: Parameters<typeof renderOgSvg>[0]) => {
  const svg = renderOgSvg(options);
  return sharp(Buffer.from(svg)).png().toBuffer();
};

const normalizeOrderRecord = (order: any) => {
  let parsedItems: any[] = [];

  try {
    parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  } catch (e) {
    console.warn(`Failed to parse items for order ${order.id}:`, e);
  }

  const metadataItem = parsedItems.find((item: any) => item?.type === 'customer_metadata');
  const visibleItems = parsedItems.filter((item: any) => item?.type !== 'customer_metadata');

  return {
    ...order,
    items: visibleItems,
    customer: metadataItem?.customer || null,
    shipping: metadataItem?.shipping || metadataItem?.customer?.address || null,
    frete: metadataItem?.frete || null,
    internalNote: metadataItem?.internalNote || '',
    fulfillment: metadataItem?.fulfillment || {
      status: 'aguardando-envio',
      trackingCode: '',
      trackingUrl: '',
      updatedAt: null,
    },
  };
};

const normalizeQuizLeadRecord = (lead: any) => {
  let parsedMetadata: any = {};

  try {
    parsedMetadata = typeof lead?.metadata === 'string'
      ? JSON.parse(lead.metadata || '{}')
      : (lead?.metadata || {});
  } catch (error) {
    parsedMetadata = {};
  }

  const history = Array.isArray(parsedMetadata?.crm?.history)
    ? parsedMetadata.crm.history
        .map((entry: any) => normalizeLeadHistoryEntry(entry))
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    : [];

  const crm = {
    status: parsedMetadata?.crm?.status || 'new',
    internalNote: parsedMetadata?.crm?.internalNote || '',
    lastContactAt: parsedMetadata?.crm?.lastContactAt || null,
    nextFollowUpAt: parsedMetadata?.crm?.nextFollowUpAt || null,
    monthlyPlanInterest: parsedMetadata?.crm?.monthlyPlanInterest || 'unknown',
    planOfferedAt: parsedMetadata?.crm?.planOfferedAt || null,
    purchaseStatusOverride: parsedMetadata?.crm?.purchaseStatusOverride || 'auto',
    history,
  };

  return {
    ...lead,
    metadata: parsedMetadata,
    crm,
    recommendedProductId: lead?.recommended_product_id || parsedMetadata?.recommended_product_id || null,
  };
};

const normalizeLeadHistoryEntry = (entry: any) => {
  if (!entry || typeof entry !== 'object') return null;

  const summary = String(entry.summary || '').trim();
  if (!summary) return null;

  const createdAt = String(entry.createdAt || new Date().toISOString()).trim();

  return {
    id: String(entry.id || `history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    type: String(entry.type || 'note').trim() || 'note',
    channel: String(entry.channel || 'crm').trim() || 'crm',
    template: String(entry.template || '').trim() || null,
    summary,
    note: String(entry.note || '').trim() || null,
    createdAt,
  };
};

const getRawQuizLeadById = async (id: string) => {
  if (!id) return null;

  if (supabase) {
    const { data, error } = await supabase.from('quiz_leads').select('*').eq('id', id).single();
    if (!error && data) return data;
  }

  if (db) {
    try {
      return db.prepare("SELECT * FROM quiz_leads WHERE id = ?").get(id);
    } catch (error) {
      console.warn('SQLite get quiz lead failed:', error);
    }
  }

  return null;
};

const fulfillmentStatusLabels: Record<string, string> = {
  'aguardando-envio': 'Aguardando envio',
  'separando': 'Separando',
  'postado': 'Postado',
  'entregue': 'Entregue',
};

const buildOrderEmailHtml = ({
  title,
  intro,
  order,
}: {
  title: string;
  intro: string;
  order: any;
}) => {
  const itemsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding:8px 0;color:#111827;">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</td>
      <td style="padding:8px 0;color:#f97316;font-weight:700;text-align:right;">${escapeHtml(formatBRL((Number(item.price) || 0) * (Number(item.quantity) || 0)))}</td>
    </tr>
  `).join('');

  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const frete = order.frete || {};
  const fulfillment = order.fulfillment || {};
  const internalNote = order.internalNote || '';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:32px 16px;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e7eb;">
        <div style="margin-bottom:24px;">
          <div style="display:inline-block;background:#fff7ed;color:#f97316;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:8px 12px;border-radius:999px;">L7 Fitness</div>
          <h1 style="font-size:28px;line-height:1.2;margin:16px 0 8px;">${escapeHtml(title)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">${escapeHtml(intro)}</p>
        </div>

        <div style="background:#111827;border-radius:20px;padding:20px 24px;color:#ffffff;margin-bottom:24px;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-weight:700;">Pedido</div>
          <div style="font-size:24px;font-weight:800;margin-top:8px;">${escapeHtml(order.order_nsu || '')}</div>
          <div style="font-size:14px;color:#d1d5db;margin-top:8px;">Total: <strong style="color:#fb923c;">${escapeHtml(formatBRL(order.total || 0))}</strong></div>
          <div style="font-size:14px;color:#d1d5db;margin-top:4px;">Status: ${escapeHtml(order.status === 'paid' ? 'Pago' : 'Pendente')}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;">Itens</th>
              <th style="text-align:right;padding-bottom:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:18px;padding:18px;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:10px;">Contato</div>
            <div style="font-size:14px;line-height:1.7;">
              <div><strong>Nome:</strong> ${escapeHtml(customer.name || '-')}</div>
              <div><strong>E-mail:</strong> ${escapeHtml(customer.email || order.customer_email || '-')}</div>
              <div><strong>Telefone:</strong> ${escapeHtml(customer.phone || '-')}</div>
              <div><strong>CPF:</strong> ${escapeHtml(customer.document || '-')}</div>
            </div>
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:18px;padding:18px;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:10px;">Entrega</div>
            <div style="font-size:14px;line-height:1.7;">
              <div><strong>Endereço:</strong> ${escapeHtml(shipping.street || '-')}, ${escapeHtml(shipping.number || '-')}</div>
              <div><strong>Complemento:</strong> ${escapeHtml(shipping.complement || '—')}</div>
              <div><strong>Bairro:</strong> ${escapeHtml(shipping.neighborhood || '-')}</div>
              <div><strong>Cidade/UF:</strong> ${escapeHtml(shipping.city || '-')} / ${escapeHtml(shipping.state || '-')}</div>
              <div><strong>CEP:</strong> ${escapeHtml(shipping.cep || '-')}</div>
              <div><strong>Frete:</strong> ${escapeHtml(frete.carrier || '')} ${escapeHtml(frete.name || '')} - ${escapeHtml(formatBRL(Number(frete.price) || 0))}</div>
              <div><strong>Status logístico:</strong> ${escapeHtml(fulfillmentStatusLabels[fulfillment.status] || 'Aguardando envio')}</div>
              <div><strong>Código de rastreio:</strong> ${escapeHtml(fulfillment.trackingCode || '—')}</div>
              <div><strong>Observação interna:</strong> ${escapeHtml(internalNote || '—')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const sendOrderPaidNotifications = async (order: any, previousOrder?: any | null) => {
  if (!order) return;

  const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'contato@mail.l7fitness.com.br';
  const relatedAffiliate = await getAffiliateById(order?.affiliate_id || previousOrder?.affiliate_id || null);

  try {
    await enviarEmail(
      orderNotificationEmail,
      `Pagamento aprovado ${order.order_nsu}`,
      buildOrderEmailHtml({
        title: 'Pagamento aprovado',
        intro: 'O pagamento foi confirmado. O pedido está pronto para separação e envio.',
        order,
      })
    );
  } catch (emailError) {
    console.warn('Falha ao enviar aviso de pagamento aprovado para admin:', emailError);
  }

  if (order?.customer_email) {
    try {
      await enviarEmail(
        order.customer_email,
        `Pagamento confirmado ${order.order_nsu}`,
        buildOrderEmailHtml({
          title: 'Pagamento confirmado',
          intro: 'Recebemos seu pagamento com sucesso. Em breve você receberá novidades sobre a preparação e o envio do pedido.',
          order,
        })
      );
    } catch (emailError) {
      console.warn('Falha ao enviar confirmação de pagamento para cliente:', emailError);
    }
  }

  if (relatedAffiliate?.email) {
    try {
      await enviarEmail(
        relatedAffiliate.email,
        `Parabéns! Nova venda aprovada ${order.order_nsu}`,
        `Olá ${relatedAffiliate.name || 'afiliado'},<br/><br/>Parabéns! Seu link gerou mais uma venda aprovada.<br/><br/><strong>Pedido:</strong> ${order.order_nsu}<br/><strong>Comissão estimada:</strong> ${formatBRL((Number(order?.total) || 0) * ((Number(relatedAffiliate.commission_rate) || 0) / 100))}<br/><br/>Seu painel será atualizado automaticamente com essa venda.`
      );
    } catch (emailError) {
      console.warn('Falha ao enviar aviso de nova venda para afiliado:', emailError);
    }
  }
};

const mergeOrderMetadataItems = (rawItems: any[], patch: any) => {
  const items = Array.isArray(rawItems) ? [...rawItems] : [];
  const metadataIndex = items.findIndex((item: any) => item?.type === 'customer_metadata');
  const previousMetadata = metadataIndex >= 0 ? items[metadataIndex] : { id: 'customer_metadata', type: 'customer_metadata' };
  const nextMetadata = {
    ...previousMetadata,
    ...patch,
    internalNote: patch?.internalNote ?? previousMetadata?.internalNote ?? '',
    fulfillment: {
      status: patch?.fulfillment?.status ?? previousMetadata?.fulfillment?.status ?? 'aguardando-envio',
      trackingCode: patch?.fulfillment?.trackingCode ?? previousMetadata?.fulfillment?.trackingCode ?? '',
      trackingUrl: patch?.fulfillment?.trackingUrl ?? previousMetadata?.fulfillment?.trackingUrl ?? '',
      updatedAt: patch?.fulfillment?.updatedAt ?? previousMetadata?.fulfillment?.updatedAt ?? new Date().toISOString(),
    }
  };

  if (metadataIndex >= 0) {
    items[metadataIndex] = nextMetadata;
  } else {
    items.push(nextMetadata);
  }

  return items;
};

const getRawOrderById = async (id: string) => {
  if (!id) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (error) {
      console.warn('Supabase getRawOrderById failed:', error);
    }
  }

  if (db) {
    try {
      return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) || null;
    } catch (error) {
      console.warn('SQLite getRawOrderById failed:', error);
    }
  }

  return null;
};

const resolveAppUrl = (req: any) => {
  const configuredUrl = String(process.env.APP_URL || '').trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const forwardedProtoHeader = req.headers['x-forwarded-proto'];
  const forwardedHostHeader = req.headers['x-forwarded-host'];
  const forwardedProto = Array.isArray(forwardedProtoHeader) ? forwardedProtoHeader[0] : forwardedProtoHeader;
  const forwardedHost = Array.isArray(forwardedHostHeader) ? forwardedHostHeader[0] : forwardedHostHeader;
  const protocol = String(forwardedProto || req.protocol || 'https').split(',')[0].trim();
  const host = String(forwardedHost || req.get('host') || 'localhost:3000').split(',')[0].trim();

  return `${protocol}://${host}`.replace(/\/$/, '');
};

const getOrderByNsu = async (orderNsu: string) => {
  if (!orderNsu) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('order_nsu', orderNsu).single();
      if (!error && data) return normalizeOrderRecord(data);
    } catch (error) {
      console.warn('Supabase getOrderByNsu failed:', error);
    }
  }

  if (db) {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE order_nsu = ?').get(orderNsu);
      if (order) return normalizeOrderRecord(order);
    } catch (error) {
      console.warn('SQLite getOrderByNsu failed:', error);
    }
  }

  return null;
};

const getAffiliateById = async (affiliateId?: string | null) => {
  if (!affiliateId) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('affiliates').select('*').eq('id', affiliateId).single();
      if (!error && data) return data;
    } catch (error) {
      console.warn('Supabase getAffiliateById failed:', error);
    }
  }

  if (db) {
    try {
      return db.prepare('SELECT * FROM affiliates WHERE id = ?').get(affiliateId) || null;
    } catch (error) {
      console.warn('SQLite getAffiliateById failed:', error);
    }
  }

  return null;
};

const normalizeInfinitePayOrderNsuCandidate = (candidate: unknown): string | null => {
  if (candidate == null) return null;

  const raw = String(candidate).trim();
  if (!raw) return null;

  const embeddedMatch = raw.match(/L7-\d{8,}/i);
  if (embeddedMatch?.[0]) {
    return embeddedMatch[0].toUpperCase();
  }

  if (/^\d{8,}$/.test(raw)) {
    return `L7-${raw}`;
  }

  return raw;
};

const buildOrderNsuLookupVariants = (orderNsu: string | null | undefined) => {
  const normalized = normalizeInfinitePayOrderNsuCandidate(orderNsu);
  if (!normalized) return [] as string[];

  const variants = new Set<string>([normalized]);
  const digitsOnly = normalized.replace(/^L7-/i, '').trim();

  if (digitsOnly && digitsOnly !== normalized) {
    variants.add(digitsOnly);
    variants.add(`L7-${digitsOnly}`);
  }

  return [...variants];
};

const resolveWebhookOrderByNsu = async (incomingOrderNsu: string | null | undefined) => {
  const variants = buildOrderNsuLookupVariants(incomingOrderNsu);

  for (const variant of variants) {
    const order = await getOrderByNsu(variant);
    if (order) {
      return { order, resolvedOrderNsu: variant };
    }
  }

  return {
    order: null,
    resolvedOrderNsu: variants[0] || null,
  };
};

const extractInfinitePayOrderNsu = (data: any): string | null => {
  const candidates = [
    data?.order_nsu,
    data?.orderNsu,
    data?.metadata?.order_nsu,
    data?.metadata?.orderNsu,
    data?.data?.order_nsu,
    data?.data?.orderNsu,
    data?.data?.metadata?.order_nsu,
    data?.data?.metadata?.orderNsu,
    data?.invoice?.order_nsu,
    data?.invoice?.orderNsu,
    data?.invoice?.metadata?.order_nsu,
    data?.invoice?.metadata?.orderNsu,
    data?.payment?.order_nsu,
    data?.payment?.orderNsu,
    data?.payment?.metadata?.order_nsu,
    data?.payment?.metadata?.orderNsu,
    data?.payload?.order_nsu,
    data?.payload?.orderNsu,
    data?.payload?.metadata?.order_nsu,
    data?.payload?.metadata?.orderNsu,
    data?.resource?.order_nsu,
    data?.resource?.orderNsu,
    data?.resource?.metadata?.order_nsu,
    data?.resource?.metadata?.orderNsu,
    data?.external_reference,
    data?.externalReference,
    data?.invoice?.external_reference,
    data?.invoice?.externalReference,
    data?.payment?.external_reference,
    data?.payment?.externalReference,
    data?.resource?.external_reference,
    data?.resource?.externalReference,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeInfinitePayOrderNsuCandidate(candidate);
    if (normalized) return normalized;
  }

  const serialized = JSON.stringify(data || {});
  const embeddedMatch = serialized.match(/L7-\d{8,}/i);
  return embeddedMatch?.[0] ? embeddedMatch[0].toUpperCase() : null;
};

const extractInfinitePayStatus = (data: any): string => {
  const candidates = [
    data?.status,
    data?.payment_status,
    data?.paymentStatus,
    data?.data?.status,
    data?.data?.payment_status,
    data?.data?.paymentStatus,
    data?.invoice?.status,
    data?.invoice?.payment_status,
    data?.invoice?.paymentStatus,
    data?.payment?.status,
    data?.payment?.payment_status,
    data?.payment?.paymentStatus,
    data?.resource?.status,
    data?.resource?.payment_status,
    data?.resource?.paymentStatus,
    data?.event,
    data?.type,
    data?.data?.event,
    data?.data?.type,
  ];

  const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return value ? String(value).trim().toLowerCase() : '';
};

const isInfinitePayPaidStatus = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  return ['paid', 'approved', 'completed', 'success', 'succeeded', 'confirmed', 'received', 'settled', 'invoice.paid', 'payment.approved', 'payment.paid'].includes(normalized);
};

const isInfinitePayPendingStatus = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  return [
    'pending',
    'processing',
    'processing_payment',
    'waiting_payment',
    'awaiting_payment',
    'created',
    'opened',
    'generated',
    'authorized',
    'in_process',
    'invoice.created',
    'invoice.pending',
    'payment.pending',
    'payment.created',
  ].includes(normalized);
};

const isInfinitePayFailedStatus = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  return [
    'failed',
    'declined',
    'denied',
    'canceled',
    'cancelled',
    'expired',
    'refunded',
    'chargeback',
    'voided',
    'invoice.failed',
    'invoice.canceled',
    'payment.failed',
    'payment.denied',
    'payment.cancelled',
  ].includes(normalized);
};

const mapInfinitePayStatusToOrderStatus = (incomingStatus: string, currentStatus?: string | null): 'paid' | 'pending' | 'failed' => {
  if (isInfinitePayPaidStatus(incomingStatus)) return 'paid';
  if (isInfinitePayFailedStatus(incomingStatus)) return 'failed';
  if (isInfinitePayPendingStatus(incomingStatus)) return 'pending';

  return currentStatus === 'paid' || currentStatus === 'failed' ? currentStatus : 'pending';
};

const normalizeAffiliateRefBase = (value?: string | null) => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();

  return normalized.slice(0, 10) || 'L7AFILIADO';
};

const generateAffiliateRefCode = async (preferred?: string | null, name?: string | null) => {
  const base = normalizeAffiliateRefBase(preferred || name);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix = attempt === 0
      ? '10'
      : String(Math.floor(100 + Math.random() * 900));
    const candidate = `${base}${suffix}`;

    let exists = false;

    if (supabase) {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, ref_code')
        .eq('ref_code', candidate)
        .maybeSingle();

      if (error && !String(error.message || '').toLowerCase().includes('multiple')) {
        throw error;
      }

      exists = !!data;
    }

    if (!exists && db) {
      const record = db.prepare("SELECT id FROM affiliates WHERE ref_code = ?").get(candidate);
      exists = !!record;
    }

    if (!exists) {
      return candidate;
    }
  }

  return `${base}${Date.now().toString().slice(-4)}`;
};

app.get("/api/health", async (req, res) => {
  let supabaseProductsCount = 0;
  let supabaseError = null;
  
  if (supabase) {
    try {
      const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
      supabaseProductsCount = count || 0;
      if (error) {
        supabaseError = error.message;
      }
    } catch (e: any) {
      supabaseError = e.message || String(e);
    }
  }

  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV, 
    supabase: !!supabase,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    sqlite: !!db,
    supabaseProductsCount,
    supabaseError
  });
});


  // API Routes
  // Seed Supabase if empty (Async)
  if (supabase) {
    (async () => {
      try {
      const { data: existingProducts, error: prodError } = await supabase.from('products').select('id').limit(1);
      if (!prodError && (!existingProducts || existingProducts.length === 0)) {
        console.log("Seeding Supabase products...");
        const initialProducts = [
          { id: 'l7-ultra-450-kit', name: '1 Kit L7 ULTRA 450mg + Detox', price: 159.90, description: 'Combo completo para emagrecimento com L7 Ultra 450mg e Detox para resultados rápidos e naturais.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7ultra-kit/600/600', images: JSON.stringify(['https://picsum.photos/seed/l7ultra-kit1/600/600']), stock: 50, rating: 4.9, reviews: 156 },
          { id: 'l7-turbo-500-kit', name: 'Kit L7 TURBO 500mg + Detox', price: 189.90, description: 'Potencialize sua queima de gordura com o Kit L7 Turbo 500mg e Detox. Energia e saciedade.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7turbo-kit/600/600', images: JSON.stringify(['https://picsum.photos/seed/l7turbo-kit1/600/600']), stock: 40, rating: 4.8, reviews: 92 },
          { id: 'l7-ultra-450', name: 'L7 Ultra 450mg', price: 149.00, description: 'Inibidor de apetite natural com Laranja Moro, L-Carnitina e Psyllium para queima de gordura.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7ultra/600/600', images: JSON.stringify([]), stock: 100, rating: 4.9, reviews: 210 },
          { id: 'l7-nitro-750-kit', name: 'Kit L7 Nitro 750mg + Detox Shake', price: 199.90, description: 'A fórmula mais potente: L7 Nitro 750mg combinada com Detox Shake para resultados máximos.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7nitro-kit/600/600', images: JSON.stringify([]), stock: 25, rating: 5.0, reviews: 78 },
          { id: 'l7-nitro-750', name: 'L7 NITRO 750mg', price: 169.00, description: 'Máxima concentration para queima de gordura abdominal e controle total do apetite.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7nitro/600/600', images: JSON.stringify([]), stock: 60, rating: 4.9, reviews: 134 },
          { id: 'l7-turbo-500', name: 'L7 TURBO 500mg', price: 159.00, description: 'Equilíbrio perfeito entre energia e queima calórica para o seu dia a dia.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7turbo/600/600', images: JSON.stringify([]), stock: 80, rating: 4.7, reviews: 115 },
          { id: 'l7-nitro-750-full', name: '1 Kit L7 NITRO 750mg + Detox + Colágeno', price: 239.00, description: 'O combo definitivo: Emagrecimento potente, detoxificação e cuidado com a pele e articulações.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7nitro-full/600/600', images: JSON.stringify([]), stock: 15, rating: 5.0, reviews: 45 },
          { id: 'l7-turbo-500-full', name: '1 Kit L7 TURBO 500mg + Detox + Colágeno', price: 229.00, description: 'Emagreça com saúde e mantenha a firmeza da pele com este kit completo de L7 Turbo e Colágeno.', category: 'emagrecedores', image: 'https://picsum.photos/seed/l7turbo-full/600/600', images: JSON.stringify([]), stock: 20, rating: 4.9, reviews: 38 }
        ];
        await supabase.from('products').insert(initialProducts);
      }

      const { data: existingPosts, error: postError } = await supabase.from('posts').select('id').limit(1);
      if (!postError && (!existingPosts || existingPosts.length === 0)) {
        console.log("Seeding Supabase posts...");
        const initialPosts = [
          { id: '1', title: '5 Dicas de Alimentação para Ganho de Massa', excerpt: 'Descubra como estruturar sua dieta.', content: 'Conteúdo completo aqui...', category: 'alimentacao', author: 'Equipe Halex', date: '2024-03-01', image: 'https://picsum.photos/seed/food1/800/400', readTime: '5 min' },
          { id: '2', title: 'Treino de Pernas: O Guia Definitivo', excerpt: 'Não pule o dia de pernas!', content: 'Conteúdo completo aqui...', category: 'treino', author: 'Coach Halex', date: '2024-02-28', image: 'https://picsum.photos/seed/gym1/800/400', readTime: '8 min' },
          { id: '3', title: 'Dieta Flexível: Funciona Mesmo?', excerpt: 'Entenda os conceitos da dieta flexível.', content: 'Conteúdo completo aqui...', category: 'dieta', author: 'Nutri Halex', date: '2024-02-25', image: 'https://picsum.photos/seed/diet1/800/400', readTime: '6 min' }
        ];
        await supabase.from('posts').insert(initialPosts);
      }

      const { data: existingCategories, error: catError } = await supabase.from('categories').select('id').limit(1);
      if (!catError && (!existingCategories || existingCategories.length === 0)) {
        console.log("Seeding Supabase categories...");
        const initialCategories = [
          { id: 'emagrecedores', name: 'Emagrecedores', description: 'Produtos para auxiliar na perda de peso.', color: 'emerald' },
          { id: 'treino', name: 'Treino', description: 'Suplementos para melhorar seu desempenho.', color: 'blue' },
          { id: 'alimentacao', name: 'Alimentação', description: 'Dicas e produtos para uma dieta equilibrada.', color: 'orange' }
        ];
        await supabase.from('categories').insert(initialCategories);
      }
    } catch (e: any) {
      console.error("Supabase seeding failed. This usually means the tables (products, posts, etc.) haven't been created in the Supabase dashboard yet. Error:", e.message || e);
    }
  })();
}

  app.get("/api/products", async (req, res) => {
    try {
      let products: any[] = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          // Simple fetch only from products table
          const { data, error } = await supabase.from('products').select('*');
          
          if (error) throw error;

          products = (data || []).map((p) => normalizeProductRecord(p));
          usedSupabase = true;
        } catch (supaError: any) {
          console.error("Supabase products fetch failed, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          const dbProducts = db.prepare("SELECT * FROM products").all() as any[];
          
          products = dbProducts.map((p) => normalizeProductRecord(p));
        } catch (sqliteError) {
          console.error("SQLite products fetch failed:", sqliteError);
        }
      }
      res.json({ products });
    } catch (error) {
      console.error("Error in GET /api/products:", error);
      res.status(500).json({ error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      let posts: any[] = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          const { data, error } = await supabase.from('posts').select('*');
          if (error) throw error;
          posts = (data || []).map(p => ({ ...p, readTime: p.read_time || p.readTime }));
          usedSupabase = true;
        } catch (supaError: any) {
          console.error("Supabase posts fetch failed, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          posts = db.prepare("SELECT * FROM posts").all();
          posts = posts.map(p => ({ ...p, readTime: p.read_time || p.readTime }));
        } catch (sqliteError) {
          console.error("SQLite posts fetch failed:", sqliteError);
        }
      }
      res.json({ posts });
    } catch (error) {
      console.error("Error in GET /api/posts:", error);
      res.status(500).json({ error: "Failed to fetch posts", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      let orders: any[] = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          orders = (data || []).map(normalizeOrderRecord);
          usedSupabase = true;
        } catch (supaError) {
          console.error("Supabase orders fetch failed, falling back to SQLite:", supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          const dbOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as any[];
          orders = dbOrders.map(normalizeOrderRecord);
        } catch (sqliteError) {
          console.error("SQLite orders fetch failed:", sqliteError);
          // Try without ORDER BY if it fails (might be missing column)
          try {
            const dbOrders = db.prepare("SELECT * FROM orders").all() as any[];
            orders = dbOrders.map(normalizeOrderRecord);
          } catch (e2) {}
        }
      }
      res.json({ orders });
    } catch (error) {
      console.error("Error in GET /api/orders:", error);
      res.status(500).json({ error: "Failed to fetch orders", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post('/api/ai/product-copy', async (req, res) => {
    try {
      const { product, mode } = req.body || {};
      const current = {
        name: String(product?.name || '').trim(),
        category: String(product?.category || '').trim(),
        price: Number(product?.price || 0),
        compareAtPrice: Number(product?.compareAtPrice || 0),
        summary: String(product?.summary || '').trim(),
        purpose: String(product?.purpose || '').trim(),
        kitContents: String(product?.kitContents || '').trim(),
        composition: String(product?.composition || '').trim(),
        capsules: String(product?.capsules || '').trim(),
        usage: String(product?.usage || '').trim(),
        details: String(product?.details || '').trim(),
        description: String(product?.description || '').trim(),
        promotionLabel: String(product?.promotionLabel || '').trim(),
        promotionBadge: String(product?.promotionBadge || '').trim(),
        promotionCta: String(product?.promotionCta || '').trim(),
      };

      if (!current.name) {
        return res.status(400).json({ success: false, error: 'Informe o nome do produto para gerar conteúdo com IA.' });
      }

      if (!ai) {
        return res.json({
          success: true,
          source: 'fallback-no-key',
          content: mergeAICopyWithCurrent(current, {}),
        });
      }

      const styleMode = String(mode || 'equilibrado').trim().toLowerCase();
      const modeInstruction = styleMode === 'conversao'
        ? 'priorize conversão e urgência com linguagem forte, porém sem exageros médicos'
        : styleMode === 'premium'
          ? 'priorize posicionamento premium e autoridade da marca'
          : 'equilibre clareza comercial, confiança e objetividade';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Você é um copywriter sênior de e-commerce da L7 Fitness.

Objetivo:
- Ler TODO o contexto do produto
- Melhorar APENAS o necessário
- Entregar texto comercial profissional, claro e persuasivo
- Sugerir CTA e criativos de ads com alta qualidade

Regras obrigatórias:
- Escrever em português do Brasil
- Evitar promessas médicas, cura, garantia absoluta de resultado
- Não inventar ingredientes inexistentes
- Manter tom profissional e focado em conversão responsável
- Se algum campo já estiver bom, manter essência e apenas otimizar
- Em "details", usar markdown simples (listas e negrito) para leitura limpa

Modo editorial: ${modeInstruction}

Dados atuais do produto:
${JSON.stringify(current, null, 2)}

Retorne APENAS JSON no schema pedido.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              purpose: { type: Type.STRING },
              kitContents: { type: Type.STRING },
              composition: { type: Type.STRING },
              capsules: { type: Type.STRING },
              usage: { type: Type.STRING },
              details: { type: Type.STRING },
              promotionLabel: { type: Type.STRING },
              promotionBadge: { type: Type.STRING },
              promotionCta: { type: Type.STRING },
              adsHeadline: { type: Type.STRING },
              adsPrimaryText: { type: Type.STRING },
              adsDescription: { type: Type.STRING },
            },
            required: ['summary', 'purpose', 'kitContents', 'composition', 'capsules', 'usage', 'details', 'promotionLabel', 'promotionBadge', 'promotionCta', 'adsHeadline', 'adsPrimaryText', 'adsDescription']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const content = mergeAICopyWithCurrent(current, parsed);

      return res.json({ success: true, source: 'gemini', content });
    } catch (error) {
      console.error('Error in POST /api/ai/product-copy:', error);
      return res.status(500).json({
        success: false,
        error: 'Falha ao gerar conteúdo com IA para o produto.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Admin API - Products
  app.post("/api/products", async (req, res) => {
    const { id, name, price, compareAtPrice, promotionLabel, promotionCta, promotionBadge, description, category, categories, image, images, stock, rating, reviews } = req.body;
    const productId = id || crypto.randomUUID();
    // Use the first category from the array if 'category' is not directly provided
    const mainCategory = category || (categories && categories.length > 0 ? categories[0] : null);
    
    const productData = { 
      id: productId, 
      name, 
      price, 
      compare_at_price: compareAtPrice || null,
      promotion_label: String(promotionLabel || '').trim() || null,
      promotion_cta: String(promotionCta || '').trim() || null,
      promotion_badge: String(promotionBadge || '').trim() || null,
      description, 
      category: mainCategory,
      image, 
      images: serializeProductImages(images), 
      stock: stock || 0, 
      rating: rating || 5, 
      reviews: reviews || 0 
    };

    let savedSomewhere = false;
    let sqliteSaved = false;
    let supabaseSaved = false;
    const saveErrors: string[] = [];
    
    if (db) {
      try {
        const result = db.prepare("INSERT INTO products (id, name, price, compare_at_price, promotion_label, promotion_cta, promotion_badge, description, category, image, images, stock, rating, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(productId, name, price, productData.compare_at_price, productData.promotion_label, productData.promotion_cta, productData.promotion_badge, description, productData.category, productData.image, productData.images, productData.stock, productData.rating, productData.reviews);
        sqliteSaved = result.changes > 0;
        savedSomewhere = savedSomewhere || sqliteSaved;
      } catch (e) {
        console.error("SQLite product insert error:", e);
        saveErrors.push(e instanceof Error ? e.message : 'Falha ao salvar produto no SQLite.');
      }
    }
    
    if (supabase) {
      const variants = buildSupabaseProductPayloadVariants({
        id: productId,
        name,
        price,
        compareAtPrice: productData.compare_at_price,
        promotionLabel: productData.promotion_label,
        promotionCta: productData.promotion_cta,
        promotionBadge: productData.promotion_badge,
        description,
        category: productData.category,
        image: productData.image,
        images: productData.images,
        stock: productData.stock,
        rating: productData.rating,
        reviews: productData.reviews,
      });

      for (const variant of variants) {
        const { error } = await supabase.from('products').upsert([variant.insert]);
        if (!error) {
          supabaseSaved = true;
          savedSomewhere = true;
          break;
        }

        console.error(`Supabase product upsert error (${variant.label}):`, error);
        saveErrors.push(`${variant.label}: ${error.message || 'Falha ao salvar produto no Supabase.'}`);
      }
    }

    if (!supabaseSaved && sqliteSaved && isEphemeralSQLiteRuntime) {
      return res.status(500).json({
        error: 'Produto salvo apenas em armazenamento temporário e não persistiu.',
        details: `Configure SUPABASE_SERVICE_ROLE_KEY no deploy para persistência real. Em ambiente Vercel o SQLite é temporário. ${saveErrors.length ? `Detalhe Supabase: ${saveErrors.join(' | ')}` : ''}`,
      });
    }

    if (!savedSomewhere) {
      return res.status(500).json({
        error: 'Falha ao salvar produto.',
        details: saveErrors.join(' | ') || 'Nenhum banco confirmou a gravação do produto.',
      });
    }
    
    res.json({ success: true, id: productId, product: normalizeProductRecord(productData) });
  });

  app.delete("/api/products/:id", async (req, res) => {
    let sqliteDeleted = false;
    let supabaseDeleted = false;

    if (db) {
      try {
        const sqliteResult = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
        db.prepare("DELETE FROM product_categories WHERE product_id = ?").run(req.params.id);
        sqliteDeleted = sqliteResult.changes > 0;
      } catch (e) {}
    }
    
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', req.params.id);
      if (!error) {
        supabaseDeleted = true;
      }
    }

    if (!supabaseDeleted && sqliteDeleted && isEphemeralSQLiteRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Exclusão concluída apenas em armazenamento temporário.',
        details: 'Configure SUPABASE_SERVICE_ROLE_KEY no deploy para persistência real. Em ambiente Vercel o SQLite é temporário.',
      });
    }
    
    res.json({ success: true });
  });
  app.get("/api/categories", async (req, res) => {
    try {
      let categories: any[] = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          const { data, error } = await supabase.from('categories').select('*');
          if (error) throw error;
          if (data) {
            categories = data;
            usedSupabase = true;
          }
        } catch (supaError: any) {
          console.error("Supabase categories fetch failed, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          categories = db.prepare("SELECT * FROM categories").all();
        } catch (sqliteError) {
          console.error("SQLite categories fetch failed:", sqliteError);
        }
      }
      res.json(categories || []);
    } catch (error) {
      console.error("Error in GET /api/categories:", error);
      res.status(500).json({ error: "Failed to fetch categories", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/categories", async (req, res) => {
    const { id, name, description, color } = req.body;
    const categoryId = id || crypto.randomUUID();
    
    if (db) {
      db.prepare("INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)")
        .run(categoryId, name, description, color);
    }
    
    if (supabase) {
      await supabase.from('categories').insert([{ id: categoryId, name, description, color }]);
    }
    
    res.json({ success: true, id: categoryId });
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (db) {
      db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
      db.prepare("DELETE FROM product_categories WHERE category_id = ?").run(req.params.id);
    }
    
    if (supabase) {
      await supabase.from('product_categories').delete().eq('category_id', req.params.id);
      await supabase.from('categories').delete().eq('id', req.params.id);
    }
    
    res.json({ success: true });
  });

  app.put("/api/products/:id", async (req, res) => {
    const { name, price, compareAtPrice, promotionLabel, promotionCta, promotionBadge, description, category, categories, image, images, stock, rating, reviews } = req.body;
    const mainCategory = category || (categories && categories.length > 0 ? categories[0] : null);

    const productData = { 
      id: req.params.id,
      name, 
      price, 
      compare_at_price: compareAtPrice || null,
      promotion_label: String(promotionLabel || '').trim() || null,
      promotion_cta: String(promotionCta || '').trim() || null,
      promotion_badge: String(promotionBadge || '').trim() || null,
      description, 
      category: mainCategory,
      image, 
      images: serializeProductImages(images), 
      stock: stock || 0, 
      rating: rating || 5, 
      reviews: reviews || 0 
    };

    let updatedSomewhere = false;
    let sqliteUpdated = false;
    let supabaseUpdated = false;
    const updateErrors: string[] = [];
    
    if (db) {
      try {
        const result = db.prepare("UPDATE products SET name = ?, price = ?, compare_at_price = ?, promotion_label = ?, promotion_cta = ?, promotion_badge = ?, description = ?, category = ?, image = ?, images = ?, stock = ?, rating = ?, reviews = ? WHERE id = ?")
          .run(productData.name, productData.price, productData.compare_at_price, productData.promotion_label, productData.promotion_cta, productData.promotion_badge, productData.description, productData.category, productData.image, productData.images, productData.stock, productData.rating, productData.reviews, req.params.id);
        sqliteUpdated = result.changes > 0;
        updatedSomewhere = updatedSomewhere || sqliteUpdated;
      } catch (e) {
        console.error("SQLite product update error:", e);
        updateErrors.push(e instanceof Error ? e.message : 'Falha ao atualizar produto no SQLite.');
      }
    }
    
    if (supabase) {
      const variants = buildSupabaseProductPayloadVariants({
        id: req.params.id,
        name,
        price,
        compareAtPrice: productData.compare_at_price,
        promotionLabel: productData.promotion_label,
        promotionCta: productData.promotion_cta,
        promotionBadge: productData.promotion_badge,
        description,
        category: productData.category,
        image: productData.image,
        images: productData.images,
        stock: productData.stock,
        rating: productData.rating,
        reviews: productData.reviews,
      });

      for (const variant of variants) {
        const { error } = await supabase.from('products').update(variant.update).eq('id', req.params.id);
        if (!error) {
          supabaseUpdated = true;
          updatedSomewhere = true;
          break;
        }

        console.error(`Supabase product update error (${variant.label}):`, error);
        updateErrors.push(`${variant.label}: ${error.message || 'Falha ao atualizar produto no Supabase.'}`);
      }
    }

    if (!supabaseUpdated && sqliteUpdated && isEphemeralSQLiteRuntime) {
      return res.status(500).json({
        error: 'Produto atualizado apenas em armazenamento temporário e não persistiu.',
        details: `Configure SUPABASE_SERVICE_ROLE_KEY no deploy para persistência real. Em ambiente Vercel o SQLite é temporário. ${updateErrors.length ? `Detalhe Supabase: ${updateErrors.join(' | ')}` : ''}`,
      });
    }

    if (!updatedSomewhere) {
      return res.status(500).json({
        error: 'Falha ao atualizar produto.',
        details: updateErrors.join(' | ') || 'Nenhum banco confirmou a atualização do produto.',
      });
    }
    
    res.json({ success: true, product: normalizeProductRecord(productData) });
  });

  // Admin API - Posts
  app.post("/api/posts", async (req, res) => {
    console.log("POST /api/posts - req.body:", req.body);
    const { id, title, excerpt, content, category, author, date, image, readtime } = req.body;
    
    // Ensure we have a unique ID
    const postId = id || crypto.randomUUID();
    
    const postData = { 
      id: postId, 
      title, 
      excerpt, 
      content, 
      category, 
      author: author || 'Equipe Halex', 
      date: date || new Date().toISOString().split('T')[0], 
      image: image, 
      readtime: readtime || '5 min'
    };
    
    console.log("Creating post in Supabase:", postData);
    
    try {
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
          
      if (error) throw error;
      
      res.json({ success: true, id: postId });
    } catch (e: any) {
      console.error("Post creation error:", e);
      res.status(400).json({ error: e.message || "Error creating post" });
    }
  });

  // Email API
  app.post("/api/enviar-email", async (req, res) => {
    const { to, subject, html } = req.body;
    try {
      await enviarEmail(to, subject, html);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro no endpoint /api/enviar-email:", error);
      res.status(500).json({ 
        error: "Falha ao enviar e-mail", 
        details: error.message || String(error) 
      });
    }
  });

  app.post("/api/contato", async (req, res) => {
    const { nome, email, mensagem } = req.body;
    if (!nome || !email || !mensagem) {
      return res.status(400).json({ success: false, error: "Campos obrigatórios" });
    }
    
    try {
      // Email para admin
      try {
        await enviarEmail("contato@mail.l7fitness.com.br", "Novo contato do site", `<p>Nome: ${nome}</p><p>Email: ${email}</p><p>Mensagem: ${mensagem}</p>`);
      } catch (e) {
        console.warn("Falha ao notificar admin por e-mail:", e);
      }

      // Email para cliente
      try {
        await enviarEmail(email, "Recebemos sua mensagem", `<p>Olá ${nome}, recebemos sua mensagem e entraremos em contato em breve.</p>`);
      } catch (e) {
        console.warn("Falha ao enviar confirmação para o cliente:", e);
      }
      
      res.json({ success: true, message: "Mensagem recebida com sucesso!" });
    } catch (error: any) {
      console.error("Erro no endpoint /api/contato:", error);
      res.status(500).json({ 
        success: false, 
        error: "Erro interno ao processar contato",
        details: error.message || String(error)
      });
    }
  });

  app.post("/api/quiz-leads", async (req, res) => {
    const {
      name,
      email,
      phone,
      goal,
      weight,
      height,
      age,
      gender,
      activity_level,
      restrictions,
      recommended_product_id,
      metadata,
    } = req.body || {};

    if (!name || !email || !goal) {
      return res.status(400).json({ success: false, error: 'Nome, e-mail e objetivo são obrigatórios.' });
    }

    const leadId = `lead_${Date.now()}`;
    const normalizedMetadata = {
      ...(metadata || {}),
      crm: {
        status: metadata?.crm?.status || 'new',
        internalNote: metadata?.crm?.internalNote || '',
        lastContactAt: metadata?.crm?.lastContactAt || null,
        nextFollowUpAt: metadata?.crm?.nextFollowUpAt || null,
        monthlyPlanInterest: metadata?.crm?.monthlyPlanInterest || 'unknown',
        planOfferedAt: metadata?.crm?.planOfferedAt || null,
        history: Array.isArray(metadata?.crm?.history)
          ? metadata.crm.history.map((entry: any) => normalizeLeadHistoryEntry(entry)).filter(Boolean)
          : [],
      }
    };

    const leadData = {
      id: leadId,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone || '').trim(),
      goal: String(goal || '').trim(),
      weight: Number(weight) || null,
      height: Number(height) || null,
      age: Number(age) || null,
      gender: String(gender || '').trim(),
      activity_level: String(activity_level || '').trim(),
      restrictions: String(restrictions || '').trim(),
      recommended_product_id: String(recommended_product_id || '').trim() || null,
      metadata: JSON.stringify(normalizedMetadata),
    };

    try {
      let supabaseSaved = false;
      let sqliteSaved = false;
      let supabaseErrorMessage: string | null = null;

      if (supabase) {
        const { error } = await supabase.from('quiz_leads').insert([leadData]);
        if (error) {
          console.error('Supabase quiz_leads insert failed:', error);
          supabaseErrorMessage = error.message || String(error);
        } else {
          supabaseSaved = true;
        }
      }

      if (db) {
        db.prepare(`
          INSERT INTO quiz_leads (
            id, name, email, phone, goal, weight, height, age, gender, activity_level, restrictions, recommended_product_id, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          leadData.id,
          leadData.name,
          leadData.email,
          leadData.phone,
          leadData.goal,
          leadData.weight,
          leadData.height,
          leadData.age,
          leadData.gender,
          leadData.activity_level,
          leadData.restrictions,
          leadData.recommended_product_id,
          leadData.metadata,
        );
        sqliteSaved = true;
      }

      if (!supabaseSaved && !sqliteSaved) {
        return res.status(500).json({
          success: false,
          error: supabaseErrorMessage ? 'Falha ao salvar lead do quiz.' : 'Nenhum banco configurado para salvar lead do quiz.',
          details: supabaseErrorMessage || 'Nenhum banco confirmou a gravação do lead.',
        });
      }

      res.json({ success: true, id: leadId, saved: { supabase: supabaseSaved, sqlite: sqliteSaved } });
    } catch (error) {
      console.error('Error in POST /api/quiz-leads:', error);
      res.status(500).json({ success: false, error: 'Falha ao salvar lead do quiz.' });
    }
  });

  app.get("/api/quiz-leads", async (req, res) => {
    try {
      let supabaseErrorMessage: string | null = null;

      if (supabase) {
        const { data, error } = await supabase
          .from('quiz_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase quiz_leads fetch failed:', error);
          supabaseErrorMessage = error.message || String(error);
        } else {
          return res.json({ success: true, leads: (data || []).map(normalizeQuizLeadRecord), source: 'supabase' });
        }
      }

      if (db) {
        const leads = db.prepare("SELECT * FROM quiz_leads ORDER BY created_at DESC").all();
        return res.json({
          success: true,
          leads: leads.map(normalizeQuizLeadRecord),
          source: 'sqlite',
          fallbackReason: supabaseErrorMessage || undefined,
        });
      }

      return res.status(500).json({
        success: false,
        error: supabaseErrorMessage ? 'Falha ao carregar leads do quiz.' : 'Nenhum banco configurado para listar leads.',
        details: supabaseErrorMessage || undefined,
      });
    } catch (error) {
      console.error('Error in GET /api/quiz-leads:', error);
      return res.status(500).json({ success: false, error: 'Falha ao carregar leads do quiz.' });
    }
  });

  app.put("/api/quiz-leads/:id/crm", async (req, res) => {
    const { id } = req.params;
    const { crmStatus, internalNote, lastContactAt, nextFollowUpAt, monthlyPlanInterest, planOfferedAt, purchaseStatusOverride, historyEntry } = req.body || {};
    const allowedStatuses = ['new', 'contacted', 'interested', 'won', 'lost'];
    const allowedMonthlyPlanInterest = ['unknown', 'interested', 'not_interested', 'closed'];
    const allowedPurchaseStatusOverrides = ['auto', 'no-purchase', 'pending', 'paid'];
    const normalizedStatus = allowedStatuses.includes(String(crmStatus)) ? String(crmStatus) : 'new';
    const normalizedNote = String(internalNote || '').trim();
    const normalizedLastContactAt = String(lastContactAt || '').trim() || null;
    const normalizedNextFollowUpAt = String(nextFollowUpAt || '').trim() || null;
    const normalizedMonthlyPlanInterest = allowedMonthlyPlanInterest.includes(String(monthlyPlanInterest)) ? String(monthlyPlanInterest) : 'unknown';
    const normalizedPlanOfferedAt = String(planOfferedAt || '').trim() || null;
    const normalizedPurchaseStatusOverride = allowedPurchaseStatusOverrides.includes(String(purchaseStatusOverride)) ? String(purchaseStatusOverride) : 'auto';
    const normalizedHistoryEntry = normalizeLeadHistoryEntry(historyEntry);

    try {
      const existingLead = await getRawQuizLeadById(id);
      if (!existingLead) {
        return res.status(404).json({ success: false, error: 'Lead não encontrado.' });
      }

      let parsedMetadata: any = {};
      try {
        parsedMetadata = typeof existingLead.metadata === 'string'
          ? JSON.parse(existingLead.metadata || '{}')
          : (existingLead.metadata || {});
      } catch (error) {
        parsedMetadata = {};
      }

      const nextMetadata = {
        ...parsedMetadata,
        crm: {
          ...(parsedMetadata?.crm || {}),
          status: normalizedStatus,
          internalNote: normalizedNote,
          lastContactAt: normalizedLastContactAt,
          nextFollowUpAt: normalizedNextFollowUpAt,
          monthlyPlanInterest: normalizedMonthlyPlanInterest,
          planOfferedAt: normalizedPlanOfferedAt,
          purchaseStatusOverride: normalizedPurchaseStatusOverride,
          history: [
            ...((Array.isArray(parsedMetadata?.crm?.history)
              ? parsedMetadata.crm.history.map((entry: any) => normalizeLeadHistoryEntry(entry)).filter(Boolean)
              : [])),
            ...(normalizedHistoryEntry ? [normalizedHistoryEntry] : []),
          ]
            .sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
            .slice(-30),
        }
      };

      const serializedMetadata = JSON.stringify(nextMetadata);
      let supabaseErrorMessage: string | null = null;

      if (supabase) {
        const { error } = await supabase
          .from('quiz_leads')
          .update({ metadata: serializedMetadata })
          .eq('id', id);

        if (error) {
          console.error('Supabase quiz_leads CRM update failed:', error);
          supabaseErrorMessage = error.message || String(error);
        }
      }

      let sqliteUpdated = false;
      if (db) {
        const result = db.prepare("UPDATE quiz_leads SET metadata = ? WHERE id = ?").run(serializedMetadata, id);
        sqliteUpdated = result.changes > 0;
      }

      if (supabaseErrorMessage && !sqliteUpdated) {
        return res.status(500).json({ success: false, error: 'Falha ao atualizar CRM do lead.', details: supabaseErrorMessage });
      }

      return res.json({
        success: true,
        lead: normalizeQuizLeadRecord({ ...existingLead, metadata: serializedMetadata }),
      });
    } catch (error) {
      console.error('Error in PUT /api/quiz-leads/:id/crm:', error);
      return res.status(500).json({ success: false, error: 'Falha ao atualizar CRM do lead.' });
    }
  });

  app.get("/api/admin/affiliates", async (req, res) => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from('affiliates').select('*').eq('status', 'pending');
          if (error) throw error;
          return res.json(data || []);
        }

        if (db) {
          const affiliates = db.prepare("SELECT * FROM affiliates WHERE status = 'pending'").all();
          return res.json(affiliates);
        }

        return res.json([]);
      } catch (error) {
        console.error("Error in GET /api/admin/affiliates:", error);
        return res.status(500).json({ error: "Failed to fetch pending affiliates", details: error instanceof Error ? error.message : String(error) });
      }
  });

  app.post("/api/admin/affiliates/:id/approve", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
      try {
        let affiliate: any = null;

        if (supabase) {
          const { error } = await supabase.from('affiliates').update({ status }).eq('id', id);
          if (error) throw error;

          const { data, error: affiliateError } = await supabase.from('affiliates').select('*').eq('id', id).single();
          if (affiliateError) throw affiliateError;
          affiliate = data;
        } else if (db) {
          db.prepare("UPDATE affiliates SET status = ? WHERE id = ?").run(status, id);
          affiliate = db.prepare("SELECT * FROM affiliates WHERE id = ?").get(id);
      }

        if (affiliate) {
          try {
            await enviarEmail(affiliate.email, `Sua afiliação foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}`, `Olá ${affiliate.name}, sua solicitação de afiliação foi ${status}.`);
          } catch (e) {
            console.error("Email error:", e);
          }
        }

        return res.json({ success: true });
      } catch (error) {
        console.error("Error in POST /api/admin/affiliates/:id/approve:", error);
        return res.status(500).json({ error: "Failed to update affiliate status", details: error instanceof Error ? error.message : String(error) });
      }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    if (db) {
      db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    }
    
    if (supabase) {
      await supabase.from('posts').delete().eq('id', req.params.id);
    }
    
    res.json({ success: true });
  });

  app.put("/api/posts/:id", async (req, res) => {
    const { title, excerpt, content, category, author, date, image, readTime } = req.body;
    const postData = { title, excerpt, content, category, author, date, image, read_time: readTime };
    
    if (db) {
      db.prepare("UPDATE posts SET title = ?, excerpt = ?, content = ?, category = ?, author = ?, date = ?, image = ?, read_time = ? WHERE id = ?")
        .run(postData.title, postData.excerpt, postData.content, postData.category, postData.author, postData.date, postData.image, postData.read_time, req.params.id);
    }
    
    if (supabase) {
      await supabase.from('posts').update(postData).eq('id', req.params.id);
    }
    
    res.json({ success: true });
  });

  // InfinitePay Checkout
  app.get("/api/orders/:email", async (req, res) => {
    const { email } = req.params;
    try {
      let orders: any[] = [];
      let usedSupabase = false;

      if (supabase) {
        try {
          const { data, error } = await supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false });
          if (error) throw error;
          orders = (data || []).map(normalizeOrderRecord);
          usedSupabase = true;
        } catch (supaError: any) {
          console.error("Supabase orders fetch failed for email, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        orders = db.prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC").all(email).map(normalizeOrderRecord);
      }
      res.json(orders);
    } catch (error) {
      console.error("Error in GET /api/orders/:email:", error);
      res.status(500).json({ error: "Failed to fetch orders", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/orders/:id/fulfillment", async (req, res) => {
    const { id } = req.params;
    const { fulfillmentStatus, trackingCode, trackingUrl, internalNote } = req.body || {};
    const allowedStatuses = ['aguardando-envio', 'separando', 'postado', 'entregue'];
    const normalizedStatus = allowedStatuses.includes(String(fulfillmentStatus)) ? String(fulfillmentStatus) : 'aguardando-envio';
    const normalizedTrackingCode = String(trackingCode || '').trim();
    const normalizedTrackingUrl = String(trackingUrl || '').trim();

    try {
      const rawOrder = await getRawOrderById(id);
      if (!rawOrder) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      let parsedItems: any[] = [];
      try {
        parsedItems = typeof rawOrder.items === 'string' ? JSON.parse(rawOrder.items) : (rawOrder.items || []);
      } catch (error) {
        console.warn('Falha ao parsear items do pedido para fulfillment:', error);
      }

      const previousOrder = normalizeOrderRecord(rawOrder);
      const nextItems = mergeOrderMetadataItems(parsedItems, {
        internalNote: String(internalNote || '').trim(),
        fulfillment: {
          status: normalizedStatus,
          trackingCode: normalizedTrackingCode,
          trackingUrl: normalizedTrackingUrl,
          updatedAt: new Date().toISOString(),
        }
      });

      const serializedItems = JSON.stringify(nextItems);

      if (db) {
        try {
          db.prepare('UPDATE orders SET items = ? WHERE id = ?').run(serializedItems, id);
        } catch (error) {
          console.error('SQLite fulfillment update failed:', error);
        }
      }

      if (supabase) {
        try {
          await supabase.from('orders').update({ items: serializedItems }).eq('id', id);
        } catch (error) {
          console.error('Supabase fulfillment update failed:', error);
        }
      }

      const updatedOrder = normalizeOrderRecord({ ...rawOrder, items: serializedItems });
      const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'contato@mail.l7fitness.com.br';
      const statusChanged = previousOrder.fulfillment?.status !== updatedOrder.fulfillment?.status;
      const trackingChanged = (previousOrder.fulfillment?.trackingCode || '') !== (updatedOrder.fulfillment?.trackingCode || '');

      if (statusChanged || trackingChanged) {
        const intro = updatedOrder.fulfillment?.trackingCode
          ? `O status logístico do pedido foi atualizado para ${fulfillmentStatusLabels[updatedOrder.fulfillment?.status] || 'Aguardando envio'} e o código de rastreio já está disponível.`
          : `O status logístico do pedido foi atualizado para ${fulfillmentStatusLabels[updatedOrder.fulfillment?.status] || 'Aguardando envio'}.`;

        if (updatedOrder.customer_email) {
          try {
            await enviarEmail(
              updatedOrder.customer_email,
              `Atualização de envio ${updatedOrder.order_nsu}`,
              buildOrderEmailHtml({
                title: 'Atualização do seu pedido',
                intro,
                order: updatedOrder,
              })
            );
          } catch (error) {
            console.warn('Falha ao enviar atualização logística para cliente:', error);
          }
        }

        try {
          await enviarEmail(
            adminEmail,
            `Logística atualizada ${updatedOrder.order_nsu}`,
            buildOrderEmailHtml({
              title: 'Logística atualizada',
              intro: `O pedido teve seu status logístico alterado para ${fulfillmentStatusLabels[updatedOrder.fulfillment?.status] || 'Aguardando envio'}.`,
              order: updatedOrder,
            })
          );
        } catch (error) {
          console.warn('Falha ao enviar atualização logística para admin:', error);
        }
      }

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error in PUT /api/orders/:id/fulfillment:', error);
      res.status(500).json({ error: 'Falha ao atualizar logística do pedido', details: error instanceof Error ? error.message : String(error) });
    }
  });

app.post("/api/checkout", async (req, res) => {
  try {
    const { items, total, customer_email, affiliate_id, frete, customer } = req.body;

    const parsedItems: any[] = Array.isArray(items) ? items : [];
    const fretePrice = frete?.price != null ? Number(frete.price) : 0;
    const normalizedFretePrice = Number.isFinite(fretePrice) ? fretePrice : 0;
    const freteDescriptionBase = String(frete?.name || 'Frete');
    const freteCarrier = String(frete?.carrier || '').trim();
    const freteDescription = freteCarrier
      ? `Frete - ${freteCarrier} ${freteDescriptionBase}`
      : `Frete - ${freteDescriptionBase}`;

    const itemsWithFrete = normalizedFretePrice > 0
      ? [
          ...parsedItems,
          { id: 'frete', name: freteDescription, quantity: 1, price: normalizedFretePrice, type: 'frete' }
        ]
      : parsedItems;

    const normalizedCustomer = {
      name: String(customer?.name || '').trim(),
      email: String(customer?.email || customer_email || 'guest@example.com').trim(),
      phone: String(customer?.phone || '').trim(),
      document: String(customer?.document || '').trim(),
      address: {
        country: 'Brasil',
        cep: String(customer?.cep || '').trim(),
        street: String(customer?.street || '').trim(),
        number: String(customer?.number || '').trim(),
        complement: String(customer?.complement || '').trim(),
        neighborhood: String(customer?.neighborhood || '').trim(),
        city: String(customer?.city || '').trim(),
        state: String(customer?.state || '').trim(),
      },
    };

    // Salvar/atualizar cliente na tabela customers do Supabase
    if (supabase && normalizedCustomer.email) {
      try {
        const customerPayload = {
          name: normalizedCustomer.name,
          email: normalizedCustomer.email,
          phone: normalizedCustomer.phone,
          document: normalizedCustomer.document,
          address: [
            normalizedCustomer.address.street,
            normalizedCustomer.address.number,
            normalizedCustomer.address.complement,
            normalizedCustomer.address.neighborhood
          ].filter(Boolean).join(', '),
          city: normalizedCustomer.address.city,
          state: normalizedCustomer.address.state,
          zip_code: normalizedCustomer.address.cep,
          updated_at: new Date().toISOString(),
        };
        await supabase.from('customers').upsert([customerPayload], { onConflict: 'email' });
      } catch (customerError) {
        console.error('Supabase customer upsert failed:', customerError);
      }
    }

    const storedItems = [
      ...itemsWithFrete,
      {
        id: 'customer_metadata',
        type: 'customer_metadata',
        customer: normalizedCustomer,
        shipping: normalizedCustomer.address,
        frete: {
          id: frete?.id || null,
          name: freteDescriptionBase,
          carrier: freteCarrier,
          price: normalizedFretePrice,
          estimatedDays: frete?.estimatedDays || null,
          cep: frete?.cep || normalizedCustomer.address.cep,
        },
        created_at: new Date().toISOString(),
      }
    ];

    const calculatedTotal = itemsWithFrete.reduce((sum: number, item: any) => {
      const q = Number(item?.quantity) || 0;
      const p = Number(item?.price) || 0;
      return sum + (p * q);
    }, 0);

    // Look up affiliate by ref_code
    let affiliateId = null;
    if (affiliate_id) {
      try {
        if (supabase) {
          const { data } = await supabase.from('affiliates').select('id').eq('ref_code', affiliate_id).single();
          if (data) affiliateId = data.id;
        } else if (db) {
          const affiliate = db.prepare("SELECT id FROM affiliates WHERE ref_code = ?").get(affiliate_id);
          if (affiliate) affiliateId = affiliate.id;
        }
      } catch (affError) {
        console.warn("Error looking up affiliate, continuing without it:", affError);
      }
    }

    // For L7Fitness, we only need the handle (InfiniteTag)
    const rawHandle = process.env.INFINITEPAY_HANDLE || "l7fitness";
    const handle = rawHandle.replace('$', '').trim();
    const appUrl = resolveAppUrl(req);
    const orderNsu = String("L7-" + Date.now());

    // Save order to DB (SQLite + Supabase)
    const orderData = {
      id: "ord_" + Date.now(),
      order_nsu: orderNsu,
      customer_email: normalizedCustomer.email,
      items: JSON.stringify(storedItems),
      total: Number.isFinite(calculatedTotal) && calculatedTotal > 0 ? calculatedTotal : total,
      status: 'pending',
      affiliate_id: affiliateId
    };

    if (db) {
      try {
        db.prepare("INSERT INTO orders (id, order_nsu, customer_email, items, total, status, affiliate_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          orderData.id, orderData.order_nsu, orderData.customer_email, orderData.items, orderData.total, orderData.status, orderData.affiliate_id
        );
      } catch (dbError) {
        console.error("SQLite order insert failed:", dbError);
      }
    }

    if (supabase) {
      try {
        await supabase.from('orders').insert([orderData]);
      } catch (supaError) {
        console.error("Supabase order insert failed:", supaError);
      }
    }

    const normalizedOrderForEmail = normalizeOrderRecord(orderData);
    const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'contato@mail.l7fitness.com.br';

    try {
      await enviarEmail(
        orderNotificationEmail,
        `Novo pedido iniciado ${orderNsu}`,
        buildOrderEmailHtml({
          title: 'Novo pedido iniciado',
          intro: 'Um novo pedido foi criado e já contém os dados completos de contato e entrega.',
          order: normalizedOrderForEmail,
        })
      );
    } catch (emailError) {
      console.warn('Falha ao enviar notificação de novo pedido para admin:', emailError);
    }

    if (normalizedCustomer.email) {
      try {
        await enviarEmail(
          normalizedCustomer.email,
          `Recebemos seu pedido ${orderNsu}`,
          buildOrderEmailHtml({
            title: 'Recebemos seu pedido',
            intro: 'Seu pedido foi criado com sucesso. Assim que o pagamento for confirmado, enviaremos as próximas atualizações.',
            order: normalizedOrderForEmail,
          })
        );
      } catch (emailError) {
        console.warn('Falha ao enviar confirmação inicial para o cliente:', emailError);
      }
    }

    try {
      // Real InfinitePay API Call (Public Checkout Links)
      const payload = {
        handle: handle,
        order_nsu: orderNsu,
        items: itemsWithFrete.map((item: any) => ({
          description: String(item.name),
          quantity: parseInt(item.quantity),
          price: Math.round(parseFloat(item.price) * 100)
        })),
        itens: itemsWithFrete.map((item: any) => ({
          description: String(item.name),
          quantity: parseInt(item.quantity),
          price: Math.round(parseFloat(item.price) * 100)
        })),
        redirect_url: `${appUrl}/checkout/success`,
        webhook_url: `${appUrl}/api/webhook-infinitepay`
      };

      console.log("InfinitePay Request Payload:", JSON.stringify(payload));

      const response = await axios.post("https://api.infinitepay.io/invoices/public/checkout/links", payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const responseData = response.data;
      console.log("InfinitePay Response Data:", JSON.stringify(responseData));

      const checkoutUrl = responseData?.checkout_url || 
                          responseData?.url || 
                          responseData?.data?.checkout_url ||
                          responseData?.data?.url;
      
      if (checkoutUrl) {
        res.json({ url: checkoutUrl, id: checkoutUrl.split('/').pop() });
      } else {
        console.error("InfinitePay Link Missing. Full Response:", JSON.stringify(responseData));
        const apiError = responseData?.message || responseData?.error || "Estrutura de resposta desconhecida";
        throw new Error(`Link não encontrado. Resposta da API: ${apiError}`);
      }
    } catch (error: any) {
      const errorDetail = error.response?.data || error.message;
      console.error("InfinitePay Error Detail:", JSON.stringify(errorDetail));
      
      // Fallback to simulation
      res.json({ 
        url: `https://pay.infinitepay.io/${handle}/checkout-simulado`,
        id: "sim_" + Date.now(),
        simulated: true,
        debug_error: errorDetail
      });
    }
  } catch (globalError) {
    console.error("Global error in /api/checkout:", globalError);
    res.status(500).json({ error: "Internal Server Error in checkout", details: globalError instanceof Error ? globalError.message : String(globalError) });
  }
});

  app.put("/api/orders/:id/payment-status", async (req, res) => {
    const { id } = req.params;
    const requestedStatus = String(req.body?.status || '').trim().toLowerCase();
    const allowedStatuses = ['pending', 'paid', 'failed'];
    const nextStatus = allowedStatuses.includes(requestedStatus) ? requestedStatus : null;

    if (!nextStatus) {
      return res.status(400).json({ error: 'Status de pagamento inválido.' });
    }

    try {
      const rawOrder = await getRawOrderById(id);
      if (!rawOrder) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const previousOrder = normalizeOrderRecord(rawOrder);

      if (db) {
        try {
          db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, id);
        } catch (error) {
          console.error('SQLite payment status update failed:', error);
        }
      }

      if (supabase) {
        try {
          await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
        } catch (error) {
          console.error('Supabase payment status update failed:', error);
        }
      }

      const refreshedRawOrder = await getRawOrderById(id);
      const updatedOrder = normalizeOrderRecord(refreshedRawOrder || { ...rawOrder, status: nextStatus });

      if (nextStatus === 'paid' && previousOrder.status !== 'paid') {
        await sendOrderPaidNotifications(updatedOrder, previousOrder);
      }

      return res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error in PUT /api/orders/:id/payment-status:', error);
      return res.status(500).json({ error: 'Falha ao atualizar status de pagamento', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // InfinitePay Webhook Handler
  app.post("/api/webhook-infinitepay", async (req, res) => {
    const data = req.body;
    console.log("InfinitePay Webhook Received:", JSON.stringify(data));
    
    const incomingOrderNsu = extractInfinitePayOrderNsu(data);
    const incomingStatus = extractInfinitePayStatus(data);
    const { order: previousOrder, resolvedOrderNsu } = await resolveWebhookOrderByNsu(incomingOrderNsu);
    const orderNsu = resolvedOrderNsu;
    const status = mapInfinitePayStatusToOrderStatus(incomingStatus, previousOrder?.status);

    if (!orderNsu) {
      console.warn('InfinitePay webhook recebido sem `order_nsu` identificável.');
      return res.status(200).send("IGNORED");
    }
    const previousStatus = previousOrder?.status;

    if (!previousOrder) {
      console.warn(`InfinitePay webhook não encontrou pedido local para ${orderNsu}. Status recebido: ${incomingStatus}`);
      return res.status(200).send("IGNORED");
    }

    if (orderNsu) {
      // Update SQLite
      if (db) {
        db.prepare("UPDATE orders SET status = ? WHERE order_nsu = ?").run(status, orderNsu);
      }
      
      // Update Supabase
      if (supabase) {
        await supabase.from('orders').update({ status }).eq('order_nsu', orderNsu);
      }

      if (status === 'paid' && previousStatus !== 'paid') {
        const updatedOrder = (await getOrderByNsu(orderNsu)) || { ...previousOrder, status: 'paid' };
        await sendOrderPaidNotifications(updatedOrder, previousOrder);
      }
    }
    
    res.status(200).send("OK");
  });

  // Affiliate API
  app.get("/api/affiliates", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('affiliates').select('*');
        if (!error && data) return res.json(data);
        if (error) throw error;
      }
      if (db) {
        try {
          const affiliates = db.prepare("SELECT * FROM affiliates").all();
          return res.json(affiliates);
        } catch (e) {
          console.warn("SQLite affiliates fetch failed:", e);
          throw e;
        }
      }
      res.json([]);
    } catch (error) {
      console.error("Error in GET /api/affiliates:", error);
      res.status(500).json({ error: "Failed to fetch affiliates", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/affiliates", async (req, res) => {
    const { name, email, whatsapp, ref_code, commission_rate, tag } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const normalizedRefCode = await generateAffiliateRefCode(String(ref_code || '').trim(), normalizedName);
    const normalizedTag = String(tag || '').trim();
    
    // Basic anti-spam: check if email already exists
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { data: existingEmailAffiliate, error: emailLookupError } = await supabase
      .from('affiliates')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (emailLookupError) {
      return res.status(400).json({ error: emailLookupError.message });
    }

    if (existingEmailAffiliate) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado no programa de afiliados." });
    }

    const { data: existingRefAffiliate, error: refLookupError } = await supabase
      .from('affiliates')
      .select('id, ref_code')
      .eq('ref_code', normalizedRefCode)
      .maybeSingle();

    if (refLookupError) {
      return res.status(400).json({ error: refLookupError.message });
    }

    if (existingRefAffiliate) {
      return res.status(400).json({ error: "Este código de afiliado já está em uso. Escolha outro código de referência." });
    }

    const affiliateData: any = { 
      id: crypto.randomUUID(),
      name: normalizedName,
      email: normalizedEmail,
      ref_code: normalizedRefCode,
      commission_rate: Number(commission_rate) || 10,
      status: 'pending'
    };
    
    if (whatsapp) affiliateData.whatsapp = whatsapp;
    if (normalizedTag) affiliateData.tag = normalizedTag;
    
    const { error } = await supabase.from('affiliates').insert([affiliateData]);
    if (error) {
      if (error.message.includes('affiliates_ref_code_key')) {
        return res.status(400).json({ error: 'Este código de afiliado já está em uso. Escolha outro código de referência.' });
      }
      if (error.message.includes('affiliates_email_key')) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no programa de afiliados.' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    // Send email notifications
    try {
      await enviarEmail(
        process.env.EMAIL_USER || 'admin@l7fitness.com.br',
        "Novo Afiliado Pendente",
        `Novo afiliado aguardando aprovação.<br/><br/><strong>Nome:</strong> ${normalizedName}<br/><strong>E-mail:</strong> ${normalizedEmail}<br/><strong>WhatsApp:</strong> ${whatsapp || '—'}<br/><strong>Ref:</strong> ${normalizedRefCode}`,
      );
    } catch (e) {
      console.error("Email error:", e);
    }

    try {
      await enviarEmail(
        normalizedEmail,
        'Recebemos sua solicitação de afiliação',
        `Olá ${normalizedName},<br/><br/>Recebemos sua solicitação para o programa de afiliados da L7 Fitness.<br/>Seu cadastro foi registrado com sucesso e agora está em análise.<br/><br/><strong>Código gerado:</strong> ${normalizedRefCode}<br/><br/>Assim que houver aprovação ou necessidade de ajuste, você será avisado por e-mail.`,
      );
    } catch (e) {
      console.error('Affiliate confirmation email error:', e);
    }
    
    res.json({ success: true });
  });

  app.patch("/api/affiliates/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, whatsapp, commission_rate, tag } = req.body || {};

    const updateData: any = {};

    if (name !== undefined) updateData.name = String(name || '').trim();
    if (email !== undefined) updateData.email = String(email || '').trim().toLowerCase();
    if (whatsapp !== undefined) updateData.whatsapp = String(whatsapp || '').trim() || null;
    if (tag !== undefined) updateData.tag = String(tag || '').trim() || null;
    if (commission_rate !== undefined) {
      const parsedCommission = Number(commission_rate);
      if (!Number.isFinite(parsedCommission)) {
        return res.status(400).json({ error: 'Comissão inválida.' });
      }
      updateData.commission_rate = parsedCommission;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo enviado para atualização.' });
    }

    try {
      let updated = false;
      let supabaseError: Error | null = null;

      if (supabase) {
        const { error } = await supabase
          .from('affiliates')
          .update(updateData)
          .eq('id', id);

        if (!error) {
          updated = true;
        } else {
          supabaseError = new Error(error.message);
        }
      }

      if (!updated && db) {
        const allowedFields = ['name', 'email', 'whatsapp', 'commission_rate', 'tag'];
        const entries = Object.entries(updateData).filter(([key]) => allowedFields.includes(key));
        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');

        if (!setClause) {
          return res.status(400).json({ error: 'Nenhum campo válido enviado para atualização.' });
        }

        db.prepare(`UPDATE affiliates SET ${setClause} WHERE id = ?`).run(...entries.map(([, value]) => value), id);
        updated = true;
      }

      if (!updated) {
        throw supabaseError || new Error("Affiliate storage not configured");
      }
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("Affiliate update error:", e);
      res.status(400).json({ error: e.message || "Error updating affiliate" });
    }
  });

  app.get("/api/admin/affiliate-payouts", async (req, res) => {
    try {
      let payouts: any[] = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('affiliate_payout_requests')
            .select('*, affiliates(name,email,ref_code)')
            .order('requested_at', { ascending: false });
          if (!error && data) {
            payouts = data;
          }
        } catch (error) {
          console.warn('Supabase payout requests fetch failed, using SQLite fallback:', error);
        }
      }

      if ((!payouts || payouts.length === 0) && db) {
        payouts = db.prepare(`
          SELECT pr.*, a.name as affiliate_name, a.email as affiliate_email, a.ref_code as affiliate_ref_code
          FROM affiliate_payout_requests pr
          LEFT JOIN affiliates a ON a.id = pr.affiliate_id
          ORDER BY COALESCE(pr.requested_at, pr.created_at) DESC
        `).all();
      }

      res.json((payouts || []).map((item: any) => ({
        ...item,
        affiliate_name: item.affiliate_name || item.affiliates?.name || '',
        affiliate_email: item.affiliate_email || item.affiliates?.email || '',
        affiliate_ref_code: item.affiliate_ref_code || item.affiliates?.ref_code || '',
      })));
    } catch (error) {
      console.error('Error in GET /api/admin/affiliate-payouts:', error);
      res.status(500).json({ error: 'Failed to fetch payout requests', details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/admin/affiliate-payouts/:id", async (req, res) => {
    const { id } = req.params;
    const { status, admin_note } = req.body || {};
    const allowedStatuses = ['requested', 'processing', 'paid', 'rejected'];
    const nextStatus = allowedStatuses.includes(String(status)) ? String(status) : 'requested';
    const processedAt = nextStatus === 'paid' || nextStatus === 'rejected' ? new Date().toISOString() : null;

    try {
      let updated = false;
      let payoutRecord: any = null;
      if (supabase) {
        try {
          const payload: any = { status: nextStatus, admin_note: String(admin_note || '').trim() || null };
          if (processedAt) payload.processed_at = processedAt;
          const { error } = await supabase.from('affiliate_payout_requests').update(payload).eq('id', id);
          if (!error) {
            updated = true;
            const { data } = await supabase
              .from('affiliate_payout_requests')
              .select('*, affiliates(name,email,ref_code)')
              .eq('id', id)
              .single();
            payoutRecord = data;
          }
        } catch (error) {
          console.warn('Supabase payout update failed, using SQLite fallback:', error);
        }
      }

      if (!updated && db) {
        db.prepare(`
          UPDATE affiliate_payout_requests
          SET status = ?, admin_note = ?, processed_at = COALESCE(?, processed_at)
          WHERE id = ?
        `).run(nextStatus, String(admin_note || '').trim() || null, processedAt, id);
        payoutRecord = db.prepare(`
          SELECT pr.*, a.name as affiliate_name, a.email as affiliate_email, a.ref_code as affiliate_ref_code
          FROM affiliate_payout_requests pr
          LEFT JOIN affiliates a ON a.id = pr.affiliate_id
          WHERE pr.id = ?
        `).get(id);
        updated = true;
      }

      if (!updated) {
        return res.status(500).json({ error: 'Payout storage unavailable' });
      }

      const affiliateEmail = payoutRecord?.affiliate_email || payoutRecord?.affiliates?.email;
      const affiliateName = payoutRecord?.affiliate_name || payoutRecord?.affiliates?.name || 'afiliado';
      if (affiliateEmail && (nextStatus === 'paid' || nextStatus === 'rejected' || nextStatus === 'processing')) {
        try {
          const statusText = nextStatus === 'paid' ? 'pago' : nextStatus === 'processing' ? 'em análise' : 'rejeitado';
          await enviarEmail(
            affiliateEmail,
            `Atualização do seu saque L7 Fitness`,
            `Olá ${affiliateName}, sua solicitação de saque foi atualizada para: ${statusText}.${admin_note ? `\n\nObservação do admin: ${admin_note}` : ''}`
          );
        } catch (error) {
          console.warn('Falha ao enviar atualização de saque para afiliado:', error);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error in PATCH /api/admin/affiliate-payouts/:id:', error);
      res.status(500).json({ error: 'Failed to update payout request', details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/affiliates/:refCode/payout-request", async (req, res) => {
    const { refCode } = req.params;
    const { amount, pix_key, pix_key_type, note } = req.body || {};

    try {
      let affiliate: any = null;
      let rawOrders: any[] = [];
      let existingPayouts: any[] = [];

      if (supabase) {
        try {
          const { data, error } = await supabase.from('affiliates').select('*').eq('ref_code', refCode).single();
          if (!error && data) {
            affiliate = data;
            const { data: orders } = await supabase.from('orders').select('*').eq('affiliate_id', data.id);
            rawOrders = orders || [];
            const { data: payouts } = await supabase.from('affiliate_payout_requests').select('*').eq('affiliate_id', data.id);
            existingPayouts = payouts || [];
          }
        } catch (error) {
          console.warn('Supabase payout request preparation failed, using SQLite fallback:', error);
        }
      }

      if (!affiliate && db) {
        affiliate = db.prepare("SELECT * FROM affiliates WHERE ref_code = ?").get(refCode);
        if (affiliate) {
          rawOrders = db.prepare("SELECT * FROM orders WHERE affiliate_id = ?").all(affiliate.id);
          existingPayouts = db.prepare("SELECT * FROM affiliate_payout_requests WHERE affiliate_id = ?").all(affiliate.id);
        }
      }

      if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });

      const parsedAmount = Number(amount) || 0;
      if (parsedAmount <= 0) return res.status(400).json({ error: 'Informe um valor de saque válido.' });
      if (!String(pix_key || '').trim()) return res.status(400).json({ error: 'Informe uma chave Pix válida.' });

      const paidCommission = (rawOrders || [])
        .map((order: any) => normalizeOrderRecord(order))
        .filter((order: any) => order.status === 'paid')
        .reduce((acc: number, order: any) => acc + ((Number(order.total) || 0) * ((Number(affiliate.commission_rate) || 0) / 100)), 0);

      const committedPayouts = (existingPayouts || [])
        .filter((item: any) => ['requested', 'processing', 'paid'].includes(String(item.status || 'requested')))
        .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

      const availableToWithdraw = Math.max(0, paidCommission - committedPayouts);
      if (parsedAmount > availableToWithdraw + 0.0001) {
        return res.status(400).json({ error: `Valor acima do disponível para saque (${formatBRL(availableToWithdraw)}).` });
      }

      const payoutData = {
        id: crypto.randomUUID(),
        affiliate_id: affiliate.id,
        amount: parsedAmount,
        pix_key: String(pix_key || '').trim(),
        pix_key_type: String(pix_key_type || '').trim() || 'pix',
        status: 'requested',
        note: String(note || '').trim() || null,
        admin_note: null,
        requested_at: new Date().toISOString(),
        processed_at: null,
      };

      let persisted = false;
      let storageWarning: string | null = null;
      if (supabase) {
        try {
          const { error } = await supabase.from('affiliate_payout_requests').insert([payoutData]);
          if (!error) persisted = true;
          else storageWarning = error.message;
        } catch (error: any) {
          storageWarning = error?.message || String(error);
        }
      }

      if (!persisted && db) {
        db.prepare(`
          INSERT INTO affiliate_payout_requests (id, affiliate_id, amount, pix_key, pix_key_type, status, note, admin_note, requested_at, processed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          payoutData.id,
          payoutData.affiliate_id,
          payoutData.amount,
          payoutData.pix_key,
          payoutData.pix_key_type,
          payoutData.status,
          payoutData.note,
          payoutData.admin_note,
          payoutData.requested_at,
          payoutData.processed_at,
        );
        persisted = true;
      }

      if (!persisted) {
        return res.status(500).json({ error: 'Não foi possível registrar a solicitação de saque.', details: storageWarning });
      }

      try {
        const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'contato@mail.l7fitness.com.br';
        await enviarEmail(
          adminEmail,
          `Novo saque solicitado por afiliado`,
          `Afiliado: ${affiliate.name}\nRef: ${affiliate.ref_code}\nValor: ${formatBRL(parsedAmount)}\nPix (${payoutData.pix_key_type}): ${payoutData.pix_key}${payoutData.note ? `\nObservação: ${payoutData.note}` : ''}`
        );
      } catch (error) {
        console.warn('Falha ao enviar e-mail de solicitação de saque:', error);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error in POST /api/affiliates/:refCode/payout-request:', error);
      res.status(500).json({ error: 'Failed to create payout request', details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/affiliates/:refCode", async (req, res) => {
    const { refCode } = req.params;
    try {
      let affiliate: any = null;
      let rawOrders: any[] = [];
      let payoutRequests: any[] = [];

      if (supabase) {
        const { data, error } = await supabase.from('affiliates').select('*').eq('ref_code', refCode).single();
        if (!error && data) {
          affiliate = data;
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('affiliate_id', data.id)
            .order('created_at', { ascending: false });

          if (!ordersError && orders) {
            rawOrders = orders;
          }

          try {
            const { data: payouts } = await supabase
              .from('affiliate_payout_requests')
              .select('*')
              .eq('affiliate_id', data.id)
              .order('requested_at', { ascending: false });
            payoutRequests = payouts || [];
          } catch (error) {
            console.warn('Supabase payout requests unavailable for affiliate dashboard:', error);
          }
        }
      }

      if (!affiliate && db) {
        affiliate = db.prepare("SELECT * FROM affiliates WHERE ref_code = ?").get(refCode);
        if (affiliate) {
          rawOrders = db.prepare("SELECT * FROM orders WHERE affiliate_id = ? ORDER BY created_at DESC").all(affiliate.id);
          payoutRequests = db.prepare("SELECT * FROM affiliate_payout_requests WHERE affiliate_id = ? ORDER BY COALESCE(requested_at, created_at) DESC").all(affiliate.id);
        }
      }

      if (affiliate && payoutRequests.length === 0 && db) {
        try {
          payoutRequests = db.prepare("SELECT * FROM affiliate_payout_requests WHERE affiliate_id = ? ORDER BY COALESCE(requested_at, created_at) DESC").all(affiliate.id);
        } catch (error) {
          console.warn('SQLite payout requests fallback failed:', error);
        }
      }

      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      const commissionRate = Number(affiliate.commission_rate) || 0;
      const normalizedOrders = rawOrders
        .map((order) => normalizeOrderRecord(order))
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const validOrders = normalizedOrders.filter((order) => order.status !== 'failed');
      const paidOrders = normalizedOrders.filter((order) => order.status === 'paid');
      const pendingOrders = normalizedOrders.filter((order) => order.status === 'pending');
      const grossSales = validOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
      const paidSales = paidOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
      const pendingSales = pendingOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
      const paidCommission = paidSales * (commissionRate / 100);
      const pendingCommission = pendingSales * (commissionRate / 100);
      const normalizedPayouts = (payoutRequests || []).map((item: any) => ({
        ...item,
        amount: Number(item.amount) || 0,
        requested_at: item.requested_at || item.created_at || null,
        processed_at: item.processed_at || null,
      }));
      const paidOutTotal = normalizedPayouts
        .filter((item: any) => item.status === 'paid')
        .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
      const lockedPayouts = normalizedPayouts
        .filter((item: any) => ['requested', 'processing', 'paid'].includes(String(item.status || 'requested')))
        .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
      const pendingPayoutAmount = normalizedPayouts
        .filter((item: any) => ['requested', 'processing'].includes(String(item.status || 'requested')))
        .reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
      const availableToWithdraw = Math.max(0, paidCommission - lockedPayouts);
      const lastPaidPayout = normalizedPayouts.find((item: any) => item.status === 'paid');

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthPaidSales = paidOrders.reduce((acc, order) => {
        const createdAt = new Date(order.created_at || 0);
        if (createdAt >= startOfMonth) {
          return acc + (Number(order.total) || 0);
        }
        return acc;
      }, 0);

      const topProductsMap = new Map<string, { name: string; orders: number; quantity: number; revenue: number }>();
      validOrders.forEach((order) => {
        const seenProducts = new Set<string>();

        (order.items || []).forEach((item: any) => {
          if (!item || item.type === 'frete' || item.type === 'customer_metadata') return;
          const name = String(item.name || 'Produto').trim() || 'Produto';
          const quantity = Number(item.quantity) || 1;
          const revenue = (Number(item.price) || 0) * quantity;
          const existing = topProductsMap.get(name) || { name, orders: 0, quantity: 0, revenue: 0 };

          existing.quantity += quantity;
          existing.revenue += revenue;
          if (!seenProducts.has(name)) {
            existing.orders += 1;
            seenProducts.add(name);
          }

          topProductsMap.set(name, existing);
        });
      });

      const appUrl = resolveAppUrl(req);

      return res.json({
        ...affiliate,
        totalSales: grossSales,
        stats: {
          grossSales,
          paidSales,
          pendingSales,
          paidCommission,
          pendingCommission,
          monthlyCommission: monthPaidSales * (commissionRate / 100),
          approvedOrders: paidOrders.length,
          pendingOrders: pendingOrders.length,
          totalOrders: normalizedOrders.length,
          averageTicket: validOrders.length ? grossSales / validOrders.length : 0,
          availableToWithdraw,
          paidOutTotal,
          pendingPayoutAmount,
          lastPaymentAt: lastPaidPayout?.processed_at || lastPaidPayout?.requested_at || null,
        },
        shareLinks: {
          home: `${appUrl}/?ref=${encodeURIComponent(affiliate.ref_code || refCode)}`,
          store: `${appUrl}/loja?ref=${encodeURIComponent(affiliate.ref_code || refCode)}`,
        },
        payoutDefaults: {
          pixKey: normalizedPayouts[0]?.pix_key || '',
          pixKeyType: normalizedPayouts[0]?.pix_key_type || 'cpf',
        },
        payoutHistory: normalizedPayouts.map((item: any) => ({
          id: item.id,
          amount: Number(item.amount) || 0,
          status: item.status || 'requested',
          pixKey: item.pix_key || '',
          pixKeyType: item.pix_key_type || 'pix',
          note: item.note || '',
          adminNote: item.admin_note || '',
          requestedAt: item.requested_at || null,
          processedAt: item.processed_at || null,
        })),
        orders: normalizedOrders.map((order) => ({
          id: order.id,
          orderNsu: order.order_nsu,
          createdAt: order.created_at,
          status: order.status,
          total: Number(order.total) || 0,
          commission: (Number(order.total) || 0) * (commissionRate / 100),
          customerEmail: order.customer?.email || order.customer_email || '',
          customerName: order.customer?.name || '',
          items: (order.items || []).map((item: any) => ({
            name: item?.name || 'Produto',
            quantity: Number(item?.quantity) || 1,
          })),
        })),
        recentOrders: normalizedOrders.slice(0, 12).map((order) => ({
          id: order.id,
          orderNsu: order.order_nsu,
          createdAt: order.created_at,
          status: order.status,
          total: Number(order.total) || 0,
          commission: (Number(order.total) || 0) * (commissionRate / 100),
          customerEmail: order.customer?.email || order.customer_email || '',
          customerName: order.customer?.name || '',
          items: (order.items || []).map((item: any) => ({
            name: item?.name || 'Produto',
            quantity: Number(item?.quantity) || 1,
          })),
        })),
        topProducts: Array.from(topProductsMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
      });
    } catch (error) {
      console.error("Error in GET /api/affiliates/:refCode:", error);
      res.status(500).json({ error: "Failed to fetch affiliate dashboard", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Favorites API
  app.get("/api/favorites/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      let favorites: any[] = [];
      
      if (supabase) {
        try {
          const { data, error } = await supabase.from('favorites').select('*').eq('user_id', userId);
          if (!error && data) {
            return res.json(data);
          }
          if (error) console.warn("Supabase favorites fetch failed, falling back to SQLite:", error);
        } catch (e) {
          console.warn("Supabase favorites fetch error, falling back to SQLite:", e);
        }
      }
      
      if (db) {
        try {
          favorites = db.prepare("SELECT * FROM favorites WHERE user_id = ?").all(userId);
        } catch (e) {
          console.warn("SQLite favorites fetch failed:", e);
        }
      }
      
      res.json(favorites || []);
    } catch (error) {
      console.error("Error in GET /api/favorites:", error);
      res.json([]); // Return empty array instead of 500 to prevent frontend crash
    }
  });

  app.post("/api/favorites", async (req, res) => {
    const { user_id, item_id, item_type } = req.body;
    const id = `fav_${Date.now()}`;
    try {
      if (db) {
        db.prepare("INSERT INTO favorites (id, user_id, item_id, item_type) VALUES (?, ?, ?, ?)").run(id, user_id, item_id, item_type);
      }
      if (supabase) {
        await supabase.from('favorites').upsert([{ id, user_id, item_id, item_type }]);
      }
      res.json({ success: true, id });
    } catch (e) {
      res.status(400).json({ error: "Already favorited or error" });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", async (req, res) => {
    const { userId, itemId } = req.params;
    if (db) {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND item_id = ?").run(userId, itemId);
    }
    if (supabase) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('item_id', itemId);
    }
    res.json({ success: true });
  });

  // 📦 MELHOR ENVIO API - Calcular Frete
  app.post("/api/frete/calcular", async (req, res) => {
    try {
      const { cep, produtos } = req.body;

      // Validar CEP
      const cepLimpo = String(cep).replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        return res.status(400).json({ error: 'CEP inválido' });
      }

      if (!produtos || produtos.length === 0) {
        return res.status(400).json({ error: 'Nenhum produto fornecido' });
      }

      // Credenciais do Melhor Envio
      const apiKey = process.env.MELHOR_ENVIO_API_KEY;
      const cepOrigem = process.env.MELHOR_ENVIO_CEP_ORIGEM || '01310100';

      if (!apiKey) {
        console.warn('⚠️ MELHOR_ENVIO_API_KEY não está configurado');
        return res.status(503).json({ 
          error: 'Cálculo de frete indisponível no momento',
          message: 'Serviço não configurado' 
        });
      }

      // Preparar payload para Melhor Envio
      const payload = {
        from: {
          postal_code: String(cepOrigem).replace(/\D/g, ''),
        },
        to: {
          postal_code: cepLimpo,
        },
        products: produtos.map((p: any, idx: number) => ({
          id: String(idx + 1),
          width: Number(p.largura) || 10,
          height: Number(p.altura) || 10,
          length: Number(p.profundidade) || 10,
          weight: Number(p.peso) || 0.5,
          quantity: Number(p.quantidade) || 1,
        })),
      };

      console.log('📦 Calculando frete via Melhor Envio...');
      console.log('✅ Credenciais presentes', {
        apiKeyPresente: !!apiKey,
        apiKeyLength: apiKey?.length,
        cepOrigem: cepOrigem.replace(/\D/g, ''),
      });
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Chamar API do Melhor Envio
      const response = await axios.post(
        'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Halex-Shop/1.0',
          },
          timeout: 15000,
        }
      );

      console.log('✅ Frete calculado com sucesso:', response.data.length, 'opção(ões)');
      console.log('Response data:', JSON.stringify(response.data.slice(0, 1), null, 2));
      
      // Retornar opções de frete
      res.json(response.data || []);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data ||
        error.message ||
        'Erro desconhecido ao calcular frete';

      const isNetworkError = error.code === 'ENOTFOUND' || 
                            error.code === 'ECONNREFUSED' || 
                            error.code === 'ETIMEDOUT' ||
                            !error.response;

      console.error('❌ ERRO AO CALCULAR FRETE:', {
        code: error.code,
        httpStatus: error.response?.status,
        statusText: error.response?.statusText,
        apiResponse: error.response?.data,
        errorMessage: error.message,
        isNetworkError,
      });

      // Retornar detalhes do erro
      res.status(error.response?.status || 500).json({
        error: 'Erro ao calcular frete',
        details: error.response?.data,
        message: typeof errorMsg === 'string' 
          ? errorMsg 
          : JSON.stringify(errorMsg),
        status: error.response?.status || 500,
        code: error.code,
        errorType: isNetworkError 
          ? 'NETWORK_ERROR'
          : error.response?.status === 401
          ? 'API_KEY_INVALID'
          : 'UNKNOWN_ERROR',
      });
    }
  });

  app.get('/og/:variant(default|store|quiz|blog).svg', (req, res) => {
    const variant = req.params.variant;

    const presets: Record<string, { eyebrow: string; title: string; subtitle: string; cta: string; footer: string }> = {
      default: {
        eyebrow: 'L7 FITNESS',
        title: 'Garanta seus suplementos com frete rápido',
        subtitle: 'Ofertas fortes, parcelamento em até 12x e atendimento direto no WhatsApp.',
        cta: 'COMPRE AGORA',
        footer: 'www.l7fitness.com.br',
      },
      store: {
        eyebrow: 'LOJA OFICIAL',
        title: 'Ofertas fortes para acelerar seus resultados',
        subtitle: 'Kits e suplementos L7 Fitness com frete rápido para todo o Brasil.',
        cta: 'VER OFERTAS',
        footer: 'Loja L7 Fitness',
      },
      quiz: {
        eyebrow: 'QUIZ AI',
        title: 'Descubra sua melhor recomendação personalizada',
        subtitle: 'Receba produto, alimentação e treino ideais para o seu perfil.',
        cta: 'FAZER QUIZ',
        footer: 'Diagnóstico comercial inteligente',
      },
      blog: {
        eyebrow: 'BLOG L7',
        title: 'Dicas práticas de treino dieta e emagrecimento',
        subtitle: 'Conteúdo rápido para transformar constância em resultado.',
        cta: 'LER AGORA',
        footer: 'Blog oficial L7 Fitness',
      },
    };

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(renderOgSvg(presets[variant] || presets.default));
  });

  app.get('/og/:variant(default|store|quiz|blog).png', async (req, res) => {
    const variant = req.params.variant;

    const presets: Record<string, { eyebrow: string; title: string; subtitle: string; cta: string; footer: string }> = {
      default: {
        eyebrow: 'L7 FITNESS',
        title: 'Garanta seus suplementos com frete rápido',
        subtitle: 'Ofertas fortes, parcelamento em até 12x e atendimento direto no WhatsApp.',
        cta: 'COMPRE AGORA',
        footer: 'www.l7fitness.com.br',
      },
      store: {
        eyebrow: 'LOJA OFICIAL',
        title: 'Ofertas fortes para acelerar seus resultados',
        subtitle: 'Kits e suplementos L7 Fitness com frete rápido para todo o Brasil.',
        cta: 'VER OFERTAS',
        footer: 'Loja L7 Fitness',
      },
      quiz: {
        eyebrow: 'QUIZ AI',
        title: 'Descubra sua melhor recomendação personalizada',
        subtitle: 'Receba produto, alimentação e treino ideais para o seu perfil.',
        cta: 'FAZER QUIZ',
        footer: 'Diagnóstico comercial inteligente',
      },
      blog: {
        eyebrow: 'BLOG L7',
        title: 'Dicas práticas de treino dieta e emagrecimento',
        subtitle: 'Conteúdo rápido para transformar constância em resultado.',
        cta: 'LER AGORA',
        footer: 'Blog oficial L7 Fitness',
      },
    };

    try {
      const buffer = await renderOgPngBuffer(presets[variant] || presets.default);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.send(buffer);
    } catch (error) {
      console.error('Falha ao gerar OG PNG padrão:', error);
      res.status(500).send('Falha ao gerar imagem OG.');
    }
  });

  app.get('/og/product/:id.svg', async (req, res) => {
    const product = await getProductByIdForMetaAsync(decodeURIComponent(req.params.id || ''));
    const benefit = getProductBenefitLine(product);
    const offerLine = getProductOfferLine(product);
    const imageUrl = String(product?.image || product?.images?.[0] || '').trim() || undefined;
    const campaignLabel = getProductCampaignLabel(product);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(renderOgSvg({
      eyebrow: campaignLabel === 'MAIS VENDIDO' ? 'TOP VENDAS' : campaignLabel === 'ESTOQUE LIMITADO' ? 'ÚLTIMAS UNIDADES' : 'OFERTA L7',
      title: product?.name || 'Suplemento L7 Fitness',
      subtitle: benefit,
      cta: getProductCtaLabel(product),
      footer: `L7 Fitness • ${offerLine}`,
      imageUrl,
      priceLabel: product ? formatBRL(Number(product.price) || 0) : undefined,
      comparePriceLabel: getProductComparePriceLabel(product),
      badges: getProductBadgeList(product),
      highlightLabel: campaignLabel,
    }));
  });

  app.get('/og/product/:id.png', async (req, res) => {
    const product = await getProductByIdForMetaAsync(decodeURIComponent(req.params.id || ''));
    const benefit = getProductBenefitLine(product);
    const offerLine = getProductOfferLine(product);
    const imageUrl = String(product?.image || product?.images?.[0] || '').trim() || undefined;
    const campaignLabel = getProductCampaignLabel(product);

    try {
      const buffer = await renderOgPngBuffer({
        eyebrow: campaignLabel === 'MAIS VENDIDO' ? 'TOP VENDAS' : campaignLabel === 'ESTOQUE LIMITADO' ? 'ÚLTIMAS UNIDADES' : 'OFERTA L7',
        title: product?.name || 'Suplemento L7 Fitness',
        subtitle: benefit,
        cta: getProductCtaLabel(product),
        footer: `L7 Fitness • ${offerLine}`,
        imageUrl,
        priceLabel: product ? formatBRL(Number(product.price) || 0) : undefined,
        comparePriceLabel: getProductComparePriceLabel(product),
        badges: getProductBadgeList(product),
        highlightLabel: campaignLabel,
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.send(buffer);
    } catch (error) {
      console.error('Falha ao gerar OG PNG de produto:', error);
      res.status(500).send('Falha ao gerar imagem OG do produto.');
    }
  });

  app.get('/og/blog/:id.svg', (req, res) => {
    const post = getPostByIdForMeta(decodeURIComponent(req.params.id || ''));

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(renderOgSvg({
      eyebrow: 'BLOG L7',
      title: post?.title || 'Conteúdo L7 Fitness',
      subtitle: post?.excerpt || 'Leia uma dica prática para acelerar seus resultados com mais estratégia.',
      cta: 'LER AGORA',
      footer: `Blog L7 Fitness • ${post?.readTime || 'Leitura rápida'}`,
      imageUrl: String(post?.image || '').trim() || undefined,
      badges: [post?.category || 'Conteúdo', post?.readTime || 'Leitura rápida'],
    }));
  });

  app.get('/og/blog/:id.png', async (req, res) => {
    const post = getPostByIdForMeta(decodeURIComponent(req.params.id || ''));

    try {
      const buffer = await renderOgPngBuffer({
        eyebrow: 'BLOG L7',
        title: post?.title || 'Conteúdo L7 Fitness',
        subtitle: post?.excerpt || 'Leia uma dica prática para acelerar seus resultados com mais estratégia.',
        cta: 'LER AGORA',
        footer: `Blog L7 Fitness • ${post?.readTime || 'Leitura rápida'}`,
        imageUrl: String(post?.image || '').trim() || undefined,
        badges: [post?.category || 'Conteúdo', post?.readTime || 'Leitura rápida'],
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.send(buffer);
    } catch (error) {
      console.error('Falha ao gerar OG PNG do blog:', error);
      res.status(500).send('Falha ao gerar imagem OG do blog.');
    }
  });

  const renderAppWithMeta = async (req: any, res: any, next?: any) => {
    try {
      const htmlPath = process.env.NODE_ENV === 'production'
        ? path.join(__dirname, 'dist', 'index.html')
        : path.join(__dirname, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const meta = await getRouteMetaAsync(req.path, resolveAppUrl(req));
      const injectedHtml = html.replace(
        /<!-- SEO_META_START -->([\s\S]*?)<!-- SEO_META_END -->/,
        `<!-- SEO_META_START -->${buildMetaBlock(meta)}<!-- SEO_META_END -->`
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injectedHtml);
    } catch (error) {
      console.error('Falha ao renderizar HTML com meta tags dinâmicas:', error);
      if (next) return next(error);
      res.status(500).send('Erro ao renderizar página.');
    }
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    })();
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get(['/', '/loja', '/dicas-ai', '/produto/:id', '/oferta/:id', '/campanha/:id', '/blog', '/blog/:id', '/admin', '/checkout', '/checkout/success', '/afiliado/:refCode'], renderAppWithMeta);
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      renderAppWithMeta(req, res, next);
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message || "An unexpected error occurred",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
