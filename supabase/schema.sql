-- Distributor Pricing Portal — Supabase schema (fresh setup)

create table if not exists public.categories (
  id bigserial primary key,
  name varchar not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id bigserial primary key,
  name varchar not null,
  status varchar not null default 'draft',
  description text,
  price numeric,
  cost_price numeric,
  selling_price numeric,
  stock integer,
  product_url text,
  image_url text,
  image_data text,
  category_id bigint,
  distributor_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_distributor_visible_idx on public.products (distributor_visible);
create index if not exists products_category_id_idx on public.products (category_id);

alter table public.products enable row level security;
alter table public.categories enable row level security;

create policy "public read products" on public.products for select using (true);
create policy "public insert products" on public.products for insert with check (true);
create policy "public update products" on public.products for update using (true);
create policy "public delete products" on public.products for delete using (true);

create policy "public read categories" on public.categories for select using (true);
create policy "public insert categories" on public.categories for insert with check (true);
create policy "public update categories" on public.categories for update using (true);
create policy "public delete categories" on public.categories for delete using (true);
