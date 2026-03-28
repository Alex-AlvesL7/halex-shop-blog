-- Executar no SQL Editor do Supabase para habilitar etiquetas de afiliados
alter table if exists public.affiliates
add column if not exists tag text;

comment on column public.affiliates.tag is 'Etiqueta interna usada no painel administrativo para classificar afiliados.';
