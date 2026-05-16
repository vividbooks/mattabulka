/** Payload pro HTML5 drag čísel/znamének z lišty — během dragover nelze spolehlivě číst dataTransfer. */
export type MathGlyphDragPayload = { label: string };

let active: MathGlyphDragPayload | null = null;

export function setMathGlyphDragPayload(next: MathGlyphDragPayload | null): void {
  active = next;
}

export function peekMathGlyphDragPayload(): MathGlyphDragPayload | null {
  return active;
}
