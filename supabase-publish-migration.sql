-- Run this migration in Supabase SQL Editor before enabling public portfolio links.
-- Existing portfolios remain private until their owners opt in to publishing.
alter table public.portfolios
  add column if not exists is_published boolean not null default false;

-- The public role needs SELECT privilege; row-level security limits it to published rows.
grant select on table public.portfolios to anon;

-- Public visitors may read only explicitly published portfolios.
-- Existing owner-based SELECT/INSERT/UPDATE/DELETE policies should remain in place.
drop policy if exists "Anyone can view published portfolios" on public.portfolios;
create policy "Anyone can view published portfolios"
  on public.portfolios
  for select
  to anon, authenticated
  using (is_published = true);
