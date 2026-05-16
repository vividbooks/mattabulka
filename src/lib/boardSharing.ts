import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardDocumentV1 } from './boardDocument';

export type BoardContentShareRow = {
  id: string;
  owner_id: string;
  board_file_id: string | null;
  token: string;
  title: string;
  document: BoardDocumentV1;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BoardShareSubmissionRow = {
  id: string;
  share_id: string;
  student_name: string;
  document: BoardDocumentV1;
  created_at: string;
};

function shareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function boardShareUrl(token: string) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#share=${encodeURIComponent(token)}`;
}

export async function createBoardContentShare(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    boardFileId?: string | null;
    title: string;
    document: BoardDocumentV1;
  },
): Promise<{ ok: true; share: BoardContentShareRow } | { ok: false; error: string }> {
  const row = {
    owner_id: input.ownerId,
    board_file_id: input.boardFileId ?? null,
    token: shareToken(),
    title: input.title.trim() || 'Nástěnka',
    document: input.document,
  };
  const { data, error } = await supabase
    .from('board_content_shares')
    .insert(row)
    .select('id,owner_id,board_file_id,token,title,document,is_active,created_at,updated_at')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Sdílení se nepodařilo vytvořit.' };
  return { ok: true, share: data as BoardContentShareRow };
}

export async function getBoardContentShareByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<{ ok: true; share: BoardContentShareRow } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('board_content_shares')
    .select('id,owner_id,board_file_id,token,title,document,is_active,created_at,updated_at')
    .eq('token', token)
    .eq('is_active', true)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Sdílený dokument se nepodařilo načíst.' };
  return { ok: true, share: data as BoardContentShareRow };
}

export async function submitBoardShare(
  supabase: SupabaseClient,
  input: {
    shareId: string;
    studentName: string;
    document: BoardDocumentV1;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('board_share_submissions').insert({
    share_id: input.shareId,
    student_name: input.studentName.trim(),
    document: input.document,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
