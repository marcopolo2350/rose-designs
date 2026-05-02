-- Experimental Supabase schema for Rose's Indoor Designs cloud sync.
-- Run this in the Supabase SQL editor after creating your project.
--
-- Policy: one row per project. Rows are scoped by profile and owner.
-- Conflict handling in the client is timestamp-based and intentionally simple.

-- === Schema ===
create table if not exists public.rose_projects (
  id          text        primary key,
  profile     text        not null default 'default',
  payload     jsonb       not null,
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  owner       uuid        references auth.users(id)
);

create index if not exists rose_projects_profile_idx  on public.rose_projects(profile);
create index if not exists rose_projects_updated_idx  on public.rose_projects(updated_at desc);

-- === Auto-set owner on insert ===
create or replace function public.rose_projects_set_owner()
returns trigger language plpgsql as $$
begin
  if new.owner is null then
    new.owner := auth.uid();
  end if;
  return new;
end; $$;

drop trigger if exists rose_projects_set_owner on public.rose_projects;
create trigger rose_projects_set_owner
  before insert on public.rose_projects
  for each row execute function public.rose_projects_set_owner();

-- === Row Level Security ===
alter table public.rose_projects enable row level security;

-- Users can read/write their own rows. Anonymous auth is supported. Each
-- anonymous user gets a stable auth.uid() within a session; pair anonymous
-- auth with "Enable Anonymous Sign-ins" in Auth settings for easy device use.
drop policy if exists "rose_projects_select_own" on public.rose_projects;
create policy "rose_projects_select_own"
  on public.rose_projects for select
  using (owner = auth.uid());

drop policy if exists "rose_projects_insert_own" on public.rose_projects;
create policy "rose_projects_insert_own"
  on public.rose_projects for insert
  with check (owner is null or owner = auth.uid());

drop policy if exists "rose_projects_update_own" on public.rose_projects;
create policy "rose_projects_update_own"
  on public.rose_projects for update
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "rose_projects_delete_own" on public.rose_projects;
create policy "rose_projects_delete_own"
  on public.rose_projects for delete
  using (owner = auth.uid());

-- === Optional: shared-across-devices mode ===
-- If Rose + Marco want to sync rooms across each other's devices without creating
-- real auth, replace the policies above with these permissive ones AND keep the
-- anon key secret. Not recommended for public deployments.
--
--   create policy "rose_projects_shared_all"
--     on public.rose_projects for all
--     using (true) with check (true);
