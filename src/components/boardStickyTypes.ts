/** Samolepicí lísteček (FigJam-style) — uložený v dokumentu nástěnky. */
export type StickyNoteShape = 'square' | 'rounded' | 'circle';

export interface StickyNoteObject {
  kind: 'stickyNote';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  /** Hex výplně (pastel jako ve FigJam). */
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  shape: StickyNoteShape;
  linkUrl?: string;
}

export const STICKY_NOTE_PALETTE: { name: string; value: string }[] = [
  { name: 'Pink', value: '#ffb7b2' },
  { name: 'Yellow', value: '#fff475' },
  { name: 'Green', value: '#ccff90' },
  { name: 'Mint', value: '#a7ffeb' },
  { name: 'Purple', value: '#d7aefb' },
  { name: 'Rose', value: '#fdcfe8' },
  { name: 'Gray', value: '#e2e2e2' },
];

export const STICKY_DEFAULT_SIZE = { width: 220, height: 200 };
export const STICKY_MIN_EDGE = 100;
