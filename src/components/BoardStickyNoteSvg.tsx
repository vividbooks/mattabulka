import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import type { StickyNoteObject } from './boardStickyTypes';
import type { Tool } from './ToolPalette';

type BoardStickyNoteSvgProps = {
  object: StickyNoteObject;
  selected: boolean;
  editing: boolean;
  /** Nástroj z palety — u vybraných režimů neblokovat tah/pan tím, že bychom zastavili bublinění z lístečku. */
  boardTool: Tool;
  onContentLive: (content: string) => void;
  onContentCommit: () => void;
  onRequestEdit: () => void;
  /** Klik na tělo lístečku (výběr / tažení) — zastaví bublinění na SVG, aby šel dvojklik a textarea. */
  onBodyPointerDown: (event: React.PointerEvent<HTMLElement>, id: string) => void;
};

function borderRadiusForShape(shape: StickyNoteObject['shape']): string {
  if (shape === 'circle') return '50%';
  if (shape === 'rounded') return '12px';
  return '0';
}

export function BoardStickyNoteSvg({
  object,
  selected,
  editing,
  boardTool,
  onContentLive,
  onContentCommit,
  onRequestEdit,
  onBodyPointerDown,
}: BoardStickyNoteSvgProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) return;
    const id = requestAnimationFrame(() => taRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [editing]);

  const br = borderRadiusForShape(object.shape);

  return (
    <g>
      <foreignObject
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        className="board-sticky-foreign"
        pointerEvents="auto"
      >
        <div
          className={`board-sticky-root${selected ? ' board-sticky-root--selected' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            backgroundColor: object.color,
            borderRadius: br,
            boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.95), 0 6px 18px rgba(30, 27, 75, 0.18)' : '0 4px 14px rgba(30, 27, 75, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            pointerEvents: 'auto',
          }}
          onPointerDown={(e) => {
            if (object.locked) return;
            if (editing && (e.target as HTMLElement).tagName === 'TEXTAREA') {
              e.stopPropagation();
              return;
            }
            if ((e.target as HTMLElement).closest('a.board-sticky-link')) return;

            const passThroughToSvg =
              boardTool === 'brush' ||
              boardTool === 'highlighter' ||
              boardTool === 'eraser' ||
              boardTool === 'drawShapes' ||
              boardTool === 'pan' ||
              boardTool === 'stamp' ||
              boardTool === 'mathWrite' ||
              boardTool === 'textWrite';

            if (passThroughToSvg) return;

            e.stopPropagation();
            onBodyPointerDown(e, object.id);
          }}
          onDoubleClick={(e) => {
            if (object.locked) return;
            e.stopPropagation();
            onRequestEdit();
          }}
        >
          {object.linkUrl ? (
            <a
              href={object.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="board-sticky-link"
              title="Otevřít odkaz"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} strokeWidth={2.2} />
            </a>
          ) : null}
          {editing ? (
            <textarea
              ref={taRef}
              className="board-sticky-textarea"
              value={object.content}
              placeholder="Text na lístečku…"
              onChange={(e) => onContentLive(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={() => onContentCommit()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                }
              }}
              style={{
                flex: 1,
                minHeight: 0,
                border: 'none',
                resize: 'none',
                outline: 'none',
                background: 'transparent',
                padding: '14px 12px',
                fontFamily: 'var(--font-app, Inter, system-ui, sans-serif)',
                fontSize: object.fontSize,
                fontWeight: object.fontWeight,
                color: '#1e1b4b',
                lineHeight: 1.35,
                textAlign: 'center',
              }}
            />
          ) : (
            <div
              className="board-sticky-display"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 12px',
                fontFamily: 'var(--font-app, Inter, system-ui, sans-serif)',
                fontSize: object.fontSize,
                fontWeight: object.fontWeight,
                color: '#1e1b4b',
                lineHeight: 1.35,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              {object.content ? (
                object.content
              ) : (
                <span style={{ opacity: 0.45, fontStyle: 'italic' }}>Dvojklik — upravit text</span>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
