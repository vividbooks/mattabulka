import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardDocumentV1 } from './boardDocument';

/** Srozumitelná hláška, když migrace živých místností ještě není na projektu nasazená. */
export function mapBoardLiveSetupError(message: string | undefined): string {
  const m = message ?? '';
  if (
    m.includes('board_live_sessions') ||
    m.includes('schema cache') ||
    /relation.*board_live_sessions.*does not exist/i.test(m)
  ) {
    return 'Živá místnost potřebuje tabulku v Supabase. V Dashboardu otevři SQL Editor, vlož a spusť obsah souboru supabase/migrations/20260514220000_board_live_sessions.sql (nebo z terminálu: supabase db push). Pak zkus znovu.';
  }
  return m || 'Nepodařilo se dokončit operaci se živou místností.';
}

export type BoardLiveSessionRow = {
  id: string;
  owner_id: string;
  board_file_id: string | null;
  room_token: string;
  title: string;
  document: BoardDocumentV1;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function liveSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const LIVE_PEER_STORAGE = 'ma-board-live-peer-id';
const LIVE_NAME_STORAGE = 'ma-live-display-name';

export function boardLiveSessionUrl(token: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#live=${encodeURIComponent(token)}`;
}

export function getOrCreateLivePeerId(): string {
  try {
    const existing = sessionStorage.getItem(LIVE_PEER_STORAGE);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(LIVE_PEER_STORAGE, id);
    return id;
  } catch {
    return `peer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function getStoredLiveDisplayName(): string {
  try {
    return localStorage.getItem(LIVE_NAME_STORAGE)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setStoredLiveDisplayName(name: string): void {
  try {
    localStorage.setItem(LIVE_NAME_STORAGE, name.trim());
  } catch {
    /* noop */
  }
}

export function liveRealtimeChannelName(token: string): string {
  return `board-live:${token}`;
}

export async function createBoardLiveSession(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    boardFileId?: string | null;
    title: string;
    document: BoardDocumentV1;
  },
): Promise<{ ok: true; session: BoardLiveSessionRow } | { ok: false; error: string }> {
  const row = {
    owner_id: input.ownerId,
    board_file_id: input.boardFileId ?? null,
    room_token: liveSessionToken(),
    title: input.title.trim() || 'Živá místnost',
    document: input.document,
  };
  const { data, error } = await supabase
    .from('board_live_sessions')
    .insert(row)
    .select('id,owner_id,board_file_id,room_token,title,document,is_active,created_at,updated_at')
    .single();
  if (error || !data) {
    return { ok: false, error: mapBoardLiveSetupError(error?.message) };
  }
  return { ok: true, session: data as BoardLiveSessionRow };
}

export async function getBoardLiveSessionByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<{ ok: true; session: BoardLiveSessionRow } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('get_board_live_session_by_token', {
    p_token: decodeURIComponent(token),
  });
  if (error) return { ok: false, error: mapBoardLiveSetupError(error.message) };
  if (data == null) {
    return { ok: false, error: 'Místnost neexistuje nebo už není aktivní.' };
  }
  return {
    ok: true,
    session: data as unknown as BoardLiveSessionRow,
  };
}

export async function updateBoardLiveSessionDocument(
  supabase: SupabaseClient,
  sessionId: string,
  document: BoardDocumentV1,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('board_live_sessions')
    .update({ document })
    .eq('id', sessionId);
  if (error) return { ok: false, error: mapBoardLiveSetupError(error.message) };
  return { ok: true };
}
