import React, { useState } from 'react';
import { Package, AlertCircle, Truck, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calcularFrete,
  formatarCEP,
  validarCEP,
  formatarPreco,
  FreteOption,
  ProdutoFrete,
} from '../services/melhorEnvioService';

interface FreteCalculatorProps {
  cartItems: any[];
  onFreteSelect?: (frete: FreteOption) => void;
}

export const FreteCalculator: React.FC<FreteCalculatorProps> = ({
  cartItems,
  onFreteSelect,
}) => {
  const [cep, setCep] = useState('');
  const [opcoesFrete, setOpcoesFrete] = useState<FreteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);
  const [expandido, setExpandido] = useState(false);

  const calcularFreteHandler = async () => {
    // Validar
    if (!validarCEP(cep)) {
      setError('CEP inválido. Digite 8 números.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Adicione produtos ao carrinho primeiro.');
      return;
    }

    setLoading(true);
    setError('');
    setOpcoesFrete([]);

    // Preparar produtos
    const produtos: ProdutoFrete[] = cartItems.map((item) => ({
      peso: item.peso || 0.5,
      altura: item.altura || 10,
      largura: item.largura || 10,
      profundidade: item.profundidade || 10,
      quantidade: item.quantity || 1,
    }));

    // Chamar API via servidor (mais seguro)
    try {
      const response = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: cep.replace(/\D/g, ''),
          produtos,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setOpcoesFrete([]);
      } else {
        // Normalizar dados da API: mapear 'company' para 'carrier' e filtrar opções com erro
        const cepLimpo = cep.replace(/\D/g, '');
        const opcoes = (data || [])
          .filter((op: any) => !op.error && (op.custom_price || op.price))
          .map((op: any) => ({
          ...op,
          carrier: op.carrier || op.company || { id: 0, name: 'Transportadora' },
          delivery_time: op.delivery_time ?? op.delivery_range?.min ?? 0,
          arrival_at: op.arrival_at || new Date(Date.now() + ((op.delivery_time ?? op.delivery_range?.min ?? 7) * 86400000)).toISOString(),
          value: Number.parseFloat(String(op.custom_price ?? op.price ?? '0')) || 0,
          cep: cepLimpo,
        }));
        if (opcoes.length === 0) {
          setError('Nenhuma opção de frete disponível para este CEP.');
        } else {
          setOpcoesFrete(opcoes);
          setExpandido(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao calcular frete');
    }

    setLoading(false);
  };

  const handleSelecionarFrete = (opcao: FreteOption) => {
    setSelectedFrete(opcao);
    if (onFreteSelect) {
      onFreteSelect(opcao);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-50 rounded-xl">
          <Truck className="text-brand-orange" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Calcular Frete</h3>
          <p className="text-sm text-gray-500">via Melhor Envio</p>
        </div>
      </div>

      {/* Input CEP */}
      <div className="space-y-2 mb-4">
        <label className="block text-sm font-bold text-gray-700">
          CEP de Entrega
        </label>
        <input
          type="text"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => {
            setCep(formatarCEP(e.target.value));
            setError('');
          }}
          maxLength={9}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:outline-none transition-colors"
        />
        <p className="text-xs text-gray-500">8 dígitos sem hífen</p>
      </div>

      {/* Botão calcular */}
      <button
        onClick={calcularFreteHandler}
        disabled={loading || !validarCEP(cep)}
        className="w-full bg-gradient-to-r from-brand-orange to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin">📦</div>
            Calculando...
          </>
        ) : (
          <>
            <Truck size={20} />
            Calcular Frete
          </>
        )}
      </button>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex gap-3 border border-red-200"
          >
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opções de frete */}
      <AnimatePresence>
        {opcoesFrete.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-700">
                {opcoesFrete.length} opção(ões) disponível(is)
              </p>
              <button
                onClick={() => setExpandido(!expandido)}
                className="text-brand-orange font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
              >
                {expandido ? 'Recolher' : 'Expandir'}
                <ChevronDown
                  size={16}
                  style={{
                    transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {expandido && (
                <div className="space-y-3">
                  {opcoesFrete.map((opcao, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={() => handleSelecionarFrete(opcao)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedFrete?.id === opcao.id
                          ? 'border-brand-orange bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900">
                              {opcao.carrier.name}
                            </p>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                              {opcao.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            🕐 {opcao.delivery_time} dia(s)
                          </p>
                          <p className="text-xs text-gray-400">
                            Previsão:{' '}
                            {new Date(opcao.arrival_at).toLocaleDateString(
                              'pt-BR',
                              { weekday: 'short', month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-black text-brand-orange">
                            {formatarPreco(opcao.price)}
                          </p>
                          {selectedFrete?.id === opcao.id && (
                            <CheckCircle
                              size={20}
                              className="text-green-500 ml-auto mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frete selecionado - resumo */}
      <AnimatePresence>
        {selectedFrete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-600 font-bold">
                  FRETE SELECIONADO
                </p>
                <p className="font-bold text-gray-900 text-sm">
                  {selectedFrete.carrier.name} {selectedFrete.name}
                </p>
                <p className="text-2xl font-black text-green-600 mt-1">
                  {formatarPreco(selectedFrete.price)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Entrega em{' '}
                  <span className="font-bold text-gray-700">
                    {selectedFrete.delivery_time} dia(s)
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info adicional */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>💡 Dica:</strong> Entrega realizada pela transportadora selecionada.
          Você receberá o código de rastreamento por email.
        </p>
      </div>
    </motion.div>
  );
};
