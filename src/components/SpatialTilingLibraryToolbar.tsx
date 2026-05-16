import { RotateCw, Trash2 } from 'lucide-react';
import { getTilePatternWithRotation, TILE_SHAPE_DEFINITIONS } from '../lib/spatialTiling';
import {
  setSpatialTilingDragPayload,
  spatialTilingDragMimeType,
} from '../lib/spatialTilingDragPayload';
import { SpatialTilingLibraryShapeSvg } from './SpatialTilingBoardSvg';

const SHAPE_ORDER = [
  'square',
  'rectangle2',
  'rectangle3',
  'rectangle4',
  'lShape',
  'lShapeBig',
  'tShape',
  'zShape',
  'squareBlock',
  'plus',
  'corner',
  'uShape',
] as const;

/** Velikost buňky v náhledu — při 2 sloupcích zůstane tvar dobře čitelný. */
const LIB_PREVIEW_CELL_PX = 28;

type Props = {
  pick: {
    boardId: string;
    shapeId: string;
    rotation: number;
  };
  onPickShape: (shapeId: string) => void;
  onRotate: () => void;
  /** Smaže všechny položené tvary z aktuální mřížky (deska zůstane). */
  onClearPlacedTiles: () => void;
};

export function SpatialTilingLibraryToolbar({ pick, onPickShape, onRotate, onClearPlacedTiles }: Props) {
  return (
    <div className="spatial-tiling-library-toolbar" aria-label="Tvary dlaždic na mřížce">
      <header className="spatial-tiling-library-toolbar__header">
        <h2 className="spatial-tiling-library-toolbar__title">Dlaždice na mřížce</h2>
        <p className="spatial-tiling-library-toolbar__subtitle">Pokrývání mřížky tvary z knihovny</p>
      </header>
      <div className="spatial-tiling-toolbar-actions spatial-tiling-toolbar-actions--top">
        <button
          type="button"
          draggable={false}
          className="machine-bottom-done spatial-tiling-rotate-btn"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRotate();
          }}
        >
          <RotateCw size={18} strokeWidth={2.2} aria-hidden />
          Otočit tvary (90°)
        </button>
        <button
          type="button"
          draggable={false}
          className="spatial-tiling-clear-btn"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClearPlacedTiles();
          }}
        >
          <Trash2 size={18} strokeWidth={2.2} aria-hidden />
          Vymazat dlaždice
        </button>
      </div>
      <div className="spatial-tiling-shape-grid">
        {SHAPE_ORDER.map((id) => {
          const def = TILE_SHAPE_DEFINITIONS[id];
          const isActive = pick.shapeId === id;
          const pattern = getTilePatternWithRotation(id, pick.rotation);
          const dragRotation = pick.rotation;
          return (
            <button
              key={id}
              type="button"
              draggable
              className={`spatial-tiling-shape-btn${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              title={`${def?.name ?? id} — přetáhni na mřížku`}
              aria-label={def?.name ?? id}
              onClick={() => onPickShape(id)}
              onDragStart={(e) => {
                e.stopPropagation();
                const mime = spatialTilingDragMimeType();
                e.dataTransfer.setData(mime, JSON.stringify({ shapeId: id, rotation: dragRotation }));
                e.dataTransfer.effectAllowed = 'copy';
                setSpatialTilingDragPayload({ shapeId: id, rotation: dragRotation });
              }}
              onDragEnd={() => setSpatialTilingDragPayload(null)}
            >
              <SpatialTilingLibraryShapeSvg
                shapeId={id}
                pattern={pattern}
                cellSize={LIB_PREVIEW_CELL_PX}
                isActive={isActive}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
