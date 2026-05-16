/**
 * Vizualizace domina z Vividbooks minihry (`DominoGame.tsx`) — viewBox 595×298,
 * pozice teček a „díry“ jako v překryvném SVG.
 */
export const VIVID_DOMINO_ACCENT = '#4e5871';
export const VIVID_DOMINO_CARD_BG = '#F5E6D0';
/** Stažený asset ze stejného URL jako minihra (Supabase). */
export const VIVID_DOMINO_TILE_ARTWORK = '/domino-tile-vividbooks.svg';

export const VIVID_DOMINO_VIEW_W = 595;
export const VIVID_DOMINO_VIEW_H = 298;

/** Offsety středu teček od středu poloviny (% stejně jako v DominoGame.generateDicePattern). */
const DICE_OFFSET_PX: Record<number, [number, number][]> = {
  0: [],
  1: [[0, 0]],
  2: [
    [-30, -30],
    [30, 30],
  ],
  3: [
    [-30, -30],
    [0, 0],
    [30, 30],
  ],
  4: [
    [-30, -30],
    [30, -30],
    [-30, 30],
    [30, 30],
  ],
  5: [
    [-30, -30],
    [30, -30],
    [0, 0],
    [-30, 30],
    [30, 30],
  ],
  6: [
    [-30, -25],
    [-30, 0],
    [-30, 25],
    [30, -25],
    [30, 0],
    [30, 25],
  ],
  7: [
    [-30, -25],
    [-30, 0],
    [-30, 25],
    [0, 0],
    [30, -25],
    [30, 0],
    [30, 25],
  ],
  8: [
    [-30, -25],
    [-30, 0],
    [-30, 25],
    [0, -25],
    [0, 25],
    [30, -25],
    [30, 0],
    [30, 25],
  ],
  9: [
    [-30, -25],
    [0, -25],
    [30, -25],
    [-30, 0],
    [0, 0],
    [30, 0],
    [-30, 25],
    [0, 25],
    [30, 25],
  ],
};

export function vividDominoDotCentersInViewBox(count: number | null, side: 'left' | 'right') {
  if (count === null) return [];
  const n = Math.min(9, Math.max(0, Math.round(count)));
  const pat = DICE_OFFSET_PX[n] ?? [];
  return pat.map(([ox, oy]) => {
    const px = 50 + ox;
    const py = 50 + oy;
    const cx = side === 'left' ? 31 + (px / 100) * 239 : 326 + (px / 100) * 239;
    const cy = 17 + (py / 100) * 265;
    return { cx, cy, r: 23 };
  });
}

/** Skrytá polovina — obdélník jako v minihře (bez interakce, jen vzhled). */
export function vividDominoHiddenHalfRect(side: 'left' | 'right') {
  const x = side === 'left' ? 31 : 326;
  return { x, y: 39, width: 239, height: 221, rx: 21 };
}

/** Tečky v poli „Celkem“ — generováno podobně jako generateCelkemDots v minihře. */
export function vividDominoTotalDotsLayout(
  totalCount: number,
  fieldWidth = 595,
  _fieldHeight = 160,
): Array<{ cx: number; cy: number; r: number }> {
  const dots: Array<{ cx: number; cy: number; r: number }> = [];
  const dotsPerRow = 12;
  const dotSpacing = 45;
  const dotRadius = 18;
  const rows = Math.ceil(totalCount / dotsPerRow);

  for (let i = 0; i < totalCount; i += 1) {
    const row = Math.floor(i / dotsPerRow);
    const col = i % dotsPerRow;
    const dotsInThisRow = row === rows - 1 ? totalCount - row * dotsPerRow : dotsPerRow;
    const rowWidth = (dotsInThisRow - 1) * dotSpacing;
    const startX = (fieldWidth - rowWidth) / 2;
    const x = startX + col * dotSpacing;
    const y = rows === 1 ? 80 : 50 + row * 60;
    dots.push({ cx: x, cy: y, r: dotRadius });
  }
  return dots;
}
