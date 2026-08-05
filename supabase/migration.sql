-- Migration for existing databases created with the old schema.
-- Run in Supabase SQL Editor. Safe to re-run.

create table if not exists public.categories (
  id bigserial primary key,
  name varchar not null,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists description text,
  add column if not exists price numeric,
  add column if not exists stock integer,
  add column if not exists product_url text,
  add column if not exists image_url text,
  add column if not exists image_data text,
  add column if not exists category_id bigint,
  add column if not exists distributor_visible boolean not null default false;

alter table public.products alter column status set default 'draft';
update public.products set status = 'draft' where status = 'pending';

create index if not exists products_distributor_visible_idx on public.products (distributor_visible);
create index if not exists products_category_id_idx on public.products (category_id);

alter table public.products enable row level security;
alter table public.categories enable row level security;

drop policy if exists "public read products" on public.products;
drop policy if exists "public insert products" on public.products;
drop policy if exists "public update products" on public.products;
drop policy if exists "public delete products" on public.products;

create policy "public read products" on public.products for select using (true);
create policy "public insert products" on public.products for insert with check (true);
create policy "public update products" on public.products for update using (true);
create policy "public delete products" on public.products for delete using (true);

drop policy if exists "public read categories" on public.categories;
drop policy if exists "public insert categories" on public.categories;
drop policy if exists "public update categories" on public.categories;
drop policy if exists "public delete categories" on public.categories;

create policy "public read categories" on public.categories for select using (true);
create policy "public insert categories" on public.categories for insert with check (true);
create policy "public update categories" on public.categories for update using (true);
create policy "public delete categories" on public.categories for delete using (true);
