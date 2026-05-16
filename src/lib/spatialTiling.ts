/**
 * Prostorové dlaždice na mřížce — tvary a pravidla převzaté z minihry „Pokládání dlaždic“
 * (Vividbooks minihry / constants/tilingData.ts).
 */

export interface TileShapeDefinition {
  id: string;
  name: string;
  pattern: boolean[][];
  color: string;
  emoji: string;
}

export interface SpatialPlacedTile {
  id: string;
  shapeId: string;
  /** Levý horní roh vzoru v souřadnicích buněk mřížky */
  gx: number;
  gy: number;
  rotation: number;
  pattern: boolean[][];
}

export interface SpatialTilingBoardObject {
  kind: 'spatialTilingBoard';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  cols: number;
  rows: number;
  placedTiles: SpatialPlacedTile[];
}

/** Stejné hodnoty jako ve hře `tilingData.ts` — mřížka a panel. */
export const SPATIAL_TILING_THEME = {
  GRID_BACKGROUND: '#FFFFFF',
  GRID_LINES: '#C0C4FF',
  PANEL_BORDER: '#D0D4F0',
} as const;

export const SPATIAL_TILING_DROP_PREVIEW = {
  valid: 'rgba(76, 175, 80, 0.45)',
  invalid: 'rgba(255, 77, 109, 0.45)',
  validStroke: '#4CAF50',
  invalidStroke: '#FF4D6D',
} as const;

/** Odsazení / čárkované vnitřní hrany — `tilingGridConstants.TILE_OFFSET` + `DASHED_LINE`. */
export const SPATIAL_TILING_TILE_RENDER = {
  BG_INSET: 1,
  CELL_SHRINK: 2,
  BORDER_PX: 2,
  DASH_LEN: 3,
  DASH_GAP: 3,
  DASH_EDGE_INSET: 0.25,
  DASH_EDGE_EXTENT: 0.5,
} as const;

export const TILE_SHAPE_DEFINITIONS: Record<string, TileShapeDefinition> = {
  square: {
    id: 'square',
    name: 'Čtverec',
    pattern: [[true]],
    color: '#4CAF50',
    emoji: '⬜',
  },
  rectangle2: {
    id: 'rectangle2',
    name: 'Obdélník 2',
    pattern: [[true, true]],
    color: '#F2D602',
    emoji: '▬',
  },
  rectangle3: {
    id: 'rectangle3',
    name: 'Obdélník 3',
    pattern: [[true, true, true]],
    color: '#7E57C2',
    emoji: '▬▬',
  },
  rectangle4: {
    id: 'rectangle4',
    name: 'Obdélník 4',
    pattern: [[true, true, true, true]],
    color: '#FF4D6D',
    emoji: '▬▬▬',
  },
  lShape: {
    id: 'lShape',
    name: 'L-tvar',
    pattern: [
      [true, false],
      [true, true],
    ],
    color: '#4EA3FF',
    emoji: '⅃',
  },
  lShapeBig: {
    id: 'lShapeBig',
    name: 'Velký L-tvar',
    pattern: [
      [true, false, false],
      [true, false, false],
      [true, true, true],
    ],
    color: '#B0B0B0',
    emoji: '⅃⅃',
  },
  tShape: {
    id: 'tShape',
    name: 'T-tvar',
    pattern: [
      [true, true, true],
      [false, true, false],
    ],
    color: '#F7A800',
    emoji: '⊤',
  },
  zShape: {
    id: 'zShape',
    name: 'Z-tvar',
    pattern: [
      [true, true, false],
      [false, true, true],
    ],
    color: '#4CAF50',
    emoji: '⌐',
  },
  squareBlock: {
    id: 'squareBlock',
    name: '2×2 čtverec',
    pattern: [
      [true, true],
      [true, true],
    ],
    color: '#F2D602',
    emoji: '⬛',
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    pattern: [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ],
    color: '#7E57C2',
    emoji: '✚',
  },
  corner: {
    id: 'corner',
    name: 'Roh',
    pattern: [
      [true, true],
      [true, false],
    ],
    color: '#FF4D6D',
    emoji: '⌐',
  },
  uShape: {
    id: 'uShape',
    name: 'U-tvar',
    pattern: [
      [true, false, true],
      [true, true, true],
    ],
    color: '#4EA3FF',
    emoji: '⊔',
  },
};

export const SPATIAL_TILING_DEFAULT_COLS = 6;
export const SPATIAL_TILING_DEFAULT_ROWS = 6;
export const SPATIAL_TILING_DEFAULT_CELL = 52;

export const SPATIAL_TILING_GRID_MIN_COLS = 2;
export const SPATIAL_TILING_GRID_MIN_ROWS = 2;
export const SPATIAL_TILING_GRID_MAX_COLS = 24;
export const SPATIAL_TILING_GRID_MAX_ROWS = 24;

/** Položené tvary, které po zmenšení mřížky stále leží celé uvnitř (cols × rows). */
export function filterSpatialPlacedTilesToGrid(
  tiles: SpatialPlacedTile[],
  cols: number,
  rows: number,
): SpatialPlacedTile[] {
  return tiles.filter((tile) => {
    for (let ri = 0; ri < tile.pattern.length; ri++) {
      const row = tile.pattern[ri];
      for (let ci = 0; ci < row.length; ci++) {
        if (!row[ci]) continue;
        const x = tile.gx + ci;
        const y = tile.gy + ri;
        if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
      }
    }
    return true;
  });
}

