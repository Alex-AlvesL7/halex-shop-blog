import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2, Tag } from 'lucide-react';
import { Category } from '../../types';

export const CategoryManagement = ({ onRefresh }: { onRefresh: () => void }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#f97316' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
    const method = editingId ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory)
    });
    
    setNewCategory({ name: '', description: '', color: '#f97316' });
    setEditingId(null);
    fetchCategories();
    onRefresh();
    setActiveTab('list');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories();
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
        <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Tag size={18} /> Categorias</button>
        <button onClick={() => { setActiveTab('create'); setEditingId(null); }} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Plus size={18} /> Nova Categoria</button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSaveCategory} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-2xl font-bold">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <input placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-xl border" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} required />
          <input placeholder="Descrição" className="w-full p-4 bg-gray-50 rounded-xl border" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} />
          <input type="color" className="w-full p-2 h-16 bg-gray-50 rounded-xl border" value={newCategory.color} onChange={e => setNewCategory({...newCategory, color: e.target.value})} />
          <button type="submit" className="btn-primary px-8 py-3 flex items-center gap-2"><Save size={20} /> Salvar Categoria</button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Categorias Cadastradas</h3>
          <div className="space-y-4">
            {categories.map(c => (
              <div key={c.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                  <div>
                    <p className="font-bold text-lg">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { 
                    setNewCategory({ 
                      name: c.name, 
                      description: c.description || '', 
                      color: c.color || '#f97316' 
                    }); 
                    setEditingId(c.id); 
                    setActiveTab('create'); 
                  }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
