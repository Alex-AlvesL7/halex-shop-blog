import React, { useState } from 'react';
import { AffiliateRegistrationForm } from './AffiliateRegistrationForm';

export const AffiliateLanding = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold text-center">Seja um Afiliado L7</h1>
      <p className="text-center text-gray-600">Junte-se a nós e ganhe comissões indicando nossos produtos.</p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-xl mb-2">Comissões Altas</h3>
          <p className="text-gray-600">Ganhe até 20% de comissão por cada venda realizada através do seu link.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-xl mb-2">Suporte Dedicado</h3>
          <p className="text-gray-600">Tenha acesso a materiais de divulgação e suporte exclusivo.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold text-xl mb-2">Pagamentos Rápidos</h3>
          <p className="text-gray-600">Receba suas comissões de forma rápida e segura.</p>
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-700 transition"
        >
          Quero ser um Afiliado
        </button>
      </div>

      {showForm && <AffiliateRegistrationForm onClose={() => setShowForm(false)} />}
    </div>
  );
};
