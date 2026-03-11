# 🗺️ Arquitetura & Fluxo da Aplicação

## Diagrama da Arquitetura

```mermaid
graph TB
    subgraph "Cliente (Browser)"
        React["React App<br/>(Vite SPA)"]
        UI["UI Components<br/>(Tailwind CSS)"]
    end

    subgraph "Frontend Services"
        Auth["Auth Service<br/>(Supabase)"]
        Gemini["AI Service<br/>(Google Gemini)"]
    end

    subgraph "Backend (Express)"
        API["Express API<br/>Port 3000"]
        Routes["Routes<br/>/api/products<br/>/api/posts<br/>/api/orders"]
    end

    subgraph "Databases & Services"
        SQLite["SQLite<br/>(Local)"]
        Supabase["Supabase<br/>(Production)"]
        Stripe["Payment<br/>(Stripe/MP)"]
    end

    React -->|Renderiza| UI
    UI -->|Interage| Auth
    UI -->|Chama| API
    API -->|Lê/Escreve| SQLite
    SQLite -->|Sincroniza| Supabase
    Auth -->|Valida| Supabase
    Gemini -->|Gera dicas| API
    API -->|Processa| Stripe

    style React fill:#61dafb
    style Auth fill:#24b47e
    style Gemini fill:#4285f4
    style API fill:#68a063
    style Supabase fill:#24b47e
    style Stripe fill:#6772e5
```

---

## Fluxo de Compra

```mermaid
graph TD
    A["Cliente acessa<br/>halex.com"] --> B["Vê produtos<br/>e blog"]
    B --> C["Clica 'Comprar Agora'"]
    C --> D["Adiciona ao<br/>carrinho"]
    D --> E{Quer continuar<br/>comprando?}
    E -->|Sim| B
    E -->|Não| F["Vai para checkout"]
    F --> G["Login/Registro<br/>(Supabase)"]
    G --> H["Preenche dados"]
    H --> I["Escolhe pagamento"]
    I --> J["Stripe/Mercado Pago<br/>processa pagamento"]
    J --> K{Pagamento<br/>aprovado?}
    K -->|Não| L["Erro - Tenta novamente"]
    L --> I
    K -->|Sim| M["Pedido criado"]
    M --> N["Email de confirmação"]
    N --> O["Redirect para<br/>página de sucesso"]
    O --> P["Cliente vê pedido<br/>em seu perfil"]

    style A fill:#FFE5B4
    style M fill:#90EE90
    style J fill:#6772e5
    style N fill:#FFB90F
```

---

## Fluxo de Admin

```mermaid
graph TD
    A["Admin faz login"] --> B["Vai para /admin"]
    B --> C{O que quer<br/>fazer?}
    
    C -->|Gerenciar| D["Dashboard"]
    D --> E["Ver méttricas"]
    E --> F["Vendas, Visitantes, etc"]
    
    C -->|Produtos| G["ProductManagement"]
    G --> H{Qual ação?}
    H -->|Ver| I["Lista de produtos"]
    H -->|Criar| J["Novo produto"]
    H -->|Editar| K["Atualizar dados"]
    H -->|Deletar| L["Remove do banco"]
    
    C -->|Blog| M["BlogManagement"]
    M --> N{Qual ação?}
    N -->|Ver| O["Posts existentes"]
    N -->|Criar| P["Novo post"]
    N -->|Editar| Q["Atualizar conteúdo"]
    N -->|Deletar| R["Remove post"]
    
    C -->|Categorias| S["CategoryManagement"]
    S --> T["Criar/Editar/Deletar<br/>categorias"]
    
    C -->|Afiliados| U["AffiliatesManagement"]
    U --> V["Aprovar/Rejeitar<br/>novos afiliados"]

    style A fill:#FFB6C1
    style D fill:#90EE90
    style G fill:#87CEEB
    style M fill:#DDA0DD
    style S fill:#F0E68C
```

---

## Fluxo de Blog Post

```mermaid
graph TD
    A["Usuário visita blog"] --> B["Vê lista de posts"]
    B --> C["Clica em um post"]
    C --> D["Abre post completo"]
    D --> E["Lê artigo"]
    E --> F{Gostou?}
    F -->|Sim| G["Clica 'Favoritar'"]
    G --> H["Salva no perfil"]
    F -->|Não| I["Volta para blog"]
    
    E --> J{Quer saber<br/>mais?}
    J -->|Sim| K["Clica link interno"]
    K --> L["Vai para<br/>outro post/produto"]
    J -->|Não| I

    style A fill:#FFE5B4
    style D fill:#87CEEB
    style G fill:#90EE90
    style H fill:#90EE90
```

---

## Fluxo de Gerador de Dicas (IA)

```mermaid
graph TD
    A["Cliente acessa<br/>'Dicas IA'"] --> B["Preenche dados"]
    B --> C["Peso, Altura,<br/>Objetivo"]
    C --> D["Clica 'Gerar'"]
    D --> E["Envia para backend"]
    E --> F["Backend chama<br/>Google Gemini API"]
    F --> G["Gemini gera<br/>resposta em JSON"]
    G --> H["Backend retorna<br/>dados ao frontend"]
    H --> I["Frontend mostra"]
    I --> J["Dicas de dieta"]
    I --> K["Dicas de treino"]
    I --> L["Produtos recomendados"]
    
    J --> M["Cliente pode"]
    M --> N["Copiar dicas"]
    M --> O["Comprar produtos"]

    style A fill:#FFE5B4
    style F fill:#4285f4
    style G fill:#4285f4
    style I fill:#90EE90
    style O fill:#FFB90F
```

---

## Fluxo de Afiliado

