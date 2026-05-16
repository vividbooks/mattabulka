import { type ReactNode, useEffect, useState } from 'react';
import type { DiceSides } from '../lib/boardDice';
import { DICE_SIDE_OPTIONS } from '../lib/boardDice';
import { numberLineBoardGameFigureUrl } from '../lib/numberLineBoardGameFigures';
import type { BeadCounterSettingsDraft, NumberLineSettingsDraft } from './MachineToolSettings';

export type NumberLineFigureChip = { id: string; position: number; color?: string };

export function NumberLineFigureMachineControls(props: {
  figures: NumberLineFigureChip[];
  activeFigureId: string | null;
  rangeStart: number;
  rangeEnd: number;
  onSelectFigure: (figureId: string) => void;
  onAddFigure: () => void;
  onStep: (delta: -1 | 1) => void;
}) {
  const {
    figures,
    activeFigureId,
    rangeStart,
    rangeEnd,
    onSelectFigure,
    onAddFigure,
    onStep,
  } = props;
  const active = figures.find((f) => f.id === activeFigureId) ?? figures[0] ?? null;

  return (
    <div className="machine-number-line-figure-controls" aria-label="Ovládání figurky na číselné ose">
      <span className="machine-number-line-figure-controls-label">Figurka</span>
      <div className="machine-number-line-figure-controls-row">
        {figures.map((figure, index) => (
          <button
            key={figure.id}
            type="button"
            className={figure.id === active?.id ? 'is-active' : ''}
            title={`Figurka ${index + 1}`}
            onClick={() => onSelectFigure(figure.id)}
          >
            <img
              src={numberLineBoardGameFigureUrl(index)}
              alt=""
              className="machine-number-line-figure-thumb"
              draggable={false}
            />
          </button>
        ))}
        {figures.length < 2 ? (
          <button type="button" className="machine-number-line-figure-add" onClick={() => onAddFigure()}>
            <span className="machine-number-line-figure-thumb machine-number-line-figure-thumb--placeholder" aria-hidden>
              +
            </span>
            <span>{figures.length === 0 ? 'Přidat' : '+ druhá'}</span>
          </button>
        ) : null}
      </div>
      <div className="machine-number-line-figure-controls-row machine-number-line-figure-controls-row--steps">
        <button
          type="button"
          aria-label="Posunout figurku doleva"
          disabled={!active || active.position <= rangeStart}
          onClick={() => onStep(-1)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Posunout figurku doprava"
          disabled={!active || active.position >= rangeEnd}
          onClick={() => onStep(1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

/** Sedm předvoleb pro obrázkový vzor (barvy dílů 1–5 a 6–10). */
const BEAD_COUNTER_TEXTURE_COLOR_PRESETS = [
  '#f6c34b',
  '#2368d9',
  '#E34242',
  '#3C8C6C',
  '#A9A3FF',
  '#f97316',
  '#A47B50',
] as const;

function matchesPreset(current: string, preset: string) {
  return current.trim().toLowerCase() === preset.toLowerCase();
}

function clampSpan(start: number, end: number) {
  let s = Math.round(Number(start));
  let e = Math.round(Number(end));
  if (!Number.isFinite(s)) s = 0;
  if (!Number.isFinite(e)) e = s + 1;
  if (e <= s) e = s + 1;
  return { start: s, end: e };
}

export function BeadCounterMachineBottomStrip({
  draft,
  onCommit,
}: {
  draft: BeadCounterSettingsDraft;
  onCommit: (next: BeadCounterSettingsDraft) => void;
}) {
  const [texturePickerOpen, setTexturePickerOpen] = useState<'a' | 'b' | null>(null);

  useEffect(() => {
    if (!texturePickerOpen) return undefined;
    const onDocMouseDown = (event: MouseEvent) => {
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (
        t.closest('.machine-bottom-texture-palette-popover') ||
        t.closest('.machine-bottom-texture-current')
      ) {
        return;
      }
      setTexturePickerOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTexturePickerOpen(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [texturePickerOpen]);

  return (
    <div className="machine-bottom-strip machine-bottom-strip--bead-counter">
      <header className="machine-settings-panel-header">
        <h2 className="machine-settings-panel-title">Korálkové počítadlo</h2>
        <p className="machine-settings-panel-subtitle">Počet korálků, barvy a zobrazení skupin.</p>
      </header>
      <div className="machine-bottom-cluster machine-bottom-field-row">
        <label className="machine-bottom-label machine-bottom-label--control" htmlFor="machine-bead-count">
          Kolik
        </label>
        <select
          id="machine-bead-count"
          className="machine-bottom-select"
          value={draft.beadCount}
          aria-label="Počet korálků"
          onChange={(e) =>
            onCommit({ ...draft, beadCount: e.target.value === '20' ? 20 : 10 })
          }
        >
          <option value={10}>10 korálků</option>
          <option value={20}>20 korálků</option>
        </select>
      </div>

      {draft.useTextures ? (
        <div className="machine-bottom-cluster machine-bottom-cluster--texture-presets">
          <span className="machine-bottom-texture-presets-heading">Barvy vzoru</span>
          <div className="machine-bottom-cluster--texture-presets__current" role="group" aria-label="Barvy obrázkového vzoru">
            <div className="machine-bottom-texture-anchor-wrap">
              <button
                type="button"
                className={`machine-bottom-texture-current${texturePickerOpen === 'a' ? ' is-picker-open' : ''}`}
                aria-label="Barva vzoru pro korálky 1–5"
                aria-expanded={texturePickerOpen === 'a'}
                aria-haspopup="listbox"
                onClick={() => setTexturePickerOpen((p) => (p === 'a' ? null : 'a'))}
              >
                <span
                  className="machine-bottom-texture-current-swatch"
                  style={{ backgroundColor: draft.textureColorA }}
                />
              </button>
              {texturePickerOpen === 'a' ? (
                <div className="machine-bottom-texture-palette-popover" role="listbox">
                  {BEAD_COUNTER_TEXTURE_COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      role="option"
                      aria-selected={matchesPreset(draft.textureColorA, hex)}
                      className={`machine-bottom-preset-swatch${matchesPreset(draft.textureColorA, hex) ? ' is-active' : ''}`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                      aria-label={`Barva ${hex}`}
                      onClick={() => {
                        onCommit({ ...draft, textureColorA: hex });
                        setTexturePickerOpen(null);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="machine-bottom-texture-anchor-wrap">
              <button
                type="button"
                className={`machine-bottom-texture-current${texturePickerOpen === 'b' ? ' is-picker-open' : ''}`}
                aria-label="Barva vzoru pro korálky 6–10"
                aria-expanded={texturePickerOpen === 'b'}
                aria-haspopup="listbox"
                onClick={() => setTexturePickerOpen((p) => (p === 'b' ? null : 'b'))}
              >
                <span
                  className="machine-bottom-texture-current-swatch"
                  style={{ backgroundColor: draft.textureColorB }}
                />
              </button>
              {texturePickerOpen === 'b' ? (
                <div className="machine-bottom-texture-palette-popover" role="listbox">
                  {BEAD_COUNTER_TEXTURE_COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      role="option"
                      aria-selected={matchesPreset(draft.textureColorB, hex)}
                      className={`machine-bottom-preset-swatch${matchesPreset(draft.textureColorB, hex) ? ' is-active' : ''}`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                      aria-label={`Barva ${hex}`}
                      onClick={() => {
                        onCommit({ ...draft, textureColorB: hex });
                        setTexturePickerOpen(null);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!draft.useTextures && !draft.dualStripe ? (
        <div className="machine-bottom-cluster">
          <span className="machine-bottom-label">Korálky</span>
          <label className="machine-bottom-color-pill">
            <input
              type="color"
              value={draft.solidColor}
              onChange={(e) => onCommit({ ...draft, solidColor: e.target.value })}
              aria-label="Barva korálků"
            />
          </label>
        </div>
      ) : null}

      {!draft.useTextures && draft.dualStripe ? (
        <div className="machine-bottom-cluster machine-bottom-cluster--dual">
          <span className="machine-bottom-label">Barvy</span>
          <label className="machine-bottom-color-pill" title="Prvních pět korálků">
            <input
              type="color"
              value={draft.colorA}
              onChange={(e) => onCommit({ ...draft, colorA: e.target.value })}
              aria-label="Barva prvních pěti korálků"
            />
          </label>
          <label className="machine-bottom-color-pill" title="Další pět korálků">
            <input
              type="color"
              value={draft.colorB}
              onChange={(e) => onCommit({ ...draft, colorB: e.target.value })}
              aria-label="Barva druhých pěti korálků"
            />
          </label>
        </div>
      ) : null}

      <label className="machine-bottom-mini-toggle">
        <input
          type="checkbox"
          checked={draft.showGroupCounts}
          onChange={(e) => onCommit({ ...draft, showGroupCounts: e.target.checked })}
        />
        <span>Skupiny</span>
      </label>

      <label className="machine-bottom-mini-toggle">
        <input
          type="checkbox"
          checked={draft.showTotalSum}
          onChange={(e) => onCommit({ ...draft, showTotalSum: e.target.checked })}
        />
        <span>Součet</span>
      </label>
    </div>
  );
}

export function NumberLineMachineBottomStrip({
  draft,
  onCommit,
  figureSlot = null as ReactNode | null,
}: {
  draft: NumberLineSettingsDraft;
  onCommit: (next: NumberLineSettingsDraft) => void;
  /** Levý blok s výběrem figurky a kroky (jen režim s figurkou). */
  figureSlot?: ReactNode | null;
}) {
  return (
    <div className="machine-bottom-strip machine-bottom-strip--number-line">
      {figureSlot ? (
        <>
          <div className="machine-number-line-figure-slot">{figureSlot}</div>
          <span className="machine-number-line-figure-slot-divider" aria-hidden />
        </>
      ) : null}
      <header className="machine-settings-panel-header">
        <h2 className="machine-settings-panel-title">Číselná osa</h2>
        <p className="machine-settings-panel-subtitle">Rozsah, barva osy a čárek.</p>
      </header>
      <div className="machine-bottom-cluster machine-bottom-field-row">
        <span className="machine-bottom-label">Od</span>
        <input
          className="machine-bottom-num"
          type="number"
          value={draft.start}
          aria-label="Začátek osy"
          onChange={(e) => {
            const { start, end } = clampSpan(Number(e.target.value), draft.end);
            onCommit({ ...draft, start, end });
          }}
        />
        <span className="machine-bottom-label">do</span>
        <input
          className="machine-bottom-num"
          type="number"
          value={draft.end}
          aria-label="Konec osy"
          onChange={(e) => {
            const { start, end } = clampSpan(draft.start, Number(e.target.value));
            onCommit({ ...draft, start, end });
          }}
        />
      </div>

      <div className="machine-bottom-cluster">
        <span className="machine-bottom-label">Osa</span>
        <label className="machine-bottom-color-pill">
          <input
            type="color"
            value={draft.accentColor}
            onChange={(e) => onCommit({ ...draft, accentColor: e.target.value })}
            aria-label="Barva osy a čísel"
          />
        </label>
      </div>

      <div className="machine-bottom-cluster">
        <span className="machine-bottom-label">Čárky</span>
        <label className="machine-bottom-color-pill">
          <input
            type="color"
            value={draft.tickFill}
            onChange={(e) => onCommit({ ...draft, tickFill: e.target.value })}
            aria-label="Výplň označení na ose"
          />
        </label>
      </div>
    </div>
  );
}

export type DiceTrayDieDraft = { id: string; sides: DiceSides; value: number };

export function DiceTrayMachineStrip({
  dice,
  defaultSides,
  maxDice = 8,
  onRoll,
  onAddDie,
  onDefaultSidesChange,
  onDieSidesChange,
}: {
  dice: DiceTrayDieDraft[];
  defaultSides: DiceSides;
  maxDice?: number;
  onRoll: () => void;
  onAddDie: () => void;
  onDefaultSidesChange: (sides: DiceSides) => void;
  onDieSidesChange: (dieId: string, sides: DiceSides) => void;
}) {
  const full = dice.length >= maxDice;
  return (
    <div className="machine-bottom-strip machine-bottom-strip--dice-tray">
      <header className="machine-settings-panel-header">
        <h2 className="machine-settings-panel-title">Kostky</h2>
        <p className="machine-settings-panel-subtitle">Hoďte najednou, přidejte kostky a změňte jejich typ.</p>
      </header>
      <div className="machine-bottom-cluster machine-dice-actions">
        <button type="button" className="machine-dice-roll-btn" onClick={() => onRoll()}>
          Hoďit
        </button>
        <button
          type="button"
          className="machine-dice-add-btn"
          disabled={full}
          onClick={() => onAddDie()}
          title={full ? `Maximum ${maxDice} kostek` : undefined}
        >
          + Kostka
        </button>
      </div>
      <div className="machine-bottom-cluster machine-bottom-field-row machine-dice-new-type">
        <label className="machine-bottom-label" htmlFor="machine-dice-new-type">
          Typ nové
        </label>
        <select
          id="machine-dice-new-type"
          className="machine-bottom-select"
          value={defaultSides}
          aria-label="Typ nově přidané kostky"
          onChange={(e) => onDefaultSidesChange(Number(e.target.value) as DiceSides)}
        >
          {DICE_SIDE_OPTIONS.map((o) => (
            <option key={o.sides} value={o.sides}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {dice.length > 0 ? (
        <div className="machine-dice-list" aria-label="Kostky na stole">
          {dice.map((die, index) => (
            <div key={die.id} className="machine-dice-row">
              <span className="machine-dice-row-label">{index + 1}.</span>
              <select
                className="machine-bottom-select machine-bottom-select--compact"
                value={die.sides}
                aria-label={`Změnit typ kostky ${index + 1}`}
                onChange={(e) => onDieSidesChange(die.id, Number(e.target.value) as DiceSides)}
              >
                {DICE_SIDE_OPTIONS.map((o) => (
                  <option key={o.sides} value={o.sides}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="machine-dice-val" aria-hidden>
                → {die.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
