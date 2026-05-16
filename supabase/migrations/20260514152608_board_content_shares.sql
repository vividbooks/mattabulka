-- Sdílení obsahu nástěnky studentům: učitel vytvoří veřejný token,
-- student otevře snapshot, zadá jméno a odevzdá vlastní verzi.

create table if not exists public.board_content_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  board_file_id uuid references public.board_files (id) on delete set null,
  token text not null unique,
  title text not null,
  document jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_content_shares_owner_updated_idx
  on public.board_content_shares (owner_id, updated_at desc);
create index if not exists board_content_shares_token_idx
  on public.board_content_shares (token);

alter table public.board_content_shares enable row level security;

drop policy if exists "board_content_shares_owner_select" on public.board_content_shares;
create policy "board_content_shares_owner_select" on public.board_content_shares
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "board_content_shares_owner_insert" on public.board_content_shares;
create policy "board_content_shares_owner_insert" on public.board_content_shares
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "board_content_shares_owner_update" on public.board_content_shares;
create policy "board_content_shares_owner_update" on public.board_content_shares
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "board_content_shares_public_read_active" on public.board_content_shares;
create policy "board_content_shares_public_read_active" on public.board_content_shares
  for select to anon using (is_active);

create table if not exists public.board_share_submissions (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.board_content_shares (id) on delete cascade,
  student_name text not null,
  document jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists board_share_submissions_share_created_idx
  on public.board_share_submissions (share_id, created_at desc);

alter table public.board_share_submissions enable row level security;

drop policy if exists "board_share_submissions_teacher_select" on public.board_share_submissions;
create policy "board_share_submissions_teacher_select" on public.board_share_submissions
  for select to authenticated using (
    exists (
      select 1
      from public.board_content_shares s
      where s.id = share_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "board_share_submissions_public_insert_active" on public.board_share_submissions;
create policy "board_share_submissions_public_insert_active" on public.board_share_submissions
  for insert to anon with check (
    length(trim(student_name)) between 1 and 80
    and exists (
      select 1
      from public.board_content_shares s
      where s.id = share_id and s.is_active
    )
  );

create or replace function public.touch_board_content_shares_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists board_content_shares_set_updated_at on public.board_content_shares;
create trigger board_content_shares_set_updated_at
  before update on public.board_content_shares
  for each row execute function public.touch_board_content_shares_updated_at();

grant select, insert, update on table public.board_content_shares to authenticated;
grant select on table public.board_content_shares to anon;
grant select on table public.board_share_submissions to authenticated;
grant insert on table public.board_share_submissions to anon;
