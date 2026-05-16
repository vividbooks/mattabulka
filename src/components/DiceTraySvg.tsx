import type { DiceSides } from '../lib/boardDice';
import { clampDiceValue } from '../lib/boardDice';

/** Jedna položka pro vykreslení - odlišná od dokumentového objektu `DiceTrayDie`. */
export type DiceTrayDieView = {
  id: string;
  sides: DiceSides;
  value: number;
};

export type DiceTrayViewModel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dice: DiceTrayDieView[];
  accent?: string;
  accentColor?: string;
};

const PAD = 14;
const CELL_W = 82;
const CELL_H = 96;
const GAP = 12;
const DIE_3D_SIZE = 58;

function layoutDice(trayW: number, trayH: number, count: number) {
  const innerW = Math.max(40, trayW - PAD * 2);
  const innerH = Math.max(40, trayH - PAD * 2);
  const cols = Math.max(1, Math.min(count, Math.floor((innerW + GAP) / (CELL_W + GAP))));
  const rows = Math.max(1, Math.ceil(count / cols));
  const gridW = cols * CELL_W + (cols - 1) * GAP;
  const gridH = rows * CELL_H + (rows - 1) * GAP;
  const ox = PAD + Math.max(0, (innerW - gridW) / 2);
  const oy = PAD + Math.max(0, (innerH - gridH) / 2);
  const positions: { cx: number; cy: number }[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      cx: ox + col * (CELL_W + GAP) + CELL_W / 2,
      cy: oy + row * (CELL_H + GAP) + CELL_H * 0.54,
    });
  }
  return positions;
}

function d6FacePips(value: number): number[] {
  switch (clampDiceValue(value, 6)) {
    case 1:
      return [5];
    case 2:
      return [1, 9];
    case 3:
      return [1, 5, 9];
    case 4:
      return [1, 3, 7, 9];
    case 5:
      return [1, 3, 5, 7, 9];
    case 6:
      return [1, 3, 4, 6, 7, 9];
    default:
      return [5];
  }
}

function Dice3DFace({
  kind,
  value,
  sides,
}: {
  kind: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom';
  value?: number;
  sides: DiceSides;
}) {
  const showValue = value !== undefined;
  const pips = showValue && sides === 6 ? d6FacePips(value) : [];
  const label = showValue && sides !== 6 ? clampDiceValue(value, sides) : null;

  return (
    <div className={`dice3d-face dice3d-face--${kind}`}>
      {pips.length > 0 ? (
        <span className="dice3d-pip-grid" aria-hidden>
          {Array.from({ length: 9 }, (_, index) => (
            <span
              key={index}
              className={`dice3d-pip-slot${pips.includes(index + 1) ? ' has-pip' : ''}`}
            />
          ))}
        </span>
      ) : null}
      {label !== null ? <span className="dice3d-label">{label}</span> : null}
    </div>
  );
}

function Dice3D({
  dieId,
  sides,
  value,
  rollAnimKey,
  index,
}: {
  dieId: string;
  sides: DiceSides;
  value: number;
  rollAnimKey: number;
  index: number;
}) {
  const v = clampDiceValue(value, sides);
  const inertFace = sides === 6 ? undefined : Math.min(v + 1, sides);
  const rotateSeed = dieId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index * 37;
  const restingStyle = {
    '--dice-rx': `${-18 + (rotateSeed % 7)}deg`,
    '--dice-ry': `${31 + (rotateSeed % 9)}deg`,
    '--dice-rz': `${-5 + (rotateSeed % 5)}deg`,
    '--dice-delay': `${index * 46}ms`,
  } as React.CSSProperties;

  return (
    <div className="dice3d-stage" style={restingStyle}>
      <div
        key={rollAnimKey > 0 ? `roll-${rollAnimKey}-${dieId}` : `idle-${dieId}`}
        className={`dice3d-cube${rollAnimKey > 0 ? ' is-rolling' : ''}`}
      >
        <Dice3DFace kind="front" value={v} sides={sides} />
        <Dice3DFace kind="back" value={inertFace} sides={sides} />
        <Dice3DFace kind="right" value={sides === 6 ? 2 : undefined} sides={sides} />
        <Dice3DFace kind="left" value={sides === 6 ? 5 : undefined} sides={sides} />
        <Dice3DFace kind="top" value={sides === 6 ? 3 : undefined} sides={sides} />
        <Dice3DFace kind="bottom" value={sides === 6 ? 4 : undefined} sides={sides} />
      </div>
    </div>
  );
}

export function DiceTraySvg({
  tray,
  selected,
  rollAnimKey = 0,
}: {
  tray: DiceTrayViewModel;
  selected: boolean;
  /** Zvýší se po hodu - spustí krátkou 3D animaci na kostkách. */
  rollAnimKey?: number;
}) {
  const accent = tray.accent ?? tray.accentColor ?? '#221d6e';
  const bg = '#fcf4e9';
  const positions = layoutDice(tray.width, tray.height, tray.dice.length);

  return (
    <g transform={`translate(${tray.x} ${tray.y})`} className="dice-tray-root">
      <defs>
        <filter id={`dice-tray-soft-${tray.id}`} x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx={0} dy={4} stdDeviation={4} floodColor="#1e1b4b" floodOpacity={0.14} />
        </filter>
      </defs>
      <rect
        x={0}
        y={0}
        width={tray.width}
        height={tray.height}
        rx={18}
        ry={18}
        fill={bg}
        stroke={accent}
        strokeWidth={selected ? 3 : 2}
        opacity={0.98}
        filter={`url(#dice-tray-soft-${tray.id})`}
      />
      {tray.dice.map((die, index) => {
        const pos = positions[index];
        if (!pos) return null;
        return (
          <foreignObject
            key={die.id}
            x={pos.cx - CELL_W / 2}
            y={pos.cy - CELL_H / 2}
            width={CELL_W}
            height={CELL_H}
            style={{ overflow: 'visible', pointerEvents: 'none' }}
          >
            <div className="dice3d-foreign">
              <Dice3D
                dieId={`${tray.id}-${die.id}`}
                sides={die.sides}
                value={die.value}
                rollAnimKey={rollAnimKey}
                index={index}
              />
            </div>
          </foreignObject>
        );
      })}
    </g>
  );
}

export const diceTray3dSize = DIE_3D_SIZE;
