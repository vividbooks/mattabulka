/** Payload for HTML5 drag z lišty — během dragover nelze spolehlivě číst dataTransfer. */
export type BuildTileDragPayload = { value: number; variant: 'stacked' | 'flat' };

let active: BuildTileDragPayload | null = null;

export function setBuildTileDragPayload(next: BuildTileDragPayload | null): void {
  active = next;
}

export function peekBuildTileDragPayload(): BuildTileDragPayload | null {
  return active;
}
