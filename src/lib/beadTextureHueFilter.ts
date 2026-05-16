/** Referenční barvy vstupních SVG (žlutá / modrá půlkorálky ve výchozích podkladech). */
export const BEAD_TEXTURE_REF_YELLOW = '#f6c34b';
export const BEAD_TEXTURE_REF_BLUE = '#2368d9';

const HEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d > 1e-8) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s || 0, l };
}

/**
 * Aproximační CSS filtr pro náhled tónování obrázkových vzorů korálků.
 */
export function cssTextureImageTintFilter(targetHex: string, referenceHex: string): string {
  const t = parseHexRgb(targetHex);
  const ref = parseHexRgb(referenceHex);
  if (!t || !ref) return '';
  const ht = rgbToHsl(t.r, t.g, t.b).h;
  const hr = rgbToHsl(ref.r, ref.g, ref.b).h;
  let dh = ht - hr;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const st = rgbToHsl(t.r, t.g, t.b).s;
  const sr = rgbToHsl(ref.r, ref.g, ref.b).s;
  const satPct = sr < 0.06 ? 110 : Math.min(155, Math.max(85, Math.round(100 * (st / sr))));
  return `hue-rotate(${dh.toFixed(1)}deg) saturate(${satPct}%)`;
}
