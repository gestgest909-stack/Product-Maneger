-- Distributor Pricing Portal — Supabase schema
-- Run in Supabase SQL Editor.

create table if not exists public.products (
  id bigserial primary key,
  name varchar not null,
  status varchar not null default 'pending',
  cost_price numeric,
  selling_price numeric,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);

alter table public.products enable row level security;

create policy "public read products" on public.products
  for select using (true);

create policy "public insert products" on public.products
  for insert with check (true);

create policy "public update products" on public.products
  for update using (true);

create policy "public delete products" on public.products
  for delete using (true);
