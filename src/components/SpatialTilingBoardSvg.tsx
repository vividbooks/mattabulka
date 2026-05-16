import type { PointerEvent, ReactNode } from 'react';
import {
  TILE_SHAPE_DEFINITIONS,
  SPATIAL_TILING_THEME,
  SPATIAL_TILING_TILE_RENDER as R,
  getDarkerColor,
  spatialPatternNeighbor,
  spatialTilingGeometry,
  type SpatialPlacedTile,
  type SpatialTilingBoardObject,
} from '../lib/spatialTiling';

/** Kolmo k okraji desky — dříve 10 px, o 80 % užší ⇒ 20 % tloušťky. */
const SPATIAL_GRID_HANDLE_THICK = Math.round(10 * 0.2);
const SPATIAL_GRID_HANDLE_RX = Math.max(1, SPATIAL_GRID_HANDLE_THICK / 2);

function fillForShape(shapeId: string) {
  return TILE_SHAPE_DEFINITIONS[shapeId]?.color ?? '#4CAF50';
}

function outlineForShape(shapeId: string) {
  return getDarkerColor(fillForShape(shapeId));
}

/** Stejné vykreslení buněk jako na desce (plné hrany + čárkované vnitřní). */
export function spatialPlacedTileCellNodes(
  tile: SpatialPlacedTile,
  ox: number,
  oy: number,
  cs: number,
): ReactNode[] {
  const baseColor = fillForShape(tile.shapeId);
  const outlineColor = outlineForShape(tile.shapeId);
  const nodes: ReactNode[] = [];

  for (let rowIndex = 0; rowIndex < tile.pattern.length; rowIndex++) {
    const row = tile.pattern[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (!row[colIndex]) continue;

      const cellX = tile.gx + colIndex;
      const cellY = tile.gy + rowIndex;
      const px = ox + cellX * cs;
      const py = oy + cellY * cs;

      const inner = R.BG_INSET;
      const sz = cs - R.CELL_SHRINK;

      nodes.push(
        <rect
          key={`${tile.id}-bg-${rowIndex}-${colIndex}`}
          x={px + inner}
          y={py + inner}
          width={sz}
          height={sz}
          fill={baseColor}
          pointerEvents="none"
        />,
      );

      const hasTopNeighbor = spatialPatternNeighbor(tile, rowIndex, colIndex, 'top');
      const hasRightNeighbor = spatialPatternNeighbor(tile, rowIndex, colIndex, 'right');
      const hasBottomNeighbor = spatialPatternNeighbor(tile, rowIndex, colIndex, 'bottom');
      const hasLeftNeighbor = spatialPatternNeighbor(tile, rowIndex, colIndex, 'left');
      const b = R.BORDER_PX;
      const e = 0.5;

      if (!hasTopNeighbor) {
        nodes.push(
          <line
            key={`${tile.id}-bt-${rowIndex}-${colIndex}`}
            x1={px + e}
            y1={py + b / 2}
            x2={px + cs - e}
            y2={py + b / 2}
            stroke={outlineColor}
            strokeWidth={b}
            pointerEvents="none"
          />,
        );
      }
      if (!hasRightNeighbor) {
        nodes.push(
          <line
            key={`${tile.id}-br-${rowIndex}-${colIndex}`}
            x1={px + cs - b / 2}
            y1={py + e}
            x2={px + cs - b / 2}
            y2={py + cs - e}
            stroke={outlineColor}
            strokeWidth={b}
            pointerEvents="none"
          />,
        );
      }
      if (!hasBottomNeighbor) {
        nodes.push(
          <line
            key={`${tile.id}-bb-${rowIndex}-${colIndex}`}
            x1={px + e}
            y1={py + cs - b / 2}
            x2={px + cs - e}
            y2={py + cs - b / 2}
            stroke={outlineColor}
            strokeWidth={b}
            pointerEvents="none"
          />,
        );
      }
      if (!hasLeftNeighbor) {
        nodes.push(
          <line
            key={`${tile.id}-bl-${rowIndex}-${colIndex}`}
            x1={px + b / 2}
            y1={py + e}
            x2={px + b / 2}
            y2={py + cs - e}
            stroke={outlineColor}
            strokeWidth={b}
            pointerEvents="none"
          />,
        );
      }

      if (hasRightNeighbor) {
        const dashPat = `${R.DASH_LEN} ${R.DASH_GAP}`;
        nodes.push(
          <line
            key={`${tile.id}-dv-${rowIndex}-${colIndex}`}
            x1={px + cs}
            y1={py + cs * R.DASH_EDGE_INSET}
            x2={px + cs}
            y2={py + cs * (R.DASH_EDGE_INSET + R.DASH_EDGE_EXTENT)}
            stroke={outlineColor}
            strokeWidth={R.BORDER_PX}
            strokeDasharray={dashPat}
            pointerEvents="none"
          />,
        );
      }
      if (hasBottomNeighbor) {
        const dashPat = `${R.DASH_LEN} ${R.DASH_GAP}`;
        nodes.push(
          <line
            key={`${tile.id}-dh-${rowIndex}-${colIndex}`}
            x1={px + cs * R.DASH_EDGE_INSET}
            y1={py + cs}
            x2={px + cs * (R.DASH_EDGE_INSET + R.DASH_EDGE_EXTENT)}
            y2={py + cs}
            stroke={outlineColor}
            strokeWidth={R.BORDER_PX}
            strokeDasharray={dashPat}
            pointerEvents="none"
          />,
        );
      }
    }
  }

  return nodes;
}

