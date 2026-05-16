/** HTML5 drag z knihovny — během dragover spolehlivě čteme přes peek. */
export type SpatialTilingDragPayload = { shapeId: string; rotation: number };

const SPATIAL_TILING_DRAG_MIME = 'application/x-spatial-tiling-shape';

let active: SpatialTilingDragPayload | null = null;

export function spatialTilingDragMimeType(): string {
  return SPATIAL_TILING_DRAG_MIME;
}

export function setSpatialTilingDragPayload(next: SpatialTilingDragPayload | null): void {
  active = next;
}

export function peekSpatialTilingDragPayload(): SpatialTilingDragPayload | null {
  return active;
}
