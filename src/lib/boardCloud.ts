import type { SupabaseClient } from '@supabase/supabase-js';

export const BOARD_STORAGE_BUCKET = 'board-documents' as const;

export type BoardFileRow = {
  id: string;
  user_id: string;
  title: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

export function boardObjectStoragePath(userId: string, fileId: string): string {
  return `${userId}/${fileId}.mnboard`;
}

export async function listBoardFiles(supabase: SupabaseClient): Promise<{
  ok: true;
  files: BoardFileRow[];
} | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('board_files')
    .select('id,user_id,title,storage_path,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, files: (data ?? []) as BoardFileRow[] };
}

export async function downloadBoardJsonFromStorage(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.storage.from(BOARD_STORAGE_BUCKET).download(storagePath);
  if (error || !data) return { ok: false, error: error?.message ?? 'Stažení se nepodařilo.' };
  try {
    const text = await data.text();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Chyba při čtení souboru.' };
  }
}

/**
 * Nový soubor: bez fileId vytvoří řádek + nahraje blob.
 * Aktualizace: předaj stejné fileId — updatne title a přepíše objekt ve Storage.
 */
export async function saveBoardDocumentToCloud(
  supabase: SupabaseClient,
  userId: string,
  json: string,
  options: { fileId?: string | null; title: string },
): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const title = options.title.trim() || 'Nástěnka';
  const isUpdate = Boolean(options.fileId);
  const fileId = options.fileId ?? crypto.randomUUID();
  const path = boardObjectStoragePath(userId, fileId);
  const body = new Blob([json], { type: 'application/json;charset=utf-8' });

  if (!isUpdate) {
    const { error: insErr } = await supabase.from('board_files').insert({
      id: fileId,
      user_id: userId,
      title,
      storage_path: path,
    });
    if (insErr) return { ok: false, error: insErr.message };
  } else {
    const { error: updErr } = await supabase
      .from('board_files')
      .update({ title })
      .eq('id', fileId)
      .eq('user_id', userId);
    if (updErr) return { ok: false, error: updErr.message };
  }

  const { error: upErr } = await supabase.storage.from(BOARD_STORAGE_BUCKET).upload(path, body, {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '0',
  });

  if (upErr) {
    if (!isUpdate) {
      await supabase.from('board_files').delete().eq('id', fileId).eq('user_id', userId);
    }
    return { ok: false, error: upErr.message };
  }

  return { ok: true, fileId };
}
