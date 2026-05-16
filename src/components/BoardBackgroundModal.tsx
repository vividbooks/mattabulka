import { X } from 'lucide-react';
import type { BoardBackgroundPattern, BoardBackgroundSettings } from '../lib/boardDocument';

const COLORS = ['#faf3d4', '#ffffff', '#f8fafc', '#fef9c3', '#dbeafe', '#dcfce7', '#fee2e2', '#f3e8ff'];

const PATTERNS: Array<{ value: BoardBackgroundPattern; label: string }> = [
  { value: 'blank', label: 'Čisté' },
  { value: 'dots', label: 'Tečky' },
  { value: 'denseDots', label: 'Husté tečky' },
  { value: 'grid', label: 'Čtverečky' },
  { value: 'largeGrid', label: 'Velké čtverce' },
  { value: 'lines', label: 'Linky' },
  { value: 'wideLines', label: 'Široké linky' },
  { value: 'notebook', label: 'Sešit' },
  { value: 'crosses', label: 'Křížky' },
  { value: 'isometric', label: 'Izometrie' },
];

type Props = {
  open: boolean;
  value: BoardBackgroundSettings;
  onChange: (next: BoardBackgroundSettings) => void;
  onClose: () => void;
};

export function BoardBackgroundModal({ open, value, onChange, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="board-cloud-modal-root" role="presentation">
      <button type="button" className="board-cloud-modal__backdrop" aria-label="Zavřít" onClick={onClose} />
      <div className="board-cloud-modal board-settings-modal" role="dialog" aria-modal="true" aria-labelledby="board-background-title">
        <div className="board-cloud-modal__head">
          <h2 id="board-background-title" className="board-cloud-modal__title">
            Pozadí nástěnky
          </h2>
          <button type="button" className="board-cloud-modal__close" onClick={onClose} aria-label="Zavřít">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
        <div className="board-settings-modal__body">
          <section className="board-settings-modal__section">
            <h3>Pozadí</h3>
          <label className="board-settings-modal__label">
            Barva pozadí
            <input
              type="color"
              className="board-settings-modal__color-input"
              value={value.color}
              onChange={(event) => onChange({ ...value, color: event.target.value })}
            />
          </label>
          <div className="board-settings-modal__swatches" aria-label="Předvolby barev">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`board-settings-modal__swatch${value.color.toLowerCase() === color ? ' is-active' : ''}`}
                style={{ background: color }}
                aria-label={`Nastavit barvu ${color}`}
                onClick={() => onChange({ ...value, color })}
              />
            ))}
          </div>
          <div className="board-settings-modal__label">Vzor</div>
          <div className="board-settings-modal__pattern-grid">
            {PATTERNS.map((pattern) => (
              <button
                key={pattern.value}
                type="button"
                className={`board-settings-modal__pattern board-bg-pattern--${pattern.value}${value.pattern === pattern.value ? ' is-active' : ''}`}
                style={{ backgroundColor: value.color }}
                onClick={() => onChange({ ...value, pattern: pattern.value })}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          </section>
        </div>
      </div>
    </div>
  );
}
