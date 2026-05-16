-- Zadávání vyhodnotitelných úkolů studentům: učitel vytvoří veřejný token,
-- student otevře snapshot úkolu, vyřeší aktivity a odevzdá dokument se skóre.

create table if not exists public.board_task_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  board_file_id uuid references public.board_files (id) on delete set null,
  token text not null unique,
  title text not null,
  document jsonb not null,
  task_kind text not null check (task_kind in ('arithmetic', 'sequence', 'domino', 'mixed')),
  task_settings jsonb,
  assignment_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_task_shares_owner_updated_idx
  on public.board_task_shares (owner_id, updated_at desc);
create index if not exists board_task_shares_token_idx
  on public.board_task_shares (token);

alter table public.board_task_shares enable row level security;

drop policy if exists "board_task_shares_owner_select" on public.board_task_shares;
create policy "board_task_shares_owner_select" on public.board_task_shares
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "board_task_shares_owner_insert" on public.board_task_shares;
create policy "board_task_shares_owner_insert" on public.board_task_shares
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "board_task_shares_owner_update" on public.board_task_shares;
create policy "board_task_shares_owner_update" on public.board_task_shares
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "board_task_shares_public_read_active" on public.board_task_shares;
create policy "board_task_shares_public_read_active" on public.board_task_shares
  for select to anon using (is_active);

create table if not exists public.board_task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_share_id uuid not null references public.board_task_shares (id) on delete cascade,
  student_name text not null,
  document jsonb not null,
  score jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists board_task_submissions_share_created_idx
  on public.board_task_submissions (task_share_id, created_at desc);

alter table public.board_task_submissions enable row level security;

drop policy if exists "board_task_submissions_teacher_select" on public.board_task_submissions;
create policy "board_task_submissions_teacher_select" on public.board_task_submissions
  for select to authenticated using (
    exists (
      select 1
      from public.board_task_shares s
      where s.id = task_share_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "board_task_submissions_public_insert_active" on public.board_task_submissions;
create policy "board_task_submissions_public_insert_active" on public.board_task_submissions
  for insert to anon with check (
    length(trim(student_name)) between 1 and 80
    and jsonb_typeof(score) = 'object'
    and exists (
      select 1
      from public.board_task_shares s
      where s.id = task_share_id and s.is_active
    )
  );

create or replace function public.touch_board_task_shares_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists board_task_shares_set_updated_at on public.board_task_shares;
create trigger board_task_shares_set_updated_at
  before update on public.board_task_shares
  for each row execute function public.touch_board_task_shares_updated_at();

grant select, insert, update on table public.board_task_shares to authenticated;
grant select on table public.board_task_shares to anon;
grant select on table public.board_task_submissions to authenticated;
grant insert on table public.board_task_submissions to anon;
