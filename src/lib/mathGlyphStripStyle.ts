export type MathGlyphFontVariant = 'printed' | 'script';

/** Pilulka se zakulacenými konci (kolečkový vzhled) vs vyšší zaoblení čtverce. */
export type MathGlyphPillShape = 'round' | 'square';

/** 6 barev čáry / čísel (barevnost glyfů z lišty). */
export const MATH_GLYPH_INK_PRESETS = [
  '#1e1b4b',
  '#dc2626',
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#ea580c',
] as const;

/** 6 barev pozadí pilulky (plus Průhledné). */
export const MATH_GLYPH_PILL_BG_PRESETS = [
  '#ffffff',
  '#fef3c7',
  '#e0e7ff',
  '#fce7f3',
  '#d1fae5',
  '#ffedd5',
] as const;

export type MathGlyphPillBackground = 'transparent' | string;

export interface MathGlyphStripStyle {
  inkColor: string;
  pillBackground: MathGlyphPillBackground;
  fontVariant: MathGlyphFontVariant;
  /** Rámeček kolem textu (u průhledného pozadí se nevykresluje). */
  pillShape: MathGlyphPillShape;
}

const STORAGE_KEY = 'ma-math-glyph-strip-style-v1';

export const DEFAULT_MATH_GLYPH_STRIP_STYLE: MathGlyphStripStyle = {
  inkColor: MATH_GLYPH_INK_PRESETS[0],
  pillBackground: 'transparent',
  fontVariant: 'printed',
  pillShape: 'round',
};

export function normalizeMathGlyphStripStyle(raw: unknown): MathGlyphStripStyle {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_MATH_GLYPH_STRIP_STYLE };
  const o = raw as Record<string, unknown>;
  const ink =
    typeof o.inkColor === 'string' && o.inkColor.length > 0 ? o.inkColor : DEFAULT_MATH_GLYPH_STRIP_STYLE.inkColor;
  let pill: MathGlyphPillBackground = DEFAULT_MATH_GLYPH_STRIP_STYLE.pillBackground;
  if (o.pillBackground === 'transparent') pill = 'transparent';
  else if (typeof o.pillBackground === 'string' && o.pillBackground.length > 0) pill = o.pillBackground;
  const fv = o.fontVariant === 'script' || o.fontVariant === 'printed' ? o.fontVariant : 'printed';
  const ps = o.pillShape === 'square' ? 'square' : 'round';
  return { inkColor: ink, pillBackground: pill, fontVariant: fv, pillShape: ps };
}

export function readMathGlyphStripStyleFromStorage(): MathGlyphStripStyle {
  if (typeof window === 'undefined') return { ...DEFAULT_MATH_GLYPH_STRIP_STYLE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MATH_GLYPH_STRIP_STYLE };
    return normalizeMathGlyphStripStyle(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_MATH_GLYPH_STRIP_STYLE };
  }
}

export function writeMathGlyphStripStyleToStorage(style: MathGlyphStripStyle) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
  } catch {
    /* úložiště plné */
  }
}

export function stripStyleToGlyphFields(style: MathGlyphStripStyle) {
  return {
    strokeColor: style.inkColor,
    pillFill: style.pillBackground,
    fontVariant: style.fontVariant,
    pillShape: style.pillShape,
  };
}
