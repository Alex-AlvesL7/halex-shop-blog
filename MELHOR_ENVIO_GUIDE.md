# 📦 Integração Melhor Envio - Guia Completo

## O que é Melhor Envio?

Melhor Envio é uma plataforma brasileira que integra múltiplas transportadoras:
- Correios (PAC, SEDEX, MINI)
- Loggi
- Jadlog
- Shein Express
- E outras

**Vantagens:**
- Melhor preço entre as transportadoras
- API simples
- Cálculo automático de frete
- Etiqueta inteligente
- Rastreamento unificado

---

## 📋 Pré-requisitos

1. ✅ Conta na plataforma Melhor Envio (gratuita)
2. ✅ API Token
3. ✅ CEP de origem (sua empresa)
4. ✅ Produto(s) com peso e dimensões
5. ✅ CEP do cliente (em tempo real)

---

## 🚀 Passo 1: Criar Conta e Gerar API Token

### No site: https://www.melhorenvio.com.br

1. Clique em **"Integrar Melhor Envio"**
2. Faça login ou crie conta (com seu email da empresa)
3. Vá em **Configurações > Integração > API**
4. Gere um novo **Token de Autenticação**
5. Copie o token (ele aparece APENAS uma vez!)

**Token será assim:**
```
eyJ0eXAiOiJKV1QiLCJhbGcL...
```

---

## 🔧 Passo 2: Adicionar Token ao .env.local

```env
# 📦 MELHOR ENVIO (Frete/Envios)
MELHOR_ENVIO_API_KEY=seu-token-aqui
MELHOR_ENVIO_CEP_ORIGEM=01310100  # CEP da sua empresa (sem hífen)
```

---

## 💻 Passo 3: Instalar Dependência (Opcional)

```bash
npm install axios
```

(Já está instalado no seu projeto!)

---

## 🛠️ Passo 4: Criar Serviço de Frete

Criar arquivo: `src/services/melhorEnvioService.ts`

```typescript
import axios from 'axios';

const MELHOR_ENVIO_API = 'https://api.melhorenvio.com.br/v2';
const API_KEY = process.env.VITE_MELHOR_ENVIO_API_KEY;
const CEP_ORIGEM = process.env.VITE_MELHOR_ENVIO_CEP_ORIGEM || '01310100';

// Calcular frete para um CEP
export const calcularFrete = async (
  cepDestino: string,
  produtos: Array<{ peso: number; altura: number; largura: number; profundidade: number }>
) => {
  try {
    // Validar CEP
    const cepLimpo = cepDestino.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return { error: 'CEP inválido' };
    }

    const response = await axios.post(
      `${MELHOR_ENVIO_API}/shipment/calculate`,
      {
        from: {
          postal_code: CEP_ORIGEM,
        },
        to: {
          postal_code: cepLimpo,
        },
        products: produtos.map((p) => ({
          id: '1',
          width: p.largura,
          height: p.altura,
          length: p.profundidade,
          weight: p.peso,
          quantity: 1,
        })),
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Halex-Shop/1.0',
        },
      }
    );

    // Resposta do Melhor Envio:
    // Array com opções de frete
    return response.data;
  } catch (error: any) {
    console.error('Erro ao calcular frete:', error.response?.data || error.message);
    return { error: 'Erro ao calcular frete' };
  }
};

// Exemplo de resposta:
/*
[
  {
    name: "PAC",
    price: "28.95",
    delivery_time: 10,
    arrival_at: "2024-03-21",
    packages: [{ products: [...] }],
    carrier: {
      id: 104,
      name: "Correios"
    }
  },
  {
    name: "SEDEX",
    price: "45.50",
    delivery_time: 3,
    arrival_at: "2024-03-14",
    packages: [{ products: [...] }],
    carrier: {
      id: 104,
      name: "Correios"
    }
  }
]
*/
```

---

## 📱 Passo 5: Componente React para Frete

Criar: `src/components/FreteCalculator.tsx`

```typescript
import React, { useState } from 'react';
import { Package, AlertCircle, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { calcularFrete } from '../services/melhorEnvioService';

interface FreteOption {
  name: string;
  price: string;
  delivery_time: number;
  arrival_at: string;
  carrier: { name: string };
}

export const FreteCalculator = ({ 
  cartItems 
}: { 
  cartItems: any[] 
}) => {
  const [cep, setCep] = useState('');
  const [opcoesFrete, setOpcoesFrete] = useState<FreteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);

  const formatarCEP = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
  };

  const calcularFreteHandler = async () => {
    if (cep.replace(/\D/g, '').length !== 8) {
      setError('CEP inválido');
      return;
    }

    setLoading(true);
    setError('');

    // Preparar produtos com dimensões
    const produtos = cartItems.map(item => ({
      peso: 0.5, // em kg - ajuste suas dimensões
      altura: 10,
      largura: 10,
      profundidade: 10,
    }));

    const resultado = await calcularFrete(cep, produtos);

    if (resultado.error) {
      setError(resultado.error);
    } else {
      setOpcoesFrete(resultado);
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <Truck className="text-brand-orange" size={24} />
        <h3 className="text-2xl font-bold">Calcular Frete</h3>
      </div>

      {/* Input CEP */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          CEP de Entrega
        </label>
        <input
          type="text"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatarCEP(e.target.value))}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-brand-orange focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">Sem hífen funciona também</p>
      </div>

      {/* Botão calcular */}
      <button
        onClick={calcularFreteHandler}
        disabled={loading}
        className="w-full bg-brand-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50"
      >
        {loading ? 'Calculando...' : 'Calcular Frete'}
      </button>

      {/* Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex gap-2"
        >
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Opções de frete */}
      {opcoesFrete.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 space-y-3"
        >
          <p className="font-bold text-gray-700 mb-3">
            {opcoesFrete.length} opção(ões) disponível(is)
          </p>
          {opcoesFrete.map((opcao, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFrete(opcao)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedFrete?.name === opcao.name
                  ? 'border-brand-orange bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">
                    {opcao.carrier.name} - {opcao.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Entrega em {opcao.delivery_time} dia(s)
                  </p>
                  <p className="text-xs text-gray-400">
                    Previsão: {new Date(opcao.arrival_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-brand-orange">
                    R$ {parseFloat(opcao.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {/* Frete selecionado */}
      {selectedFrete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <p className="text-sm text-gray-600">
            📦 Frete selecionado:
          </p>
          <p className="font-bold text-green-600 text-lg">
            {selectedFrete.carrier.name} {selectedFrete.name} - R$ {parseFloat(selectedFrete.price).toFixed(2)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
```

