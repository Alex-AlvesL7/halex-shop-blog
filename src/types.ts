export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  promotionLabel?: string;
  promotionCta?: string;
  promotionBadge?: string;
  description: string;
  category?: string;
  categories?: string[];
  image: string;
  images?: string[];
  stock: number;
  rating: number;
  reviews: number;
  // Dimensões para cálculo de frete
  peso?: number;        // em kg
  altura?: number;      // em cm
  largura?: number;     // em cm
  profundidade?: number; // em cm
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'alimentacao' | 'treino' | 'dieta' | 'negocios';
  author: string;
  date: string;
  image: string;
  readTime: string;
}

export interface CartItem extends Product {
  quantity: number;
}
