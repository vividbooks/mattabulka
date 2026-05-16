import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Paintbrush } from 'lucide-react';
import {
  MATH_GLYPH_INK_PRESETS,
  MATH_GLYPH_PILL_BG_PRESETS,
  type MathGlyphStripStyle,
} from '../lib/mathGlyphStripStyle';

function colorMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function MathGlyphStripStyleControl({
  style,
  onChange,
}: {
  style: MathGlyphStripStyle;
  onChange: (next: MathGlyphStripStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) {
      setPopoverStyle({});
      return undefined;
    }

    const anchor = wrapRef.current;
    const pop = popoverRef.current;
    if (!anchor || !pop) return undefined;

    const position = () => {
      const ar = anchor.getBoundingClientRect();
      const pr = pop.getBoundingClientRect();
      const gap = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceAbove = ar.top;
      const spaceBelow = vh - ar.bottom;
      const placeAbove = spaceAbove >= pr.height + gap || spaceAbove >= spaceBelow;

      let top = placeAbove ? ar.top - pr.height - gap : ar.bottom + gap;
      let left = ar.left;
      top = Math.max(8, Math.min(top, vh - pr.height - 8));
      left = Math.max(8, Math.min(left, vw - pr.width - 8));

      setPopoverStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 10050,
      });
    };

    /* První snímek po mountu může mít ještě nulovou výšku — přepočet hned po layoutu. */
    requestAnimationFrame(() => {
      position();
      requestAnimationFrame(position);
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(position) : null;
    if (ro) ro.observe(pop);
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);
    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (event: MouseEvent) => {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const popoverReady = open && 'top' in popoverStyle && 'left' in popoverStyle;

  const hasPillFill = style.pillBackground !== 'transparent';

  const popover =
    open && typeof document !== 'undefined' ? (
      <div
        ref={popoverRef}
        className="math-strip-style-popover"
        style={{
          position: 'fixed',
          zIndex: 10050,
          maxHeight: 'min(70vh, 420px)',
          overflowY: 'auto',
          opacity: popoverReady ? 1 : 0,
          pointerEvents: popoverReady ? 'auto' : 'none',
          ...popoverStyle,
        }}
        role="dialog"
        aria-label="Nastavení vzhledu glyfů"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="math-strip-style-popover__section">
          <span className="math-strip-style-popover__heading">Barevnost</span>
          <div className="math-strip-style-popover__swatches" role="group" aria-label="Barva čáry a textu">
            {MATH_GLYPH_INK_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`machine-bottom-preset-swatch${colorMatch(style.inkColor, hex) ? ' is-active' : ''}`}
                style={{ backgroundColor: hex }}
                title={hex}
                aria-label={`Barva ${hex}`}
                aria-pressed={colorMatch(style.inkColor, hex)}
                onClick={() => onChange({ ...style, inkColor: hex })}
              />
            ))}
          </div>
        </div>

        <div className="math-strip-style-popover__section">
          <span className="math-strip-style-popover__heading">Pozadí</span>
          <div className="math-strip-style-popover__bg-actions">
            <button
              type="button"
              className={`math-strip-style-popover__pill-btn${style.pillBackground === 'transparent' ? ' is-active' : ''}`}
              aria-pressed={style.pillBackground === 'transparent'}
              onClick={() => onChange({ ...style, pillBackground: 'transparent' })}
            >
              Průhledné
            </button>
            {hasPillFill ? (
              <div className="math-strip-style-popover__shape-inline" role="group" aria-label="Tvar rámečku">
                <button
                  type="button"
                  className={`math-strip-style-popover__font-choice${style.pillShape === 'round' ? ' is-active' : ''}`}
                  aria-pressed={style.pillShape === 'round'}
                  onClick={() => onChange({ ...style, pillShape: 'round' })}
                >
                  Kolečko
                </button>
                <button
                  type="button"
                  className={`math-strip-style-popover__font-choice${style.pillShape === 'square' ? ' is-active' : ''}`}
                  aria-pressed={style.pillShape === 'square'}
                  onClick={() => onChange({ ...style, pillShape: 'square' })}
                >
                  Čtvereček
                </button>
              </div>
            ) : null}
          </div>
          <div className="math-strip-style-popover__swatches" role="group" aria-label="Barva pozadí pilulky">
            {MATH_GLYPH_PILL_BG_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`machine-bottom-preset-swatch${typeof style.pillBackground === 'string' && colorMatch(style.pillBackground, hex) ? ' is-active' : ''}`}
                style={{ backgroundColor: hex }}
                title={hex}
                aria-label={`Pozadí ${hex}`}
                aria-pressed={typeof style.pillBackground === 'string' && colorMatch(style.pillBackground, hex)}
                onClick={() => onChange({ ...style, pillBackground: hex })}
              />
            ))}
          </div>
          <p className="math-strip-style-popover__hint">
            U <strong>Průhledné</strong> se vykreslí jen text bez rámečku a obrysu.
          </p>
        </div>

        <div className="math-strip-style-popover__section">
          <span className="math-strip-style-popover__heading">Font</span>
          <div className="math-strip-style-popover__font-toggle math-strip-style-popover__font-toggle--preview" role="group" aria-label="Typ písma">
            <button
              type="button"
              className={`math-strip-style-popover__font-choice math-strip-style-popover__font-choice--sample${style.fontVariant === 'printed' ? ' is-active' : ''}`}
              aria-pressed={style.fontVariant === 'printed'}
              aria-label="Tiskací písmo"
              onClick={() => onChange({ ...style, fontVariant: 'printed' })}
            >
              <span className="math-strip-style-popover__font-preview math-strip-style-popover__font-preview--printed" aria-hidden="true">
                123
              </span>
            </button>
            <button
              type="button"
              className={`math-strip-style-popover__font-choice math-strip-style-popover__font-choice--sample${style.fontVariant === 'script' ? ' is-active' : ''}`}
              aria-pressed={style.fontVariant === 'script'}
              aria-label="Psací písmo"
              onClick={() => onChange({ ...style, fontVariant: 'script' })}
            >
              <span className="math-strip-style-popover__font-preview math-strip-style-popover__font-preview--script" aria-hidden="true">
                123
              </span>
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="math-strip-style-anchor" ref={wrapRef}>
      <button
        type="button"
        className={`pinned-sticker-button pinned-math-style-btn is-icon-only${open ? ' is-open' : ''}`}
        title="Barevnost, pozadí a písmo čísel a znamének"
        aria-label="Vzhled čísel a znamének"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Paintbrush size={20} strokeWidth={2.2} className="pinned-math-style-icon" aria-hidden />
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
