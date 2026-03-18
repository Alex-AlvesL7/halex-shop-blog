import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type FavoriteItem = {
  item_id: string;
  item_type: 'product' | 'post';
};

type AuthContextValue = {
  user: any;
  favorites: FavoriteItem[];
  toggleFavorite: (id: string, type: 'product' | 'post') => void;
  isFavorite: (id: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth error:', error);
        if (error.message.includes('Invalid Refresh Token')) {
          supabase.auth.signOut();
        }
      }
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/favorites/${user.id}`)
        .then(res => res.json())
        .then(data => setFavorites(data));
    } else {
      setFavorites([]);
    }
  }, [user]);

  const toggleFavorite = async (id: string, type: 'product' | 'post') => {
    if (!user) return;

    const existing = favorites.find((favorite) => favorite.item_id === id);

    if (existing) {
      await fetch(`/api/favorites/${user.id}/${id}`, { method: 'DELETE' });
      setFavorites(favorites.filter((favorite) => favorite.item_id !== id));
      return;
    }

    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, item_id: id, item_type: type }),
    });

    setFavorites([...favorites, { item_id: id, item_type: type }]);
  };

  const isFavorite = (id: string) => favorites.some((favorite) => favorite.item_id === id);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, favorites, toggleFavorite, isFavorite, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
