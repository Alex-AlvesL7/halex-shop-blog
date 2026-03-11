# 📝 Checklist de Desenvolvimento - HALEX Shop

## 🔴 CRÍTICO - Deve fazer antes de ir ao ar

### Pagamento & Checkout
- [ ] Escolher gateway de pagamento (Stripe/Mercado Pago/PayPal)
- [ ] Instalar SDK do gateway
- [ ] Implementar componente de checkout
- [ ] Integrar validação de cartão/dados
- [ ] Testar transações de teste
- [ ] Implementar confirmação de pedido por email
- [ ] Criar página de sucesso/erro de pagamento
- [ ] Implementar webhook para confirmação de pagamento

### Banco de Dados (Supabase)
- [ ] Criar conta Supabase e projeto
- [ ] Copiar credenciais para .env.local
- [ ] Testar conexão do servidor
- [ ] Verificar se dados estão sendo salvos
- [ ] Fazer backup strategy

### Email (Nodemailer/Resend)
- [ ] Configurar provedor de email (Gmail, SendGrid, Resend)
- [ ] Adicionar credenciais em .env.local (EMAIL_USER, EMAIL_PASS)
- [ ] Testar envio de email de confirmação
- [ ] Templates de email (confirmação, novo afiliado, etc)

---

## 🟡 IMPORTANTE - Para oferecer bom serviço

### Conteúdo do Blog
- [ ] Escrever 5+ posts de qualidade (mínimo 800 palavras cada)
  - [ ] Post sobre os benefícios de cada produto
  - [ ] Guia de nutrição e emagrecimento
  - [ ] Rotinas de treino
  - [ ] Depoimentos de clientes
  - [ ] Artigos sobre IA e personalização
- [ ] Adicionar imagens/fotos de qualidade
- [ ] Otimizar para SEO (meta tags, keywords)
- [ ] Implementar compartilhamento social

### Produtos
- [ ] Adicionar imagens reais dos produtos
- [ ] Escrever descrições detalhadas
- [ ] Adicionar mais produtos/variações
- [ ] Implementar avaliações de clientes
- [ ] Criar "bundles" promocionais

### User Experience
- [ ] Testar em mobile (responsividade)
- [ ] Melhorar velocidade de carregamento
- [ ] Adicionar mais animações e transições
- [ ] Implementar busca de produtos
- [ ] Melhorar filtros de categoria
- [ ] Adicionar wishlist/favoritos funcional

---

## 🟢 NICE-TO-HAVE - Melhorias futuras

### Marketing & Social
- [ ] Integrar com Instagram (Feed)
- [ ] Integrar com TikTok (videos)
- [ ] Newsletter signup
- [ ] Cupons e promoções
- [ ] Programa de referência (afiliados)
- [ ] Gamification (pontos, badges)

### Admin Panel
- [ ] Dashboard com gráficos de vendas
- [ ] Relatórios de produtos mais vendidos
- [ ] Gestão completa de pedidos
- [ ] Controle de estoque
- [ ] Sistema de notificações

### Funcionalidades Extras
- [ ] Live chat com suporte
- [ ] Chatbot IA
- [ ] Recomendações personalizadas
- [ ] Histórico de compras
- [ ] Programa de fidelidade

### Performance & SEO
- [ ] Configurar sitemap.xml
- [ ] Robots.txt
- [ ] Open Graph tags
- [ ] Schema markup (products, articles)
- [ ] Google Analytics
- [ ] Google Ads integration

---

## 📋 Integração com Supabase - Passo a Passo

1. **Criar projeto Supabase**:
   - Ir em supabase.com
   - Fazer login/criar conta
   - Clique em "New Project"
   - Escolha região (Brasil se possível)

2. **Copiar credenciais**:
   - Vá em Project Settings > API
   - Copie `Project URL` → `VITE_SUPABASE_URL`
   - Copie `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - Cole em `.env.local`

3. **Verificar tabelas**:
   - O servidor.ts criará tabelas automaticamente
   - Verifique em Supabase > SQL Editor
   - Tabelas: products, posts, orders, favorites, categories, affiliates

4. **Autenticação**:
   - Supabase > Auth > Providers
   - Ativar Email/Password
   - Email confirmations (opcional)

---

## 💳 Integração com Gateway de Pagamento

### Option 1: Stripe (Recomendado globalmente)
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Option 2: Mercado Pago (Recomendado Brasil)
```env
MERCADO_PAGO_TOKEN=YOUR_TOKEN
MERCADO_PAGO_STORE_ID=YOUR_STORE_ID
```

### Option 3: PayPal
```env
PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
PAYPAL_SECRET=YOUR_SECRET
```

**Recomendação**: Para Brasil, use Mercado Pago. É mais barato e familiar para clientes.

---

## 📧 Configuração de Email

No arquivo `mailer.ts`, você pode usar:
- Nodemailer + Gmail
- Resend (já instalado)
- SendGrid
- AWS SES

**Exemplo com Resend**:
```env
RESEND_API_KEY=re_YOUR_KEY
SEND_FROM_EMAIL=noreply@halex.com.br
```

---

## 🚀 Deploy - Vercel

Arquivo `vercel.json` já está pronto.

**Passos**:
1. Fazer push para GitHub
2. Conectar repositório no Vercel
3. Adicionar variáveis de ambiente no Vercel
4. Deploy automático (git push = deploy)

---

## 🧪 Testes Recomendados

### Antes de lançar:
- [ ] Criar conta de teste
- [ ] Adicionar produto ao carrinho
- [ ] Completar checkout (transação de teste)
- [ ] Receber email de confirmação
- [ ] Criar post de blog via admin
- [ ] Usar IA Gemini para gerar dicas
- [ ] Testar afiliado
- [ ] Mobile responsiveness
- [ ] Verificar performance com Lighthouse

---

## 📞 Suporte & Documentação

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated**: 10/03/2026
**Priority Order**: Pagamento → Supabase → Email → Conteúdo → Lançamento
