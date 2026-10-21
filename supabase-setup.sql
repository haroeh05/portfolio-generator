-- Fresh-project setup for PortGen.
-- Do not run this over an existing portfolio table without reviewing the schema first.

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  contact_number text not null default '',
  address text not null default '',
  about_me text not null default '',
  profile_picture_url text,
  education jsonb not null default '[]'::jsonb check (jsonb_typeof(education) = 'array'),
  skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  projects jsonb not null default '[]'::jsonb check (jsonb_typeof(projects) = 'array'),
  work_experience jsonb not null default '[]'::jsonb check (jsonb_typeof(work_experience) = 'array'),
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
  template text not null default 'simple' check (template in ('simple', 'modern', 'creative')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_portfolio_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists set_portfolio_updated_at on public.portfolios;
create trigger set_portfolio_updated_at
  before update on public.portfolios
  for each row execute function public.set_portfolio_updated_at();

alter table public.portfolios enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.portfolios to anon, authenticated;
grant insert, update, delete on public.portfolios to authenticated;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists app_private.account_usernames (
  username text primary key
    check (username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique
);

alter table app_private.account_usernames enable row level security;
revoke all on table app_private.account_usernames from public, anon, authenticated;

create or replace function public.lookup_account_email_for_username(p_username text)
returns text
language sql
security definer
set search_path = ''
as $$
  select account.email
  from app_private.account_usernames as account
  where account.username = pg_catalog.lower(pg_catalog.btrim(p_username));
$$;

revoke all on function public.lookup_account_email_for_username(text)
  from public, anon, authenticated;
grant execute on function public.lookup_account_email_for_username(text)
  to service_role;

create or replace function public.register_username_for_account(
  p_username text,
  p_email text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_username text := pg_catalog.lower(pg_catalog.btrim(p_username));
  account_email text;
begin
  if normalized_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Invalid username';
  end if;

  select users.email into account_email
  from auth.users as users
  where users.id = p_user_id;

  if account_email is null or pg_catalog.lower(account_email) <> pg_catalog.lower(pg_catalog.btrim(p_email)) then
    raise exception 'Account email does not match';
  end if;

  insert into app_private.account_usernames (username, user_id, email)
  values (normalized_username, p_user_id, account_email);
end;
$$;

revoke all on function public.register_username_for_account(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.register_username_for_account(text, text, uuid)
  to service_role;

drop policy if exists "Portfolio owners and public visitors can read" on public.portfolios;
drop policy if exists "Portfolio owners can read own" on public.portfolios;
create policy "Portfolio owners can read own"
  on public.portfolios
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

drop policy if exists "Anyone can view published portfolios" on public.portfolios;
create policy "Anyone can view published portfolios"
  on public.portfolios
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Portfolio owners can insert" on public.portfolios;
create policy "Portfolio owners can insert"
  on public.portfolios
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

drop policy if exists "Portfolio owners can update" on public.portfolios;
create policy "Portfolio owners can update"
  on public.portfolios
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  )
  with check (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

drop policy if exists "Portfolio owners can delete" on public.portfolios;
create policy "Portfolio owners can delete"
  on public.portfolios
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio owners can upload profile images" on storage.objects;
create policy "Portfolio owners can upload profile images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Portfolio owners can delete profile images" on storage.objects;
create policy "Portfolio owners can delete profile images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (select auth.jwt() ->> 'is_anonymous') = 'false'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );