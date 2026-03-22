-- Tabela de clientes (customers)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  phone text,
  document text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para busca rápida por e-mail
create index if not exists customers_email_idx on customers(email);
