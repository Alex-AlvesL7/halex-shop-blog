import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2, ShoppingBag } from 'lucide-react';
import { Category } from '../../types';

export const ProductManagement = ({ products, onRefresh }: { products: any[], onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, description: '', categories: [] as string[], image: '', stock: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    
    if (!response.ok) {
      alert('Erro ao salvar produto');
      return;
    }

    alert(`Produto ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
    setNewProduct({ name: '', price: 0, description: '', categories: [], image: '', stock: 0 });
    setEditingId(null);
    onRefresh();
    setActiveTab('list');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
        <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><ShoppingBag size={18} /> Produtos</button>
        <button onClick={() => { setActiveTab('create'); setEditingId(null); setNewProduct({ name: '', price: 0, description: '', categories: [], image: '', stock: 0 }); }} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Plus size={18} /> Novo Produto</button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSaveProduct} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-2xl font-bold">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          <input placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-xl border" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Preço" className="p-4 bg-gray-50 rounded-xl border" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} required />
            <input type="number" placeholder="Estoque" className="p-4 bg-gray-50 rounded-xl border" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} required />
          </div>
          <textarea placeholder="Descrição" className="w-full p-4 bg-gray-50 rounded-xl border h-32" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
          <input placeholder="Imagem URL" className="w-full p-4 bg-gray-50 rounded-xl border" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
          
          <div>
            <label className="block text-sm font-bold mb-2">Categorias</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const isSelected = newProduct.categories.includes(cat.id);
                    setNewProduct({
                      ...newProduct,
                      categories: isSelected 
                        ? newProduct.categories.filter(id => id !== cat.id)
                        : [...newProduct.categories, cat.id]
                    });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${newProduct.categories.includes(cat.id) ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <button type="submit" className="btn-primary px-8 py-3 flex items-center gap-2"><Save size={20} /> Salvar Produto</button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Produtos Cadastrados</h3>
          <div className="space-y-4">
            {products.map(p => (
              <div key={p.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-lg">{p.name}</p>
                  <p className="text-sm text-gray-500">R$ {p.price} • Estoque: {p.stock}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setNewProduct(p); setEditingId(p.id); setActiveTab('create'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
