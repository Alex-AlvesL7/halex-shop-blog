# 🏋️ HALEX Shop & Blog

**Plataforma integrada de e-commerce e blog para venda de suplementos com consultoria por IA.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node](https://img.shields.io/badge/Node-18%2B-blue)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Funcionalidades

### 🛍️ E-Commerce
- Catálogo de produtos (L7 Ultra, Turbo, Nitro)
- Carrinho de compras
- Sistema de categorias
- Avaliações e reviews
- Wishlist/Favoritos

### 📚 Blog
- Posts sobre alimentação, treino e dieta
- Categorização de conteúdo
- Leitura estimada
- SEO otimizado
- Gerenciamento completo no admin

### 🤖 IA & Consultoria
- Gerador de dicas de saúde com Google Gemini
- Personalização baseada em peso, altura, objetivo
- Recomendações de suplementos
- Planos de alimentação automáticos

### 👨‍💼 Admin Dashboard
- Gerenciamento de produtos (CRUD)
- Gerenciamento de blog posts
- Gerenciamento de categorias
- Dashboard com métricas financeiras e operacionais
- Menu lateral profissional por área (financeiro, vendas, produtos, conteúdo, afiliados e leads)
- Pedidos com painéis recolhíveis para operação mais rápida
- Atualização manual de status de pagamento
- Controle logístico com rastreio e observações internas
- Gerenciamento de afiliados e comissões
- CRM básico de leads do quiz

### 🔐 Autenticação
- Login/Registro com Supabase
- Perfil de usuário
- Histórico de favoritos
- Recuperação de senha

### 💵 Sistema de Afiliados
- Dashboard de afiliados
- Códigos de referência
- Tracking de comissões
- Gerenciamento no admin
- Tags persistentes para segmentação de afiliados
- Solicitação e acompanhamento de saques

### 💬 Suporte
- Chat integrado
- Sistema de suporte ao cliente

### 📦 Pós-compra e experiência do cliente
- Painel de compras no menu da conta
- Histórico de pedidos e status de pagamento
- Acompanhamento de envio e rastreio
- Resumo do carrinho e favoritos
- Retorno pós-checkout com leitura do pedido real

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/halex-shop.git
   cd halex-shop
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   - Copie `.env.local` e preencha com suas credenciais
   - Veja [.env.local guide](#variáveis-de-ambiente) abaixo

4. **Rode em desenvolvimento**
   ```bash
   npm run dev
   ```
   A aplicação vai abrir em `http://localhost:3000`

5. **Build para produção**
   ```bash
   npm run build
   npm start
   ```

---

## 🔐 Variáveis de Ambiente

Copie o arquivo `.env.local` e configure:

```env
# Supabase
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key

# Google Gemini
GEMINI_API_KEY=your-api-key

# Configurações da app
NODE_ENV=development
APP_URL=http://localhost:3000
PORT=3000

# InfinitePay
INFINITEPAY_HANDLE=seu-handle

# Melhor Envio
MELHOR_ENVIO_API_KEY=seu-token
MELHOR_ENVIO_CEP_ORIGEM=00000000
```

**Guia completo**: Ver [SETUP-GUIDE.md](./SETUP-GUIDE.md)

---

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin panel
│   │   └── ...
│   ├── services/           # API & integrations
│   │   ├── supabaseClient.ts
│   │   └── geminiService.ts
│   ├── App.tsx             # Main app
│   ├── types.ts            # TypeScript types
│   └── main.tsx            # Entry point
├── server.ts               # Express backend
├── package.json
├── vite.config.ts
└── .env.local              # Environment variables
```

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev       # Rodar em desenvolvimento
npm start         # Subir servidor em produção
npm run build     # Build para produção
npm run preview   # Preview da build
npm run lint      # TypeScript check
npm run clean     # Limpar pasta dist
```

---

## 📦 Stack Tecnológico

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS
- Vite
- Motion (animations)

**Backend:**
- Express
- Node.js 20+
- SQLite (default) / Supabase

**Integrações:**
- Supabase (Auth + Database)
- Google Gemini (IA)
- Resend/Nodemailer (Email)
- InfinitePay (checkout e webhook)
- Melhor Envio (cálculo de frete)

---

## 🚀 Deployment

### Railway (Recomendado)

1. Push para GitHub
2. Conecte o repositório na Railway
3. Configure as variáveis de ambiente de produção
4. Faça o build com `npm run build`
5. Suba o serviço com `npm start`
6. Defina `APP_URL` com o domínio final, por exemplo `https://l7fitness.com.br`
7. Adicione o domínio personalizado na Railway e aponte o DNS

Arquivos de apoio: [railway.json](railway.json), [server.ts](server.ts) e [vercel.json](vercel.json).

### Variáveis importantes na Railway

```env
NODE_ENV=production
APP_URL=https://l7fitness.com.br
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
INFINITEPAY_HANDLE=...
MELHOR_ENVIO_API_KEY=...
MELHOR_ENVIO_CEP_ORIGEM=...
```

### Observações de produção

- A Railway injeta a porta automaticamente e o servidor já usa `process.env.PORT`
- Use Node 20+ na Railway para compatibilidade com Vite, Supabase e `@google/genai`
- Se usar SQLite na Railway, configure volume persistente; sem volume, o disco é temporário
- O recomendado em produção é manter persistência principal no Supabase
- Revise no Supabase as URLs de redirecionamento para o domínio novo
- Revise na InfinitePay o webhook apontando para o domínio novo

### Vercel

Pode continuar como alternativa, mas o fluxo principal agora está preparado para Railway.

### Outras plataformas

Ver [DEVELOPMENT-CHECKLIST.md](./DEVELOPMENT-CHECKLIST.md) para mais opções.

---

## 📖 Documentação

- [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Como rodar o projeto
- [PROJECT-STATUS.md](./PROJECT-STATUS.md) - Status atual e roadmap
- [DEVELOPMENT-CHECKLIST.md](./DEVELOPMENT-CHECKLIST.md) - Checklist de features
- [DESIGN-CONTENT-GUIDE.md](./DESIGN-CONTENT-GUIDE.md) - Guia de design e conteúdo

---

## 🔒 Segurança

- Variáveis sensíveis protegidas em .env
- Autenticação via Supabase Auth
- CORS configurado
- Rate limiting recomendado para API

---

## 📊 Roadmap

- [x] Setup inicial
- [x] E-commerce básico
- [x] Blog com CMS admin
- [x] Autenticação
- [x] Sistema de pagamento
- [x] Sistema de afiliados com painel
- [x] Painel administrativo reorganizado
- [x] Painel de compras do cliente
- [ ] Conteúdo de qualidade (6+ posts)
- [ ] Performance otimizada
- [ ] Deploy em produção

---

## 💡 Contributing

Contribuições são bem-vindas! Abra uma issue ou pull request.

---

## 📧 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato via email.

---

## 📄 License

MIT License - veja [LICENSE](LICENSE) para mais detalhes.

---

**Versão**: 1.0.0  
**Última atualização**: 28/03/2026

🚀 **Pronto para lançar!**