---

## 🔗 Passo 6: Adicionar ao Checkout

No arquivo `src/App.tsx`, na seção de checkout, adicione:

```typescript
import { FreteCalculator } from './components/FreteCalculator';

// Dentro do componente de Checkout:
<FreteCalculator cartItems={cart} />
```

---

## 📊 Dados Necessários dos Produtos

Cada produto precisa ter:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  // ... outros campos
  
  // NOVOS CAMPOS PARA FRETE:
  peso: number;           // em kg (ex: 0.5)
  altura: number;         // em cm (ex: 10)
  largura: number;        // em cm (ex: 15)
  profundidade: number;   // em cm (ex: 5)
}
```

**Adicione no seu data.ts:**

```typescript
export const PRODUCTS: Product[] = [
  {
    id: 'l7-ultra-450-kit',
    name: '1 Kit L7 ULTRA 450mg + Detox',
    price: 159.90,
    description: '...',
    category: 'emagrecedores',
    image: '...',
    stock: 50,
    rating: 4.9,
    reviews: 156,
    // NOVOS:
    peso: 0.5,
    altura: 15,
    largura: 10,
    profundidade: 10,
  },
  // ... outros produtos
];
```

---

## 🧪 Teste com cURL

Para testar a API do Melhor Envio direto:

```bash
curl -X POST https://api.melhorenvio.com.br/v2/shipment/calculate \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "postal_code": "01310100"
    },
    "to": {
      "postal_code": "20040020"
    },
    "products": [
      {
        "id": "1",
        "width": 10,
        "height": 15,
        "length": 10,
        "weight": 0.5,
        "quantity": 1
      }
    ]
  }'
```

---

## ⚠️ Limitações & Considerações

1. **Dimensões obrigatórias**: Sem dimensões corretas, o cálculo pode falhar
2. **Peso mínimo**: Melhor Envio tem peso mínimo (~0.3kg)
3. **Rate limit**: ~100 requisições/minuto
4. **Geocódigo**: Alguns CEPs podem não ter cobertura
5. **Cache**: Considere cachear resultados por 1 hora

---

## 🔒 Segurança

⚠️ **NUNCA** colocar API key no frontend!

```typescript
// ❌ ERRADO - Expõe API key
const API_KEY = "eyJ0eXAiOi..."; // No código frontend!

// ✅ CORRETO - Apenas no backend
// server.ts:
const apiKey = process.env.MELHOR_ENVIO_API_KEY;
```

Crie uma rota no Express para calcular:

```typescript
// server.ts
app.post("/api/frete/calcular", async (req, res) => {
  const { cep, produtos } = req.body;
  
  // Chamar Melhor Envio API (com chave segura no servidor)
  const resultado = await calcularFrete(cep, produtos);
  
  res.json(resultado);
});
```

---

## 📱 Versão Simplificada (Widget)

Melhor Envio também oferece um script HTML simples:

```html
<script src="https://www.melhorenvio.com.br/deploy/v2-widget.js"></script>
```

Mas a integração via API é mais profissional para e-commerce.

---

## 🚀 Checklist de Implementação

- [ ] Criar conta em melhorenvio.com.br
- [ ] Gerar API Token
- [ ] Adicionar chave em .env.local
- [ ] Criar arquivo melhorEnvioService.ts
- [ ] Adicionar dimensões aos produtos
- [ ] Criar componente FreteCalculator
- [ ] Integrar no checkout
- [ ] Testar com diferentes CEPs
- [ ] Ajustar dimensões/peso conforme necessário
- [ ] Deploy em produção

---

## 📞 Links Úteis

- **API Docs**: https://www.melhorenvio.com.br/como-funciona
- **Dashboard**: https://app.melhorenvio.com.br
- **Status API**: https://status.melhorenvio.com.br
- **Suporte**: suporte@melhorenvio.com.br

---

## 💡 Dica Extra: Formato de Resposta

A resposta do Melhor Envio sempre retorna:

```json
[
  {
    "id": 10065,
    "name": "PAC",
    "price": "28.95",
    "delivery_time": 10,
    "arrival_at": "2024-03-21",
    "carrier": {
      "id": 104,
      "name": "Correios",
      "picture": "https://..."
    },
    "packages": [
      {
        "id": 1,
        "service_id": 104,
        "service_name": "PAC",
        "price": "28.95",
        "products": [...]
      }
    ]
  }
]
```

---

**Próximo passo após implementar frete**: Integrar pagamento (Stripe/Mercado Pago)

Qualquer dúvida, é só chamar! 🚀
