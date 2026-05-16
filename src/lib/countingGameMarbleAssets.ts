/**
 * Stejné assety kuliček / pytlíku jako minihra „Zjišťujeme“ (Vividbooks CountingGame).
 * Zdroj: Supabase Admin math — viz CountingGame.tsx v projektu minihry.
 */
const ADMIN_MATH =
  'https://jjpiguuubvmiobmixwgh.supabase.co/storage/v1/object/public/Admin%20math';

export const KULICKA_ZELENA_SVG = `${ADMIN_MATH}/kulicka_zelena.svg`;
export const KULICKA_ZLUTA_SVG = `${ADMIN_MATH}/kulicka_zluta.svg`;

/** Pytlíček jako ve minihře Zjisti — `getColoredContainerImage()` v CountingGame.tsx. */
export const PITLIK_ZELENA_SVG = `${ADMIN_MATH}/pitlik_zelena.svg`;
export const PITLIK_ZLUTY_SVG = `${ADMIN_MATH}/pitlik_zluty.svg`;

/** Mapování hex barvy položky → stejné SVG jako v minihře (zelená / žlutá). */
export function kulickaSvgUrlForHex(color: string): string {
  const h = color.trim().toLowerCase();
  if (h === '#f6d64f') return KULICKA_ZLUTA_SVG;
  return KULICKA_ZELENA_SVG;
}
