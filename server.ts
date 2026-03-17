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
import crypto from "crypto";
import dotenv from "dotenv";

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
      commission_rate REAL DEFAULT 10,
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
    db.exec("ALTER TABLE orders ADD COLUMN affiliate_id TEXT");
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

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log(`Supabase integrated successfully using ${supabaseServiceRoleKey ? 'service role' : 'anon key'}.`);
} else {
  console.warn("Supabase credentials missing. Using local SQLite only.");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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

const getProductsCatalog = () => {
  if (db) {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      if (Array.isArray(products) && products.length > 0) return products.map((product: any) => applyPromotionToProduct(product));
    } catch (error) {
      console.warn('Falha ao carregar catálogo de produtos para SEO:', error);
    }
  }

  return PRODUCTS.map((product) => applyPromotionToProduct(product));
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

const getProductBenefitLine = (product: any) => {
  const description = String(product?.description || '').trim();
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
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />
  `;

const getRouteMeta = (pathname: string, appUrl: string) => {
  const normalizedPath = String(pathname || '/').split('?')[0] || '/';
  const productMatch = normalizedPath.match(/^\/produto\/([^/]+)$/);
  const blogDetailMatch = normalizedPath.match(/^\/blog\/([^/]+)$/);

  const defaultMeta = {
    title: 'L7 Fitness | Garanta seu suplemento com frete rápido',
    description: 'Garanta hoje seus suplementos L7 Fitness com frete rápido, parcelamento em até 12x e atendimento direto no WhatsApp. Estoque limitado.',
    canonicalUrl: `${appUrl}${normalizedPath === '/' ? '/' : normalizedPath}`,
    imageUrl: `${appUrl}/og/default.svg`,
    imageAlt: 'Arte promocional da L7 Fitness com CTA de compra',
    type: 'website',
  };

  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    const product = getProductByIdForMeta(productId);
    if (product) {
      return {
        title: `${product.name} | Compre agora na L7 Fitness`,
        description: getProductSocialDescription(product),
        canonicalUrl: `${appUrl}/produto/${encodeURIComponent(productId)}`,
        imageUrl: `${appUrl}/og/product/${encodeURIComponent(productId)}.svg`,
        imageAlt: `${product.name} com CTA de compra da L7 Fitness`,
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
        imageUrl: `${appUrl}/og/blog/${encodeURIComponent(postId)}.svg`,
        imageAlt: `${post.title} no blog da L7 Fitness`,
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
      imageUrl: `${appUrl}/og/store.svg`,
      imageAlt: 'Loja L7 Fitness com ofertas e frete rápido',
    };
  }

  if (normalizedPath === '/dicas-ai') {
    return {
      ...defaultMeta,
      title: 'Quiz AI L7 Fitness | Descubra sua melhor recomendação',
      description: 'Faça o quiz da L7 Fitness e receba uma recomendação personalizada com produto, alimentação, treino e oferta especial.',
      canonicalUrl: `${appUrl}/dicas-ai`,
      imageUrl: `${appUrl}/og/quiz.svg`,
      imageAlt: 'Quiz AI da L7 Fitness com recomendação personalizada',
    };
  }

  if (normalizedPath === '/blog') {
    return {
      ...defaultMeta,
      title: 'Blog L7 Fitness | Dicas de treino, dieta e resultados',
      description: 'Leia dicas práticas de emagrecimento, treino e alimentação no blog da L7 Fitness e acelere seus resultados.',
      canonicalUrl: `${appUrl}/blog`,
      imageUrl: `${appUrl}/og/blog.svg`,
      imageAlt: 'Blog L7 Fitness com dicas de treino e alimentação',
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

const extractInfinitePayOrderNsu = (data: any): string | null => {
  const candidates = [
    data?.order_nsu,
    data?.orderNsu,
    data?.data?.order_nsu,
    data?.data?.orderNsu,
    data?.invoice?.order_nsu,
    data?.invoice?.orderNsu,
    data?.payment?.order_nsu,
    data?.payment?.orderNsu,
    data?.payload?.order_nsu,
    data?.payload?.orderNsu,
    data?.resource?.order_nsu,
    data?.resource?.orderNsu,
    data?.external_reference,
    data?.externalReference,
  ];

  const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return value ? String(value).trim() : null;
};

const extractInfinitePayStatus = (data: any): string => {
  const candidates = [
    data?.status,
    data?.data?.status,
    data?.invoice?.status,
    data?.payment?.status,
    data?.resource?.status,
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
  return ['paid', 'approved', 'completed', 'success', 'succeeded', 'invoice.paid', 'payment.approved', 'payment.paid'].includes(normalized);
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

          products = (data || []).map(p => {
            let images = [];
            try {
              images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
            } catch (e) {
              console.warn(`Failed to parse images for product ${p.id}:`, e);
            }
            return applyPromotionToProduct({
              ...p,
              images,
              // Map single category to categories array for frontend compatibility
              categories: p.category ? [p.category] : []
            });
          });
          usedSupabase = true;
        } catch (supaError: any) {
          console.error("Supabase products fetch failed, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          const dbProducts = db.prepare("SELECT * FROM products").all() as any[];
          
          products = dbProducts.map(p => {
            let images = [];
            try {
              images = p.images ? JSON.parse(p.images) : [];
            } catch (e) {
              console.warn(`Failed to parse images for product ${p.id} from SQLite:`, e);
            }
            return applyPromotionToProduct({
              ...p,
              images,
              categories: p.category ? [p.category] : []
            });
          });
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

  // Admin API - Products
  app.post("/api/products", async (req, res) => {
    const { id, name, price, description, category, categories, image, images, stock, rating, reviews } = req.body;
    const productId = id || crypto.randomUUID();
    // Use the first category from the array if 'category' is not directly provided
    const mainCategory = category || (categories && categories.length > 0 ? categories[0] : null);
    
    const productData = { 
      id: productId, 
      name, 
      price, 
      description, 
      category: mainCategory,
      image, 
      images: JSON.stringify(images || []), 
      stock: stock || 0, 
      rating: rating || 5, 
      reviews: reviews || 0 
    };
    
    if (db) {
      try {
        db.prepare("INSERT INTO products (id, name, price, description, category, image, images, stock, rating, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(productId, name, price, description, productData.category, productData.image, productData.images, productData.stock, productData.rating, productData.reviews);
      } catch (e) {
        console.error("SQLite product insert error:", e);
      }
    }
    
    if (supabase) {
      const { error } = await supabase.from('products').upsert([productData]);
      if (error) console.error("Supabase product upsert error:", error);
    }
    
    res.json({ success: true, id: productId });
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (db) {
      try {
        db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
        db.prepare("DELETE FROM product_categories WHERE product_id = ?").run(req.params.id);
      } catch (e) {}
    }
    
    if (supabase) {
      await supabase.from('products').delete().eq('id', req.params.id);
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
    const { name, price, description, category, categories, image, images, stock, rating, reviews } = req.body;
    const mainCategory = category || (categories && categories.length > 0 ? categories[0] : null);

    const productData = { 
      name, 
      price, 
      description, 
      category: mainCategory,
      image, 
      images: typeof images === 'string' ? images : JSON.stringify(images || []), 
      stock: stock || 0, 
      rating: rating || 5, 
      reviews: reviews || 0 
    };
    
    if (db) {
      try {
        db.prepare("UPDATE products SET name = ?, price = ?, description = ?, category = ?, image = ?, images = ?, stock = ?, rating = ?, reviews = ? WHERE id = ?")
          .run(productData.name, productData.price, productData.description, productData.category, productData.image, productData.images, productData.stock, productData.rating, productData.reviews, req.params.id);
      } catch (e) {
        console.error("SQLite product update error:", e);
      }
    }
    
    if (supabase) {
      const { error } = await supabase.from('products').update(productData).eq('id', req.params.id);
      if (error) console.error("Supabase product update error:", error);
    }
    
    res.json({ success: true });
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

      if (supabase) {
        const { error } = await supabase.from('quiz_leads').insert([leadData]);
        if (error) {
          console.error('Supabase quiz_leads insert failed:', error);
          return res.status(500).json({
            success: false,
            error: 'Falha ao salvar lead no Supabase.',
            details: error.message || String(error),
          });
        }

        supabaseSaved = true;
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

      if (!supabase && !sqliteSaved) {
        return res.status(500).json({ success: false, error: 'Nenhum banco configurado para salvar lead do quiz.' });
      }

      res.json({ success: true, id: leadId, saved: { supabase: supabaseSaved, sqlite: sqliteSaved } });
    } catch (error) {
      console.error('Error in POST /api/quiz-leads:', error);
      res.status(500).json({ success: false, error: 'Falha ao salvar lead do quiz.' });
    }
  });

  app.get("/api/quiz-leads", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('quiz_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase quiz_leads fetch failed:', error);
          return res.status(500).json({ success: false, error: 'Falha ao carregar leads no Supabase.' });
        }

        return res.json({ success: true, leads: (data || []).map(normalizeQuizLeadRecord), source: 'supabase' });
      }

      if (db) {
        const leads = db.prepare("SELECT * FROM quiz_leads ORDER BY created_at DESC").all();
        return res.json({ success: true, leads: leads.map(normalizeQuizLeadRecord), source: 'sqlite' });
      }

      return res.status(500).json({ success: false, error: 'Nenhum banco configurado para listar leads.' });
    } catch (error) {
      console.error('Error in GET /api/quiz-leads:', error);
      return res.status(500).json({ success: false, error: 'Falha ao carregar leads do quiz.' });
    }
  });

  app.put("/api/quiz-leads/:id/crm", async (req, res) => {
    const { id } = req.params;
    const { crmStatus, internalNote, lastContactAt, nextFollowUpAt, monthlyPlanInterest, planOfferedAt, historyEntry } = req.body || {};
    const allowedStatuses = ['new', 'contacted', 'interested', 'won', 'lost'];
    const allowedMonthlyPlanInterest = ['unknown', 'interested', 'not_interested', 'closed'];
    const normalizedStatus = allowedStatuses.includes(String(crmStatus)) ? String(crmStatus) : 'new';
    const normalizedNote = String(internalNote || '').trim();
    const normalizedLastContactAt = String(lastContactAt || '').trim() || null;
    const normalizedNextFollowUpAt = String(nextFollowUpAt || '').trim() || null;
    const normalizedMonthlyPlanInterest = allowedMonthlyPlanInterest.includes(String(monthlyPlanInterest)) ? String(monthlyPlanInterest) : 'unknown';
    const normalizedPlanOfferedAt = String(planOfferedAt || '').trim() || null;
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

      if (supabase) {
        const { error } = await supabase
          .from('quiz_leads')
          .update({ metadata: serializedMetadata })
          .eq('id', id);

        if (error) {
          console.error('Supabase quiz_leads CRM update failed:', error);
          return res.status(500).json({ success: false, error: 'Falha ao atualizar CRM no Supabase.' });
        }
      }

      if (db) {
        db.prepare("UPDATE quiz_leads SET metadata = ? WHERE id = ?").run(serializedMetadata, id);
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
    const affiliates = db.prepare("SELECT * FROM affiliates WHERE status = 'pending'").all();
    res.json(affiliates);
  });

  app.post("/api/admin/affiliates/:id/approve", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    db.prepare("UPDATE affiliates SET status = ? WHERE id = ?").run(status, id);
    
    // Send email to affiliate
    const affiliate = db.prepare("SELECT * FROM affiliates WHERE id = ?").get(id);
    if (affiliate) {
      try {
        await enviarEmail(affiliate.email, `Sua afiliação foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}`, `Olá ${affiliate.name}, sua solicitação de afiliação foi ${status}.`);
      } catch (e) {
        console.error("Email error:", e);
      }
    }
    
    res.json({ success: true });
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

  // InfinitePay Webhook Handler
  app.post("/api/webhook-infinitepay", async (req, res) => {
    const data = req.body;
    console.log("InfinitePay Webhook Received:", JSON.stringify(data));
    
    const orderNsu = extractInfinitePayOrderNsu(data);
    const incomingStatus = extractInfinitePayStatus(data);
    const status = isInfinitePayPaidStatus(incomingStatus) ? 'paid' : 'failed';

    if (!orderNsu) {
      console.warn('InfinitePay webhook recebido sem `order_nsu` identificável.');
      return res.status(200).send("IGNORED");
    }

    const previousOrder = orderNsu ? await getOrderByNsu(orderNsu) : null;
    const previousStatus = previousOrder?.status;

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
        const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.EMAIL_USER || 'contato@mail.l7fitness.com.br';

        try {
          await enviarEmail(
            orderNotificationEmail,
            `Pagamento aprovado ${orderNsu}`,
            buildOrderEmailHtml({
              title: 'Pagamento aprovado',
              intro: 'O pagamento foi confirmado pela InfinitePay. O pedido está pronto para separação e envio.',
              order: updatedOrder,
            })
          );
        } catch (emailError) {
          console.warn('Falha ao enviar aviso de pagamento aprovado para admin:', emailError);
        }

        if (updatedOrder?.customer_email) {
          try {
            await enviarEmail(
              updatedOrder.customer_email,
              `Pagamento confirmado ${orderNsu}`,
              buildOrderEmailHtml({
                title: 'Pagamento confirmado',
                intro: 'Recebemos seu pagamento com sucesso. Em breve você receberá novidades sobre a preparação e o envio do pedido.',
                order: updatedOrder,
              })
            );
          } catch (emailError) {
            console.warn('Falha ao enviar confirmação de pagamento para cliente:', emailError);
          }
        }
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
    const { name, email, whatsapp, ref_code, commission_rate } = req.body;
    
    // Basic anti-spam: check if email already exists
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { data: existing } = await supabase.from('affiliates').select('*').eq('email', email).single();
    if (existing) return res.status(400).json({ error: "Email já cadastrado" });

    const affiliateData: any = { 
      id: crypto.randomUUID(),
      name, 
      email, 
      ref_code, 
      commission_rate: Number(commission_rate) || 10,
      status: 'pending'
    };
    
    if (whatsapp) affiliateData.whatsapp = whatsapp;
    
    const { error } = await supabase.from('affiliates').insert([affiliateData]);
    if (error) return res.status(400).json({ error: error.message });
    
    // Send email to admin
    try {
      await enviarEmail(process.env.EMAIL_USER || 'admin@l7fitness.com.br', "Novo Afiliado Pendente", `Novo afiliado: ${name} (${email}) aguardando aprovação.`);
    } catch (e) {
      console.error("Email error:", e);
    }
    
    res.json({ success: true });
  });

  app.get("/api/admin/affiliates", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { data, error } = await supabase.from('affiliates').select('*').eq('status', 'pending');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/admin/affiliates/:id/approve", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    
    try {
      const { error } = await supabase.from('affiliates').update({ status }).eq('id', id);
      if (error) throw error;
      
      // Send email to affiliate
      const { data: affiliate } = await supabase.from('affiliates').select('*').eq('id', id).single();
      if (affiliate) {
        try {
          await enviarEmail(affiliate.email, `Sua afiliação foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}`, `Olá ${affiliate.name}, sua solicitação de afiliação foi ${status}.`);
        } catch (e: any) {
          console.error("Falha ao enviar e-mail de notificação de afiliado:", e.message);
          // Não travamos a resposta se apenas o e-mail falhar, mas avisamos no log
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao aprovar afiliado:", error);
      res.status(500).json({ error: "Erro ao processar aprovação", details: error.message || String(error) });
    }
  });

  app.patch("/api/affiliates/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, whatsapp, commission_rate } = req.body;
    
    const updateData: any = { 
      name,
      email,
      whatsapp,
      commission_rate: Number(commission_rate) 
    };

    try {
      if (!supabase) throw new Error("Supabase not configured");

      const { error } = await supabase
        .from('affiliates')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("Affiliate update error:", e);
      res.status(400).json({ error: e.message || "Error updating affiliate" });
    }
  });

  app.get("/api/affiliates/:refCode", async (req, res) => {
    const { refCode } = req.params;
    if (supabase) {
      const { data, error } = await supabase.from('affiliates').select('*').eq('ref_code', refCode).single();
      if (!error && data) {
        // Get stats
        const { data: orders } = await supabase.from('orders').select('total').eq('affiliate_id', data.id);
        const totalSales = orders?.reduce((acc, o) => acc + o.total, 0) || 0;
        return res.json({ ...data, totalSales });
      }
    }
    if (db) {
      const affiliate = db.prepare("SELECT * FROM affiliates WHERE ref_code = ?").get(refCode);
      if (affiliate) {
        const orders = db.prepare("SELECT total FROM orders WHERE affiliate_id = ?").all(affiliate.id);
        const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
        return res.json({ ...affiliate, totalSales });
      }
    }
    res.status(404).json({ error: "Affiliate not found" });
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

  app.get('/og/product/:id.svg', (req, res) => {
    const product = getProductByIdForMeta(decodeURIComponent(req.params.id || ''));
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

  const renderAppWithMeta = (req: any, res: any, next?: any) => {
    try {
      const htmlPath = process.env.NODE_ENV === 'production'
        ? path.join(__dirname, 'dist', 'index.html')
        : path.join(__dirname, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const meta = getRouteMeta(req.path, resolveAppUrl(req));
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
    app.get(['/', '/loja', '/dicas-ai', '/produto/:id', '/blog', '/blog/:id', '/admin', '/checkout', '/checkout/success', '/afiliado/:refCode'], renderAppWithMeta);
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
