-- Živá spolupráce: snapshot v DB + Realtime Broadcast v aplikaci (kanál podle tajného tokenu).

create table if not exists public.board_live_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  board_file_id uuid references public.board_files (id) on delete set null,
  room_token text not null unique,
  title text not null,
  document jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_live_sessions_owner_updated_idx
  on public.board_live_sessions (owner_id, updated_at desc);
create index if not exists board_live_sessions_token_idx
  on public.board_live_sessions (room_token);

alter table public.board_live_sessions enable row level security;

drop policy if exists "board_live_sessions_owner_select" on public.board_live_sessions;
create policy "board_live_sessions_owner_select" on public.board_live_sessions
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "board_live_sessions_owner_insert" on public.board_live_sessions;
create policy "board_live_sessions_owner_insert" on public.board_live_sessions
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "board_live_sessions_owner_update" on public.board_live_sessions;
create policy "board_live_sessions_owner_update" on public.board_live_sessions
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "board_live_sessions_owner_delete" on public.board_live_sessions;
create policy "board_live_sessions_owner_delete" on public.board_live_sessions
  for delete to authenticated using (owner_id = auth.uid());

grant select, insert, update, delete on table public.board_live_sessions to authenticated;

create or replace function public.touch_board_live_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists board_live_sessions_set_updated_at on public.board_live_sessions;
create trigger board_live_sessions_set_updated_at
  before update on public.board_live_sessions
  for each row execute function public.touch_board_live_sessions_updated_at();

-- Student bez přihlášení: initial load podle tokenu (stejný model jako veřejné task share).
create or replace function public.get_board_live_session_by_token(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select to_jsonb(s)
  from public.board_live_sessions s
  where s.room_token = p_token
    and s.is_active = true
  limit 1;
$$;

grant execute on function public.get_board_live_session_by_token(text) to anon, authenticated;
