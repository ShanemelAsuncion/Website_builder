-- Supabase schema for Website Builder
-- Run in Supabase SQL editor or via CLI

-- Users table
create table if not exists public.users (
  id bigserial primary key,
  email text unique not null,
  password text not null,
  is_master boolean default false,
  created_at timestamptz default now()
);

-- Content table (keyed content blobs)
create table if not exists public.content (
  id bigserial primary key,
  key text unique not null,
  value text not null,
  type text not null,
  updated_at timestamptz default now()
);

-- Password reset tokens
create table if not exists public.password_reset_tokens (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Email change requests
create table if not exists public.email_change_requests (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  new_email text not null,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Settings table (optional; for runtime config values)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_content_key on public.content(key);
create index if not exists idx_tokens_user_id on public.password_reset_tokens(user_id);
create index if not exists idx_email_change_user_id on public.email_change_requests(user_id);

-- Storage bucket must be created via Supabase Storage UI/API:
-- Bucket name: 'uploads' (public)
-- Public read enabled so public URLs work on the frontend.
