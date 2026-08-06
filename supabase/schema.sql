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

create table if not exists public.distributor_requests (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  status varchar not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  status varchar not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_distributor_visible_idx on public.products (distributor_visible);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists distributor_requests_product_id_idx on public.distributor_requests (product_id);
create index if not exists distributor_requests_status_idx on public.distributor_requests (status);
create index if not exists orders_product_id_idx on public.orders (product_id);
create index if not exists orders_status_idx on public.orders (status);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.distributor_requests enable row level security;
alter table public.orders enable row level security;

create policy "public read products" on public.products for select using (true);
create policy "public insert products" on public.products for insert with check (true);
create policy "public update products" on public.products for update using (true);
create policy "public delete products" on public.products for delete using (true);

create policy "public read categories" on public.categories for select using (true);
create policy "public insert categories" on public.categories for insert with check (true);
create policy "public update categories" on public.categories for update using (true);
create policy "public delete categories" on public.categories for delete using (true);

create policy "public read distributor_requests" on public.distributor_requests for select using (true);
create policy "public insert distributor_requests" on public.distributor_requests for insert with check (true);
create policy "public update distributor_requests" on public.distributor_requests for update using (true);
create policy "public delete distributor_requests" on public.distributor_requests for delete using (true);

create policy "public read orders" on public.orders for select using (true);
create policy "public insert orders" on public.orders for insert with check (true);
create policy "public update orders" on public.orders for update using (true);
create policy "public delete orders" on public.orders for delete using (true);
