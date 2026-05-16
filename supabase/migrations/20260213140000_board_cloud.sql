-- Nástěnka v cloudu: profil uživatele, metadata souborů, Storage (board-documents).
-- Spusť v Supabase SQL Editor nebo: supabase db push

-- ---------------------------------------------------------------------------
-- Profily (1:1 s auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Dokumenty nástěnky (metadata; JSON tělo ve Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.board_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_files_storage_path_unique unique (storage_path)
);

create index if not exists board_files_user_updated_idx on public.board_files (user_id, updated_at desc);

alter table public.board_files enable row level security;

drop policy if exists "board_files_select_own" on public.board_files;
create policy "board_files_select_own" on public.board_files for select to authenticated using (user_id = auth.uid());

drop policy if exists "board_files_insert_own" on public.board_files;
create policy "board_files_insert_own" on public.board_files for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "board_files_update_own" on public.board_files;
create policy "board_files_update_own" on public.board_files
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "board_files_delete_own" on public.board_files;
create policy "board_files_delete_own" on public.board_files for delete to authenticated using (user_id = auth.uid());

create or replace function public.touch_board_files_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists board_files_set_updated_at on public.board_files;
create trigger board_files_set_updated_at
  before update on public.board_files
  for each row execute function public.touch_board_files_updated_at();

-- ---------------------------------------------------------------------------
-- Storage: soukromý bucket, cesta {user_uuid}/{board_file_uuid}.mnboard
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('board-documents', 'board-documents', false)
on conflict (id) do nothing;

drop policy if exists "board_documents_select_own" on storage.objects;
create policy "board_documents_select_own" on storage.objects for select to authenticated using (
  bucket_id = 'board-documents' and name like auth.uid()::text || '/%'
);

drop policy if exists "board_documents_insert_own" on storage.objects;
create policy "board_documents_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'board-documents' and name like auth.uid()::text || '/%'
);

drop policy if exists "board_documents_update_own" on storage.objects;
create policy "board_documents_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'board-documents' and name like auth.uid()::text || '/%'
  ) with check (
    bucket_id = 'board-documents' and name like auth.uid()::text || '/%'
  );

drop policy if exists "board_documents_delete_own" on storage.objects;
create policy "board_documents_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'board-documents' and name like auth.uid()::text || '/%'
);

-- ---------------------------------------------------------------------------
-- Oprávnění k tabulkám přes Data API
-- ---------------------------------------------------------------------------
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.board_files to authenticated;
