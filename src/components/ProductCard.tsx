import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useAuth } from '../contexts/authContext';
import { formatPriceBRL, hasProductPromotion } from '../utils/productContent';

const categoryLabels: Record<string, string> = {
  emagrecedores: 'Emagrecedores',
  suplementos: 'Suplementos',
  acessorios: 'Acessórios',
  vestuario: 'Vestuário',
};

export const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}> = ({ product, onAddToCart, onClick }) => {
  const { toggleFavorite, isFavorite, user } = useAuth();
  const favorited = isFavorite(product.id);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => onClick(product)}
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative ${product.stock <= 0 ? 'opacity-75' : ''}`}
    >
      {user && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(product.id, 'product');
          }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${favorited ? 'bg-brand-orange text-white' : 'bg-white/80 text-gray-400 hover:text-brand-orange'}`}
        >
          <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
        </button>
      )}

      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-brand-black">
            {categoryLabels[String(product.category || '').toLowerCase()] || product.category || 'Produto'}
          </span>
          {product.promotionLabel && (
            <span className="bg-brand-orange text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {product.promotionLabel}
            </span>
          )}
          {product.stock <= 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
              Esgotado
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, index) => (
              <span key={index} className={index < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}>★</span>
            ))}
          </div>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            {hasProductPromotion(product) && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 line-through">{formatPriceBRL(product.compareAtPrice)}</span>
                <span className="px-2 py-1 rounded-full bg-orange-50 text-brand-orange text-[10px] font-black uppercase tracking-widest">
                  -{product.discountPercentage}%
                </span>
              </div>
            )}
            <span className="text-lg font-bold text-brand-orange">{formatPriceBRL(product.price)}</span>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              if (product.stock > 0) onAddToCart(product);
            }}
            disabled={product.stock <= 0}
            className={`p-2 rounded-full transition-colors ${product.stock > 0 ? 'bg-brand-black text-white hover:bg-brand-orange' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