/** Náhled tvaru v knihovně – vizuál shodný s položenou dlaždicí na mřížce. */
export function SpatialTilingLibraryShapeSvg(props: {
  shapeId: string;
  pattern: boolean[][];
  cellSize: number;
  isActive?: boolean;
}) {
  const { shapeId, pattern, cellSize: cs, isActive = false } = props;
  const rows = pattern.length;
  const cols = Math.max(...pattern.map((r) => r.length), 1);
  const w = cols * cs;
  const h = rows * cs;
  const tile: SpatialPlacedTile = {
    id: 'library-preview',
    shapeId,
    gx: 0,
    gy: 0,
    rotation: 0,
    pattern,
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`spatial-tiling-library-shape-svg${isActive ? ' is-active' : ''}`}
      aria-hidden
    >
      {spatialPlacedTileCellNodes(tile, 0, 0, cs)}
    </svg>
  );
}

interface SpatialTilingBoardSvgProps {
  board: SpatialTilingBoardObject;
  /** Snížení opacity při HTML5 drag preview nad deskou (volitelně). */
  placedOpacity?: number;
  selected?: boolean;
  onGridResizeStart?: (
    event: PointerEvent<SVGGElement>,
    board: SpatialTilingBoardObject,
    edge: 'cols' | 'rows',
  ) => void;
}

export function SpatialTilingBoardSvg({
  board,
  placedOpacity = 1,
  selected = false,
  onGridResizeStart,
}: SpatialTilingBoardSvgProps) {
  const geom = spatialTilingGeometry(board);
  const { cellSize: cs, originX: ox, originY: oy } = geom;
  const bx = board.x;
  const by = board.y;
  const bw = board.width;
  const bh = board.height;
  const { GRID_BACKGROUND, GRID_LINES } = SPATIAL_TILING_THEME;

  const gridLines: ReactNode[] = [];
  for (let c = 0; c <= board.cols; c++) {
    const x = ox + c * cs;
    gridLines.push(
      <line
        key={`gv-${c}`}
        x1={x}
        y1={oy}
        x2={x}
        y2={oy + board.rows * cs}
        stroke={GRID_LINES}
        strokeWidth={1}
        pointerEvents="none"
      />,
    );
  }
  for (let r = 0; r <= board.rows; r++) {
    const y = oy + r * cs;
    gridLines.push(
      <line
        key={`gh-${r}`}
        x1={ox}
        y1={y}
        x2={ox + board.cols * cs}
        y2={y}
        stroke={GRID_LINES}
        strokeWidth={1}
        pointerEvents="none"
      />,
    );
  }

  const tileLayers: ReactNode[] = [];
  for (const tile of board.placedTiles) {
    tileLayers.push(...spatialPlacedTileCellNodes(tile, ox, oy, cs));
  }

  return (
    <g className="spatial-tiling-board-root">
      <rect
        x={board.x}
        y={board.y}
        width={board.width}
        height={board.height}
        rx={8}
        fill="rgba(255,255,255,0.35)"
        stroke={SPATIAL_TILING_THEME.PANEL_BORDER}
        strokeWidth={1}
        pointerEvents="none"
      />
      <rect
        x={ox}
        y={oy}
        width={board.cols * cs}
        height={board.rows * cs}
        fill={GRID_BACKGROUND}
        stroke={SPATIAL_TILING_THEME.PANEL_BORDER}
        strokeWidth={1}
        pointerEvents="none"
      />
      <g className="spatial-tiling-grid-lines" pointerEvents="none">
        {gridLines}
      </g>
      <g className="spatial-tiling-placed" pointerEvents="none" opacity={placedOpacity}>
        {tileLayers}
      </g>
      {selected && onGridResizeStart ? (
        <>
          <g
            className="number-line-control spatial-tiling-grid-control spatial-tiling-grid-control--cols"
            onPointerDown={(event) => onGridResizeStart(event, board, 'cols')}
          >
            <rect
              x={bx + bw + 3 + (10 - SPATIAL_GRID_HANDLE_THICK) / 2}
              y={by + bh * 0.25 - 4}
              width={SPATIAL_GRID_HANDLE_THICK}
              height={(bh + 16) / 2}
              rx={SPATIAL_GRID_HANDLE_RX}
            />
          </g>
          <g
            className="number-line-control spatial-tiling-grid-control spatial-tiling-grid-control--rows"
            onPointerDown={(event) => onGridResizeStart(event, board, 'rows')}
          >
            <rect
              x={bx + bw * 0.25 - 4}
              y={by + bh + 3 + (10 - SPATIAL_GRID_HANDLE_THICK) / 2}
              width={(bw + 16) / 2}
              height={SPATIAL_GRID_HANDLE_THICK}
              rx={SPATIAL_GRID_HANDLE_RX}
            />
          </g>
        </>
      ) : null}
    </g>
  );
}

/** Náhled vzoru při drag z knihovny (zelený / červený overlay). */
export function SpatialTilingPatternOverlaySvg(props: {
  originX: number;
  originY: number;
  cellSize: number;
  pattern: boolean[][];
  fill: string;
  stroke: string;
  fillOpacity?: number;
}) {
  const { originX: ox, originY: oy, cellSize: cs, pattern, fill, stroke, fillOpacity = 0.45 } = props;
  const inner = R.BG_INSET;
  const sz = cs - R.CELL_SHRINK;
  const cells: ReactNode[] = [];
  for (let ri = 0; ri < pattern.length; ri++) {
    const row = pattern[ri];
    for (let ci = 0; ci < row.length; ci++) {
      if (!row[ci]) continue;
      const px = ox + ci * cs;
      const py = oy + ri * cs;
      cells.push(
        <rect
          key={`ov-${ri}-${ci}`}
          x={px + inner}
          y={py + inner}
          width={sz}
          height={sz}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={1.5}
        />,
      );
    }
  }
  return (
    <g className="spatial-tiling-drop-preview" pointerEvents="none">
      {cells}
    </g>
  );
}
