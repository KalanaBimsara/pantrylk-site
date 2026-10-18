-- Pantry LK — initial schema, Row Level Security and storage
-- Run in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- Inspect existing tables first: this script uses IF NOT EXISTS but does not migrate old data.

create extension if not exists pgcrypto;

-------------------------------------------------------------------------------
-- Helpers
-------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so policies can check admin status without recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-------------------------------------------------------------------------------
-- Site settings (single row, id = 1)
-------------------------------------------------------------------------------
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default 'Pantry LK Pvt Ltd',
  tagline text,
  phone_display text,
  phone_intl text,
  whatsapp_number text check (whatsapp_number ~ '^[0-9]{8,15}$'),
  email text,
  address text,
  business_hours text,
  map_url text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  kitchen_planner_url text check (kitchen_planner_url is null or kitchen_planner_url ~ '^https://'),
  quotation_maker_url text check (quotation_maker_url is null or quotation_maker_url ~ '^https://'),
  open_apps_in_new_tab boolean not null default true,
  contact_uploads_enabled boolean not null default false,
  brand jsonb not null default '{}'::jsonb,
  seo_default_title text,
  seo_default_description text,
  updated_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Content
-------------------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  image_path text,
  image_alt text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  category_id uuid references public.product_categories (id) on delete set null,
  summary text,
  description text,
  price_mode text not null default 'on_request' check (price_mode in ('fixed', 'starting', 'on_request', 'none')),
  price numeric(12, 2) check (price is null or price >= 0),
  finishes jsonb not null default '[]'::jsonb,   -- [{ "name": "Walnut", "hex": "#624734" }]
  specs jsonb not null default '[]'::jsonb,      -- [{ "label": "Dimensions", "value": "Made to measure" }]
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished', 'archived')),
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null,
  alt text not null default '',
  caption text,
  sort_order int not null default 0
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  layout text,
  style text,
  project_type text,
  location text,            -- district level only; never a street address
  completed_on text,        -- e.g. "March 2026", only when verified
  summary text,
  requirements text,
  solution text,
  materials jsonb not null default '[]'::jsonb,
  cover_path text,
  cover_alt text,
  before_path text,
  before_alt text,
  after_path text,
  after_alt text,
  is_featured boolean not null default false,
  photos_verified boolean not null default false,  -- genuine Pantry LK work + homeowner consent
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished', 'archived')),
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_publish_requires_verification check (status <> 'published' or (photos_verified and cover_path is not null))
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  path text not null,
  alt text not null default '',
  caption text,
  sort_order int not null default 0
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  customer_name text not null,
  area text,
  project_id uuid references public.projects (id) on delete set null,
  consent_confirmed boolean not null default false,
  is_approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint testimonials_approval_requires_consent check (not is_approved or consent_confirmed)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_published boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  unique (page_slug, section_key)
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('header', 'footer')),
  label text not null,
  href text not null,
  is_external boolean not null default false,
  is_enabled boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Inquiries (private)
-------------------------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text check (email is null or char_length(email) <= 200),
  inquiry_type text not null check (inquiry_type in ('New kitchen project', 'Product inquiry', 'Existing project', 'Partnership', 'Other')),
  message text not null check (char_length(message) between 10 and 4000),
  source_page text check (source_page is null or char_length(source_page) <= 300),
  status text not null default 'New' check (status in ('New', 'Contacted', 'In Progress', 'Completed', 'Archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Indexes & triggers
-------------------------------------------------------------------------------
create index if not exists products_status_idx on public.products (status, sort_order);
create index if not exists projects_status_idx on public.projects (status, sort_order);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create index if not exists project_images_project_idx on public.project_images (project_id, sort_order);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);

do $$ declare t text; begin
  foreach t in array array['site_settings','product_categories','products','projects','pages'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.navigation_items enable row level security;
alter table public.redirects enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_notes enable row level security;
alter table public.admin_activity_logs enable row level security;

-- Profiles: users see their own row; admins see all. Nobody can self-promote.
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Public read of published content
create policy "settings public read" on public.site_settings for select using (true);
create policy "categories public read" on public.product_categories for select using (is_published or public.is_admin());
create policy "products public read" on public.products for select using (status = 'published' or public.is_admin());
create policy "product images public read" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())));
create policy "projects public read" on public.projects for select using (status = 'published' or public.is_admin());
create policy "project images public read" on public.project_images for select
  using (exists (select 1 from public.projects p where p.id = project_id and (p.status = 'published' or public.is_admin())));
create policy "testimonials public read" on public.testimonials for select using (is_approved or public.is_admin());
create policy "faqs public read" on public.faqs for select using (is_published or public.is_admin());
create policy "pages public read" on public.pages for select using (is_published or public.is_admin());
create policy "sections public read" on public.page_sections for select using (is_enabled or public.is_admin());
create policy "nav public read" on public.navigation_items for select using (is_enabled or public.is_admin());
create policy "redirects public read" on public.redirects for select using (true);

-- Admin write on all content tables
do $$ declare t text; begin
  foreach t in array array['site_settings','product_categories','products','product_images','projects','project_images','testimonials','faqs','pages','page_sections','navigation_items','redirects'] loop
    execute format('create policy "%s admin insert" on public.%I for insert with check (public.is_admin())', t, t);
    execute format('create policy "%s admin update" on public.%I for update using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format('create policy "%s admin delete" on public.%I for delete using (public.is_admin())', t, t);
  end loop;
end $$;

-- Inquiries: anyone may INSERT a New inquiry (validated by constraints + server action);
-- only admins can read, update or delete. Anonymous users can never select.
create policy "inquiries public insert" on public.inquiries for insert to anon, authenticated
  with check (status = 'New');
create policy "inquiries admin read" on public.inquiries for select using (public.is_admin());
create policy "inquiries admin update" on public.inquiries for update using (public.is_admin()) with check (public.is_admin());
create policy "inquiries admin delete" on public.inquiries for delete using (public.is_admin());

create policy "notes admin all" on public.inquiry_notes for all using (public.is_admin()) with check (public.is_admin());
create policy "activity admin read" on public.admin_activity_logs for select using (public.is_admin());
create policy "activity admin insert" on public.admin_activity_logs for insert with check (public.is_admin());

-------------------------------------------------------------------------------
-- Storage buckets
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true), ('inquiry-attachments', 'inquiry-attachments', false)
on conflict (id) do nothing;

create policy "site-media public read" on storage.objects for select using (bucket_id = 'site-media');
create policy "site-media admin write" on storage.objects for insert with check (bucket_id = 'site-media' and public.is_admin());
create policy "site-media admin update" on storage.objects for update using (bucket_id = 'site-media' and public.is_admin());
create policy "site-media admin delete" on storage.objects for delete using (bucket_id = 'site-media' and public.is_admin());
create policy "attachments admin read" on storage.objects for select using (bucket_id = 'inquiry-attachments' and public.is_admin());
create policy "attachments admin delete" on storage.objects for delete using (bucket_id = 'inquiry-attachments' and public.is_admin());
-- Uploads to inquiry-attachments go through a server route with signed upload URLs (admin phase).
