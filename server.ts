import express from "express";
import axios from "axios";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { enviarEmail } from "./mailer.js";
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
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase integrated successfully.");
} else {
  console.warn("Supabase credentials missing. Using local SQLite only.");
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
            return {
              ...p,
              images,
              // Map single category to categories array for frontend compatibility
              categories: p.category ? [p.category] : []
            };
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
            return {
              ...p,
              images,
              categories: p.category ? [p.category] : []
            };
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
          orders = (data || []).map(o => {
            let items = [];
            try {
              items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
            } catch (e) {
              console.warn(`Failed to parse items for order ${o.id}:`, e);
            }
            return { ...o, items };
          });
          usedSupabase = true;
        } catch (supaError) {
          console.error("Supabase orders fetch failed, falling back to SQLite:", supaError);
        }
      }

      if (!usedSupabase && db) {
        try {
          const dbOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as any[];
          orders = dbOrders.map(o => {
            let items = [];
            try {
              items = o.items ? JSON.parse(o.items) : [];
            } catch (e) {
              console.warn(`Failed to parse items for order ${o.id} from SQLite:`, e);
            }
            return { ...o, items };
          });
        } catch (sqliteError) {
          console.error("SQLite orders fetch failed:", sqliteError);
          // Try without ORDER BY if it fails (might be missing column)
          try {
            const dbOrders = db.prepare("SELECT * FROM orders").all() as any[];
            orders = dbOrders.map(o => {
              let items = [];
              try {
                items = o.items ? JSON.parse(o.items) : [];
              } catch (e) {
                console.warn(`Failed to parse items for order ${o.id} from SQLite:`, e);
              }
              return { ...o, items };
            });
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
          orders = data || [];
          usedSupabase = true;
        } catch (supaError: any) {
          console.error("Supabase orders fetch failed for email, falling back to SQLite:", supaError.message || supaError);
        }
      }

      if (!usedSupabase && db) {
        orders = db.prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC").all(email);
      }
      res.json(orders.map(o => {
        let items = [];
        try {
          items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        } catch (e) {
          console.warn(`Failed to parse items for order ${o.id}:`, e);
        }
        return { ...o, items };
      }));
    } catch (error) {
      console.error("Error in GET /api/orders/:email:", error);
      res.status(500).json({ error: "Failed to fetch orders", details: error instanceof Error ? error.message : String(error) });
    }
  });

app.post("/api/checkout", async (req, res) => {
  try {
    const { items, total, customer_email, affiliate_id, frete } = req.body;

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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const orderNsu = String("L7-" + Date.now());
    
    // Save order to DB (SQLite + Supabase)
    const orderData = {
      id: "ord_" + Date.now(),
      order_nsu: orderNsu,
      customer_email: customer_email || 'guest@example.com',
      items: JSON.stringify(itemsWithFrete),
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
    
    const orderNsu = data.order_nsu || data.data?.order_nsu;
    const status = (data.status === 'paid' || data.data?.status === 'paid') ? 'paid' : 'failed';

    if (orderNsu) {
      // Update SQLite
      if (db) {
        db.prepare("UPDATE orders SET status = ? WHERE order_nsu = ?").run(status, orderNsu);
      }
      
      // Update Supabase
      if (supabase) {
        await supabase.from('orders').update({ status }).eq('order_nsu', orderNsu);
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
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(__dirname, "dist", "index.html"));
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