```mermaid
graph TD
    A["Acessar página<br/>de afiliados"] --> B["Preencher formulário"]
    B --> C["Email, WhatsApp, etc"]
    C --> D["Submeter"]
    D --> E["Email enviado<br/>para admin"]
    E --> F["Admin revisa<br/>no dashboard"]
    F --> G{Aprovar?}
    G -->|Não| H["Enviar email<br/>de rejeição"]
    G -->|Sim| I["Gerar código<br/>de referência"]
    I --> J["Enviar código<br/>ao afiliado"]
    J --> K["Afiliado login<br/>no dashboard"]
    K --> L["Ver estatísticas"]
    L --> M["Clicar no link"]
    L --> N["Conversões"]
    L --> O["Comissões"]

    style K fill:#90EE90
    style I fill:#FFB90F
    style O fill:#90EE90
```

---

## Estrutura de Dados

### Tabelas do Banco de Dados

```mermaid
graph LR
    subgraph "SQLite/Supabase"
        Products["Products<br/>id, name, price, stock, rating"]
        Posts["Posts<br/>id, title, content, category, date"]
        Orders["Orders<br/>id, customer, items, total, status"]
        Users["Users<br/>id, email, password<br/>(Supabase Auth)"]
        Favorites["Favorites<br/>id, user_id, item_id, type"]
        Categories["Categories<br/>id, name, description"]
        Affiliates["Affiliates<br/>id, email, ref_code, rate"]
    end

    Users -->|tem| Orders
    Users -->|tem| Favorites
    Products -->|em| Orders
    Posts -->|em| Favorites
    Products -->|em| Categories
    Affiliates -->|rastreia| Orders

    style Products fill:#87CEEB
    style Posts fill:#DDA0DD
    style Orders fill:#FFB90F
    style Users fill:#90EE90
    style Affiliates fill:#FFB6C1
```

---

## Integração de Serviços Externos

```mermaid
graph TB
    App["Halex App<br/>localhost:3000"]
    
    subgraph "Autenticação"
        Supabase["Supabase Auth<br/>Login/Registro"]
    end
    
    subgraph "Banco de Dados"
        DB["Supabase Database<br/>PostgreSQL"]
    end
    
    subgraph "IA & Machine Learning"
        Gemini["Google Gemini API<br/>Gera dicas"]
    end
    
    subgraph "Pagamentos"
        Stripe["Stripe<br/>Cartão de crédito"]
        MercadoPago["Mercado Pago<br/>PIX, Boleto"]
    end
    
    subgraph "Email"
        Resend["Resend<br/>Transacional"]
        Gmail["Gmail SMTP<br/>Backup"]
    end
    
    subgraph "Deployment"
        Vercel["Vercel<br/>Host Frontend + API"]
    end

    App -->|Login| Supabase
    App -->|Dados| DB
    App -->|Gera dicas| Gemini
    App -->|Processa pag| Stripe
    App -->|Processa pag| MercadoPago
    App -->|Envia email| Resend
    App -->|Backup email| Gmail
    App -->|Deploy| Vercel

    style App fill:#61dafb
    style Supabase fill:#24b47e
    style Gemini fill:#4285f4
    style Stripe fill:#6772e5
    style Vercel fill:#000
    style Resend fill:#000
```

---

## Fluxo de Desenvolvimento

```mermaid
graph LR
    A["Código Local<br/>npm run dev"] --> B["Servidor Express<br/>localhost:3000"]
    B --> C["Vite Dev Server<br/>Hot Reload"]
    C --> D["Browser"]
    
    E["Mudança de código"] -->|Auto-reload| C
    
    F["npm run build"] --> G["Vite Build<br/>Minify"]
    G --> H["dist/"]
    H --> I["Pronto para deploy"]
    
    I --> J["Push para GitHub"]
    J --> K["Vercel CI/CD"]
    K --> L["Deploy automático"]
    L --> M["halex.app<br/>Production"]

    style A fill:#FFE5B4
    style B fill:#68a063
    style C fill:#61dafb
    style D fill:#90EE90
    style M fill:#52C41A
```

---

## Segurança de Autenticação

```mermaid
graph TD
    A["Usuário tenta login"] --> B["Envia email + senha"]
    B --> C["Express recebe"]
    C --> D["Valida com Supabase"]
    D --> E{Válido?}
    E -->|Não| F["Retorna erro"]
    E -->|Sim| G["Cria session"]
    G --> H["Retorna JWT token"]
    H --> I["Frontend armazena<br/>no localStorage"]
    I --> J["Próximas requisições<br/>enviam token"]
    J --> K["Backend valida<br/>token"]
    K --> L{Válido?}
    L -->|Não| M["Retorna 401"]
    L -->|Sim| N["Permite acesso"]

    style A fill:#FFE5B4
    style H fill:#90EE90
    style M fill:#FF6B6B
    style N fill:#90EE90
```

---

## Componentes React - Árvore

```
App (componente principal)
├── Navbar
│   ├── Search
│   └── AuthModal
├── Router (páginas)
│   ├── HomePage
│   │   ├── Hero
│   │   ├── FeaturedProducts
│   │   └── BlogPreview
│   ├── StorePage
│   │   └── ProductCard (map)
│   ├── BlogPage
│   │   └── BlogPostCard (map)
│   ├── BlogPostDetailsPage
│   ├── AdminDashboard
│   │   ├── ProductManagement
│   │   ├── BlogManagement
│   │   ├── CategoryManagement
│   │   └── AffiliatesManagement
│   ├── AffiliateLanding
│   └── TipsPage
├── Cart
│   └── CartItem (map)
├── Footer
└── SupportChat
```

---

**Última atualização**: 10/03/2026