export function rotateTilePattern(pattern: boolean[][]): boolean[][] {
  const rows = pattern.length;
  const cols = pattern[0].length;
  const rotated: boolean[][] = [];

  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = 0; j < rows; j++) {
      rotated[i][j] = pattern[rows - 1 - j][i];
    }
  }

  return rotated;
}

export function getTilePatternWithRotation(shapeId: string, rotation: number): boolean[][] {
  let pattern = TILE_SHAPE_DEFINITIONS[shapeId]?.pattern || [[true]];
  const r = ((rotation % 4) + 4) % 4;
  for (let i = 0; i < r; i++) {
    pattern = rotateTilePattern(pattern);
  }
  return pattern.map((row) => [...row]);
}

export function getDarkerColor(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const darkerR = Math.floor(Number.isFinite(r) ? r * 0.6 : 0);
  const darkerG = Math.floor(Number.isFinite(g) ? g * 0.6 : 0);
  const darkerB = Math.floor(Number.isFinite(b) ? b * 0.6 : 0);
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB
    .toString(16)
    .padStart(2, '0')}`;
}

export interface SpatialTilingGeometry {
  cellSize: number;
  originX: number;
  originY: number;
  gridW: number;
  gridH: number;
}

export function spatialTilingGeometry(board: SpatialTilingBoardObject): SpatialTilingGeometry {
  const cs = Math.min(board.width / board.cols, board.height / board.rows);
  const gw = cs * board.cols;
  const gh = cs * board.rows;
  const originX = board.x + (board.width - gw) / 2;
  const originY = board.y + (board.height - gh) / 2;
  return { cellSize: cs, originX, originY, gridW: gw, gridH: gh };
}

export function worldPointToGridCell(
  board: SpatialTilingBoardObject,
  world: { x: number; y: number },
  geom: SpatialTilingGeometry,
): { cx: number; cy: number } | null {
  if (
    world.x < geom.originX ||
    world.x >= geom.originX + geom.gridW ||
    world.y < geom.originY ||
    world.y >= geom.originY + geom.gridH
  ) {
    return null;
  }
  const cx = Math.floor((world.x - geom.originX) / geom.cellSize);
  const cy = Math.floor((world.y - geom.originY) / geom.cellSize);
  if (cx < 0 || cx >= board.cols || cy < 0 || cy >= board.rows) return null;
  return { cx, cy };
}

export function findPlacedTileAtCell(
  placed: SpatialPlacedTile[],
  cx: number,
  cy: number,
): SpatialPlacedTile | null {
  for (let i = placed.length - 1; i >= 0; i--) {
    const t = placed[i];
    for (let ri = 0; ri < t.pattern.length; ri++) {
      const row = t.pattern[ri];
      for (let ci = 0; ci < row.length; ci++) {
        if (row[ci] && t.gx + ci === cx && t.gy + ri === cy) return t;
      }
    }
  }
  return null;
}

export function canPlaceSpatialPattern(
  pattern: boolean[][],
  gx: number,
  gy: number,
  cols: number,
  rows: number,
  placed: SpatialPlacedTile[],
): boolean {
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col]) {
        const cellX = gx + col;
        const cellY = gy + row;
        if (cellX < 0 || cellX >= cols || cellY < 0 || cellY >= rows) return false;
      }
    }
  }

  const occupied: boolean[][] = [];
  for (let i = 0; i < rows; i++) {
    occupied[i] = new Array(cols).fill(false);
  }

  for (const tile of placed) {
    for (let rowIndex = 0; rowIndex < tile.pattern.length; rowIndex++) {
      const row = tile.pattern[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex]) {
          const cellX = tile.gx + colIndex;
          const cellY = tile.gy + rowIndex;
          if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
            occupied[cellY][cellX] = true;
          }
        }
      }
    }
  }

  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col]) {
        const cellX = gx + col;
        const cellY = gy + row;
        if (occupied[cellY][cellX]) return false;
      }
    }
  }

  return true;
}

/** Soused v rámci jedné dlaždice (stejná logika jako `hasNeighbor` v minihře). */
export function spatialPatternNeighbor(
  tile: SpatialPlacedTile,
  rowIndex: number,
  colIndex: number,
  direction: 'top' | 'right' | 'bottom' | 'left',
): boolean {
  const currentX = tile.gx + colIndex;
  const currentY = tile.gy + rowIndex;
  let checkX = currentX;
  let checkY = currentY;
  switch (direction) {
    case 'top':
      checkY -= 1;
      break;
    case 'right':
      checkX += 1;
      break;
    case 'bottom':
      checkY += 1;
      break;
    case 'left':
      checkX -= 1;
      break;
  }
  return tile.pattern[checkY - tile.gy]?.[checkX - tile.gx] === true;
}

export function spatialPatternLocalHit(
  tile: SpatialPlacedTile,
  gridCx: number,
  gridCy: number,
): { patternCi: number; patternRi: number } | null {
  for (let ri = 0; ri < tile.pattern.length; ri++) {
    const row = tile.pattern[ri];
    for (let ci = 0; ci < row.length; ci++) {
      if (row[ci] && tile.gx + ci === gridCx && tile.gy + ri === gridCy) {
        return { patternCi: ci, patternRi: ri };
      }
    }
  }
  return null;
}

export function canPlaceSpatialPatternExcluding(
  pattern: boolean[][],
  gx: number,
  gy: number,
  cols: number,
  rows: number,
  placed: SpatialPlacedTile[],
  excludeTileId: string | null,
): boolean {
  const rest = excludeTileId ? placed.filter((t) => t.id !== excludeTileId) : placed;
  return canPlaceSpatialPattern(pattern, gx, gy, cols, rows, rest);
}
