/** Výchozí barva tužky na světlém plátně */
export const DEFAULT_BRUSH_COLOR_LIGHT = '#1e1b4b';
/** Výchozí barva tužky na tmavém plátně */
export const DEFAULT_BRUSH_COLOR_DARK = '#f8fafc';

export const BRUSH_COLOR_PRESETS = [
  '#1e1b4b',
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#7c3aed',
  '#ea580c',
  '#ca8a04',
  '#0d9488',
  '#f8fafc',
  '#38bdf8',
] as const;

export const HIGHLIGHTER_COLOR_PRESETS = [
  '#fde047',
  '#86efac',
  '#93c5fd',
  '#f9a8d4',
  '#fde68a',
  '#a78bfa',
  '#fca5a5',
  '#67e8f9',
] as const;

export type BrushColorPreset = (typeof BRUSH_COLOR_PRESETS)[number];
export type HighlighterColorPreset = (typeof HIGHLIGHTER_COLOR_PRESETS)[number];
