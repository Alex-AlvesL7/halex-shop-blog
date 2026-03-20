# 🚀 Guia de Setup - HALEX Shop & Blog

## ✅ Status do Projeto

O projeto **está funcionando** e pronto para desenvolvimento!

### Que foi feito:
- ✅ **Dependências instaladas**: Todos os pacotes npm foram instalados com sucesso
- ✅ **Variáveis de ambiente configuradas**: Arquivo `.env.local` criado com as chaves necessárias
- ✅ **Projeto compilado**: Build de produção funcionando
- ✅ **Servidor rodando**: App acessível em http://localhost:3000

---

## 🔧 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos para rodar:

1. **Instalar dependências** (se não tiver feito):
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   - Abrir o arquivo `.env.local` na raiz do projeto
   - Substituir os valores de exemplo com suas credenciais reais:
     ```env
     VITE_SUPABASE_URL=sua-url-aqui
     VITE_SUPABASE_ANON_KEY=sua-chave-aqui
     GEMINI_API_KEY=sua-api-key-aqui
   RESEND_API_KEY=sua-chave-resend-aqui
   EMAIL_FROM=noreply@mail.seudominio.com.br
   EMAIL_USER=admin@seudominio.com.br
     ```

3. **Rodar em desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação abrirá em `http://localhost:3000`

4. **Build para produção**:
   ```bash
   npm run build
   preview: npm run preview
   ```

---

## 📋 O que já existe no projeto

### ✨ Funcionalidades Prontas:
1. **E-commerce**
   - Catálogo de produtos (L7 Ultra, Turbo, Nitro)
   - Carrinho de compras
   - Página de detalhes do produto
   - Categorias de produtos

2. **Blog**
   - Listagem de posts
   - Visualização de artigos completos
   - Categorias: Alimentação, Treino, Dieta
   - Painel para criar/editar posts

3. **Admin Dashboard**
   - Gerenciar produtos (CRUD)
   - Gerenciar posts de blog
   - Gerenciar categorias
   - Dashboard com métricas

4. **Autenticação**
   - Login/Registro com Supabase Auth
   - Perfil de usuário
   - Favoritos

5. **IA & Consultoria**
   - Gerador de dicas de saúde com Google Gemini
   - Personalização baseada em peso, altura, objetivo

6. **Sistema de Afiliados**
   - Dashboard de afiliados
   - Gerenciamento de afiliados no admin
   - Códigos de referência

7. **Chat de Suporte**
   - Componente de chat integrado
   - Suporte ao cliente

---

## 🚧 O que Precisa Ser Finalizado

### Priority 1 - CRÍTICO:
1. **Sistema de Pagamento** ⚠️
   - Integnar InfinitePay/gateway de pagamento
   - Implementar checkout
   - Processar pedidos
   - Status: Backend preparado, frontend faltando

2. **Conectar ao Supabase** 
   - Configurar banco de dados Supabase
   - Migração de dados
   - Testes de integração
   - Status: Código preparado, precisa de credenciais reais

### Priority 2 - IMPORTANTE:
3. **Melhorar Conteúdo do Blog**
   - Adicionar mais posts (3 posts = MVP)
   - Criar conteúdo original sobre fitness
   - Melhorar SEO dos posts
   - Status: 3 posts básicos existem, precisam expandir

4. **Otimizar Performance**
   - Code-splitting no bundle (warning no build)
   - Otimizar imagens
   - Cache estratégico
   - Status: Build completo, pode melhorar

5. **Design & UX**
   - Melhorar responsividade mobile
   - Adicionar mais animações
   - Melhorar acessibilidade
   - Status: Básico pronto, pode polir

### Priority 3 - DEPLOY:
6. **Preparar para Produção**
   - Configurar Vercel
   - Setup de domínio
   - SSL/HTTPS
   - Status: Vercel.json existe, falta configuração

---

## 🔌 Integração Necessária - ORDEM

### 1️⃣ Configurar Banco de Dados (Supabase)
```
1. Criar conta em supabase.com
2. Copiar URL e ANON_KEY
3. Colar em .env.local
4. Banco de dados será sincronizado automaticamente
```

### 2️⃣ Configurar Gemini AI
```
1. Ir para https://makersuite.google.com/app/apikeys
2. Criar e copiar a API key
3. Adicionar em GEMINI_API_KEY no .env.local
```

### 3️⃣ Integrar Gateway de Pagamento
```
Opções:
- InfinitePay (já no código)
- Stripe
- Mercado Pago
- PayPal

Reccomendação: Stripe ou Mercado Pago para Brasil
```

### 4️⃣ Configurar envio de e-mail (Resend)
```
1. Criar conta em https://resend.com
2. Gerar a chave RESEND_API_KEY
3. Validar o domínio/remetente usado em EMAIL_FROM
4. Definir EMAIL_USER para receber alertas administrativos
5. Adicionar tudo no deploy e no .env.local
```

Sem essas variáveis, o afiliado pode ser salvo normalmente no Supabase, mas o e-mail de confirmação não será entregue.

---

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── App.tsx                 # App principal
│   ├── main.tsx               # Ponto de entrada React
│   ├── types.ts               # TypeScript types
│   ├── data.ts                # Dados estáticos
│   ├── components/
│   │   ├── AffiliateDashboard.tsx
│   │   ├── AffiliateRegistration.tsx
│   │   ├── SupportChat.tsx
│   │   ├── admin/
│   │   │   ├── BlogManagement.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   └── CategoryManagement.tsx
│   │   └── ... outros
│   └── services/
│       ├── supabaseClient.ts
│       └── geminiService.ts
├── server.ts                   # Express server
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── .env.local                 # Variáveis de ambiente
```

---

## 🎯 Próximas Etapas Recomendadas

1. **Esta semana**:
   - [ ] Configurar Supabase
   - [ ] Configurar Gemini API
   - [ ] Testar fluxo completo do admin

2. **Próxima semana**:
   - [ ] Integrar pagamento (Stripe/Mercado Pago)
   - [ ] Criar 5+ posts de blog
   - [ ] Testar afiliados

3. **Antes do launch**:
   - [ ] Deploy em staging (Vercel)
   - [ ] Testes completos
   - [ ] Integração com domínio real
   - [ ] Setup de email (Resend + domínio validado)

---

## 📞 Dúvidas Frequentes

**P: Por que estou vendo "Supabase credentials missing"?**
A: É normal. O app funciona com SQLite local enquanto Supabase não está configurado.

**P: Onde adiciono minhas credenciais do Supabase?**
A: No arquivo `.env.local` na raiz do projeto.

**P: Posso usar o Supabase gratuito?**
A: Sim! Plano free é suficiente para MVP.

---

## ✨ Dicas de Desenvolvimento

- Use `npm run dev` para development com hot reload
- Use `npm run build` para testar produção
- Verifique `server.ts` para rotas de API
- Componentes admin estão em `src/components/admin/`
- Tailwind CSS é usado para estilos

---

**Última atualização**: 10/03/2026
**Status]: 🟢 Pronto para desenvolver!
