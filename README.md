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
- Dashboard com métricas
- Gerenciamento de afiliados

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

### 💬 Suporte
- Chat integrado
- Sistema de suporte ao cliente

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
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
   npm run preview
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
- Node.js
- SQLite (default) / Supabase

**Integrações:**
- Supabase (Auth + Database)
- Google Gemini (IA)
- Resend/Nodemailer (Email)
- Payment Gateway (Stripe/Mercado Pago)

---

## 🚀 Deployment

### Vercel (Recomendado)

1. Push para GitHub
2. Conecte repositório no Vercel
3. Adicione variáveis de ambiente
4. Deploy automático (CI/CD)

Arquivo `vercel.json` já está configurado.

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
- [ ] Sistema de pagamento
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
**Última atualização**: 10/03/2026

🚀 **Pronto para lançar!**
