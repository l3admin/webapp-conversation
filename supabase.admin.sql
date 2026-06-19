-- Admin and multi-tenant access schema for invite-only operation.
-- Apply this in Supabase SQL editor before using /admin APIs.

alter table public.user_profiles
  add column if not exists is_master_admin boolean not null default false;

alter table public.user_profiles
  add column if not exists is_disabled boolean not null default false;

alter table public.user_profiles
  add column if not exists first_name text;

alter table public.user_profiles
  add column if not exists last_name text;

alter table public.user_profiles
  add column if not exists must_change_password boolean not null default false;

alter table public.user_profiles
  add column if not exists password_changed_at timestamptz;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  logo_storage_path text,
  theme_json jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_catalog (
  agent_id text primary key,
  display_name text not null,
  button_label text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_catalog
  add column if not exists description text;

alter table public.agent_catalog
  add column if not exists button_label text;

create table if not exists public.user_customer_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, customer_id)
);

create table if not exists public.customer_agent_access (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  agent_id text not null references public.agent_catalog(agent_id) on delete cascade,
  agent_display_name text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, agent_id)
);

create unique index if not exists customer_agent_access_one_default_per_customer
  on public.customer_agent_access(customer_id)
  where is_default = true;

-- Optional future per-user override support.
create table if not exists public.user_agent_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null references public.agent_catalog(agent_id) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, agent_id)
);

-- Minimal RLS posture for end-user reads; admin writes happen via server-side admin secret-key APIs.
alter table public.customers enable row level security;
alter table public.agent_catalog enable row level security;
alter table public.user_customer_access enable row level security;
alter table public.customer_agent_access enable row level security;
alter table public.user_agent_overrides enable row level security;

drop policy if exists "user_profiles_self_select" on public.user_profiles;
create policy "user_profiles_self_select" on public.user_profiles
for select using (auth.uid() = user_id);

drop policy if exists "customers_via_user_access" on public.customers;
create policy "customers_via_user_access" on public.customers
for select using (
  exists (
    select 1
    from public.user_customer_access uca
    where uca.customer_id = customers.id
      and uca.user_id = auth.uid()
  )
);

drop policy if exists "user_customer_access_self_select" on public.user_customer_access;
create policy "user_customer_access_self_select" on public.user_customer_access
for select using (user_id = auth.uid());

drop policy if exists "customer_agent_access_via_user_access" on public.customer_agent_access;
create policy "customer_agent_access_via_user_access" on public.customer_agent_access
for select using (
  exists (
    select 1
    from public.user_customer_access uca
    where uca.customer_id = customer_agent_access.customer_id
      and uca.user_id = auth.uid()
  )
);

drop policy if exists "agent_catalog_via_customer_access" on public.agent_catalog;
create policy "agent_catalog_via_customer_access" on public.agent_catalog
for select using (
  exists (
    select 1
    from public.customer_agent_access caa
    join public.user_customer_access uca on uca.customer_id = caa.customer_id
    where caa.agent_id = agent_catalog.agent_id
      and uca.user_id = auth.uid()
  )
);

drop policy if exists "user_agent_overrides_self_select" on public.user_agent_overrides;
create policy "user_agent_overrides_self_select" on public.user_agent_overrides
for select using (user_id = auth.uid());
