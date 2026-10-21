-- Apply this migration to existing projects before enabling account-only workspaces.
-- Published portfolio records remain public; draft records require their owner account.

alter table public.portfolios enable row level security;
grant select on table public.portfolios to anon, authenticated;
grant insert, update, delete on table public.portfolios to authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'portfolios'
      and column_name = 'owner_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'portfolios'
      and column_name = 'user_id'
  ) then
    alter table public.portfolios rename column owner_id to user_id;
  end if;
end;
$$;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists app_private.account_usernames (
  username text primary key
    check (username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'app_private'
      and table_name = 'account_usernames'
      and column_name = 'owner_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'app_private'
      and table_name = 'account_usernames'
      and column_name = 'user_id'
  ) then
    alter table app_private.account_usernames rename column owner_id to user_id;
  end if;
end;
$$;

alter table app_private.account_usernames enable row level security;
revoke all on table app_private.account_usernames from public, anon, authenticated;

insert into app_private.account_usernames (username, user_id, email)
select
  lower(raw_user_meta_data ->> 'username'),
  id,
  email
from auth.users
where email is not null
  and lower(email) = lower(raw_user_meta_data ->> 'username') || '@users.portgen.invalid'
  and raw_user_meta_data ->> 'username' ~ '^[a-zA-Z0-9_]{3,24}$'
on conflict do nothing;

drop function if exists public.lookup_account_email_for_username(text);
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

drop function if exists public.register_username_for_account(text, text, uuid);
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
