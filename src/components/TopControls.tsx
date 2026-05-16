import type { ReactNode } from 'react';
import { Redo2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';

interface TopControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (zoom: number) => void;
  /** Napravo jako první pilulka — název souboru + nabídka (před historii). */
  fileMenu?: ReactNode;
  /** Postup úkolu (např. 3 / 8), zobrazí se jako pilulka ve stejné výšce jako historie. */
  taskProgress?: { current: number; total: number } | null;
  className?: string;
}

export function TopControls({
  canUndo,
  canRedo,
  zoom,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  fileMenu = null,
  taskProgress = null,
  className = '',
}: TopControlsProps) {
  return (
    <div className={['top-controls', className].filter(Boolean).join(' ')} aria-label="Soubor a nástroje">
      {fileMenu}
      {taskProgress ? (
        <div className="top-control-pill top-task-progress-pill" aria-label="Aktuální příklad">
          <span className="top-task-progress-pill__text">
            {taskProgress.current} / {taskProgress.total}
          </span>
        </div>
      ) : null}

      <div className="top-control-pill">
        <button
          className="top-control-button"
          type="button"
          title="Zpět (Cmd/Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={17} strokeWidth={2.2} />
        </button>
        <div className="top-control-separator" />
        <button
          className="top-control-button"
          type="button"
          title="Vpřed (Cmd/Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={17} strokeWidth={2.2} />
        </button>
      </div>

      <div className="top-control-pill top-zoom-slider-pill">
        <button className="top-control-button" type="button" title="Oddálit" onClick={onZoomOut}>
          <ZoomOut size={18} strokeWidth={2.2} />
        </button>
        <input
          className="top-zoom-slider"
          type="range"
          min="25"
          max="800"
          step="5"
          value={Math.round(zoom * 100)}
          aria-label="Zoom"
          title={`${Math.round(zoom * 100)} %`}
          onChange={(event) => onZoomChange(Number(event.currentTarget.value) / 100)}
          onDoubleClick={onZoomReset}
        />
        <button className="top-control-button" type="button" title="Přiblížit" onClick={onZoomIn}>
          <ZoomIn size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
