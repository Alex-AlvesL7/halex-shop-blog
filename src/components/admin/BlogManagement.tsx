import React, { useState } from 'react';
import { Plus, Edit2, Save, X, Trash2, FileText } from 'lucide-react';

export const BlogManagement = ({ posts, onRefresh }: { posts: any[], onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe Halex', image: '', readtime: '5 min' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/posts/${editingId}` : '/api/posts';
    const method = editingId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      alert(`Erro ao salvar post: ${errorData.error}`);
      return;
    }

    alert(`Post ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
    setNewPost({ title: '', excerpt: '', content: '', category: 'alimentacao', author: 'Equipe Halex', image: '', readtime: '5 min' });
    setEditingId(null);
    onRefresh();
    setActiveTab('list');
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
        <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><FileText size={18} /> Posts</button>
        <button onClick={() => { setActiveTab('create'); setEditingId(null); }} className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Plus size={18} /> Novo Post</button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSavePost} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-2xl font-bold">{editingId ? 'Editar Post' : 'Novo Post'}</h3>
          <input placeholder="Título" className="w-full p-4 bg-gray-50 rounded-xl border" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} required />
          <textarea placeholder="Resumo" className="w-full p-4 bg-gray-50 rounded-xl border" value={newPost.excerpt} onChange={e => setNewPost({...newPost, excerpt: e.target.value})} />
          <textarea placeholder="Conteúdo" className="w-full p-4 bg-gray-50 rounded-xl border h-40" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Categoria" className="p-4 bg-gray-50 rounded-xl border" value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} />
            <input placeholder="Tempo de Leitura (ex: 5 min)" className="p-4 bg-gray-50 rounded-xl border" value={newPost.readtime} onChange={e => setNewPost({...newPost, readtime: e.target.value})} />
          </div>
          <input placeholder="Imagem URL" className="w-full p-4 bg-gray-50 rounded-xl border" value={newPost.image} onChange={e => setNewPost({...newPost, image: e.target.value})} />
          <button type="submit" className="btn-primary px-8 py-3 flex items-center gap-2"><Save size={20} /> Salvar Post</button>
        </form>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Posts Cadastrados</h3>
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-lg">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.category} • {p.author}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setNewPost(p); setEditingId(p.id); setActiveTab('create'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeletePost(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
