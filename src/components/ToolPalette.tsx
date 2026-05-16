import { Hand, MousePointer2, Trash2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** `stamp` = vkládání z připnutého pásu (bez tlačítka v paletě, jen z knihovny). `mathWrite` = jen z připnutého math pásu. */
export type Tool =
  | 'select'
  | 'stamp'
  | 'pan'
  | 'brush'
  | 'highlighter'
  | 'eraser'
  | 'textWrite'
  | 'stickyNote'
  | 'drawShapes'
  | 'mathWrite';

type PaletteToolId = Exclude<
  Tool,
  | 'stamp'
  | 'mathWrite'
  | 'brush'
  | 'textWrite'
  | 'highlighter'
  | 'stickyNote'
  | 'eraser'
  | 'drawShapes'
>;

interface ToolPaletteProps {
  tool: Tool;
  suppressActiveTool?: boolean;
  selectedCount: number;
  /** Počet objektů na plátně (kvůli povolení „Smazat vše“). */
  boardObjectCount: number;
  leadingItem?: ReactNode;
  leadingItemLabel?: string;
  tasksItem?: ReactNode;
  tasksItemLabel?: string;
  libraryItem?: ReactNode;
  libraryItemLabel?: string;
  drawingItem?: ReactNode;
  drawingItemLabel?: string;
  onToolChange: (tool: Tool) => void;
  onDeleteSelection: () => void;
  onClearBoard: () => void;
}

function Separator() {
  return <div className="palette-separator" />;
}

export function ToolPalette({
  tool,
  suppressActiveTool = false,
  selectedCount,
  boardObjectCount,
  leadingItem = null,
  leadingItemLabel,
  tasksItem = null,
  tasksItemLabel,
  libraryItem = null,
  libraryItemLabel,
  drawingItem = null,
  drawingItemLabel,
  onToolChange,
  onDeleteSelection,
  onClearBoard,
}: ToolPaletteProps) {
  const toolButton = (id: PaletteToolId, Icon: LucideIcon, label: string) => {
    const active = !suppressActiveTool && tool === id;
    return (
      <div className="palette-item" key={id}>
        <button
          className={`palette-button${active ? ' is-active' : ''}`}
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={() => onToolChange(id)}
        >
          <Icon size={18} strokeWidth={2.2} />
        </button>
      </div>
    );
  };

  const actionButton = (
    key: string,
    Icon: LucideIcon,
    label: string,
    onClick: () => void,
    disabled = false,
    danger = false,
  ) => (
    <div className="palette-item" key={key}>
      <button
        className={`palette-button ${danger ? 'palette-button-danger' : ''}`}
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon size={18} strokeWidth={2.2} />
      </button>
    </div>
  );

  return (
    <aside className="tool-palette" aria-label="Nástroje nástěnky">
      {leadingItem ? (
        <div className="palette-item palette-item--menu">
          {leadingItem}
          {leadingItemLabel ? <span className="palette-item-label palette-item-label--menu">{leadingItemLabel}</span> : null}
        </div>
      ) : null}
      {toolButton('select', MousePointer2, 'Výběr (V)')}
      {toolButton('pan', Hand, 'Move / posun plátna (H)')}
      {libraryItem ? (
        <div className="palette-item palette-item--library">
          {libraryItem}
          {libraryItemLabel ? <span className="palette-item-label palette-item-label--library">{libraryItemLabel}</span> : null}
        </div>
      ) : null}
      {drawingItem ? (
        <div className="palette-item palette-item--drawing">
          {drawingItem}
          {drawingItemLabel ? (
            <span className="palette-item-label palette-item-label--drawing">{drawingItemLabel}</span>
          ) : null}
        </div>
      ) : null}
      {tasksItem ? (
        <div className="palette-item palette-item--tasks">
          {tasksItem}
          {tasksItemLabel ? <span className="palette-item-label palette-item-label--tasks">{tasksItemLabel}</span> : null}
        </div>
      ) : null}
      <Separator />
      {actionButton(
        'delete',
        Trash2,
        selectedCount > 0 ? `Smazat výběr (${selectedCount})` : 'Smazat vše',
        () => {
          if (selectedCount > 0) {
            onDeleteSelection();
          } else {
            onClearBoard();
          }
        },
        selectedCount === 0 && boardObjectCount === 0,
        true,
      )}
    </aside>
  );
}
