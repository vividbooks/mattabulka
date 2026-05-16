import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import { listBoardFiles, downloadBoardJsonFromStorage, type BoardFileRow } from '../lib/boardCloud';
import { parseBoardDocumentJson, type BoardDocumentV1 } from '../lib/boardDocument';

type BoardCloudModalProps = {
  open: boolean;
  supabase: SupabaseClient;
  onClose: () => void;
  onOpenDocument: (doc: BoardDocumentV1, meta: { title: string; cloudFileId: string }) => void;
};

export function BoardCloudModal({ open, supabase, onClose, onOpenDocument }: BoardCloudModalProps) {
  const [files, setFiles] = useState<BoardFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await listBoardFiles(supabase);
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setFiles([]);
      return;
    }
    setFiles(r.files);
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  const pick = useCallback(
    async (row: BoardFileRow) => {
      setError(null);
      const down = await downloadBoardJsonFromStorage(supabase, row.storage_path);
      if (!down.ok) {
        setError(down.error);
        return;
      }
      const parsed = parseBoardDocumentJson(down.text);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      onOpenDocument(parsed.doc, { title: row.title, cloudFileId: row.id });
      onClose();
    },
    [supabase, onOpenDocument, onClose],
  );

  if (!open) return null;

  return (
    <div className="board-cloud-modal-root" role="presentation">
      <button type="button" className="board-cloud-modal__backdrop" aria-label="Zavřít" onClick={onClose} />
      <div className="board-cloud-modal" role="dialog" aria-modal="true" aria-labelledby="board-cloud-title">
        <div className="board-cloud-modal__head">
          <h2 id="board-cloud-title" className="board-cloud-modal__title">
            Soubory v cloudu
          </h2>
          <button type="button" className="board-cloud-modal__close" onClick={onClose} aria-label="Zavřít">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
        {loading ? <p className="board-cloud-modal__hint">Načítám…</p> : null}
        {error ? <p className="board-cloud-modal__error">{error}</p> : null}
        <ul className="board-cloud-modal__list">
          {files.map((f) => (
            <li key={f.id}>
              <button type="button" className="board-cloud-modal__row" onClick={() => void pick(f)}>
                <span className="board-cloud-modal__name">{f.title}</span>
                <span className="board-cloud-modal__meta">
                  {new Date(f.updated_at).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {files.length === 0 && !loading ? (
          <p className="board-cloud-modal__hint">Zatím žádné soubory — použij „Uložit do cloudu“.</p>
        ) : null}
      </div>
    </div>
  );
}
