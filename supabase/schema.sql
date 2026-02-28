-- ============================================================
--  PLUTOX GOLD VAULT — Supabase Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────────

create type kyc_status        as enum ('pending','approved','rejected');
create type account_status    as enum ('active','grace_period','suspended');
create type order_type        as enum ('purchase','delivery','buyback');
create type order_status      as enum ('pending','complete','cancelled');
create type holding_status    as enum ('active','delivered','sold');
create type billing_status    as enum ('pending','paid','failed','waived');

-- ── LOCATIONS / VAULTS / BINS ────────────────────────────────

create table locations (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  address    text,
  country    text not null default 'GB',
  created_at timestamptz not null default now()
);

create table vaults (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  code        text not null unique,
  capacity    int  not null default 1000,
  created_at  timestamptz not null default now()
);

create table bins (
  id         uuid primary key default gen_random_uuid(),
  vault_id   uuid not null references vaults(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- ── CUSTOMERS ────────────────────────────────────────────────

create table customers (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null,
  email               text not null unique,
  phone               text,
  kyc_status          kyc_status    not null default 'pending',
  account_status      account_status not null default 'active',
  stripe_customer_id  text unique,
  overdue_amount      numeric(12,2) not null default 0,
  grace_period_ends   timestamptz,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

-- ── PRODUCTS ─────────────────────────────────────────────────

create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text           not null,
  weight_g        numeric(10,4)  not null,
  purity          numeric(5,4)   not null default 0.9999,
  base_price      numeric(12,2)  not null,
  storage_fee     numeric(12,2)  not null default 0,
  handling_fee    numeric(12,2)  not null default 0,
  is_active       boolean        not null default true,
  image_url       text,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

-- ── GOLD PRICE HISTORY ───────────────────────────────────────

create table gold_price_history (
  id           uuid primary key default gen_random_uuid(),
  price_per_g  numeric(12,4) not null,
  source       text not null default 'metals_api',
  recorded_at  timestamptz   not null default now()
);

-- ── VAULT HOLDINGS ───────────────────────────────────────────

create table vault_holdings (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  product_id    uuid not null references products(id),
  bin_id        uuid references bins(id),
  plutox_ref    text not null unique,
  status        holding_status not null default 'active',
  purchase_price numeric(12,2) not null,
  current_value  numeric(12,2),
  storage_fee    numeric(12,2) not null default 0,
  acquired_at    timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

-- ── ORDERS ───────────────────────────────────────────────────

create table orders (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers(id) on delete cascade,
  product_id      uuid not null references products(id),
  holding_id      uuid references vault_holdings(id),
  order_type      order_type   not null,
  status          order_status not null default 'pending',
  quantity        int          not null default 1,
  gold_price_g    numeric(12,4),
  unit_price      numeric(12,2) not null,
  handling_fee    numeric(12,2) not null default 0,
  delivery_fee    numeric(12,2) not null default 0,
  total_amount    numeric(12,2) not null,
  stripe_payment_intent text,
  delivery_address jsonb,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── DELIVERY FEE TIERS ───────────────────────────────────────

create table delivery_fee_tiers (
  id          uuid primary key default gen_random_uuid(),
  label       text           not null,
  min_weight_g numeric(10,4) not null,
  max_weight_g numeric(10,4),
  fee         numeric(12,2)  not null,
  sort_order  int            not null default 0,
  created_at  timestamptz    not null default now()
);

-- ── STORAGE BILLING ──────────────────────────────────────────

create table storage_billing (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references customers(id) on delete cascade,
  holding_id      uuid not null references vault_holdings(id) on delete cascade,
  amount          numeric(12,2) not null,
  status          billing_status not null default 'pending',
  stripe_invoice_id text,
  billing_period_start timestamptz not null,
  billing_period_end   timestamptz not null,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── PLATFORM SETTINGS ────────────────────────────────────────

create table platform_settings (
  key        text primary key,
  value      text not null,
  label      text,
  updated_at timestamptz not null default now()
);

insert into platform_settings (key, value, label) values
  ('storage_fee_rate',    '0.015',  'Monthly storage fee rate (%)'),
  ('handling_fee_flat',   '25.00',  'Flat handling fee per order (£)'),
  ('grace_period_days',   '14',     'Grace period days before suspension'),
  ('metals_api_key',      '',       'Metals API key'),
  ('stripe_secret_key',   '',       'Stripe secret key'),
  ('company_name',        'Plutox Gold Vault', 'Company display name');

-- ── INDEXES ──────────────────────────────────────────────────

create index on vault_holdings (customer_id, status);
create index on orders         (customer_id, created_at desc);
create index on storage_billing(customer_id, status);
create index on storage_billing(holding_id);
create index on gold_price_history(recorded_at desc);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_customers_upd   before update on customers      for each row execute function set_updated_at();
create trigger trg_products_upd    before update on products        for each row execute function set_updated_at();
create trigger trg_holdings_upd    before update on vault_holdings  for each row execute function set_updated_at();
create trigger trg_orders_upd      before update on orders          for each row execute function set_updated_at();

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────

alter table customers       enable row level security;
alter table vault_holdings  enable row level security;
alter table orders          enable row level security;
alter table storage_billing enable row level security;
alter table products        enable row level security;
alter table gold_price_history enable row level security;
alter table delivery_fee_tiers enable row level security;
alter table platform_settings  enable row level security;
alter table locations          enable row level security;
alter table vaults             enable row level security;
alter table bins               enable row level security;

-- Customers see only their own rows
create policy "customers: own row" on customers        for all using (auth.uid() = id);
create policy "holdings: own"      on vault_holdings   for all using (auth.uid() = customer_id);
create policy "orders: own"        on orders           for all using (auth.uid() = customer_id);
create policy "billing: own"       on storage_billing  for all using (auth.uid() = customer_id);

-- Public read for products, prices, tiers, settings
create policy "products: public read"    on products            for select using (true);
create policy "gold_price: public read"  on gold_price_history  for select using (true);
create policy "delivery: public read"    on delivery_fee_tiers  for select using (true);
create policy "settings: public read"    on platform_settings   for select using (true);
create policy "locations: public read"   on locations           for select using (true);
create policy "vaults: public read"      on vaults              for select using (true);
create policy "bins: public read"        on bins                for select using (true);

-- ── SEED DATA ────────────────────────────────────────────────

insert into locations (code, name, address, country) values
  ('LON-01', 'London Vault', '1 Gold Lane, EC2V 8RF, London', 'GB');

insert into vaults (location_id, code, capacity)
  select id, 'VAULT-A', 500 from locations where code = 'LON-01';

insert into bins (vault_id, code)
  select id, 'A-' || lpad(n::text,3,'0')
  from vaults, generate_series(1,20) n
  where code = 'VAULT-A';

insert into products (name, weight_g, purity, base_price, storage_fee, handling_fee) values
  ('1g Gold Bar',     1,    0.9999, 75.00,   0.50,  15.00),
  ('5g Gold Bar',     5,    0.9999, 370.00,  2.00,  20.00),
  ('10g Gold Bar',    10,   0.9999, 730.00,  3.50,  25.00),
  ('1oz Gold Bar',    31.1, 0.9999, 2250.00, 9.00,  35.00),
  ('100g Gold Bar',   100,  0.9999, 7100.00, 25.00, 50.00);

insert into delivery_fee_tiers (label, min_weight_g, max_weight_g, fee, sort_order) values
  ('Under 10g',    0,    9.99,  25.00, 1),
  ('10g – 50g',    10,   49.99, 45.00, 2),
  ('50g – 100g',   50,   99.99, 65.00, 3),
  ('100g+',        100,  null,  95.00, 4);
