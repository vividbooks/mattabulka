export type DiceSides = 4 | 6 | 8 | 10 | 12 | 20;

export const DICE_SIDE_OPTIONS: readonly { sides: DiceSides; label: string }[] = [
  { sides: 4, label: 'D4' },
  { sides: 6, label: 'D6' },
  { sides: 8, label: 'D8' },
  { sides: 10, label: 'D10' },
  { sides: 12, label: 'D12' },
  { sides: 20, label: 'D20' },
] as const;

export function isDiceSides(n: unknown): n is DiceSides {
  return n === 4 || n === 6 || n === 8 || n === 10 || n === 12 || n === 20;
}

export function normalizeDiceSides(n: unknown, fallback: DiceSides = 6): DiceSides {
  return isDiceSides(n) ? n : fallback;
}

export function clampDiceValue(value: number, sides: DiceSides): number {
  const v = Math.round(Number(value));
  if (!Number.isFinite(v)) return 1;
  return Math.min(sides, Math.max(1, v));
}

export function randomDiceRoll(sides: DiceSides): number {
  return 1 + Math.floor(Math.random() * sides);
}
