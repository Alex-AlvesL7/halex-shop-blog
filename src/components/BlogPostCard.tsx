import React from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { BlogPost } from '../types';
import { useAuth } from '../contexts/authContext';

export const BlogPostCard: React.FC<{
  post: BlogPost;
  onClick: (post: BlogPost) => void;
  onAffiliateClick?: () => void;
}> = ({ post, onClick, onAffiliateClick }) => {
  const { toggleFavorite, isFavorite, user } = useAuth();
  const favorited = isFavorite(post.id);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => onClick(post)}
      className="group cursor-pointer relative"
    >
      {user && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(post.id, 'post');
          }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${favorited ? 'bg-brand-orange text-white' : 'bg-white/80 text-gray-400 hover:text-brand-orange'}`}
        >
          <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
        </button>
      )}

      <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 border border-gray-100">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-brand-orange">
          <span>{post.category}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="text-gray-400">{post.readTime}</span>
        </div>
        <h3 className="text-xl font-display font-bold text-gray-900 group-hover:text-brand-orange transition-colors leading-tight">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
        {onAffiliateClick && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAffiliateClick();
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-brand-orange transition hover:bg-brand-orange hover:text-white"
          >
            Faturar como afiliado <ChevronRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
