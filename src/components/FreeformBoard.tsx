// @ts-nocheck — velký board; typy řešíme postupně.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  BoxSelect,
  Circle,
  Combine,
  ClipboardPaste,
  Copy,
  GripHorizontal,
  ListChecks,
  Lock,
  LockOpen,
  Maximize,
  Minus,
  PenTool,
  Play,
  Plus,
  Scissors,
  Shapes,
  Square,
  Trash2,
} from 'lucide-react';
import { beadCounterToDraft, numberLineToDraft, type BeadCounterSettingsDraft, type NumberLineSettingsDraft } from './MachineToolSettings';
import {
  BeadCounterMachineBottomStrip,
  DiceTrayMachineStrip,
  NumberLineFigureMachineControls,
  NumberLineMachineBottomStrip,
} from './MachineBottomStrip';
import {
  ObjectLibraryPanel,
  type LibraryDockPosition,
  type ObjectLibraryPanelMode,
  type PinnedStripBoardSelection,
} from './ObjectLibraryPanel';
import { TopControls } from './TopControls';
import { ToolPalette, type Tool } from './ToolPalette';
import { numberLineBoardGameFigureUrl } from '../lib/numberLineBoardGameFigures';
import type { DiceSides } from '../lib/boardDice';
import { clampDiceValue, normalizeDiceSides, randomDiceRoll } from '../lib/boardDice';
import type { SpatialTilingBoardObject } from '../lib/spatialTiling';
import {
  SPATIAL_TILING_DEFAULT_CELL,
  SPATIAL_TILING_DEFAULT_COLS,
  SPATIAL_TILING_DEFAULT_ROWS,
  SPATIAL_TILING_DROP_PREVIEW,
  SPATIAL_TILING_GRID_MAX_COLS,
  SPATIAL_TILING_GRID_MAX_ROWS,
  SPATIAL_TILING_GRID_MIN_COLS,
  SPATIAL_TILING_GRID_MIN_ROWS,
  canPlaceSpatialPattern,
  canPlaceSpatialPatternExcluding,
  filterSpatialPlacedTilesToGrid,
  findPlacedTileAtCell,
  getTilePatternWithRotation,
  spatialPatternLocalHit,
  spatialTilingGeometry,
  worldPointToGridCell,
} from '../lib/spatialTiling';
import {
  peekSpatialTilingDragPayload,
  setSpatialTilingDragPayload,
  spatialTilingDragMimeType,
} from '../lib/spatialTilingDragPayload';
import { SpatialTilingBoardSvg, SpatialTilingPatternOverlaySvg } from './SpatialTilingBoardSvg';
import { DiceTraySvg } from './DiceTraySvg';
import { MarbleBagSvg, type MarbleBagItemView } from './MarbleBagSvg';
import { MarbleBagYellowTaskSvg } from './MarbleBagYellowTaskSvg';
import { SpatialTilingLibraryToolbar } from './SpatialTilingLibraryToolbar';
import { BoardScrollbars } from './BoardScrollbars';
import { BoardStickyNoteSvg } from './BoardStickyNoteSvg';
import type { StickyNoteObject } from './boardStickyTypes';
import { STICKY_DEFAULT_SIZE, STICKY_MIN_EDGE, STICKY_NOTE_PALETTE } from './boardStickyTypes';
import { BoardFileMenu } from './BoardFileMenu';
import { BoardCloudModal } from './BoardCloudModal';
import type { StickerItem } from '../lib/stickerLibrary';
import { peekBuildTileDragPayload } from '../lib/buildTileDragPayload';
import { MARBLE_BAG_ITEM_DRAG } from '../lib/marbleBagDragMime';
import { peekMathGlyphDragPayload } from '../lib/mathGlyphDragPayload';
import {
  readMathGlyphStripStyleFromStorage,
  stripStyleToGlyphFields,
  type MathGlyphFontVariant,
  type MathGlyphPillShape,
  writeMathGlyphStripStyleToStorage,
  type MathGlyphStripStyle,
} from '../lib/mathGlyphStripStyle';
import {
  VIVID_DOMINO_ACCENT,
  VIVID_DOMINO_TILE_ARTWORK,
  VIVID_DOMINO_VIEW_H,
  VIVID_DOMINO_VIEW_W,
  vividDominoDotCentersInViewBox,
  vividDominoHiddenHalfRect,
} from '../lib/vividbooksDominoVisual';
import {
  BEAD_TEXTURE_REF_BLUE,
  BEAD_TEXTURE_REF_YELLOW,
  cssTextureImageTintFilter,
} from '../lib/beadTextureHueFilter';
import {
  buildBoardDocumentJson,
  BOARD_FILE_EXTENSION,
  DEFAULT_BOARD_BACKGROUND,
  DEFAULT_BOARD_METADATA,
  downloadBoardDocumentBlob,
  parseBoardDocumentJson,
  suggestedBoardFileName,
  type BoardBackgroundSettings,
  type BoardDocumentMetadata,
  type BoardDocumentV1,
} from '../lib/boardDocument';
import {
  arithmeticOperationSymbol,
  computeArithmeticExpectedAnswer,
  prepareArithmeticExamplesForBoard,
  decodeAssignmentFromUrlPayload,
  evaluateDominoAnswer,
  generateDominoExamples,
  generateMarbleBagExamples,
  generateSequenceExamples,
  type ArithmeticExample,
  type ArithmeticOperation,
  type ArithmeticTaskSettings,
  type DominoExample,
  type DominoTaskSettings,
  type MarbleBagExample,
  type MarbleBagTaskSettings,
  type SequenceExample,
  type SequenceItem,
  type SequenceTaskSettings,
  type TaskAssignmentSettings,
} from '../lib/taskAssignments';
import { kulickaSvgUrlForHex } from '../lib/countingGameMarbleAssets';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { saveBoardDocumentToCloud } from '../lib/boardCloud';
import {
  boardShareUrl,
  createBoardContentShare,
  getBoardContentShareByToken,
  submitBoardShare,
  type BoardContentShareRow,
} from '../lib/boardSharing';
import {
  boardTaskShareUrl,
  createBoardTaskShare,
  getBoardTaskShareByToken,
  listBoardTaskSharesForFile,
  listBoardTaskSubmissions,
  submitBoardTask,
  type BoardTaskScore,
  type BoardTaskShareRow,
  type BoardTaskSubmissionRow,
} from '../lib/boardTaskSharing';
import {
  boardLiveSessionUrl,
  createBoardLiveSession,
  getBoardLiveSessionByToken,
  getOrCreateLivePeerId,
  getStoredLiveDisplayName,
  liveRealtimeChannelName,
  setStoredLiveDisplayName,
  updateBoardLiveSessionDocument,
} from '../lib/boardLiveSession';
import { BoardBackgroundModal } from './BoardBackgroundModal';
import { BoardShareModal } from './BoardShareModal';
import { StudentShareSubmitBar } from './StudentShareSubmitBar';
import {
  DEFAULT_BRUSH_COLOR_DARK,
  DEFAULT_BRUSH_COLOR_LIGHT,
  HIGHLIGHTER_COLOR_PRESETS,
} from '../lib/drawingToolColors';
import {
  readAppUiLightModeFromStorage,
  writeAppUiLightModeToStorage,
} from '../lib/appUiTheme';

function liveCursorColorForPeer(peerId: string): string {
  let h = 0;
  for (let i = 0; i < peerId.length; i++) h = (h * 31 + peerId.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 82% 52%)`;
}

/** Špička v (0,0) — kompaktní „myší“ šipka ve stylu Figma/FigJam (plná + černý obrys). */
const LIVE_COLLAB_CURSOR_POINTER_D =
  'M0 0L12.8 11.2L7.6 11.2L7.6 21.2L4.4 21.2L4.4 11.2L0 11.2Z';

function liveCollabNamePillWidth(label: string): number {
  return Math.min(220, Math.max(42, Math.ceil(label.length * 8.4) + 24));
}

const MATH_GLYPH_DRAG = 'application/x-math-glyph';
const MATH_GLYPH_R = 56;
const MATH_INLINE_MAX_LEN = 8;
const TEXT_INLINE_MAX_LEN = 72;

const LIBRARY_DOCK_STORAGE_KEY = 'ma-library-dock';
function readLibraryDockPosition(): LibraryDockPosition {
  try {
    const raw = localStorage.getItem(LIBRARY_DOCK_STORAGE_KEY);
    if (raw === 'side') return 'side';
    /* Spodní dok knihovny zrušen — starší hodnotu „bottom“ převedeme. */
    if (raw === 'bottom') return 'side';
  } catch {
    /* úložiště nedostupné */
  }
  return 'side';
}

function mathGlyphFontSize(r: number) {
  return Math.min(r * 1.35, 72);
}

/** Šířka/výška pilulky; výška = 2r, šířka roste s textem (minimum kruh). */
function mathGlyphPillDimensions(label: string, r: number) {
  const height = r * 2;
  const fontSize = mathGlyphFontSize(r);
  const charW = fontSize * 0.55;
  const padX = r * 0.72;
  const innerTextW = label.length * charW;
  const width = Math.max(height, innerTextW + padX * 2);
  return { width, height, fontSize, charW };
}

/** Po změně textu drží střed „bobánku“ na stejném místě. */
function mathGlyphRelabelKeepingCenter(o: MathGlyphObject, newLabel: string): MathGlyphObject {
  const oldDims = mathGlyphPillDimensions(o.label, o.r);
  const cx = o.x + oldDims.width / 2;
  const cy = o.y + oldDims.height / 2;
  const { width: newW, height: newH } = mathGlyphPillDimensions(newLabel, o.r);
  return {
    ...o,
    label: newLabel,
    x: cx - newW / 2,
    y: cy - newH / 2,
  };
}

function isMergeableNumberGlyph(glyph: MathGlyphObject) {
  return /^\d+$/.test(glyph.label);
}

/** Číslice a znaménka z lišty (včetně slepených bloků jako „12+“) — tyto dílky lze po přiblížení sloučit. */
const MATH_GLYPH_MERGE_LABEL_RE = /^[\d+\-−×÷=,]+$/;

function isMergeParticipantMathGlyph(glyph: MathGlyphObject) {
  return (
    glyph.label.length > 0 &&
    glyph.label.length <= 8 &&
    MATH_GLYPH_MERGE_LABEL_RE.test(glyph.label)
  );
}

type PendingPinnedPlacement =
  | { kind: 'tile'; value: number; variant: 'stacked' | 'flat' }
  | { kind: 'sticker'; sticker: StickerItem }
  | { kind: 'mathGlyph'; label: string };

type Point = { x: number; y: number };
type BeadCounterVariant = 'ten' | 'twenty';

interface Stroke {
  kind: 'stroke';
  id: string;
  locked?: boolean;
  points: Point[];
  color: string;
  width: number;
  /** Pevná barva vs. průhledný zvýrazňovač (multiply). */
  strokeKind?: 'ink' | 'highlighter';
}

type BoardShapeKind = 'circle' | 'square' | 'arrow';

interface BoardShapeObject {
  kind: 'boardShape';
  id: string;
  locked?: boolean;
  shape: BoardShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
}

interface ImageObject {
  kind: 'image';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  name: string;
  cropX?: number;
  cropY?: number;
}

interface BuildNumberTileObject {
  kind: 'buildNumberTile';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  value: number;
  variant: 'stacked' | 'flat';
  cellWidth: number;
  width: number;
  height: number;
}

interface MathGlyphObject {
  kind: 'mathGlyph';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  r: number;
  label: string;
  strokeColor?: string;
  pillFill?: 'transparent' | string;
  fontVariant?: MathGlyphFontVariant;
  /** Zachování tvaru rámečku; výchozí kulaté konce. */
  pillShape?: MathGlyphPillShape;
}

interface NumberLineObject {
  kind: 'numberLine';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  start: number;
  end: number;
  spacing: number;
  width: number;
  height: number;
  /** Barva čáry, obrysů koleček a čísel */
  accentColor?: string;
  /** Výplň koleček s čísly */
  tickFill?: string;
  mode?: 'plain' | 'withFigure';
  figurePosition?: number | null;
  activeFigureId?: string | null;
  figures?: Array<{
    id: string;
    position: number;
    color: string;
  }>;
  trails?: Array<{
    id: string;
    value: number;
    color?: string;
  }>;
}

type ArithmeticExampleStatus = 'pending' | 'submitted-correct' | 'submitted-incorrect';

interface BeadCounterObject {
  kind: 'beadCounter';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  beadRadius: number;
  wireColor?: string;
  variant?: BeadCounterVariant;
  beads: Array<{
    id: string;
    color: string;
    imageUrl?: string;
    position: number;
  }>;
  /** Oddělení skupin nad minimální roztečí (viz BEAD_GROUP_GAP_EXTRA_PX). */
  showGroupCounts?: boolean;
  /** Za řádek s počty přidá „= N“ (N = všechny korálky na lanku). */
  showTotalSum?: boolean;
}

interface ArithmeticExampleObject {
  kind: 'arithmeticExample';
  id: string;
  locked?: boolean;
  assignmentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  example: ArithmeticExample;
  submitted?: boolean;
}

interface SequenceExampleObject {
  kind: 'sequenceExample';
  id: string;
  locked?: boolean;
  assignmentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  example: SequenceExample;
  activeCellId?: string | null;
}

interface DominoExampleObject {
  kind: 'dominoExample';
  id: string;
  locked?: boolean;
  assignmentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  example: DominoExample;
  submitted?: boolean;
}

interface MarbleBagExampleObject {
  kind: 'marbleBagExample';
  id: string;
  locked?: boolean;
  assignmentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  example: MarbleBagExample;
  items: MarbleBagItem[];
  submitted?: boolean;
}

/** Volitelná dlaždice domina (knihovna) — bez úkolu, +/- na polovinách. */
interface DominoTileObject {
  kind: 'dominoTile';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  leftPips: number;
  rightPips: number;
  /** Která polovina má zobrazené krokovače (− / +). */
  editingSide: 'left' | 'right' | null;
}

interface DiceTrayDie {
  id: string;
  sides: DiceSides;
  value: number;
}

interface DiceTrayObject {
  kind: 'diceTray';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Typ kostky přidaný přes „+ Kostka“. */
  defaultSides: DiceSides;
  dice: DiceTrayDie[];
  accentColor?: string;
}

interface MarbleBagItem extends MarbleBagItemView {}

interface MarbleBagObject {
  kind: 'marbleBag';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  items: MarbleBagItem[];
  accentColor?: string;
}

interface CanvasFrameObject {
  kind: 'canvasFrame';
  id: string;
  locked?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  title: string;
  backgroundColor: string | null;
  borderColor: string;
}

type BoardObject =
  | CanvasFrameObject
  | Stroke
  | BoardShapeObject
  | ImageObject
  | BuildNumberTileObject
  | MathGlyphObject
  | NumberLineObject
  | BeadCounterObject
  | ArithmeticExampleObject
  | DominoExampleObject
  | SequenceExampleObject
  | MarbleBagExampleObject
  | DominoTileObject
  | DiceTrayObject
  | MarbleBagObject
  | SpatialTilingBoardObject
  | StickyNoteObject;

function boardObjectIsLocked(o: BoardObject): boolean {
  return o.locked === true;
}

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface Snapshot {
  objects: BoardObject[];
}

type BoardAction =
  | { type: 'idle' }
  | { type: 'pan'; startClient: Point; startViewport: Viewport }
  | { type: 'brush' }
  | { type: 'eraser' }
  | { type: 'lasso' }
  | {
      type: 'drag';
      startWorld: Point;
      originalObjects: BoardObject[];
      selectedIds: string[];
      moved: boolean;
    }
  | {
      type: 'numberLineResize';
      id: string;
      side: 'start' | 'end';
      startWorld: Point;
      originalLine: NumberLineObject;
      moved: boolean;
    }
  | {
      type: 'spatialTilingGridResize';
      id: string;
      edge: 'cols' | 'rows';
      startWorld: Point;
      originalBoard: SpatialTilingBoardObject;
      originalCellSize: number;
      originalGridW: number;
      originalGridH: number;
      moved: boolean;
    }
  | {
      type: 'imageCropPan';
      id: string;
      startWorld: Point;
      originalImage: ImageObject;
      moved: boolean;
    }
  | {
      type: 'beadDrag';
      counterId: string;
      beadId: string;
      startWorld: Point;
      originalCounter: BeadCounterObject;
      moved: boolean;
    }
  | {
      type: 'buildTileSplitPending';
      tileId: string;
      splitAfter: number;
      startWorld: Point;
      shiftKey: boolean;
    }
  | {
      type: 'boundsResize';
      id: string;
      startWorld: Point;
      original: BoardObject;
      moved: boolean;
    }
  | {
      type: 'spatialTileDrag';
      boardId: string;
      tileId: string;
      patternColIndex: number;
      patternRowIndex: number;
      startWorld: Point;
      moved: boolean;
    }
  | {
      type: 'marbleBagItemDrag';
      exampleId: string;
      itemId: string;
      startWorld: Point;
      originalExample: MarbleBagExampleObject;
      moved: boolean;
    }
  | { type: 'drawShape'; startWorld: Point };

const EMPTY_ACTION: BoardAction = { type: 'idle' };

type TempBoardShape = {
  shape: BoardShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
};
const BRUSH_WIDTH = 5;
const STICKER_PUBLIC_BASE_URL = 'https://njbtqmsxbyvpwigfceke.supabase.co/storage/v1/object/public/competition_files';
const HALF_MOON_BEAD_URLS = {
  yellow: `${STICKER_PUBLIC_BASE_URL}/stickers/5_barevne%20symboly/barevnesymboly_2_4_yellowbead.svg`,
  blue: `${STICKER_PUBLIC_BASE_URL}/stickers/5_barevne%20symboly/barevnesymboly_2_3_bluebead.svg`,
};

/** Max. pohyb (obrazovka px) při čekání na řez – pak se jedná o tah, né o klik. */
const BUILD_TILE_SPLIT_CLICK_MAX_MOVE_SCREEN_PX = 6;

const BUILD_TILE_SPLIT_ANIM_MS = 360;
const CANVAS_FRAME_DEFAULT_COLOR = '#ffffff';
/** Bez obrysu rámu; při výběru nepřidáváme tlustý obrys (viz CSS). */
const CANVAS_FRAME_BORDER_COLOR = 'none';
const CANVAS_FRAME_MIN_WIDTH = 360;
const CANVAS_FRAME_MIN_HEIGHT = 260;
/** Minimální rozměr při tažení pravého-spodního rohu — obecné objekty. */
const GENERIC_BOARD_BOUNDS_MIN = 48;
const CANVAS_FRAME_COLOR_PRESETS = [
  '#ffffff',
  '#eef2ff',
  '#dbeafe',
  '#dcfce7',
  '#fef9c3',
  '#ffedd5',
  '#fee2e2',
  '#f3e8ff',
  '#e0f2fe',
  null,
] as const;
const ARITHMETIC_EXAMPLE_WIDTH = 420;
const ARITHMETIC_EXAMPLE_HEIGHT = 142;
const ARITHMETIC_EXAMPLE_GAP_X = 220;
const ARITHMETIC_SUBMIT_R = 18;
/** Mezera mezi spodkem karty příkladu a středem kolečka s fajfkou (světové jednotky). */
const ARITHMETIC_SUBMIT_GAP_BELOW_CARD = 10;
const SEQUENCE_CELL_SIZE = 72;
const SEQUENCE_CELL_GAP = 8;
const SEQUENCE_CARD_PAD = 28;
const SEQUENCE_EXAMPLE_GAP_X = 220;
const SEQUENCE_SUBMIT_R = 18;
const SEQUENCE_CHOICE_DRAG = 'application/x-sequence-choice';
/** Větší poloměr zásahu u kolečka odevzdání na dotykových zařízeních / tabulích (px ve viewportu). */
function submitCircleHitRadiusPx(): number {
  if (typeof window === 'undefined') return 26;
  try {
    if (window.matchMedia('(pointer: coarse)').matches) return 44;
    if (window.matchMedia('(any-pointer: coarse)').matches) return 44;
  } catch {
    /* Media queries unsupported */
  }
  return 26;
}

const DOMINO_EXAMPLE_WIDTH = 304;
const DOMINO_EXAMPLE_HEIGHT = 328;
const DOMINO_EXAMPLE_GAP_X = 220;
const MARBLE_BAG_EXAMPLE_WIDTH = 720;
const MARBLE_BAG_EXAMPLE_HEIGHT = 480;
const MARBLE_BAG_EXAMPLE_GAP_X = 240;
/** Kulička jako ve minihře Zjišťujeme — raster/SVG z úložiště (kulicka_zelena / kulicka_zluta). */
function MarbleBagTaskMarbleDisc({
  cx,
  cy,
  mr,
  color,
  scale,
}: {
  cx: number;
  cy: number;
  mr: number;
  color: string;
  scale: number;
}) {
  const d = 2 * (mr + 3 * scale);
  return (
    <image
      href={kulickaSvgUrlForHex(color)}
      x={cx - d / 2}
      y={cy - d / 2}
      width={d}
      height={d}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
    />
  );
}

const DOMINO_TILE_WIDTH = 240;
const DOMINO_TILE_HEIGHT = Math.round((DOMINO_TILE_WIDTH * VIVID_DOMINO_VIEW_H) / VIVID_DOMINO_VIEW_W);
const MAX_DICE_TRAY_DICE = 8;
const DICE_TRAY_DEFAULT_W = 320;
const DICE_TRAY_DEFAULT_H = 156;
const MARBLE_BAG_DEFAULT_W = 250;
const MARBLE_BAG_DEFAULT_H = 220;
/** Barva „zásobních“ kuliček u zadání (MÁM / stolek) — shodná s paletou úlohy. */
const MARBLE_BAG_STOCK_MARBLE_COLOR = '#44b968';
const MARBLE_BAG_DRAG = 'application/x-marble-bag';

/** ease-out cubic pro odklánění půlek po řezu */
function easeBuildTileSplitOut(t: number) {
  const u = Math.min(1, Math.max(0, t));
  return 1 - (1 - u) ** 3;
}

function cloneObjects(objects: BoardObject[]): BoardObject[] {
  return objects.map((object) => {
    if (object.kind === 'stroke') return { ...object, points: object.points.map((point) => ({ ...point })) };
    if (object.kind === 'beadCounter') return { ...object, beads: object.beads.map((bead) => ({ ...bead })) };
    if (object.kind === 'numberLine') {
      return {
        ...object,
        figures: object.figures?.map((figure) => ({ ...figure })),
        trails: object.trails?.map((trail) => ({ ...trail })),
      };
    }
    if (object.kind === 'arithmeticExample') return { ...object, example: { ...object.example } };
    if (object.kind === 'dominoExample') return { ...object, example: { ...object.example } };
    if (object.kind === 'marbleBagExample') {
      return {
        ...object,
        example: { ...object.example },
        items: object.items.map((item) => ({ ...item })),
      };
    }
    if (object.kind === 'sequenceExample') {
      return {
        ...object,
        example: {
          ...object.example,
          choices: object.example.choices.map((choice) => ({ ...choice })),
          cells: object.example.cells.map((cell) => ({ ...cell })),
          pattern: [...object.example.pattern],
        },
      };
    }
    if (object.kind === 'spatialTilingBoard') {
      return {
        ...object,
        placedTiles: object.placedTiles.map((t) => ({
          ...t,
          pattern: t.pattern.map((row) => [...row]),
        })),
      };
    }
    if (object.kind === 'diceTray') {
      return {
        ...object,
        dice: object.dice.map((d) => ({ ...d })),
      };
    }
    if (object.kind === 'marbleBag') {
      return {
        ...object,
        items: object.items.map((item) => ({ ...item })),
      };
    }
    return { ...object };
  });
}

const BOARD_CLIPBOARD_MARKER = 'ma_nastenka_board';

function translateBoardObject(object: BoardObject, dx: number, dy: number): BoardObject {
  if (object.kind === 'stroke') {
    return {
      ...object,
      points: object.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
    };
  }
  return { ...object, x: object.x + dx, y: object.y + dy };
}

function duplicateObjectsForPaste(objects: BoardObject[]): BoardObject[] {
  const cloned = cloneObjects(objects);
  const assignmentIdRemap = new Map<string, string>();
  const nextAssignmentId = (old: string) => {
    let next = assignmentIdRemap.get(old);
    if (!next) {
      next = `assignment-${crypto.randomUUID()}`;
      assignmentIdRemap.set(old, next);
    }
    return next;
  };

  return cloned.map((object) => {
    if (object.kind === 'arithmeticExample') {
      return {
        ...object,
        id: crypto.randomUUID(),
        assignmentId: nextAssignmentId(object.assignmentId),
        submitted: false,
        example: { ...object.example, id: crypto.randomUUID() },
      };
    }
    if (object.kind === 'dominoExample') {
      return {
        ...object,
        id: crypto.randomUUID(),
        assignmentId: nextAssignmentId(object.assignmentId),
        submitted: false,
        example: { ...object.example, id: crypto.randomUUID() },
      };
    }
    if (object.kind === 'marbleBagExample') {
      return {
        ...object,
        id: crypto.randomUUID(),
        assignmentId: nextAssignmentId(object.assignmentId),
        submitted: false,
        items: object.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
        example: { ...object.example, id: crypto.randomUUID() },
      };
    }
    if (object.kind === 'sequenceExample') {
      const cellIdRemap = new Map<string, string>();
      const cells = object.example.cells.map((cell) => {
        const nid = crypto.randomUUID();
        cellIdRemap.set(cell.id, nid);
        return { ...cell, id: nid };
      });
      let activeCellId = object.activeCellId;
      if (activeCellId && cellIdRemap.has(activeCellId)) {
        activeCellId = cellIdRemap.get(activeCellId)!;
      } else {
        activeCellId = cells.find((cell) => !cell.given)?.id ?? null;
      }
      return {
        ...object,
        id: crypto.randomUUID(),
        assignmentId: nextAssignmentId(object.assignmentId),
        example: {
          ...object.example,
          id: crypto.randomUUID(),
          cells,
        },
        activeCellId,
      };
    }
    if (object.kind === 'beadCounter') {
      return {
        ...object,
        id: crypto.randomUUID(),
        beads: object.beads.map((bead) => ({ ...bead, id: crypto.randomUUID() })),
      };
    }
    if (object.kind === 'numberLine') {
      const figureIdRemap = new Map<string, string>();
      const figures = object.figures?.map((figure) => {
        const nid = crypto.randomUUID();
        figureIdRemap.set(figure.id, nid);
        return { ...figure, id: nid };
      });
      const trails = object.trails?.map((trail) => ({ ...trail, id: crypto.randomUUID() }));
      let activeFigureId = object.activeFigureId;
      if (activeFigureId && figureIdRemap.has(activeFigureId)) {
        activeFigureId = figureIdRemap.get(activeFigureId)!;
      }
      return {
        ...object,
        id: crypto.randomUUID(),
        figures,
        trails,
        activeFigureId,
      };
    }
    if (object.kind === 'dominoTile') {
      return {
        ...object,
        id: crypto.randomUUID(),
        editingSide: null,
      };
    }
    if (object.kind === 'spatialTilingBoard') {
      return {
        ...object,
        id: crypto.randomUUID(),
        placedTiles: object.placedTiles.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          pattern: t.pattern.map((row) => [...row]),
        })),
      };
    }
    if (object.kind === 'diceTray') {
      return {
        ...object,
        id: crypto.randomUUID(),
        dice: object.dice.map((d) => ({
          ...d,
          id: crypto.randomUUID(),
        })),
      };
    }
    return { ...object, id: crypto.randomUUID() };
  }).map((o) => ({ ...o, locked: false }));
}

function boundsOfBoardObjects(items: BoardObject[]) {
  if (items.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const object of items) {
    const b = objectBounds(object);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
}

function resolveContextTargetIds(hit: BoardObject | null, selectedIds: string[]): string[] {
  if (hit) {
    if (selectedIds.includes(hit.id) && selectedIds.length > 0) {
      return [...selectedIds];
    }
    return [hit.id];
  }
  return [...selectedIds];
}

function compactBoardObjectTargetIds(list: BoardObject[], targetIds: string[]): string[] {
  const present = new Set(list.map((object) => object.id));
  return targetIds.filter((id, index) => present.has(id) && targetIds.indexOf(id) === index);
}

/** Přesune cílové objekty úplně navrch SVG vrstvení. Pozdější objekt v poli se vykreslí výš. */
function reorderBoardObjectsBringForward(list: BoardObject[], targetIds: string[]): BoardObject[] | null {
  const ids = compactBoardObjectTargetIds(list, targetIds);
  if (!ids.length) return null;
  const sel = new Set(ids);
  const selected = list.filter((object) => sel.has(object.id));
  if (selected.length === 0 || list.slice(-selected.length).every((object) => sel.has(object.id))) return null;
  return [...list.filter((object) => !sel.has(object.id)), ...selected];
}

/** Přesune cílové objekty úplně dospod SVG vrstvení. Dřívější objekt v poli se vykreslí níž. */
function reorderBoardObjectsSendBackward(list: BoardObject[], targetIds: string[]): BoardObject[] | null {
  const ids = compactBoardObjectTargetIds(list, targetIds);
  if (!ids.length) return null;
  const sel = new Set(ids);
  const selected = list.filter((object) => sel.has(object.id));
  if (selected.length === 0 || list.slice(0, selected.length).every((object) => sel.has(object.id))) return null;
  return [...selected, ...list.filter((object) => !sel.has(object.id))];
}

/** Jeden krok „blíž k vrcholu“ z-orderu: přesune celý souvislý blok výběru nad nejbližšího neselected souseda. */
function reorderBoardObjectsOneStepForward(list: BoardObject[], targetIds: string[]): BoardObject[] | null {
  if (!targetIds.length) return null;
  const sel = new Set(targetIds);
  const n = list.length;
  let hi = -1;
  for (let i = n - 1; i >= 0; i -= 1) {
    if (sel.has(list[i].id) && i < n - 1 && !sel.has(list[i + 1].id)) {
      hi = i;
      break;
    }
  }
  if (hi < 0) return null;
  let lo = hi;
  while (lo > 0 && sel.has(list[lo - 1].id)) lo -= 1;
  const block = list.slice(lo, hi + 1);
  const neighbor = list[hi + 1];
  const before = list.slice(0, lo);
  const after = list.slice(hi + 2);
  return [...before, neighbor, ...block, ...after];
}

/** Jeden krok „blíž ke dnu“: celý souvislý blok výběru pod nejbližšího neselected souseda níže. */
function reorderBoardObjectsOneStepBackward(list: BoardObject[], targetIds: string[]): BoardObject[] | null {
  if (!targetIds.length) return null;
  const sel = new Set(targetIds);
  const n = list.length;
  let lo = -1;
  for (let i = 0; i < n; i += 1) {
    if (sel.has(list[i].id) && i > 0 && !sel.has(list[i - 1].id)) {
      lo = i;
      break;
    }
  }
  if (lo < 0) return null;
  let hi = lo;
  while (hi < n - 1 && sel.has(list[hi + 1].id)) hi += 1;
  const neighbor = list[lo - 1];
  const block = list.slice(lo, hi + 1);
  const before = list.slice(0, lo - 1);
  const after = list.slice(hi + 1);
  return [...before, ...block, neighbor, ...after];
}

function canBringBoardObjectsForward(list: BoardObject[], targetIds: string[]): boolean {
  return reorderBoardObjectsBringForward(list, targetIds) !== null;
}

function canSendBoardObjectsBackward(list: BoardObject[], targetIds: string[]): boolean {
  return reorderBoardObjectsSendBackward(list, targetIds) !== null;
}

function pickBoardObjectHit(
  world: Point,
  list: BoardObject[],
  tolerance: number,
  options?: { skipLocked?: boolean },
): BoardObject | null {
  const hits = (object: BoardObject) => {
    if (options?.skipLocked && boardObjectIsLocked(object)) return false;
    if (object.kind === 'image') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'buildNumberTile') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'mathGlyph') {
      const b = objectBounds(object);
      const pad = tolerance * 0.12;
      return pointInRect(world, {
        x: b.x - pad,
        y: b.y - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2,
      });
    }

    if (object.kind === 'numberLine') {
      const b = objectBounds(object);
      const pad = tolerance * 0.12;
      return (
        world.x >= b.x - pad &&
        world.x <= b.x + b.width + pad &&
        world.y >= b.y - pad &&
        world.y <= b.y + b.height + pad
      );
    }

    if (object.kind === 'beadCounter') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'diceTray') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'arithmeticExample' || object.kind === 'dominoExample' || object.kind === 'marbleBagExample') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'sequenceExample') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'dominoTile') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'spatialTilingBoard') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'stickyNote') {
      return (
        world.x >= object.x &&
        world.x <= object.x + object.width &&
        world.y >= object.y &&
        world.y <= object.y + object.height
      );
    }

    if (object.kind === 'boardShape') {
      return hitBoardShape(world, object, tolerance);
    }

    return hitStroke(world, object, tolerance);
  };

  const ordered = [...list].reverse();
  const objectHit = ordered.find((object) => object.kind !== 'stroke' && hits(object));
  if (objectHit) return objectHit;
  return ordered.find((object) => object.kind === 'stroke' && hits(object)) ?? null;
}

function parseBoardClipboardPayload(text: string): BoardObject[] | null {
  try {
    const data = JSON.parse(text) as { v?: number; app?: string; objects?: unknown };
    if (data.v !== 1 || data.app !== BOARD_CLIPBOARD_MARKER || !Array.isArray(data.objects)) {
      return null;
    }
    return data.objects as BoardObject[];
  } catch {
    return null;
  }
}

function getNumberLineFigures(line: NumberLineObject) {
  if (line.figures?.length) return line.figures;
  if (line.figurePosition === null || line.figurePosition === undefined) return [];
  return [{ id: 'figure-1', position: line.figurePosition, color: '#38bdf8' }];
}

function getActiveFigure(line: NumberLineObject) {
  const figures = getNumberLineFigures(line);
  return figures.find((figure) => figure.id === line.activeFigureId) ?? figures[0] ?? null;
}

/** Poloměr koleček na číselné ose — musí sedět s NumberLineSvg. */
const NUMBER_LINE_TICK_R = 17;
/** ~36×52 před ±30 % úpravou – figurky nad kolečky. */
const NUMBER_LINE_FIGURE_SPRITE_W = Math.round(36 * 1.3);
const NUMBER_LINE_FIGURE_SPRITE_H = Math.round(52 * 1.3);
/** Posun kotvy nahoru (SVG −Y), aby nestály přílis „do“ čárky. */
const NUMBER_LINE_FIGURE_LIFT_Y = 30;
/** Horizontální posun druhé figurky, když stojí vedle sebe na sousedních číslech. */
const NUMBER_LINE_FIGURE_PAIR_DX = 8;
/** Extra výška výběrového rámečku nad/pod osou, ať se vejdou hlavy figurek. */
const NUMBER_LINE_FIGURE_BOUNDS_PAD_Y = 12;

function numberLineWithFigureBoundsExpansion(object: NumberLineObject): { expandTop: number; expandBottom: number } {
  if (object.mode !== 'withFigure' || getNumberLineFigures(object).length === 0) {
    return { expandTop: 0, expandBottom: 0 };
  }
  const cy = object.height / 2;
  const footRel = cy + NUMBER_LINE_TICK_R;
  const spriteBottomRel = footRel - NUMBER_LINE_FIGURE_LIFT_Y;
  const figureTopRel = spriteBottomRel - NUMBER_LINE_FIGURE_SPRITE_H;
  const expandTop = Math.max(0, -figureTopRel) + NUMBER_LINE_FIGURE_BOUNDS_PAD_Y;
  const expandBottom = NUMBER_LINE_FIGURE_BOUNDS_PAD_Y;
  return { expandTop, expandBottom };
}

function pointsToPath(points: Point[]) {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')}`;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceToSegment(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return distance(point, a);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  const projected = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(point, projected);
}

function hitStroke(point: Point, stroke: Stroke, tolerance: number) {
  const tol = tolerance + stroke.width * 0.5;
  if (stroke.points.length === 1) return distance(point, stroke.points[0]) <= tol;
  for (let index = 1; index < stroke.points.length; index += 1) {
    if (distanceToSegment(point, stroke.points[index - 1], stroke.points[index]) <= tol) {
      return true;
    }
  }
  return false;
}

function rectFromPoints(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

function pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function findSpatialTilingBoardAtPoint(world: Point, list: BoardObject[]): SpatialTilingBoardObject | null {
  for (const o of [...list].reverse()) {
    if (o.kind !== 'spatialTilingBoard') continue;
    if (boardObjectIsLocked(o)) continue;
    if (pointInRect(world, { x: o.x, y: o.y, width: o.width, height: o.height })) return o;
  }
  return null;
}

function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const sign = (p1: Point, p2: Point, p3: Point) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function boardShapeArrowHeadPoints(o: BoardShapeObject) {
  const x1 = o.x;
  const y1 = o.y;
  const x2 = o.x + o.w;
  const y2 = o.y + o.h;
  const dx = o.w;
  const dy = o.h;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;
  const ux = dx / len;
  const uy = dy / len;
  const ah = Math.min(16, len * 0.35);
  const bx = x2 - ux * ah;
  const by = y2 - uy * ah;
  const perpX = -uy;
  const perpY = ux;
  const aw = ah * 0.55;
  const tip = { x: x2, y: y2 };
  const left = { x: bx + perpX * aw, y: by + perpY * aw };
  const right = { x: bx - perpX * aw, y: by - perpY * aw };
  const shaftEnd = { x: bx, y: by };
  return { tip, left, right, shaftEnd, shaftStart: { x: x1, y: y1 } };
}

function hitBoardShape(p: Point, o: BoardShapeObject, tolerance: number): boolean {
  const half = o.strokeWidth * 0.5;
  const t = tolerance + half;
  if (o.shape === 'arrow') {
    const a = { x: o.x, y: o.y };
    const b = { x: o.x + o.w, y: o.y + o.h };
    if (distanceToSegment(p, a, b) <= t) return true;
    const head = boardShapeArrowHeadPoints(o);
    if (!head) return false;
    if (pointInTriangle(p, head.tip, head.left, head.right)) return true;
    if (distanceToSegment(p, head.left, head.right) <= t) return true;
    if (distanceToSegment(p, head.left, head.tip) <= t) return true;
    if (distanceToSegment(p, head.right, head.tip) <= t) return true;
    return false;
  }
  if (o.shape === 'square') {
    return pointInRect(p, { x: o.x, y: o.y, width: o.w, height: o.h });
  }
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const rx = Math.abs(o.w) / 2;
  const ry = Math.abs(o.h) / 2;
  if (rx < 1e-6 || ry < 1e-6) return false;
  const ix = (p.x - cx) / rx;
  const iy = (p.y - cy) / ry;
  return ix * ix + iy * iy <= 1;
}

function normalizeBoardShapeCommit(d: TempBoardShape): { x: number; y: number; w: number; h: number } | null {
  const minWorld = 6;
  if (d.shape === 'arrow') {
    if (Math.hypot(d.w, d.h) < minWorld) return null;
    return { x: d.x, y: d.y, w: d.w, h: d.h };
  }
  const x = Math.min(d.x, d.x + d.w);
  const y = Math.min(d.y, d.y + d.h);
  const w = Math.abs(d.w);
  const h = Math.abs(d.h);
  if (w < minWorld && h < minWorld) return null;
  return { x, y, w, h };
}

function BoardShapeMark({
  shape,
  x,
  y,
  w,
  h,
  color,
  strokeWidth,
  preview,
}: {
  shape: BoardShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
  preview?: boolean;
}) {
  const dashStyle = preview ? ({ strokeDasharray: '6 4', opacity: 0.88 } as const) : undefined;
  if (shape === 'circle') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = Math.max(Math.abs(w) / 2, 0);
    const ry = Math.max(Math.abs(h) / 2, 0);
    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        style={dashStyle}
      />
    );
  }
  if (shape === 'square') {
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        style={dashStyle}
      />
    );
  }
  const o: BoardShapeObject = {
    kind: 'boardShape',
    id: 'preview',
    shape: 'arrow',
    x,
    y,
    w,
    h,
    color,
    strokeWidth,
  };
  const head = boardShapeArrowHeadPoints(o);
  if (!head) return null;
  return (
    <g style={dashStyle}>
      <line
        x1={head.shaftStart.x}
        y1={head.shaftStart.y}
        x2={head.shaftEnd.x}
        y2={head.shaftEnd.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polygon
        points={`${head.tip.x},${head.tip.y} ${head.left.x},${head.left.y} ${head.right.x},${head.right.y}`}
        fill={color}
      />
    </g>
  );
}

function strokeBounds(stroke: Stroke) {
  const xs = stroke.points.map((point) => point.x);
  const ys = stroke.points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/** Minimální šířka/výška při měnění rozměru z pravého dolního rohu podle typu objektu. */
function boundsResizeMinimums(o: BoardObject): { mw: number; mh: number } {
  switch (o.kind) {
    case 'canvasFrame':
      return { mw: CANVAS_FRAME_MIN_WIDTH, mh: CANVAS_FRAME_MIN_HEIGHT };
    case 'stickyNote':
      return { mw: STICKY_MIN_EDGE, mh: STICKY_MIN_EDGE };
    case 'stroke': {
      return { mw: GENERIC_BOARD_BOUNDS_MIN, mh: GENERIC_BOARD_BOUNDS_MIN };
    }
    case 'mathGlyph':
      return {
        mw: GENERIC_BOARD_BOUNDS_MIN,
        mh: GENERIC_BOARD_BOUNDS_MIN,
      };
    case 'spatialTilingBoard': {
      const minCell = 18;
      return {
        mw: Math.max(GENERIC_BOARD_BOUNDS_MIN, o.cols * minCell),
        mh: Math.max(GENERIC_BOARD_BOUNDS_MIN, o.rows * minCell),
      };
    }
    case 'numberLine': {
      if (o.mode === 'withFigure') {
        const minCenteredH =
          2 * (NUMBER_LINE_FIGURE_SPRITE_H - NUMBER_LINE_TICK_R + NUMBER_LINE_FIGURE_LIFT_Y);
        return {
          mw: GENERIC_BOARD_BOUNDS_MIN,
          mh: Math.max(GENERIC_BOARD_BOUNDS_MIN, Math.ceil(minCenteredH)),
        };
      }
      return { mw: GENERIC_BOARD_BOUNDS_MIN, mh: GENERIC_BOARD_BOUNDS_MIN };
    }
    default:
      return { mw: GENERIC_BOARD_BOUNDS_MIN, mh: GENERIC_BOARD_BOUNDS_MIN };
  }
}

function supportsBoardBoundsResize(o: BoardObject): boolean {
  if (o.kind === 'stroke') {
    const b = strokeBounds(o);
    return o.points.length >= 2 && b.width >= 4 && b.height >= 4;
  }
  return true;
}

/** Změna velikosti z ukotvení levého horního rohu (Š×V jako u plátna / lístečku). */
function applyBoardObjectBoundsResize(orig: BoardObject, nextW: number, nextH: number): BoardObject | null {
  const { mw, mh } = boundsResizeMinimums(orig);
  let w = Math.max(mw, nextW);
  let h = Math.max(mh, nextH);

  switch (orig.kind) {
    case 'canvasFrame':
      return { ...orig, width: w, height: h };
    case 'stickyNote':
      return { ...orig, width: w, height: h };
    case 'image':
      return { ...orig, width: w, height: h };
    case 'mathGlyph': {
      const dims0 = mathGlyphPillDimensions(orig.label, orig.r);
      const s = Math.sqrt((w * h) / (dims0.width * dims0.height));
      const nr = Math.max(11, Math.min(96, Number((orig.r * s).toFixed(2))));
      return { ...orig, r: nr };
    }
    case 'numberLine':
      return { ...orig, width: w, height: h };
    case 'beadCounter':
      return { ...orig, width: w, height: h };
    case 'diceTray':
      return { ...orig, width: w, height: h };
    case 'marbleBag':
      return { ...orig, width: w, height: h };
    case 'buildNumberTile': {
      const cwW = w / Math.max(1, orig.value);
      const cwH =
        orig.variant === 'flat' ? h : Math.max(40, h / (83 / 60));
      const nextCw = Math.round(Math.min(90, Math.max(22, Math.min(cwW, cwH))));
      const nextH =
        orig.variant === 'flat' ? nextCw : nextCw * (83 / 60);
      const nextWidth = nextCw * orig.value;
      return { ...orig, cellWidth: nextCw, width: nextWidth, height: nextH };
    }
    case 'arithmeticExample':
    case 'dominoExample':
    case 'sequenceExample':
    case 'dominoTile':
      return { ...orig, width: w, height: h };
    case 'spatialTilingBoard': {
      const { cols, rows } = orig;
      const cs = Math.max(18, Math.min(w / cols, h / rows));
      return {
        ...orig,
        width: cols * cs,
        height: rows * cs,
      };
    }
    case 'boardShape': {
      const bz = objectBounds(orig);
      if (bz.width < 1 || bz.height < 1) return null;
      const sx = w / bz.width;
      const sy = h / bz.height;
      return {
        ...orig,
        w: orig.w * sx,
        h: orig.h * sy,
      };
    }
    case 'stroke': {
      const b = strokeBounds(orig);
      if (b.width <= 1e-4 || b.height <= 1e-4) return null;
      const sx = w / b.width;
      const sy = h / b.height;
      const points = orig.points.map((p) => ({
        x: b.x + (p.x - b.x) * sx,
        y: b.y + (p.y - b.y) * sy,
      }));
      const g = Math.sqrt(Math.max(0.001, sx * sy));
      const nextPen = Math.max(2, Math.min(48, orig.width * g));
      return {
        ...orig,
        points,
        width: nextPen,
      };
    }
    default:
      return null;
  }
}

/** Jedna ikona pravého-spodního rohu („scale“ jako Lucide MoveDiagonal), zrcadleně pro pravý-spodní roh. */
function BoardResizeSeHandleMarkup() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      overflow="visible"
      aria-hidden
      className="board-resize-handle-icon-svg"
    >
      <path
        d="M11 19H5v-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 5h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 5 5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Minimální rozestup středů sousedních korálků při nejtěsnějším položení (srovnej moveBead). */
function beadCounterPackedSpacing(counter: BeadCounterObject): number {
  return counter.beadRadius * 1.75;
}

/** Rozestup nad minimální „dotyk“ pro rozřezání skupin (px). */
const BEAD_GROUP_GAP_EXTRA_PX = 10;

/** Velikost písma pro řádek s počty / součtem (px). */
const BEAD_COUNTER_GROUP_COUNT_FONT_SIZE = 52;
/** Mezera mezi spodem korálků od osy šňůry a řádkem s počtem (compact). */
const BEAD_COUNTER_GROUP_LABEL_GAP_AFTER_BEADS_PX = 6;
/** Doplňkový posun řádku s počtem pod korálky px (skupiny / součet). */
const BEAD_COUNTER_GROUP_LABEL_EXTRA_DOWN_PX = 26;
/** Rezerva pod řádek s čísly při rozšíření výšky objektu. */
const BEAD_COUNTER_LABEL_VERTICAL_PADDING_PX = 14;

/** Vertikální střed lanka v kompaktním počítadle (nezávisle na prodloužené výšce kvůli popiskům). */
function beadCounterWireCenterY(counter: BeadCounterObject): number {
  const twenty =
    counter.variant === 'twenty' ||
    counter.beads.length > 12 ||
    counter.width >= 600;
  return twenty ? 132 / 2 : 84 / 2;
}

/**
 * Skupiny = úseky mezi dvěma korálky, kde mezera > minimální dotyk + BEAD_GROUP_GAP_EXTRA_PX.
 */
function beadCounterPositionClusters(counter: BeadCounterObject): Array<{ count: number; centerX: number }> {
  if (counter.beads.length === 0) return [];
  const sorted = [...counter.beads].sort((a, b) => a.position - b.position);
  const splitAbove = beadCounterPackedSpacing(counter) + BEAD_GROUP_GAP_EXTRA_PX;
  const clusters: number[][] = [];
  let cur: number[] = [sorted[0].position];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].position - sorted[i - 1].position > splitAbove) {
      clusters.push(cur);
      cur = [sorted[i].position];
    } else {
      cur.push(sorted[i].position);
    }
  }
  clusters.push(cur);
  return clusters.map((positions) => ({
    count: positions.length,
    centerX: (Math.min(...positions) + Math.max(...positions)) / 2,
  }));
}

/** Jedna řádka se součtem: „a + b + … = N“, nebo jen „= N“. Použito jen při showTotalSum. */
function beadCounterSumLineExpression(counter: BeadCounterObject): string | null {
  if (!counter.showTotalSum || counter.beads.length === 0) return null;
  const total = counter.beads.length;
  if (counter.showGroupCounts) {
    const clusters = beadCounterPositionClusters(counter);
    if (clusters.length > 0) {
      return `${clusters.map((c) => String(c.count)).join(' + ')} = ${total}`;
    }
  }
  return `= ${total}`;
}

function beadCounterFitBounds(counter: BeadCounterObject): { x: number; y: number; width: number; height: number } {
  if (counter.beads.length === 0) {
    return { x: counter.x, y: counter.y, width: counter.width, height: counter.height };
  }
  const positions = counter.beads.map((bead) => bead.position);
  const minP = Math.min(...positions);
  const maxP = Math.max(...positions);
  const visualHalf = counter.beadRadius * 1.35 + 10;
  const pad = 12;
  const innerLeft = minP - visualHalf - pad;
  const innerRight = maxP + visualHalf + pad;
  const leftL = Math.min(Math.max(innerLeft, 2), counter.width - 48);
  const rightL = Math.max(Math.min(innerRight, counter.width - 2), leftL + 36);
  /* Celé červené lanko včetně háčků na koncích (viz BeadCounterSvg). */
  const wireTipLeft = 4;
  const wireTipRight = counter.width - 4;
  const spanLeft = Math.min(leftL, wireTipLeft);
  const spanRight = Math.max(rightL, wireTipRight);
  const width = Math.max(spanRight - spanLeft, 28);
  let height = counter.height;
  if (
    counter.beads.length > 0 &&
    (counter.showGroupCounts || counter.showTotalSum)
  ) {
    const wireY = beadCounterWireCenterY(counter);
    const labelBottom =
      wireY +
      counter.beadRadius * 1.38 +
      BEAD_COUNTER_GROUP_COUNT_FONT_SIZE +
      BEAD_COUNTER_GROUP_LABEL_GAP_AFTER_BEADS_PX +
      BEAD_COUNTER_GROUP_LABEL_EXTRA_DOWN_PX +
      BEAD_COUNTER_LABEL_VERTICAL_PADDING_PX;
    height = Math.max(counter.height, labelBottom + 8);
  }
  return {
    x: counter.x + spanLeft,
    y: counter.y,
    width,
    height,
  };
}

function arithmeticAnswerRect(example: ArithmeticExampleObject) {
  return {
    x: example.x + example.width - 156,
    y: example.y + 42,
    width: 116,
    height: 72,
  };
}

function arithmeticSubmitButtonCenter(example: { x: number; y: number; width: number; height: number }) {
  return {
    x: example.x + example.width / 2,
    y: example.y + example.height + ARITHMETIC_SUBMIT_GAP_BELOW_CARD + ARITHMETIC_SUBMIT_R,
  };
}

function marbleBagExampleGeometry(example: MarbleBagExampleObject) {
  const scale = Math.min(example.width / 1200, example.height / 800);
  const left = example.x + (example.width - 1200 * scale) / 2;
  const top = example.y + (example.height - 800 * scale) / 2;
  const sx = (value: number) => left + value * scale;
  const gy = (value: number) => top + value * scale;
  return { scale, sx, gy };
}

function marbleBagAnswerRect(example: MarbleBagExampleObject) {
  const { scale, sx, gy } = marbleBagExampleGeometry(example);
  const sw = (v: number) => v * scale;
  return {
    x: sx(528),
    y: gy(676),
    width: sw(176),
    height: sw(80),
  };
}

function marbleBagSubmitButtonCenter(example: MarbleBagExampleObject) {
  const { sx, gy } = marbleBagExampleGeometry(example);
  return { x: sx(930), y: gy(718) };
}

function marbleBagItemDefaultPosition(index: number) {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: 650 + col * 46 + row * 12,
    y: 255 + row * 38 + (col % 2) * 8,
  };
}

function marbleBagMarbleOrdinal(example: MarbleBagExampleObject, item: MarbleBagItem) {
  const ord = example.items.filter((i) => i.kind === 'marble').findIndex((i) => i.id === item.id);
  return ord < 0 ? 0 : ord;
}

function marbleBagMarbleLayoutPosition(example: MarbleBagExampleObject, item: MarbleBagItem & { kind: 'marble' }) {
  if (item.x !== undefined && item.y !== undefined) return { x: item.x, y: item.y };
  return marbleBagItemDefaultPosition(marbleBagMarbleOrdinal(example, item));
}

function marbleBagItemHitAt(example: MarbleBagExampleObject, point: Point) {
  const { scale, sx, gy } = marbleBagExampleGeometry(example);
  const hitR = 52 * scale;
  for (let index = example.items.length - 1; index >= 0; index -= 1) {
    const item = example.items[index];
    if (item.kind !== 'marble') continue;
    const p = marbleBagMarbleLayoutPosition(example, item);
    if (distance(point, { x: sx(p.x), y: gy(p.y) }) <= hitR) return item;
  }
  return null;
}

/** Oblast žlutého pytlíku ve „design“ souřadnicích (1200×800 stejně jako MarbleBagYellowTaskSvg). */
const MARBLE_BAG_PYTLIK_DESIGN = { x: 450, y: 40, w: 576, h: 384 };

/** Aktivní drop — kulička ze spodní lišty je nad žlutým pytlíkem (stejná oblast jako `MarbleBagYellowTaskSvg`). */
function marbleBagYellowPytlikHitRect(example: MarbleBagExampleObject) {
  const { scale, sx, gy } = marbleBagExampleGeometry(example);
  const sw = (value: number) => value * scale;
  const pad = 8 * scale;
  const d = MARBLE_BAG_PYTLIK_DESIGN;
  return {
    x: sx(d.x) - pad,
    y: gy(d.y) - pad,
    width: sw(d.w) + 2 * pad,
    height: sw(d.h) + 2 * pad,
  };
}

function worldPointOverMarbleBagYellowPytlik(example: MarbleBagExampleObject, world: Point): boolean {
  return pointInRect(world, marbleBagYellowPytlikHitRect(example));
}

/** Velikost bílého kolečka s × u kuličky (násobek `marbleBagExampleGeometry().scale`). */
const MARBLE_BAG_DELETE_CHIP_CIRCLE_R = 17;
/** Glyph × uvnitř kolečka. */
const MARBLE_BAG_DELETE_CHIP_FONT = 22;
/** Poloměr zásahu prstem v px obrazovky (musí ladit s vizuálem výše). */
const MARBLE_BAG_DELETE_CHIP_HIT_RADIUS_PX = 24;

function isMarbleCenterInPytlikDesign(p: { x: number; y: number }) {
  const pad = 8;
  return (
    p.x >= MARBLE_BAG_PYTLIK_DESIGN.x - pad &&
    p.y >= MARBLE_BAG_PYTLIK_DESIGN.y - pad &&
    p.x <= MARBLE_BAG_PYTLIK_DESIGN.x + MARBLE_BAG_PYTLIK_DESIGN.w + pad &&
    p.y <= MARBLE_BAG_PYTLIK_DESIGN.y + MARBLE_BAG_PYTLIK_DESIGN.h + pad
  );
}

function marbleBagDeleteChipWorld(example: MarbleBagExampleObject, item: MarbleBagItem & { kind: 'marble' }) {
  const { scale, sx, gy } = marbleBagExampleGeometry(example);
  const p = marbleBagMarbleLayoutPosition(example, item);
  const mr = 34 * scale;
  return { x: sx(p.x) + mr * 0.75, y: gy(p.y) - mr * 0.75 };
}

function marbleBagDeleteChipHit(
  example: MarbleBagExampleObject,
  item: MarbleBagItem & { kind: 'marble' },
  world: Point,
  viewportScale: number,
) {
  const c = marbleBagDeleteChipWorld(example, item);
  const r = MARBLE_BAG_DELETE_CHIP_HIT_RADIUS_PX / viewportScale;
  return distance(world, c) <= r;
}

function sequenceChoiceByKey(example: SequenceExample, key: string) {
  return example.choices.find((choice) => choice.key === key) ?? null;
}

function sequenceCellRect(object: SequenceExampleObject, row: number, col: number) {
  return {
    x: object.x + SEQUENCE_CARD_PAD + col * (SEQUENCE_CELL_SIZE + SEQUENCE_CELL_GAP),
    y: object.y + SEQUENCE_CARD_PAD + 44 + row * (SEQUENCE_CELL_SIZE + SEQUENCE_CELL_GAP),
    width: SEQUENCE_CELL_SIZE,
    height: SEQUENCE_CELL_SIZE,
  };
}

function sequenceAnswerComplete(object: SequenceExampleObject) {
  return object.example.cells.every((cell) => cell.given || cell.answerKey === cell.expectedKey);
}

function sequenceSubmitButtonCenter(example: SequenceExampleObject) {
  return {
    x: example.x + example.width / 2,
    y: example.y + example.height + ARITHMETIC_SUBMIT_GAP_BELOW_CARD + SEQUENCE_SUBMIT_R,
  };
}

function mathGlyphCenter(glyph: MathGlyphObject) {
  const dims = mathGlyphPillDimensions(glyph.label, glyph.r);
  return {
    x: glyph.x + dims.width / 2,
    y: glyph.y + dims.height / 2,
  };
}

function mergeTouchingNumberGlyphs(objects: BoardObject[], preferredId?: string): { objects: BoardObject[]; selectedId?: string } {
  const glyphs = objects.filter((object): object is MathGlyphObject => object.kind === 'mathGlyph' && isMergeParticipantMathGlyph(object));
  if (glyphs.length < 2) return { objects };

  const boundsById = new Map(glyphs.map((glyph) => [glyph.id, objectBounds(glyph)]));
  const parent = new Map(glyphs.map((glyph) => [glyph.id, glyph.id]));
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p === id) return p;
    const root = find(p);
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  for (let i = 0; i < glyphs.length; i += 1) {
    const a = glyphs[i];
    const ab = boundsById.get(a.id);
    if (!ab) continue;
    for (let j = i + 1; j < glyphs.length; j += 1) {
      const b = glyphs[j];
      const bb = boundsById.get(b.id);
      if (!bb) continue;
      const verticalOverlap = Math.min(ab.y + ab.height, bb.y + bb.height) - Math.max(ab.y, bb.y);
      const requiredOverlap = Math.min(ab.height, bb.height) * 0.58;
      const horizontalGap = Math.max(ab.x, bb.x) - Math.min(ab.x + ab.width, bb.x + bb.width);
      /* Užší tolerance: sloučí se jen po výraznějším přiblížení (menší „perimetr“). */
      if (verticalOverlap >= requiredOverlap && horizontalGap <= Math.min(a.r, b.r) * 0.085) {
        union(a.id, b.id);
      }
    }
  }

  const groups = new Map<string, MathGlyphObject[]>();
  for (const glyph of glyphs) {
    const root = find(glyph.id);
    groups.set(root, [...(groups.get(root) ?? []), glyph]);
  }
  const mergeGroups = [...groups.values()].filter((group) => group.length > 1);
  if (mergeGroups.length === 0) return { objects };

  const removeIds = new Set<string>();
  const replacements = new Map<string, MathGlyphObject>();
  let selectedId = preferredId;
  for (const group of mergeGroups) {
    const ordered = [...group].sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);
    const keep =
      (preferredId ? ordered.find((glyph) => glyph.id === preferredId) : null) ??
      ordered.find((glyph) => glyph.id === find(ordered[0].id)) ??
      ordered[0];
    const label = ordered.map((glyph) => glyph.label).join('').slice(0, 8);
    const minX = Math.min(...ordered.map((glyph) => objectBounds(glyph).x));
    const maxX = Math.max(...ordered.map((glyph) => {
      const bounds = objectBounds(glyph);
      return bounds.x + bounds.width;
    }));
    const minY = Math.min(...ordered.map((glyph) => objectBounds(glyph).y));
    const maxY = Math.max(...ordered.map((glyph) => {
      const bounds = objectBounds(glyph);
      return bounds.y + bounds.height;
    }));
    const { width, height } = mathGlyphPillDimensions(label, keep.r);
    replacements.set(keep.id, {
      ...keep,
      label,
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2,
    });
    ordered.forEach((glyph) => {
      if (glyph.id !== keep.id) removeIds.add(glyph.id);
    });
    if (preferredId && ordered.some((glyph) => glyph.id === preferredId)) selectedId = keep.id;
  }

  return {
    objects: objects
      .filter((object) => !removeIds.has(object.id))
      .map((object) => replacements.get(object.id) ?? object),
    selectedId,
  };
}

function splitMathGlyphIntoSeparateGlyphs(source: MathGlyphObject): MathGlyphObject[] {
  const chars = Array.from(source.label);
  if (chars.length <= 1) return [];
  const r = source.r;
  const gap = r * 0.14;
  const dimsList = chars.map((ch) => mathGlyphPillDimensions(ch, r));
  const totalW = dimsList.reduce((s, d) => s + d.width, 0) + gap * (chars.length - 1);
  const oldDims = mathGlyphPillDimensions(source.label, r);
  const centerX = source.x + oldDims.width / 2;
  const centerY = source.y + oldDims.height / 2;
  let x = centerX - totalW / 2;
  return chars.map((ch, i) => {
    const d = dimsList[i];
    const y = centerY - d.height / 2;
    const next = {
      ...source,
      id: crypto.randomUUID(),
      label: ch,
      x,
      y,
    };
    x += d.width + gap;
    return next;
  });
}

function normalizeArithmeticAnswerText(text: string) {
  return text
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
}

function arithmeticAnswerFromGlyphs(example: ArithmeticExampleObject, objects: BoardObject[]) {
  const glyphs = objects
    .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
    .filter((glyph) => mathGlyphOverlapsAnswerZone(glyph, example))
    .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);
  const text = normalizeArithmeticAnswerText(glyphs.map((glyph) => glyph.label).join(''));
  if (!text) return null;
  if (!/^-?\d+$/.test(text)) return { text, correct: false };
  return { text, correct: Number(text) === example.example.expectedAnswer };
}

function arithmeticExampleStatus(
  example: ArithmeticExampleObject,
  answer: ReturnType<typeof arithmeticAnswerFromGlyphs>,
): ArithmeticExampleStatus {
  if (!example.submitted) return 'pending';
  return answer?.correct ? 'submitted-correct' : 'submitted-incorrect';
}

type AnswerZoneRect = { x: number; y: number; width: number; height: number };

function glyphOverlapsAnswerRect(glyph: MathGlyphObject, rect: AnswerZoneRect) {
  const b = objectBounds(glyph);
  return (
    b.x < rect.x + rect.width &&
    b.x + b.width > rect.x &&
    b.y < rect.y + rect.height &&
    b.y + b.height > rect.y
  );
}

function mathGlyphOverlapsMarbleBagAnswerZone(glyph: MathGlyphObject, example: MarbleBagExampleObject) {
  return glyphOverlapsAnswerRect(glyph, marbleBagAnswerRect(example));
}

function marbleBagGlyphDigitsText(example: MarbleBagExampleObject, objects: BoardObject[]): string | null {
  const rect = marbleBagAnswerRect(example);
  const glyphs = objects
    .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
    .filter((glyph) => glyphOverlapsAnswerRect(glyph, rect))
    .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);
  const text = normalizeArithmeticAnswerText(glyphs.map((glyph) => glyph.label).join(''));
  return text.length > 0 ? text : null;
}

function dominoInputRects(example: DominoExampleObject): AnswerZoneRect[] {
  const ox = example.x;
  const oy = example.y;
  const w = example.width;
  const midY = oy + 202;
  const slotW = 52;
  const slotH = 48;
  if (example.example.mode === 'dominoSum') {
    const bw = Math.min(112, w - 48);
    return [{ x: ox + (w - bw) / 2, y: oy + 256, width: bw, height: slotH }];
  }
  if (example.example.mode === 'partition') {
    return [
      { x: ox + 42, y: oy + 250, width: slotW, height: slotH },
      { x: ox + w - 42 - slotW, y: oy + 250, width: slotW, height: slotH },
    ];
  }
  const cx = ox + w / 2;
  return [
    { x: cx - 76, y: midY, width: slotW, height: slotH },
    { x: cx + 16, y: midY, width: slotW, height: slotH },
  ];
}

function parseIntGlyphsInRect(rect: AnswerZoneRect, objects: BoardObject[]) {
  const glyphs = objects
    .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
    .filter((glyph) => glyphOverlapsAnswerRect(glyph, rect))
    .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);
  const text = normalizeArithmeticAnswerText(glyphs.map((glyph) => glyph.label).join(''));
  if (!text || !/^-?\d+$/.test(text)) return null;
  return Number(text);
}

function dominoAnswerFromGlyphs(example: DominoExampleObject, objects: BoardObject[]) {
  const rects = dominoInputRects(example);
  const slots = rects.map((rect) => parseIntGlyphsInRect(rect, objects));
  if (slots.some((v) => v === null)) return null;
  const values = slots as number[];
  return { slots: values, correct: evaluateDominoAnswer(example.example, values) };
}

function dominoExampleStatus(
  example: DominoExampleObject,
  answer: ReturnType<typeof dominoAnswerFromGlyphs>,
): ArithmeticExampleStatus {
  if (!example.submitted) return 'pending';
  return answer?.correct ? 'submitted-correct' : 'submitted-incorrect';
}

function marbleBagAnswerValue(example: MarbleBagExampleObject, objects: BoardObject[]) {
  const glyphText = marbleBagGlyphDigitsText(example, objects);
  if (glyphText !== null && /^\d+$/.test(glyphText)) {
    return Number(glyphText);
  }
  if (example.example.answerMode === 'number') {
    const labels = example.items
      .filter((item) => item.kind === 'number' && item.label)
      .map((item) => item.label)
      .join('');
    if (!/^\d+$/.test(labels)) return null;
    return Number(labels);
  }
  return example.items.filter((item) => item.kind === 'marble').length;
}

function marbleBagExampleStatus(example: MarbleBagExampleObject, objects: BoardObject[]): ArithmeticExampleStatus {
  if (!example.submitted) return 'pending';
  return marbleBagAnswerValue(example, objects) === example.example.expectedInBag ? 'submitted-correct' : 'submitted-incorrect';
}

function calculateTaskScore(objects: BoardObject[], assignmentId: string | null): BoardTaskScore {
  const taskObjects = objects
    .filter(
      (object): object is ArithmeticExampleObject | DominoExampleObject | SequenceExampleObject | MarbleBagExampleObject =>
        (object.kind === 'arithmeticExample' ||
          object.kind === 'dominoExample' ||
          object.kind === 'sequenceExample' ||
          object.kind === 'marbleBagExample') &&
        (assignmentId ? object.assignmentId === assignmentId : true),
    )
    .sort((a, b) => {
      const ai = a.example.index ?? 0;
      const bi = b.example.index ?? 0;
      return ai - bi;
    });

  const examples = taskObjects.map((object) => {
    if (object.kind === 'arithmeticExample') {
      const answer = arithmeticAnswerFromGlyphs(object, objects);
      return {
        exampleId: object.id,
        index: object.example.index,
        kind: 'arithmetic' as const,
        correct: !!answer?.correct,
        answer: answer?.text ?? null,
        expected: object.example.expectedAnswer,
      };
    }

    if (object.kind === 'dominoExample') {
      const answer = dominoAnswerFromGlyphs(object, objects);
      return {
        exampleId: object.id,
        index: object.example.index,
        kind: 'domino' as const,
        correct: !!answer?.correct,
        answer: answer?.slots ?? null,
        expected:
          object.example.mode === 'dominoSum'
            ? object.example.expectLeft + object.example.expectRight
            : [object.example.expectLeft, object.example.expectRight],
      };
    }

    if (object.kind === 'marbleBagExample') {
      const answer = marbleBagAnswerValue(object, objects);
      return {
        exampleId: object.id,
        index: object.example.index,
        kind: 'marbleBag' as const,
        correct: answer === object.example.expectedInBag,
        answer,
        expected: object.example.expectedInBag,
      };
    }

    const openCells = object.example.cells.filter((cell) => !cell.given);
    const correctCells = openCells.filter((cell) => cell.answerKey === cell.expectedKey).length;
    const correct = openCells.length > 0 && correctCells === openCells.length;
    return {
      exampleId: object.id,
      index: object.example.index,
      kind: 'sequence' as const,
      correct,
      answer: openCells.map((cell) => ({ cellId: cell.id, answerKey: cell.answerKey ?? null })),
      expected: openCells.map((cell) => ({ cellId: cell.id, expectedKey: cell.expectedKey })),
    };
  });

  const total = examples.length;
  const correct = examples.filter((example) => example.correct).length;
  return {
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    examples,
  };
}

/** Žákovský režim: všechny příklady daného úkolu jsou odevzdané (kde je třeba) a zároveň správně. */
function isStudentAssignmentCompleteAndCorrect(objects: BoardObject[], assignmentId: string | null): boolean {
  if (!assignmentId) return false;
  const taskObjects = objects.filter(
      (object): object is ArithmeticExampleObject | DominoExampleObject | SequenceExampleObject | MarbleBagExampleObject =>
        (object.kind === 'arithmeticExample' ||
          object.kind === 'dominoExample' ||
          object.kind === 'sequenceExample' ||
          object.kind === 'marbleBagExample') &&
      object.assignmentId === assignmentId,
  );
  if (taskObjects.length === 0) return false;
  for (const object of taskObjects) {
    if (object.kind === 'arithmeticExample' || object.kind === 'dominoExample' || object.kind === 'marbleBagExample') {
      if (!object.submitted) return false;
    }
  }
  const score = calculateTaskScore(objects, assignmentId);
  return score.total > 0 && score.correct === score.total;
}

type CreatedTaskAssignment = {
  taskKind: BoardTaskShareRow['task_kind'];
  taskSettings: TaskAssignmentSettings;
  assignmentId: string;
};

function objectBounds(object: BoardObject) {
  if (object.kind === 'canvasFrame') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'image') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'buildNumberTile') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'mathGlyph') {
    const { width, height } = mathGlyphPillDimensions(object.label, object.r);
    return { x: object.x, y: object.y, width, height };
  }

  if (object.kind === 'numberLine') {
    const { expandTop, expandBottom } = numberLineWithFigureBoundsExpansion(object);
    return {
      x: object.x,
      y: object.y - expandTop,
      width: object.width,
      height: object.height + expandTop + expandBottom,
    };
  }

  if (object.kind === 'beadCounter') {
    return beadCounterFitBounds(object);
  }

  if (object.kind === 'arithmeticExample') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'dominoExample') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'marbleBagExample') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'sequenceExample') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'dominoTile') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'diceTray') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'marbleBag') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'spatialTilingBoard') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  if (object.kind === 'boardShape') {
    if (object.shape === 'arrow') {
      const x1 = object.x;
      const y1 = object.y;
      const x2 = object.x + object.w;
      const y2 = object.y + object.h;
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const maxX = Math.max(x1, x2);
      const maxY = Math.max(y1, y2);
      const len = Math.hypot(object.w, object.h);
      const pad = object.strokeWidth * 0.5 + Math.min(18, len * 0.4);
      return {
        x: minX - pad,
        y: minY - pad,
        width: maxX - minX + pad * 2,
        height: maxY - minY + pad * 2,
      };
    }
    return {
      x: object.x,
      y: object.y,
      width: object.w,
      height: object.h,
    };
  }

  if (object.kind === 'stickyNote') {
    return {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
    };
  }

  return strokeBounds(object);
}

function createCanvasFrameObject(
  bounds: { x: number; y: number; width: number; height: number },
  index: number,
  options?: { title?: string; backgroundColor?: string | null },
): CanvasFrameObject {
  return {
    kind: 'canvasFrame',
    id: crypto.randomUUID(),
    x: bounds.x,
    y: bounds.y,
    width: Math.max(CANVAS_FRAME_MIN_WIDTH, bounds.width),
    height: Math.max(CANVAS_FRAME_MIN_HEIGHT, bounds.height),
    label: String(index),
    title: options?.title?.trim() || String(index),
    backgroundColor: options?.backgroundColor === undefined ? CANVAS_FRAME_DEFAULT_COLOR : options.backgroundColor,
    borderColor: CANVAS_FRAME_BORDER_COLOR,
  };
}

function renumberCanvasFrames(objects: BoardObject[]) {
  let next = 1;
  return objects.map((object) => {
    if (object.kind !== 'canvasFrame') return object;
    const label = String(next++);
    return {
      ...object,
      label,
      title: object.title?.trim() || label,
    };
  });
}

function unionObjectBounds(items: BoardObject[], pad = 72) {
  if (items.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of items) {
    const b = objectBounds(item);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(CANVAS_FRAME_MIN_WIDTH, maxX - minX + pad * 2),
    height: Math.max(CANVAS_FRAME_MIN_HEIGHT, maxY - minY + pad * 2),
  };
}

function findCanvasFrameContainingObjectFromList(
  frames: CanvasFrameObject[],
  object: BoardObject,
): CanvasFrameObject | null {
  const bounds = objectBounds(object);
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const containingFrames = frames.filter((frame) =>
    pointInRect(center, { x: frame.x, y: frame.y, width: frame.width, height: frame.height }),
  );
  return containingFrames.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

function removeAssignmentExamplesAndFrames(
  objects: BoardObject[],
  assignmentId: string,
  exampleKinds: Array<'arithmeticExample' | 'sequenceExample' | 'dominoExample' | 'marbleBagExample'>,
): BoardObject[] {
  const frames = objects.filter((o): o is CanvasFrameObject => o.kind === 'canvasFrame');
  const removeIds = new Set<string>();
  for (const object of objects) {
    if (!exampleKinds.includes(object.kind as 'arithmeticExample' | 'sequenceExample' | 'dominoExample' | 'marbleBagExample')) continue;
    if (!('assignmentId' in object) || (object as { assignmentId?: string }).assignmentId !== assignmentId) continue;
    removeIds.add(object.id);
    const frame = findCanvasFrameContainingObjectFromList(frames, object);
    if (frame) removeIds.add(frame.id);
  }
  return objects.filter((o) => !removeIds.has(o.id));
}

function mathGlyphOverlapsAnswerZone(glyph: MathGlyphObject, example: ArithmeticExampleObject) {
  const answerRect = arithmeticAnswerRect(example);
  const b = objectBounds(glyph);
  return (
    b.x < answerRect.x + answerRect.width &&
    b.x + b.width > answerRect.x &&
    b.y < answerRect.y + answerRect.height &&
    b.y + b.height > answerRect.y
  );
}

function selectionOutlineRect(object: BoardObject) {
  const bounds = objectBounds(object);
  const pad = 8;
  return {
    x: bounds.x - pad,
    y: bounds.y - pad,
    width: bounds.width + pad * 2,
    height: bounds.height + pad * 2,
  };
}

function unionSelectionOutlines(selectedObjects: BoardObject[]) {
  if (selectedObjects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const object of selectedObjects) {
    const rect = selectionOutlineRect(object);
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

/** Šířka pilulky s názvem plátna podle délky textu (světové jednotky SVG). */
function canvasFrameLabelPillWidth(labelText: string) {
  const t = labelText.trim();
  const charW = 9.6;
  const padX = 26;
  const minW = 36;
  const maxW = 340;
  return Math.min(maxW, Math.max(minW, t.length * charW + padX));
}

function CanvasFrameSvg({
  object,
  selected,
  onLabelPointerDown,
}: {
  object: CanvasFrameObject;
  selected: boolean;
  onLabelPointerDown: (event: React.PointerEvent<SVGGElement>, id: string) => void;
}) {
  const fill = object.backgroundColor ?? 'transparent';
  const labelText = object.title?.trim() || object.label;
  const labelWidth = canvasFrameLabelPillWidth(labelText);
  const labelCenterX = object.x + 18 + labelWidth / 2;
  const labelCenterY = object.y + 18 + 19;
  const stroke =
    object.borderColor && object.borderColor !== 'none' && object.borderColor !== 'transparent'
      ? object.borderColor
      : 'none';
  const strokeWidth = stroke === 'none' ? 0 : 2.5;
  return (
    <g className={`canvas-frame-svg${selected ? ' is-selected' : ''}`}>
      <rect
        className="canvas-frame-svg__shadow"
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx={28}
      />
      <rect
        className="canvas-frame-svg__fill"
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx={28}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray="none"
      />
      {selected ? (
        <rect
          className="selection-outline"
          pointerEvents="none"
          aria-hidden
          x={object.x - 8}
          y={object.y - 8}
          width={object.width + 16}
          height={object.height + 16}
          rx={36}
        />
      ) : null}
      <g className="canvas-frame-svg__label" onPointerDown={(event) => onLabelPointerDown(event, object.id)}>
        <rect x={object.x + 18} y={object.y + 18} width={labelWidth} height={38} rx={19} />
        <text x={labelCenterX} y={labelCenterY} textAnchor="middle" dominantBaseline="middle">
          {labelText}
        </text>
      </g>
    </g>
  );
}

/** Horní limit měřítka plátna (kolečko, posuvník, ruční zoom). „Na celou oblast“ výběru může jít až sem. */
const MAX_BOARD_ZOOM_SCALE = 8;
const MIN_BOARD_ZOOM_SCALE = 0.25;

function zoomViewportToFitWorldBounds(
  clientWidth: number,
  clientHeight: number,
  bounds: { x: number; y: number; width: number; height: number },
  chrome?: { left: number; rightFit: number; top: number; bottom: number },
  opts?: { padPx?: number; maxScale?: number; minScale?: number },
): Viewport {
  const padPx = opts?.padPx ?? 56;
  const maxScale = opts?.maxScale ?? 3;
  const minScale = opts?.minScale ?? MIN_BOARD_ZOOM_SCALE;
  const c = chrome ?? { left: 0, rightFit: 0, top: 0, bottom: 0 };
  /* Odsazení v pixelech plátna (clientWidth/Height = velikost SVG prvku). */
  const innerLeft = c.left + padPx;
  const innerRight = clientWidth - c.rightFit - padPx;
  const usableW = Math.max(innerRight - innerLeft, 1);

  const innerTop = c.top + padPx;
  const innerBottom = clientHeight - c.bottom - padPx;
  const usableH = Math.max(innerBottom - innerTop, 1);

  const bw = Math.max(bounds.width, 1);
  const bh = Math.max(bounds.height, 1);
  let nextScale = Math.min(usableW / bw, usableH / bh);
  nextScale = Math.min(maxScale, Math.max(minScale, Number(nextScale.toFixed(3))));
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const centerPxX = innerLeft + usableW / 2;
  const centerPxY = innerTop + usableH / 2;
  return {
    scale: nextScale,
    x: cx - centerPxX / nextScale,
    y: cy - centerPxY / nextScale,
  };
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const LEGO_COLORS: Record<number, { light: string; dark: string; lightCircle: string; darkCircle: string }> = {
  1: { light: '#E0E0E0', dark: '#B0B0B0', lightCircle: '#E7E7E7', darkCircle: '#B0B0B0' },
  2: { light: '#E34242', dark: '#7A1C1C', lightCircle: '#FF6B6B', darkCircle: '#7A1C1C' },
  3: { light: '#8DE2C8', dark: '#1F6B5A', lightCircle: '#A6F2DA', darkCircle: '#3BAA8A' },
  4: { light: '#A9A3FF', dark: '#4D3FA6', lightCircle: '#C1B8FF', darkCircle: '#5D50B8' },
  5: { light: '#FFD84C', dark: '#8C7B00', lightCircle: '#FFF2A6', darkCircle: '#C7A900' },
  6: { light: '#3C8C6C', dark: '#205E46', lightCircle: '#61B58D', darkCircle: '#2E7559' },
  7: { light: '#2E2F6D', dark: '#000000', lightCircle: '#595A89', darkCircle: '#1D1E50' },
  8: { light: '#A47B50', dark: '#5E4630', lightCircle: '#B48C63', darkCircle: '#735B3D' },
  9: { light: '#55A2FF', dark: '#303D99', lightCircle: '#7AC4FF', darkCircle: '#4775D1' },
  10: { light: '#FF7B7B', dark: '#C73546', lightCircle: '#FF9B9B', darkCircle: '#E04A55' },
};

/** Poloměr tlačítka řezu ve **obrazovkových pixelech** (srovnej .machine-outline-control 29×29). */
const BUILD_TILE_SPLIT_BTN_SCREEN_R = 14.5;

/** Malá mezera mezi dvěma dlaždicemi po rozdělení (světové souřadnice). */
const TILE_SPLIT_GAP_WORLD = 10;

const BUILD_TILE_SNAP_SCREEN_PX = 18;
const BUILD_TILE_SNAP_MIN_OVERLAP_WORLD = 2.5;
/** Euklidovský dosah hrubého „navázání řádku“ (pravý okraj + srovnání hran naráz). */
const BUILD_TILE_LINE_CONTINUE_SCREEN_PX = 56;

type BuildTileSnapGuide =
  | { kind: 'v'; x: number; y0: number; y1: number }
  | { kind: 'h'; y: number; x0: number; x1: number };

type XSMode = 'L_R' | 'L_L' | 'R_L' | 'R_R';
type YSMode = 'T_T' | 'T_B' | 'B_T' | 'B_B';

/**
 * Viditelný průnik dvou uzavřených intervalů (např. x-rozsah dlaždic), doplněný o sousedy:
 * pokud sdílená hrana jen „políbkem“ drží nebo mají úzkou štěrbu ≤ threshWorld, stále to
 * považujeme za vhodné pro párové srovnaní vedle/pod sebou (bez toho řada nestojí jako řada).
 */
function tileSnapAxisOverlap(
  lo1: number,
  hi1: number,
  lo2: number,
  hi2: number,
  threshWorld: number,
): { lo: number; hi: number } | null {
  const minSpan = BUILD_TILE_SNAP_MIN_OVERLAP_WORLD;
  const overlapLen = Math.min(hi1, hi2) - Math.max(lo1, lo2);

  if (overlapLen >= minSpan) {
    return { lo: Math.max(lo1, lo2), hi: Math.min(hi1, hi2) };
  }

  // Tenký kladný průnik
  if (overlapLen > 1e-6) {
    const mid = (Math.max(lo1, lo2) + Math.min(hi1, hi2)) / 2;
    return { lo: mid - minSpan * 0.55, hi: mid + minSpan * 0.55 };
  }

  // Dotyk či štěrbina podél osy – typicky řada dlaždic vodorovně vedle sebe
  let gap: number | null = null;
  let seam = 0;
  if (hi1 <= lo2 + 1e-9) {
    gap = lo2 - hi1;
    seam = (hi1 + lo2) / 2;
  } else if (hi2 <= lo1 + 1e-9) {
    gap = lo1 - hi2;
    seam = (hi2 + lo1) / 2;
  } else if (overlapLen <= 1e-6 && overlapLen >= -1e-9 && Math.max(lo1, lo2) <= Math.min(hi1, hi2) + 1e-9) {
    seam = (Math.max(lo1, lo2) + Math.min(hi1, hi2)) / 2;
    gap = 0;
  }

  if (gap === null) return null;
  if (gap > threshWorld + 1e-9) return null;

  const pad = Math.max(minSpan * 0.55, 2.25);
  return { lo: seam - pad / 2, hi: seam + pad / 2 };
}

function betterSnap(candidateAbs: number, candidateAdj: number, best: { absv: number; adj: number } | undefined): boolean {
  if (!best) return true;
  if (candidateAbs + 1e-9 < best.absv) return true;
  if (Math.abs(candidateAbs - best.absv) <= 1e-9 && Math.abs(candidateAdj) < Math.abs(best.adj) - 1e-9) return true;
  return false;
}

function finalizeSnapGuideVertical(
  mode: XSMode,
  movable: BuildNumberTileObject,
  anchor: BuildNumberTileObject,
  _dx: number,
  dy: number,
  threshWorld: number,
): BuildTileSnapGuide {
  const my = movable.y + dy;
  const mb = my + movable.height;
  const al = anchor.x;
  const ar = al + anchor.width;
  const at = anchor.y;
  const ab = at + anchor.height;

  let gx: number;
  switch (mode) {
    case 'L_R':
      gx = ar;
      break;
    case 'L_L':
      gx = al;
      break;
    case 'R_L':
      gx = al;
      break;
    case 'R_R':
      gx = ar;
      break;
    default:
      gx = (al + ar) / 2;
      break;
  }

  const yOv = tileSnapAxisOverlap(my, mb, at, ab, threshWorld);
  if (!yOv) {
    const mid = (my + mb) / 2;
    return { kind: 'v', x: gx, y0: mid, y1: mid };
  }
  return { kind: 'v', x: gx, y0: yOv.lo, y1: yOv.hi };
}

function finalizeSnapGuideHorizontal(
  mode: YSMode,
  movable: BuildNumberTileObject,
  anchor: BuildNumberTileObject,
  dx: number,
  _dy: number,
  threshWorld: number,
): BuildTileSnapGuide {
  const mx = movable.x + dx;
  const mr = mx + movable.width;
  const al = anchor.x;
  const ar = al + anchor.width;
  const at = anchor.y;
  const ab = at + anchor.height;

  let gy: number;
  switch (mode) {
    case 'T_T':
      gy = anchor.y;
      break;
    case 'T_B':
      gy = ab;
      break;
    case 'B_T':
      gy = anchor.y;
      break;
    case 'B_B':
      gy = ab;
      break;
    default:
      gy = (at + ab) / 2;
      break;
  }

  const xOv = tileSnapAxisOverlap(mx, mr, al, ar, threshWorld);
  if (!xOv) {
    const mid = (mx + mr) / 2;
    return { kind: 'h', y: gy, x0: mid, x1: mid };
  }
  return { kind: 'h', y: gy, x0: xOv.lo, x1: xOv.hi };
}

function computeBuildTileSnapAdjustment(
  originalObjects: BoardObject[],
  selectedIds: string[],
  dxRaw: number,
  dyRaw: number,
  viewScale: number,
): { dx: number; dy: number; guides: BuildTileSnapGuide[] } {
  const guides: BuildTileSnapGuide[] = [];
  const selectedSet = new Set(selectedIds);

  const movables = originalObjects.filter(
    (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile' && selectedSet.has(o.id),
  );
  const anchors = originalObjects.filter(
    (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile' && !selectedSet.has(o.id),
  );

  if (movables.length === 0 || anchors.length === 0) {
    return { dx: dxRaw, dy: dyRaw, guides };
  }

  const threshWorld = BUILD_TILE_SNAP_SCREEN_PX / Math.max(viewScale, 1e-6);
  const lineContinueWorld = BUILD_TILE_LINE_CONTINUE_SCREEN_PX / Math.max(viewScale, 1e-6);

  let bestLine:
    | {
        hypo: number;
        dxAdj: number;
        dyAdj: number;
        xMode: XSMode;
        yMode: YSMode;
        m: BuildNumberTileObject;
        a: BuildNumberTileObject;
      }
    | undefined;

  let bestX:
    | { adj: number; absv: number; mode: XSMode; m: BuildNumberTileObject; a: BuildNumberTileObject }
    | undefined;

  let bestY:
    | { adj: number; absv: number; mode: YSMode; m: BuildNumberTileObject; a: BuildNumberTileObject }
    | undefined;

  for (const m of movables) {
    const ml = m.x + dxRaw;
    const mr = ml + m.width;
    const mt = m.y + dyRaw;
    const mb = mt + m.height;

    for (const a of anchors) {
      const al = a.x;
      const ar = al + a.width;
      const at = a.y;
      const ab = at + a.height;

      const acx = (al + ar) / 2;
      const mcx = (ml + mr) / 2;

      // Řada vpravo: levý okraj tahu k pravé stěně kotvy + dorovnat horní/spodní hranici.
      if (mcx >= acx - lineContinueWorld * 0.62 && mr > al - lineContinueWorld * 1.35) {
        const latchDx = ar - ml;
        const latchDyTop = at - mt;
        const latchDyBot = ab - mb;
        const preferTop = Math.abs(latchDyTop) <= Math.abs(latchDyBot);
        const latchDy = preferTop ? latchDyTop : latchDyBot;
        const yMode: YSMode = preferTop ? 'T_T' : 'B_B';
        const hypo = Math.hypot(latchDx, latchDy);
        if (hypo <= lineContinueWorld + 1e-9 && (!bestLine || hypo + 1e-9 < bestLine.hypo)) {
          bestLine = {
            hypo,
            dxAdj: latchDx,
            dyAdj: latchDy,
            xMode: 'L_R',
            yMode,
            m,
            a,
          };
        }
      }

      // Řada vlevo (zrcadlově): pravý okraj k levému boku kotvy.
      if (mcx <= acx + lineContinueWorld * 0.62 && ml < ar + lineContinueWorld * 1.35) {
        const latchDx = al - mr;
        const latchDyTop = at - mt;
        const latchDyBot = ab - mb;
        const preferTop = Math.abs(latchDyTop) <= Math.abs(latchDyBot);
        const latchDy = preferTop ? latchDyTop : latchDyBot;
        const yMode: YSMode = preferTop ? 'T_T' : 'B_B';
        const hypo = Math.hypot(latchDx, latchDy);
        if (hypo <= lineContinueWorld + 1e-9 && (!bestLine || hypo + 1e-9 < bestLine.hypo)) {
          bestLine = {
            hypo,
            dxAdj: latchDx,
            dyAdj: latchDy,
            xMode: 'R_L',
            yMode,
            m,
            a,
          };
        }
      }

      const yOv = tileSnapAxisOverlap(mt, mb, at, ab, threshWorld);
      if (yOv) {
        const xCandidates: Array<{ adj: number; mode: XSMode }> = [
          { adj: ar - ml, mode: 'L_R' },
          { adj: al - ml, mode: 'L_L' },
          { adj: al - mr, mode: 'R_L' },
          { adj: ar - mr, mode: 'R_R' },
        ];
        for (const { adj, mode } of xCandidates) {
          const absv = Math.abs(adj);
          if (absv > threshWorld + 1e-9) continue;
          const cur = bestX ? { absv: bestX.absv, adj: bestX.adj } : undefined;
          if (!betterSnap(absv, adj, cur)) continue;
          bestX = { adj, absv, mode, m, a };
        }
      }

      const xOvForY = tileSnapAxisOverlap(ml, mr, al, ar, threshWorld);
      if (xOvForY) {
        const yCandidates: Array<{ adj: number; mode: YSMode }> = [
          { adj: at - mt, mode: 'T_T' },
          { adj: ab - mt, mode: 'T_B' },
          { adj: at - mb, mode: 'B_T' },
          { adj: ab - mb, mode: 'B_B' },
        ];
        for (const { adj, mode } of yCandidates) {
          const absv = Math.abs(adj);
          if (absv > threshWorld + 1e-9) continue;
          const cur = bestY ? { absv: bestY.absv, adj: bestY.adj } : undefined;
          if (!betterSnap(absv, adj, cur)) continue;
          bestY = { adj, absv, mode, m, a };
        }
      }
    }
  }

  if (bestLine !== undefined) {
    const dx = dxRaw + bestLine.dxAdj;
    const dy = dyRaw + bestLine.dyAdj;
    guides.push(finalizeSnapGuideVertical(bestLine.xMode, bestLine.m, bestLine.a, dx, dy, threshWorld));
    guides.push(finalizeSnapGuideHorizontal(bestLine.yMode, bestLine.m, bestLine.a, dx, dy, threshWorld));
    return { dx, dy, guides };
  }

  const dx = dxRaw + (bestX?.adj ?? 0);
  const dy = dyRaw + (bestY?.adj ?? 0);

  if (bestX) {
    guides.push(finalizeSnapGuideVertical(bestX.mode, bestX.m, bestX.a, dx, dy, threshWorld));
  }
  if (bestY) {
    guides.push(finalizeSnapGuideHorizontal(bestY.mode, bestY.m, bestY.a, dx, dy, threshWorld));
  }

  return { dx, dy, guides };
}

function buildTileSnapGuidesEqual(a: BuildTileSnapGuide[], b: BuildTileSnapGuide[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (x.kind !== y.kind) return false;
    if (x.kind === 'v' && y.kind === 'v') {
      if (
        Math.abs(x.x - y.x) > 0.4 ||
        Math.abs(x.y0 - y.y0) > 0.4 ||
        Math.abs(x.y1 - y.y1) > 0.4
      ) {
        return false;
      }
    } else if (x.kind === 'h' && y.kind === 'h') {
      if (
        Math.abs(x.y - y.y) > 0.4 ||
        Math.abs(x.x0 - y.x0) > 0.4 ||
        Math.abs(x.x1 - y.x1) > 0.4
      ) {
        return false;
      }
    }
  }
  return true;
}

const EXTERNAL_DRAG_NEW_TILE_ID = '__external-new-build-tile__';

function externalTileDragOverlayEqual(
  prev: { tile: BuildNumberTileObject; guides: BuildTileSnapGuide[] } | null,
  next: { tile: BuildNumberTileObject; guides: BuildTileSnapGuide[] },
): boolean {
  if (!prev) return false;
  return (
    prev.tile.x === next.tile.x &&
    prev.tile.y === next.tile.y &&
    prev.tile.value === next.tile.value &&
    prev.tile.variant === next.tile.variant &&
    buildTileSnapGuidesEqual(prev.guides, next.guides)
  );
}

/** Stejné snappování jako při táhnutí dlaždice na desce; vstup je střed pod kurzorem. */
function snapNewBuildTilePosition(
  center: Point,
  value: number,
  variant: 'stacked' | 'flat',
  anchors: BuildNumberTileObject[],
  viewScale: number,
): { x: number; y: number; guides: BuildTileSnapGuide[] } {
  const cellWidth = variant === 'flat' ? 44 : 34;
  const height = variant === 'flat' ? 44 : cellWidth * (83 / 60);
  const width = cellWidth * value;
  const x0 = center.x - width / 2;
  const y0 = center.y - height / 2;

  if (anchors.length === 0) {
    return { x: x0, y: y0, guides: [] };
  }

  const tempTile: BuildNumberTileObject = {
    kind: 'buildNumberTile',
    id: EXTERNAL_DRAG_NEW_TILE_ID,
    x: x0,
    y: y0,
    value,
    variant,
    cellWidth,
    width,
    height,
  };

  const originalObjects: BoardObject[] = [...anchors, tempTile];
  const snapped = computeBuildTileSnapAdjustment(originalObjects, [EXTERNAL_DRAG_NEW_TILE_ID], 0, 0, viewScale);
  return {
    x: x0 + snapped.dx,
    y: y0 + snapped.dy,
    guides: snapped.guides,
  };
}

function buildTileSplitButtonCenterWorld(tile: BuildNumberTileObject, splitAfter: number): Point {
  const cw = tile.cellWidth;
  return {
    x: tile.x + (splitAfter + 1) * cw,
    y: tile.y + tile.height / 2,
  };
}

/** Klik jen na „nůžky“ — né na celý průběžný pás mezery. */
function hitBuildTileSplitButton(tile: BuildNumberTileObject, world: Point, viewScale: number): number | null {
  if (tile.value <= 1) return null;
  const rWorld = BUILD_TILE_SPLIT_BTN_SCREEN_R / viewScale;
  const slack = (viewScale >= 1 ? 2 : 3) / viewScale;
  for (let splitAfter = 0; splitAfter <= tile.value - 2; splitAfter += 1) {
    const c = buildTileSplitButtonCenterWorld(tile, splitAfter);
    if (Math.hypot(world.x - c.x, world.y - c.y) <= rWorld + slack) return splitAfter;
  }
  return null;
}

/**
 * Vrací splitAfter: poslední index článku v levé části (levá část má splitAfter+1 článků).
 * world musí být uvnitř obdélníku dlaždice; testuje pruhy kolem svislých hran mezi články.
 */
function hitBuildTileSplitGap(tile: BuildNumberTileObject, world: Point): number | null {
  if (tile.value <= 1) return null;
  const lx = world.x - tile.x;
  const ly = world.y - tile.y;
  if (lx <= 0 || lx >= tile.width || ly <= 0 || ly >= tile.height) return null;
  const cw = tile.cellWidth;
  const halfBand = clamp(cw * 0.24, 5, 12);
  for (let boundary = 1; boundary < tile.value; boundary += 1) {
    const bx = boundary * cw;
    if (Math.abs(lx - bx) <= halfBand) return boundary - 1;
  }
  return null;
}

function splitBuildNumberTileIntoTwo(tile: BuildNumberTileObject, splitAfter: number): [BuildNumberTileObject, BuildNumberTileObject] {
  const leftN = splitAfter + 1;
  const rightN = tile.value - leftN;
  if (leftN < 1 || rightN < 1) throw new Error('invalid split');

  const cellWidth = tile.cellWidth;
  const height = tile.variant === 'flat' ? cellWidth : cellWidth * (83 / 60);
  const gap = TILE_SPLIT_GAP_WORLD;

  const left: BuildNumberTileObject = {
    kind: 'buildNumberTile',
    id: crypto.randomUUID(),
    x: tile.x,
    y: tile.y,
    value: leftN,
    variant: tile.variant,
    cellWidth,
    width: cellWidth * leftN,
    height,
  };

  const right: BuildNumberTileObject = {
    kind: 'buildNumberTile',
    id: crypto.randomUUID(),
    x: tile.x + left.width + gap,
    y: tile.y,
    value: rightN,
    variant: tile.variant,
    cellWidth,
    width: cellWidth * rightN,
    height,
  };

  return [left, right];
}

function ghostTileAtCenter(value: number, variant: 'stacked' | 'flat', center: Point): BuildNumberTileObject {
  const cellWidth = variant === 'flat' ? 44 : 34;
  const height = variant === 'flat' ? 44 : cellWidth * (83 / 60);
  const width = cellWidth * value;
  return {
    kind: 'buildNumberTile',
    id: '__ghost-tile__',
    x: center.x - width / 2,
    y: center.y - height / 2,
    value,
    variant,
    cellWidth,
    width,
    height,
  };
}

/** Zobrazuje stejnou hodnotu; clamp 1–10. Levý horní roh dlaždice zůstane. */
function buildNumberTileWithValue(tile: BuildNumberTileObject, nextValue: number): BuildNumberTileObject {
  const v = Math.min(10, Math.max(1, nextValue));
  if (v === tile.value) return tile;
  const cellWidth = tile.cellWidth;
  const height = tile.variant === 'flat' ? cellWidth : cellWidth * (83 / 60);
  const width = cellWidth * v;
  return {
    ...tile,
    value: v,
    width,
    height,
  };
}

function sortBuildTilesReadingOrder(tiles: BuildNumberTileObject[]): BuildNumberTileObject[] {
  return [...tiles].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
}

/** Sloučení více dlaždic do jedné; při součtu přes 10 nebo méně než dvou kusů vrátí `null`. */
function mergeBuildNumberTilesIfAllowed(tiles: BuildNumberTileObject[]): BuildNumberTileObject | null {
  if (tiles.length < 2) return null;
  const sum = tiles.reduce((s, t) => s + t.value, 0);
  if (sum > 10) return null;
  const sorted = sortBuildTilesReadingOrder(tiles);
  const variant = sorted[0].variant;
  const cellWidth = sorted[0].cellWidth;
  const minX = Math.min(...tiles.map((t) => t.x));
  const minY = Math.min(...tiles.map((t) => t.y));
  const height = variant === 'flat' ? cellWidth : cellWidth * (83 / 60);
  const width = cellWidth * sum;
  return {
    kind: 'buildNumberTile',
    id: crypto.randomUUID(),
    x: minX,
    y: minY,
    value: sum,
    variant,
    cellWidth,
    width,
    height,
  };
}

let buildTileAudioCtx: AudioContext | null = null;

function playBuildTileCountBeep(tileOrdinal: number, dotInTile: number) {
  const AC =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : null;
  if (!AC) return;
  try {
    if (!buildTileAudioCtx) buildTileAudioCtx = new AC();
    const ctx = buildTileAudioCtx;
    void ctx.resume();
    const baseHz = 300 + tileOrdinal * 95 + dotInTile * 6;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tileOrdinal % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseHz, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t0 = ctx.currentTime;
    const dur = 0.085;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {
    /* bez zvuku */
  }
}

function BuildTileSplitScissorsGlyph() {
  return (
    <g
      className="build-tile-split-scissors-stroke"
      fill="none"
      stroke="#fefce8"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-12,-12)"
      vectorEffect="nonScalingStroke"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </g>
  );
}

function BuildNumberTileSvg({
  tile,
  splitHoverAfter = null,
  viewportScale = 1,
  playbackHighlightCell = null,
}: {
  tile: BuildNumberTileObject;
  splitHoverAfter?: number | null;
  viewportScale?: number;
  /** Přehrávání: zvýraznění jedné „články“ dlaždice (0 … value−1). */
  playbackHighlightCell?: number | null;
}) {
  const colors = LEGO_COLORS[tile.value] ?? LEGO_COLORS[1];
  const cellWidth = tile.cellWidth;

  const splitHint =
    splitHoverAfter !== null && tile.value > 1 ? (
      <g className="build-tile-split-hover">
        {(() => {
          const cx = tile.x + (splitHoverAfter + 1) * cellWidth;
          const inset = Math.max(3, tile.height * 0.08);
          const pxScale = viewportScale >= 1e-6 ? 1 / viewportScale : 1;
          const rHud = BUILD_TILE_SPLIT_BTN_SCREEN_R;
          return (
            <>
              <line
                pointerEvents="none"
                className="selection-outline"
                x1={cx}
                y1={tile.y + inset}
                x2={cx}
                y2={tile.y + tile.height - inset}
              />
              <g pointerEvents="none" transform={`translate(${cx},${tile.y + tile.height / 2}) scale(${pxScale})`}>
                <circle r={rHud} className="build-tile-split-button-disk" vectorEffect="nonScalingStroke" />
                <g transform="scale(0.68)">
                  <BuildTileSplitScissorsGlyph />
                </g>
              </g>
            </>
          );
        })()}
      </g>
    ) : null;

  if (tile.variant === 'flat') {
    const circleSize = cellWidth * 0.5;
    return (
      <g>
        <rect
          x={tile.x}
          y={tile.y}
          width={tile.width}
          height={tile.height}
          fill={colors.light}
          stroke={colors.dark}
          strokeWidth={2}
        />
        {Array.from({ length: tile.value }).map((_, index) => (
          <circle
            key={index}
            cx={tile.x + cellWidth * index + cellWidth / 2}
            cy={tile.y + tile.height / 2}
            r={circleSize / 2}
            fill={colors.lightCircle}
            stroke={colors.dark}
            strokeWidth={2}
          />
        ))}
        {playbackHighlightCell !== null &&
        playbackHighlightCell >= 0 &&
        playbackHighlightCell < tile.value && (
          <rect
            x={tile.x + cellWidth * playbackHighlightCell}
            y={tile.y}
            width={cellWidth}
            height={tile.height}
            fill="rgba(251, 191, 36, 0.4)"
            stroke="#ea580c"
            strokeWidth={2.5}
            rx={6}
            pointerEvents="none"
          />
        )}
        {splitHint}
      </g>
    );
  }

  const topHeight = cellWidth * (40 / 60);
  const bottomHeight = cellWidth * 0.5;
  const circleSize = cellWidth * (40 / 60);
  const circleGap = cellWidth * (10 / 60);
  const circleOffset = cellWidth * (37 / 60);
  const totalHeight = bottomHeight + topHeight + circleSize + circleGap - circleOffset;

  return (
    <g>
      {Array.from({ length: tile.value }).map((_, index) => {
        const x = tile.x + index * cellWidth;
        const y = tile.y;
        const bottomY = y + totalHeight - bottomHeight;
        const topY = bottomY - topHeight;
        const circleY = y + totalHeight - (bottomHeight + topHeight - circleOffset) - circleSize;
        const topCircleY = y + totalHeight - (bottomHeight + topHeight - circleOffset + circleGap) - circleSize;
        return (
          <g key={index}>
            <rect x={x} y={bottomY} width={cellWidth} height={bottomHeight} fill={colors.dark} />
            <rect x={x} y={topY} width={cellWidth} height={topHeight} fill={colors.light} />
            <circle cx={x + cellWidth / 2} cy={circleY + circleSize / 2} r={circleSize / 2} fill={colors.darkCircle} />
            <circle
              cx={x + cellWidth / 2}
              cy={topCircleY + circleSize / 2}
              r={circleSize / 2}
              fill={colors.lightCircle}
            />
            {playbackHighlightCell === index ? (
              <rect
                x={x}
                y={y}
                width={cellWidth}
                height={totalHeight}
                fill="rgba(251, 191, 36, 0.36)"
                stroke="#ea580c"
                strokeWidth={2.5}
                rx={4}
                pointerEvents="none"
              />
            ) : null}
          </g>
        );
      })}
      {splitHint}
    </g>
  );
}

function isMathGlyphInputChar(ch: string): boolean {
  if (ch.length !== 1) return false;
  if (/^[0-9]$/.test(ch)) return true;
  if ('+×÷=,.−'.includes(ch)) return true;
  if (ch === '-' || ch === '−') return true;
  return false;
}

function normalizeMathGlyphChar(ch: string): string {
  if (ch === '-') return '−';
  return ch;
}

/** Jednobyte / znak řádkové editace nástrojem Text — bez řídicích znaků. */
function isTextGlyphInputChar(ch: string): boolean {
  if (ch.length !== 1) return false;
  const c = ch.charCodeAt(0);
  return c >= 32 && c !== 127;
}

function MathGlyphSvg({
  object,
  editing = false,
  caretVisible = true,
  ink = '#1e1b4b',
}: {
  object: MathGlyphObject;
  editing?: boolean;
  caretVisible?: boolean;
  ink?: string;
}) {
  const stroke = object.strokeColor ?? ink;
  const isTransparent = object.pillFill === 'transparent';
  const rectFill =
    isTransparent
      ? 'none'
      : object.pillFill === undefined
        ? '#ffffff'
        : object.pillFill;
  const showFrame = !isTransparent;
  const pillShape = object.pillShape ?? 'round';
  const isScript = object.fontVariant === 'script';
  const { width, height, fontSize, charW } = mathGlyphPillDimensions(object.label, object.r);
  const cx = object.x + width / 2;
  const cy = object.y + height / 2;
  const tw = object.label.length * charW;
  const caretX = object.label.length === 0 ? cx : cx + tw / 2 + 1;
  const showCaret = editing && caretVisible;
  const caretHalf = fontSize * 0.38;
  const rw = Math.max(0, width - 2);
  const rh = Math.max(0, height - 2);
  const maxCorner = Math.min(rw, rh) / 2;
  const roundCorner = Math.max(1, Math.min(rh / 2 - 0.5, maxCorner));
  const squareCorner = Math.max(6, Math.min(16, rh * 0.2));
  const cornerR = pillShape === 'square' ? Math.min(squareCorner, maxCorner) : Math.min(roundCorner, maxCorner);
  return (
    <g>
      {showFrame ? (
        <rect
          x={object.x + 1}
          y={object.y + 1}
          width={rw}
          height={rh}
          rx={cornerR}
          ry={cornerR}
          fill={rectFill}
          stroke={stroke}
          strokeWidth={2}
        />
      ) : null}
      <text
        x={cx}
        y={cy + object.r * (isScript ? 0.34 : 0.38)}
        fill={stroke}
        fontSize={fontSize}
        fontWeight={800}
        fontFamily={isScript ? 'var(--font-math-script)' : 'var(--font-math-strip)'}
        stroke={isScript ? stroke : undefined}
        strokeWidth={isScript ? 1.52 : undefined}
        paintOrder={isScript ? 'stroke fill' : undefined}
        textAnchor="middle"
        style={{ userSelect: 'none' }}
      >
        {object.label}
      </text>
      {showCaret ? (
        <line
          x1={caretX}
          x2={caretX}
          y1={cy - caretHalf}
          y2={cy + caretHalf}
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}

function NumberLineSvg({
  line,
  selected,
  onResizeStart,
}: {
  line: NumberLineObject;
  selected: boolean;
  onResizeStart: (event: React.PointerEvent<SVGGElement>, line: NumberLineObject, side: 'start' | 'end') => void;
}) {
  const centerY = line.y + line.height / 2;
  const radius = NUMBER_LINE_TICK_R;
  const left = line.x + radius;
  const right = line.x + line.width - radius;
  const values = Array.from({ length: line.end - line.start + 1 }, (_, index) => line.start + index);
  const figures = getNumberLineFigures(line);
  const accent = line.accentColor ?? '#1e1b4b';
  const tickFill = line.tickFill ?? '#ffffff';

  return (
    <g>
      <line x1={left} y1={centerY} x2={right} y2={centerY} stroke={accent} strokeWidth={2} opacity={0.45} />
      {values.map((value, index) => {
        const cx = left + index * line.spacing;
        const trailHits = line.trails?.filter((trail) => trail.value === value).slice(-4) ?? [];
        return (
          <g key={value}>
            {trailHits.map((trail, trailIndex) => (
              <circle
                className="number-line-trail"
                cx={cx}
                cy={centerY}
                key={trail.id}
                r={radius + 7 + trailIndex * 3}
                style={{
                  fill: trail.color ? `${trail.color}66` : undefined,
                  stroke: trail.color ?? undefined,
                }}
              />
            ))}
            <circle cx={cx} cy={centerY} r={radius} fill={tickFill} stroke={accent} strokeWidth={1.5} />
            <text
              x={cx}
              y={centerY + 5}
              fill={accent}
              fontSize={16}
              fontWeight={800}
              textAnchor="middle"
              style={{ userSelect: 'none' }}
            >
              {value}
            </text>
          </g>
        );
      })}
      {line.mode === 'withFigure' &&
        figures.map((figure, figureListIndex) => {
          const figureIndex = figure.position - line.start;
          if (figureIndex < 0 || figureIndex >= values.length) return null;
          const figureX =
            left + figureIndex * line.spacing + (figureListIndex === 1 ? NUMBER_LINE_FIGURE_PAIR_DX : 0);
          const footY = centerY + radius - NUMBER_LINE_FIGURE_LIFT_Y;
          const href = numberLineBoardGameFigureUrl(figureListIndex);
          const hw = NUMBER_LINE_FIGURE_SPRITE_W / 2;
          return (
            <g className="number-line-figure" key={figure.id} pointerEvents="none" transform={`translate(${figureX} ${footY})`}>
              <image
                href={href}
                x={-hw}
                y={-NUMBER_LINE_FIGURE_SPRITE_H}
                width={NUMBER_LINE_FIGURE_SPRITE_W}
                height={NUMBER_LINE_FIGURE_SPRITE_H}
                preserveAspectRatio="xMidYMax meet"
              />
            </g>
          );
        })}
      {selected && (
        <>
          <g
            className="number-line-control"
            onPointerDown={(event) => onResizeStart(event, line, 'start')}
          >
            <rect x={line.x - 13} y={line.y + line.height * 0.25 - 4} width={10} height={(line.height + 16) / 2} rx={5} />
          </g>
          <g
            className="number-line-control"
            onPointerDown={(event) => onResizeStart(event, line, 'end')}
          >
            <rect x={line.x + line.width + 3} y={line.y + line.height * 0.25 - 4} width={10} height={(line.height + 16) / 2} rx={5} />
          </g>
        </>
      )}
    </g>
  );
}

function beadY(counter: BeadCounterObject) {
  return counter.y + beadCounterWireCenterY(counter);
}

function BeadCounterSvg({
  counter,
  onBeadPointerDown,
}: {
  counter: BeadCounterObject;
  onBeadPointerDown: (event: React.PointerEvent<SVGGElement>, counter: BeadCounterObject, beadId: string) => void;
}) {
  const wireY = beadCounterWireCenterY(counter);
  const wire = counter.wireColor ?? '#ef123f';
  const labelRowY =
    wireY +
    counter.beadRadius * 1.38 +
    BEAD_COUNTER_GROUP_COUNT_FONT_SIZE / 2 +
    BEAD_COUNTER_GROUP_LABEL_GAP_AFTER_BEADS_PX +
    BEAD_COUNTER_GROUP_LABEL_EXTRA_DOWN_PX;

  return (
    <g transform={`translate(${counter.x} ${counter.y})`}>
      <path
        d={`M 4 ${wireY - 5} Q 12 ${wireY - 16} 20 ${wireY - 5} Q 12 ${wireY + 6} 4 ${wireY - 5}`}
        fill="none"
        stroke={wire}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <line
        x1={16}
        y1={wireY}
        x2={counter.width - 16}
        y2={wireY}
        fill="none"
        stroke={wire}
        strokeLinecap="round"
        strokeWidth={7}
      />
      <path
        d={`M ${counter.width - 4} ${wireY - 5} Q ${counter.width - 12} ${wireY - 16} ${counter.width - 20} ${wireY - 5} Q ${counter.width - 12} ${wireY + 6} ${counter.width - 4} ${wireY - 5}`}
        fill="none"
        stroke={wire}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      {counter.beads.map((bead) => {
        const cx = bead.position;
        const cy = wireY;
        const imageSize = counter.beadRadius * 2.7;
        const holeX = cx + imageSize * 0.23;
        const holeRadius = imageSize * 0.12;
        return (
          <g
            className="bead-counter-bead"
            key={bead.id}
            onPointerDown={(event) => onBeadPointerDown(event, counter, bead.id)}
          >
            <circle cx={cx} cy={cy} r={counter.beadRadius + 10} fill="transparent" />
            {bead.imageUrl ? (
              <>
                <defs>
                  <clipPath id={`bead-thread-hole-${bead.id}`}>
                    <circle cx={holeX} cy={cy} r={holeRadius} />
                  </clipPath>
                </defs>
                <image
                  href={bead.imageUrl}
                  x={cx - imageSize / 2}
                  y={cy - imageSize / 2}
                  width={imageSize}
                  height={imageSize}
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    filter: cssTextureImageTintFilter(
                      bead.color,
                      /yellow/i.test(bead.imageUrl)
                        ? BEAD_TEXTURE_REF_YELLOW
                        : BEAD_TEXTURE_REF_BLUE,
                    ),
                  }}
                />
                <line
                  x1={holeX - holeRadius * 1.45}
                  y1={cy}
                  x2={holeX + holeRadius * 1.45}
                  y2={cy}
                  stroke={wire}
                  strokeLinecap="round"
                  strokeWidth={7}
                  clipPath={`url(#bead-thread-hole-${bead.id})`}
                  pointerEvents="none"
                />
              </>
            ) : (
              <>
                <ellipse cx={cx + 4} cy={cy + 4} rx={counter.beadRadius * 0.78} ry={counter.beadRadius} fill="rgba(15, 23, 42, 0.16)" />
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={counter.beadRadius * 0.78}
                  ry={counter.beadRadius}
                  fill={bead.color}
                  stroke="rgba(30, 27, 75, 0.24)"
                  strokeWidth={2}
                />
                <ellipse
                  cx={cx - counter.beadRadius * 0.22}
                  cy={cy - counter.beadRadius * 0.22}
                  rx={counter.beadRadius * 0.24}
                  ry={counter.beadRadius * 0.38}
                  fill="rgba(255, 255, 255, 0.3)"
                />
                <circle cx={cx + counter.beadRadius * 0.3} cy={cy} r={counter.beadRadius * 0.22} fill="rgba(30, 27, 75, 0.26)" />
              </>
            )}
          </g>
        );
      })}
      {counter.showGroupCounts &&
        !counter.showTotalSum &&
        beadCounterPositionClusters(counter).map((cluster, index) => (
          <text
            className="bead-counter-group-count"
            key={`gc-${counter.id}-${index}`}
            x={cluster.centerX}
            y={labelRowY}
            fill="#1e1b4b"
            fontSize={BEAD_COUNTER_GROUP_COUNT_FONT_SIZE}
            fontWeight={750}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {cluster.count}
          </text>
        ))}
      {counter.showTotalSum &&
        (() => {
          const expr = beadCounterSumLineExpression(counter);
          if (!expr) return null;
          return (
            <text
              className="bead-counter-group-count"
              key={`gc-${counter.id}-sum`}
              x={counter.width / 2}
              y={labelRowY}
              fill="#1e1b4b"
              fontSize={BEAD_COUNTER_GROUP_COUNT_FONT_SIZE}
              fontWeight={750}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {expr}
            </text>
          );
        })()}
    </g>
  );
}

function ArithmeticExampleSvg({
  object,
  answer,
  status,
  selected,
}: {
  object: ArithmeticExampleObject;
  answer: ReturnType<typeof arithmeticAnswerFromGlyphs>;
  status: ArithmeticExampleStatus;
  selected: boolean;
}) {
  const answerRect = arithmeticAnswerRect(object);
  const symbol = arithmeticOperationSymbol(object.example.operation);
  const sub = arithmeticSubmitButtonCenter(object);
  return (
    <g
      className={`arithmetic-example-block arithmetic-example-card arithmetic-example-card--${status}${
        selected ? ' is-active' : ''
      }`}
    >
      <rect
        className="arithmetic-example-card-bg"
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx={22}
      />
      <text
        className="arithmetic-example-index"
        x={object.x + 24}
        y={object.y + 32}
        dominantBaseline="middle"
      >
        {object.example.index}
      </text>
      <text
        className="arithmetic-example-expression"
        x={object.x + 38}
        y={object.y + 76}
        dominantBaseline="middle"
      >
        {object.example.a} {symbol} {object.example.b} =
      </text>
      <rect
        className="arithmetic-example-answer-zone"
        x={answerRect.x}
        y={answerRect.y}
        width={answerRect.width}
        height={answerRect.height}
        rx={18}
      />
      <circle
        className="arithmetic-example-submit-circle"
        cx={sub.x}
        cy={sub.y}
        r={ARITHMETIC_SUBMIT_R}
      />
      <text
        className="arithmetic-example-submit-check"
        x={sub.x}
        y={sub.y + 1}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        ✓
      </text>
      {object.submitted ? (
        <text
          className="arithmetic-example-status"
          x={object.x + object.width / 2}
          y={object.y - 14}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {answer?.correct ? 'správně' : 'zkus znovu'}
        </text>
      ) : null}
    </g>
  );
}

function MarbleBagExampleSvg({
  object,
  selected,
  allObjects,
  dropTarget,
  focusedMarbleItemId,
}: {
  object: MarbleBagExampleObject;
  selected: boolean;
  allObjects: BoardObject[];
  dropTarget: boolean;
  focusedMarbleItemId: string | null;
}) {
  const status = marbleBagExampleStatus(object, allObjects);
  const ex = object.example;
  const { scale, sx, gy } = marbleBagExampleGeometry(object);
  const sw = (value: number) => value * scale;
  const answerRect = marbleBagAnswerRect(object);
  const sub = marbleBagSubmitButtonCenter(object);
  const shadowFilterId = `marble-bag-task-shadow-${object.id}`;
  const softFilterId = `marble-bag-task-soft-${object.id}`;

  const titleY = gy(62);
  const table = { x: sx(190), y: gy(210), width: sw(820), height: sw(388), radius: sw(26) };
  const bag = { x: sx(450), y: gy(40), width: sw(576), height: sw(384) };
  const titleBallX = sx(600 + Math.min(ex.total, 12) * 20);
  const tablePositions = [
    { x: 250, y: 280 },
    { x: 350, y: 365 },
    { x: 455, y: 285 },
    { x: 455, y: 395 },
    { x: 270, y: 490 },
    { x: 365, y: 475 },
    { x: 520, y: 370 },
    { x: 290, y: 395 },
    { x: 520, y: 500 },
  ];

  const titleBallLeft = ex.totalDisplayMode === 'number' ? sx(600) : titleBallX;
  const titleBallTop = gy(20);
  const titleMarbleMr = 34 * scale;

  const glyphDigits = marbleBagGlyphDigitsText(object, allObjects);
  const glyphNormalized =
    glyphDigits !== null ? normalizeArithmeticAnswerText(glyphDigits) : '';
  const hasGlyphAnswer = glyphNormalized.length > 0 && /^\d+$/.test(glyphNormalized);
  const numberLabels = object.items
    .filter((item) => item.kind === 'number' && item.label)
    .map((item) => item.label)
    .join('');
  const hasNumberItems = ex.answerMode === 'number' && /^\d+$/.test(numberLabels);
  const marbleN = object.items.filter((item) => item.kind === 'marble').length;
  let answerZoneDisplay: string | null = null;
  if (hasGlyphAnswer) {
    answerZoneDisplay = glyphNormalized;
  } else if (hasNumberItems) {
    answerZoneDisplay = numberLabels;
  } else if (marbleN > 0) {
    answerZoneDisplay = String(marbleN);
  }
  return (
    <g
      className={`arithmetic-example-block marble-bag-example-block arithmetic-example-card--${status}${
        selected ? ' is-active' : ''
      }`}
    >
      <defs>
        <filter id={shadowFilterId} x="-10%" y="-18%" width="120%" height="140%">
          <feDropShadow dx={0} dy={14 * scale} stdDeviation={15 * scale} floodColor="#4b321f" floodOpacity={0.24} />
        </filter>
        <filter id={softFilterId} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx={0} dy={4 * scale} stdDeviation={3 * scale} floodColor="#3b2818" floodOpacity={0.2} />
        </filter>
      </defs>
      <text
        className="marble-bag-example-title"
        x={sx(520)}
        y={titleY}
        fill="#03036a"
        fontSize={62 * scale}
        fontWeight={900}
        textAnchor="end"
        dominantBaseline="middle"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {ex.totalDisplayMode === 'number' ? `MÁM ${ex.total}` : 'MÁM'}
      </text>
      {ex.totalDisplayMode === 'lines' ? (
        <g pointerEvents="none">
          {Array.from({ length: ex.total }).map((_, index) => (
            <path
              key={index}
              d={`M ${sx(542 + index * 19)} ${gy(14)} Q ${sx(552 + index * 19)} ${gy(52)} ${sx(542 + index * 19)} ${gy(91)}`}
              stroke="#03036a"
              strokeWidth={3.9 * scale}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>
      ) : null}
      <MarbleBagTaskMarbleDisc
        cx={titleBallLeft + 36 * scale}
        cy={titleBallTop + 36 * scale}
        mr={titleMarbleMr}
        color={MARBLE_BAG_STOCK_MARBLE_COLOR}
        scale={scale}
      />

      <rect
        x={table.x}
        y={table.y + 10 * scale}
        width={table.width}
        height={table.height}
        rx={table.radius}
        fill="#755838"
        opacity={0.9}
        filter={`url(#${shadowFilterId})`}
      />
      <rect
        x={table.x}
        y={table.y}
        width={table.width}
        height={table.height}
        rx={table.radius}
        fill="#fff8ef"
        filter={`url(#${shadowFilterId})`}
      />
      <MarbleBagYellowTaskSvg
        x={bag.x}
        y={bag.y}
        width={bag.width}
        height={bag.height}
        dropTarget={dropTarget}
      />
      <g pointerEvents="none">
        {Array.from({ length: ex.onTable }, (_, index) => {
          const p = tablePositions[index % tablePositions.length];
          const row = Math.floor(index / tablePositions.length);
          const left = sx(p.x + row * 28);
          const top = gy(p.y + row * 18);
          const mr = 27 * scale;
          return (
            <MarbleBagTaskMarbleDisc
              key={index}
              cx={left + 30 * scale}
              cy={top + 30 * scale}
              mr={mr}
              color={MARBLE_BAG_STOCK_MARBLE_COLOR}
              scale={scale}
            />
          );
        })}
      </g>
      <g pointerEvents="none">
        {object.items
          .filter((item): item is Extract<MarbleBagItem, { kind: 'marble' }> => item.kind === 'marble')
          .map((item) => {
            const p = marbleBagMarbleLayoutPosition(object, item);
            const mr = 34 * scale;
            const delX = sx(p.x) + mr * 0.75;
            const delY = gy(p.y) - mr * 0.75;
            return (
              <g key={item.id}>
                <MarbleBagTaskMarbleDisc
                  cx={sx(p.x)}
                  cy={gy(p.y)}
                  mr={mr}
                  color={item.color}
                  scale={scale}
                />
                {focusedMarbleItemId === item.id ? (
                  <g className="marble-bag-marble-delete-chip" pointerEvents="none" aria-hidden>
                    <circle
                      cx={delX}
                      cy={delY}
                      r={MARBLE_BAG_DELETE_CHIP_CIRCLE_R * scale}
                      fill="white"
                      stroke="#4f46e5"
                      strokeWidth={2.2 * scale}
                    />
                    <text
                      x={delX}
                      y={delY + 1.2 * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#312e81"
                      fontSize={MARBLE_BAG_DELETE_CHIP_FONT * scale}
                      fontWeight={800}
                    >
                      ×
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
      </g>
      <text
        className="marble-bag-example-label marble-bag-example-label--caps"
        x={answerRect.x - 12 * scale}
        y={answerRect.y + answerRect.height * 0.52}
        fill="#03036a"
        fontSize={66 * scale}
        fontWeight={800}
        textAnchor="end"
        dominantBaseline="middle"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        V PYTLÍKU JE:
      </text>
      <rect
        className="arithmetic-example-answer-zone"
        x={answerRect.x}
        y={answerRect.y}
        width={answerRect.width}
        height={answerRect.height}
        rx={12 * scale}
      />
      {answerZoneDisplay !== null && !hasGlyphAnswer ? (
        <text
          className="marble-bag-example-zone-value"
          x={answerRect.x + answerRect.width / 2}
          y={answerRect.y + answerRect.height * 0.62}
          fill="#1e1b4b"
          fontSize={54 * scale}
          fontWeight={800}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {answerZoneDisplay}
        </text>
      ) : null}
      <circle className="arithmetic-example-submit-circle" cx={sub.x} cy={sub.y} r={ARITHMETIC_SUBMIT_R} />
      <text
        className="arithmetic-example-submit-check marble-bag-example-submit-check"
        x={sub.x}
        y={sub.y + 1}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        ✓
      </text>
      {object.submitted ? (
        <text
          className="arithmetic-example-status marble-bag-example-status"
          x={object.x + object.width / 2}
          y={object.y - 14}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {status === 'submitted-correct' ? 'správně' : 'zkus znovu'}
        </text>
      ) : null}
    </g>
  );
}

function VividbooksDominoMinihryTile({
  ex,
  plasticGradId,
  plasticFilterId,
}: {
  ex: DominoExample;
  plasticGradId: string;
  plasticFilterId: string;
}) {
  const hr = vividDominoHiddenHalfRect('left');
  const hrR = vividDominoHiddenHalfRect('right');

  const leftDots = vividDominoDotCentersInViewBox(ex.leftPips, 'left').map((d, i) => (
    <circle
      key={`lp-${i}`}
      cx={d.cx}
      cy={d.cy}
      r={d.r}
      fill={`url(#${plasticGradId})`}
      stroke="#666"
      strokeWidth={0.5}
      filter={`url(#${plasticFilterId})`}
    />
  ));

  const rightDots = vividDominoDotCentersInViewBox(ex.rightPips, 'right').map((d, i) => (
    <circle
      key={`rp-${i}`}
      cx={d.cx}
      cy={d.cy}
      r={d.r}
      fill={`url(#${plasticGradId})`}
      stroke="#666"
      strokeWidth={0.5}
      filter={`url(#${plasticFilterId})`}
    />
  ));

  return (
    <g pointerEvents="none">
      <image
        href={VIVID_DOMINO_TILE_ARTWORK}
        x={0}
        y={0}
        width={VIVID_DOMINO_VIEW_W}
        height={VIVID_DOMINO_VIEW_H}
        preserveAspectRatio="xMidYMid meet"
      />
      {ex.leftPips === null ? (
        <rect
          x={hr.x}
          y={hr.y}
          width={hr.width}
          height={hr.height}
          rx={hr.rx}
          ry={hr.rx}
          fill="white"
          fillOpacity={0.9}
          stroke={VIVID_DOMINO_ACCENT}
          strokeWidth={4}
        />
      ) : (
        leftDots
      )}
      {ex.rightPips === null ? (
        <rect
          x={hrR.x}
          y={hrR.y}
          width={hrR.width}
          height={hrR.height}
          rx={hrR.rx}
          ry={hrR.rx}
          fill="white"
          fillOpacity={0.9}
          stroke={VIVID_DOMINO_ACCENT}
          strokeWidth={4}
        />
      ) : (
        rightDots
      )}
    </g>
  );
}

function dominoTileToSyntheticExample(tile: DominoTileObject): DominoExample {
  return {
    id: tile.id,
    index: 0,
    mode: 'partition',
    leftPips: tile.leftPips,
    rightPips: tile.rightPips,
    targetSum: tile.leftPips + tile.rightPips,
    expectLeft: tile.leftPips,
    expectRight: tile.rightPips,
  };
}

function InteractiveDominoTileSvg({ tile }: { tile: DominoTileObject }) {
  const plasticGradId = `domino-tile-grad-${tile.id}`;
  const plasticFiltId = `domino-tile-filt-${tile.id}`;
  const ex = dominoTileToSyntheticExample(tile);
  const bw = VIVID_DOMINO_VIEW_W;
  const bh = VIVID_DOMINO_VIEW_H;

  return (
    <g className="domino-tile-interactive-root">
      <g transform={`translate(${tile.x}, ${tile.y})`}>
        <svg width={tile.width} height={tile.height} viewBox={`0 0 ${bw} ${bh}`} overflow="visible">
          <defs>
            <radialGradient id={plasticGradId} cx="0.3" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#4a4a4a" />
              <stop offset="30%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </radialGradient>
            <filter id={plasticFiltId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="rgba(0,0,0,0.2)" />
            </filter>
          </defs>
          <g style={{ pointerEvents: 'none' }}>
            <VividbooksDominoMinihryTile ex={ex} plasticGradId={plasticGradId} plasticFilterId={plasticFiltId} />
          </g>
          {/* Celoplošný zachytávač: bez stopPropagation kvůli výběru/tažení na hlavním SVG. */}
          <rect x={0} y={0} width={bw} height={bh} fill="transparent" />
        </svg>
      </g>
    </g>
  );
}

function DominoDotsRowStripe({
  cx,
  y,
  maxWidth,
  count,
  plasticGradId,
  plasticFilterId,
}: {
  cx: number;
  y: number;
  maxWidth: number;
  count: number;
  plasticGradId: string;
  plasticFilterId: string;
}) {
  const maxDots = Math.min(Math.max(count, 0), 18);
  if (maxDots === 0) return null;
  const gap = Math.max(17, Math.min(27, maxWidth / (maxDots + 1)));
  const rowW = gap * Math.max(maxDots - 1, 0);
  const cx0 = cx - rowW / 2;
  const pr = Math.min(11, Math.max(6, gap * 0.3));
  return (
    <g pointerEvents="none">
      {Array.from({ length: maxDots }).map((_, index) => (
        <circle
          key={`d-${count}-${index}`}
          cx={cx0 + index * gap}
          cy={y}
          r={pr}
          fill={`url(#${plasticGradId})`}
          stroke="#666"
          strokeWidth={0.5}
          filter={`url(#${plasticFilterId})`}
        />
      ))}
    </g>
  );
}

function DominoExampleSvg({
  object,
  answer,
  status,
  selected,
}: {
  object: DominoExampleObject;
  answer: ReturnType<typeof dominoAnswerFromGlyphs>;
  status: ArithmeticExampleStatus;
  selected: boolean;
}) {
  const ex = object.example;
  const sub = arithmeticSubmitButtonCenter(object);
  const inputRects = dominoInputRects(object);
  const cxCard = object.x + object.width / 2;
  const plasticGradId = `domino-plastic-grad-${object.id}`;
  const plasticFiltId = `domino-plastic-filt-${object.id}`;

  const cxDom = object.x + object.width / 2;
  const cyDom = object.y + 104;
  const domW = 252;
  const domH = (domW * VIVID_DOMINO_VIEW_H) / VIVID_DOMINO_VIEW_W;

  return (
    <g
      className={`arithmetic-example-block arithmetic-example-card domino-example-card arithmetic-example-card--${status}${
        selected ? ' is-active' : ''
      }`}
    >
      <defs>
        <radialGradient id={plasticGradId} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="30%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <filter id={plasticFiltId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="rgba(0,0,0,0.2)" />
        </filter>
      </defs>

      <rect
        className="arithmetic-example-card-bg"
        x={object.x}
        y={object.y}
        width={object.width}
        height={object.height}
        rx={22}
      />

      <text className="arithmetic-example-index" x={object.x + 20} y={object.y + 30} dominantBaseline="middle">
        {ex.index}
      </text>

      <g transform={`translate(${cxDom}, ${cyDom}) rotate(-6)`}>
        <svg
          x={-domW / 2}
          y={-domH / 2}
          width={domW}
          height={domH}
          viewBox={`0 0 ${VIVID_DOMINO_VIEW_W} ${VIVID_DOMINO_VIEW_H}`}
          overflow="visible"
        >
          <VividbooksDominoMinihryTile ex={ex} plasticGradId={plasticGradId} plasticFilterId={plasticFiltId} />
        </svg>
      </g>

      {ex.mode === 'partition' ? (
        <g>
          <rect
            className="domino-example-middle-bar"
            x={object.x + 26}
            y={object.y + 174}
            width={object.width - 52}
            height={62}
            rx={16}
          />
          <DominoDotsRowStripe
            cx={object.x + object.width / 2}
            y={object.y + 204}
            maxWidth={Math.min(object.width - 52, Math.max(ex.targetSum, 6) * 22)}
            count={ex.targetSum}
            plasticGradId={plasticGradId}
            plasticFilterId={plasticFiltId}
          />
        </g>
      ) : null}

      {ex.mode === 'dominoSum' ? (
        <g>
          <rect
            className="domino-example-middle-bar domino-example-middle-bar--soft"
            x={object.x + 26}
            y={object.y + 174}
            width={object.width - 52}
            height={62}
            rx={16}
          />
          {object.example.index === 1 ? (
            <DominoDotsRowStripe
              cx={object.x + object.width / 2}
              y={object.y + 204}
              maxWidth={object.width - 84}
              count={ex.targetSum}
              plasticGradId={plasticGradId}
              plasticFilterId={plasticFiltId}
            />
          ) : null}
        </g>
      ) : null}

      {ex.mode === 'missingAddition' ? (
        <g>
          {inputRects.map((zone) => (
            <rect
              key={`${zone.x}-${zone.y}`}
              className="arithmetic-example-answer-zone"
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx={12}
            />
          ))}
          <text
            className="domino-equation-plus"
            x={cxCard}
            y={inputRects[0] ? inputRects[0].y + inputRects[0].height / 2 + 1 : object.y + 224}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            +
          </text>
          <rect
            className="domino-example-readonly"
            x={object.x + object.width / 2 - 44}
            y={object.y + 274}
            width={88}
            height={50}
            rx={14}
          />
          <text
            className="domino-example-sum-text"
            fill={VIVID_DOMINO_ACCENT}
            x={cxCard}
            y={object.y + 299}
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {ex.targetSum}
          </text>
        </g>
      ) : null}

      {ex.mode !== 'missingAddition'
        ? inputRects.map((zone) => (
            <rect
              key={`in-${zone.x}`}
              className="arithmetic-example-answer-zone"
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx={14}
            />
          ))
        : null}

      <circle className="arithmetic-example-submit-circle" cx={sub.x} cy={sub.y} r={ARITHMETIC_SUBMIT_R} />
      <text
        className="arithmetic-example-submit-check"
        x={sub.x}
        y={sub.y + 1}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        ✓
      </text>
      {object.submitted ? (
        <text
          className="arithmetic-example-status"
          x={object.x + object.width / 2}
          y={object.y - 14}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {answer?.correct ? 'správně' : 'zkus znovu'}
        </text>
      ) : null}
    </g>
  );
}

function SequenceItemSvg({
  item,
  x,
  y,
  size,
}: {
  item: SequenceItem;
  x: number;
  y: number;
  size: number;
}) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  if (item.kind === 'number') {
    return (
      <text
        className="sequence-item sequence-item-number"
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {item.label}
      </text>
    );
  }
  if (item.kind === 'tile') {
    const tileW = size * 0.56;
    const tileH = size * 0.56;
    const left = cx - tileW / 2;
    const top = cy - tileH / 2;
    return (
      <g className="sequence-item sequence-item-tile">
        <rect x={left + 8} y={top + 6} width={tileW} height={tileH} rx={4} fill="#4d3fa6" />
        <path d={`M ${left} ${top + 8} L ${left + 8} ${top} L ${left + tileW + 8} ${top} L ${left + tileW} ${top + 8} Z`} fill="#a9a3ff" />
        <rect x={left} y={top + 8} width={tileW} height={tileH} rx={4} fill="#6557d2" />
      </g>
    );
  }
  if (item.key.includes('square')) {
    return <rect className="sequence-item sequence-item-shape" x={cx - size * 0.24} y={cy - size * 0.24} width={size * 0.48} height={size * 0.48} fill="#6557d2" />;
  }
  if (item.key.includes('plus')) {
    return (
      <text
        className="sequence-item sequence-item-plus"
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        +
      </text>
    );
  }
  return <circle className="sequence-item sequence-item-shape" cx={cx} cy={cy} r={size * 0.22} fill="#fbbf24" />;
}

function SequenceExampleSvg({ object, selected }: { object: SequenceExampleObject; selected: boolean }) {
  const complete = sequenceAnswerComplete(object);
  const sub = sequenceSubmitButtonCenter(object);
  return (
    <g className={`sequence-example-card${selected ? ' is-active' : ''}${complete ? ' is-complete' : ''}`}>
      <rect className="sequence-example-bg" x={object.x} y={object.y} width={object.width} height={object.height} rx={24} />
      <text className="sequence-example-title" x={object.x + 28} y={object.y + 28} dominantBaseline="middle">
        {object.example.index}. Pokračuj v řadě
      </text>
      {object.example.cells.map((cell) => {
        const rect = sequenceCellRect(object, cell.row, cell.col);
        const answerCorrect = !cell.given && cell.answerKey !== undefined && cell.answerKey === cell.expectedKey;
        const answerWrong = !cell.given && cell.answerKey !== undefined && cell.answerKey !== cell.expectedKey;
        const item = sequenceChoiceByKey(object.example, cell.given ? cell.expectedKey : (cell.answerKey ?? ''));
        return (
          <g
            key={cell.id}
            className={`sequence-cell${cell.given ? ' is-given' : ''}${object.activeCellId === cell.id ? ' is-active' : ''}${answerCorrect ? ' is-correct' : ''}${answerWrong ? ' is-wrong' : ''}`}
          >
            <rect
              className="sequence-cell-bg"
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={10}
            />
            {item ? <SequenceItemSvg item={item} x={rect.x} y={rect.y} size={rect.width} /> : null}
          </g>
        );
      })}
      <circle
        className="sequence-example-submit-circle"
        cx={sub.x}
        cy={sub.y}
        r={SEQUENCE_SUBMIT_R}
      />
      <text
        className="sequence-example-submit-check"
        x={sub.x}
        y={sub.y + 1}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        ✓
      </text>
    </g>
  );
}

function rebuildNumberLineFromDraft(line: NumberLineObject, draft: NumberLineSettingsDraft): NumberLineObject {
  let start = Math.round(Number(draft.start));
  let end = Math.round(Number(draft.end));
  if (!Number.isFinite(start)) start = line.start;
  if (!Number.isFinite(end)) end = line.end;
  if (end <= start) end = start + 1;

  const spacing = line.spacing;
  const width = (end - start) * spacing + 34;
  const oldCx = line.x + line.width / 2;
  const newX = oldCx - width / 2;

  const clampPos = (p: number) => clamp(p, start, end);

  const figures =
    line.figures?.map((figure) => ({
      ...figure,
      position: clampPos(figure.position),
    })) ?? [];

  const trails = line.trails?.filter((trail) => trail.value >= start && trail.value <= end).map((trail) => ({ ...trail })) ?? [];

  const figurePosition =
    line.figurePosition !== undefined && line.figurePosition !== null ? clampPos(line.figurePosition) : null;

  return {
    ...line,
    x: newX,
    start,
    end,
    width,
    accentColor: draft.accentColor,
    tickFill: draft.tickFill,
    figures,
    trails,
    figurePosition,
  };
}

function beadCounterFrameHeight(
  variantTwenty: boolean,
  showGroupCounts: boolean,
  showTotalSum: boolean,
): number {
  let height = variantTwenty ? 132 : 84;
  if (showGroupCounts || showTotalSum) {
    height +=
      BEAD_COUNTER_GROUP_COUNT_FONT_SIZE +
      BEAD_COUNTER_GROUP_LABEL_GAP_AFTER_BEADS_PX +
      BEAD_COUNTER_GROUP_LABEL_EXTRA_DOWN_PX +
      BEAD_COUNTER_LABEL_VERTICAL_PADDING_PX;
  }
  return height;
}

function beadCounterVisualFieldsEqual(
  current: BeadCounterSettingsDraft,
  draft: BeadCounterSettingsDraft,
): boolean {
  return (
    current.beadCount === draft.beadCount &&
    current.useTextures === draft.useTextures &&
    current.dualStripe === draft.dualStripe &&
    current.solidColor === draft.solidColor &&
    current.colorA === draft.colorA &&
    current.colorB === draft.colorB &&
    current.textureColorA === draft.textureColorA &&
    current.textureColorB === draft.textureColorB
  );
}

function beadCounterDraftsEquivalent(
  current: BeadCounterSettingsDraft,
  draft: BeadCounterSettingsDraft,
): boolean {
  return (
    beadCounterVisualFieldsEqual(current, draft) &&
    current.showGroupCounts === draft.showGroupCounts &&
    current.showTotalSum === draft.showTotalSum
  );
}

/** Jen Skupiny / Součet: zachovat pozice korálků, šířku a horní okraj (drát se neposouvá). */
function patchBeadCounterLabelOptions(counter: BeadCounterObject, draft: BeadCounterSettingsDraft): BeadCounterObject {
  const variant: BeadCounterVariant = draft.beadCount === 20 ? 'twenty' : 'ten';
  const isTwenty = variant === 'twenty';
  const height = beadCounterFrameHeight(isTwenty, draft.showGroupCounts, draft.showTotalSum);
  return {
    ...counter,
    variant,
    height,
    showGroupCounts: draft.showGroupCounts,
    showTotalSum: draft.showTotalSum,
  };
}

function applyBeadCounterMachineDraft(
  counter: BeadCounterObject,
  draft: BeadCounterSettingsDraft,
): BeadCounterObject {
  const currentDraft = beadCounterToDraft(counter);
  if (beadCounterDraftsEquivalent(currentDraft, draft)) return counter;
  if (beadCounterVisualFieldsEqual(currentDraft, draft)) {
    return patchBeadCounterLabelOptions(counter, draft);
  }
  return rebuildBeadCounterFromDraft(counter, draft);
}

function rebuildBeadCounterFromDraft(counter: BeadCounterObject, draft: BeadCounterSettingsDraft): BeadCounterObject {
  const variant: BeadCounterVariant = draft.beadCount === 20 ? 'twenty' : 'ten';
  const isTwenty = variant === 'twenty';
  const width = isTwenty ? 700 : 460;
  const height = beadCounterFrameHeight(isTwenty, draft.showGroupCounts, draft.showTotalSum);
  const beadRadius = isTwenty ? 14 : 18;
  const beadGap = isTwenty ? beadRadius * 1.38 : beadRadius * 1.55;
  const beadStart = isTwenty ? 72 : 70;
  const beadCount = draft.beadCount;

  const cx = counter.x + counter.width / 2;
  const cy = counter.y + counter.height / 2;

  const beadsSpec = Array.from({ length: beadCount }, (_, index) => {
    if (draft.useTextures) {
      const isYellowGroup = Math.floor(index / 5) % 2 === 0;
      return isYellowGroup
        ? { color: draft.textureColorA, imageUrl: HALF_MOON_BEAD_URLS.yellow }
        : { color: draft.textureColorB, imageUrl: HALF_MOON_BEAD_URLS.blue };
    }
    const color = draft.dualStripe
      ? Math.floor(index / 5) % 2 === 0
        ? draft.colorA
        : draft.colorB
      : draft.solidColor;
    return { color, imageUrl: undefined as string | undefined };
  });

  return {
    ...counter,
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
    beadRadius,
    variant,
    wireColor: '#ef123f',
    showGroupCounts: draft.showGroupCounts,
    showTotalSum: draft.showTotalSum,
    beads: beadsSpec.map((bead, index) => ({
      id: crypto.randomUUID(),
      color: bead.color,
      imageUrl: bead.imageUrl,
      position: beadStart + index * beadGap,
    })),
  };
}

function moveBead(counter: BeadCounterObject, beadId: string, targetPosition: number) {
  const beadIndex = counter.beads.findIndex((bead) => bead.id === beadId);
  if (beadIndex < 0) return counter;

  const min = counter.beadRadius;
  const max = counter.width - counter.beadRadius;
  const gap = counter.beadRadius * 1.75;
  const positions = counter.beads.map((bead) => bead.position);
  positions[beadIndex] = Math.min(max, Math.max(min, targetPosition));

  for (let index = beadIndex + 1; index < positions.length; index += 1) {
    positions[index] = Math.max(positions[index], positions[index - 1] + gap);
  }
  for (let index = beadIndex - 1; index >= 0; index -= 1) {
    positions[index] = Math.min(positions[index], positions[index + 1] - gap);
  }
  if (positions[positions.length - 1] > max) {
    positions[positions.length - 1] = max;
    for (let index = positions.length - 2; index >= 0; index -= 1) {
      positions[index] = Math.min(positions[index], positions[index + 1] - gap);
    }
  }
  if (positions[0] < min) {
    positions[0] = min;
    for (let index = 1; index < positions.length; index += 1) {
      positions[index] = Math.max(positions[index], positions[index - 1] + gap);
    }
  }

  return {
    ...counter,
    beads: counter.beads.map((bead, index) => ({
      ...bead,
      position: Math.min(max, Math.max(min, positions[index])),
    })),
  };
}

function strokeIntersectsRect(stroke: Stroke, rect: { x: number; y: number; width: number; height: number }) {
  const bounds = strokeBounds(stroke);
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  return stroke.points.some((point) => pointInRect(point, rect)) || pointInRect(center, rect);
}

function pickActiveTaskIdsFromObjects(objs: BoardObject[]): {
  assignmentId: string | null;
  exampleId: string | null;
} {
  for (const o of objs) {
    if (o.kind === 'arithmeticExample' || o.kind === 'dominoExample' || o.kind === 'sequenceExample' || o.kind === 'marbleBagExample') {
      return { assignmentId: o.assignmentId, exampleId: o.id };
    }
  }
  return { assignmentId: null, exampleId: null };
}

async function writeTextToFileHandle(handle: FileSystemFileHandle, text: string) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

export function FreeformBoard() {
  const { supabase, user } = useSupabaseAuth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const actionRef = useRef<BoardAction>(EMPTY_ACTION);
  const eraserMutatedRef = useRef(false);
  const splitAnimRafRef = useRef<number | null>(null);
  const splitAnimMetaRef = useRef<{ rightId: string; rightXFinal: number } | null>(null);
  const historyRef = useRef<Snapshot[]>([{ objects: [] }]);
  const historyIndexRef = useRef(0);
  const objectsRef = useRef<BoardObject[]>([]);
  const fitViewportToBoundsRef = useRef<
    (bounds: { x: number; y: number; width: number; height: number }, options?: { animated?: boolean }) => void
  >(() => {});

  const [tool, setTool] = useState<Tool>('select');
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedIds;
  /** Poslední výběr v režimu Kreslení — kvůli odlišení „otevři kreslení s už vybranou mřížkou“ vs. nový klik na mřížku. */
  const selectedIdsWhenDrawingRef = useRef<string[] | null>(null);

  const [pinnedMathGlyphs, setPinnedMathGlyphs] = useState(true);
  const pinnedMathGlyphsRef = useRef(false);
  useEffect(() => {
    pinnedMathGlyphsRef.current = pinnedMathGlyphs;
  }, [pinnedMathGlyphs]);

  useEffect(() => {
    if (!pinnedMathGlyphs && tool === 'mathWrite') {
      setTool('select');
    }
  }, [pinnedMathGlyphs, tool]);

  const mathInlineEditIdRef = useRef<string | null>(null);
  const [mathInlineEditId, setMathInlineEditId] = useState<string | null>(null);
  const [stickyEditingId, setStickyEditingId] = useState<string | null>(null);
  const [mathCaretBlink, setMathCaretBlink] = useState(true);
  const mathInlineInputRef = useRef<HTMLInputElement | null>(null);
  const mathInlineTypingKindRef = useRef<'math' | 'text' | null>(null);

  /** Lišta barev/přejmenování plátna jen po kliknutí na bobánek (název), ne při výběru okraje apod. */
  const [canvasFrameToolbarOpenForId, setCanvasFrameToolbarOpenForId] = useState<string | null>(null);

  useEffect(() => {
    if (canvasFrameToolbarOpenForId === null) return;
    if (selectedIds.length !== 1 || selectedIds[0] !== canvasFrameToolbarOpenForId) {
      setCanvasFrameToolbarOpenForId(null);
    }
  }, [selectedIds, canvasFrameToolbarOpenForId]);

  const setMathInlineEditingId = useCallback((id: string | null) => {
    mathInlineEditIdRef.current = id;
    setMathInlineEditId(id);
  }, []);

  useEffect(() => {
    if (!mathInlineEditId) return;
    setMathCaretBlink(true);
    const interval = setInterval(() => setMathCaretBlink((b) => !b), 530);
    const focusFrame = requestAnimationFrame(() => mathInlineInputRef.current?.focus());
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(focusFrame);
    };
  }, [mathInlineEditId]);
  const [tempStroke, setTempStroke] = useState<Stroke | null>(null);
  const tempStrokeRef = useRef<Stroke | null>(null);
  const [tempBoardShape, setTempBoardShape] = useState<TempBoardShape | null>(null);
  const tempBoardShapeRef = useRef<TempBoardShape | null>(null);
  const [drawShapeKind, setDrawShapeKind] = useState<BoardShapeKind>('circle');
  const drawShapeKindRef = useRef<BoardShapeKind>('circle');
  useEffect(() => {
    drawShapeKindRef.current = drawShapeKind;
  }, [drawShapeKind]);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: -600, y: -360, scale: 1 });
  const viewportAnimRafRef = useRef<number | null>(null);
  const viewportRefForAnim = useRef(viewport);
  useEffect(() => {
    viewportRefForAnim.current = viewport;
  }, [viewport]);
  useEffect(() => {
    return () => {
      if (viewportAnimRafRef.current !== null) cancelAnimationFrame(viewportAnimRafRef.current);
    };
  }, []);
  const [svgViewportSize, setSvgViewportSize] = useState({ width: 0, height: 0 });
  const [historyUI, setHistoryUI] = useState({ canUndo: false, canRedo: false });
  const [isPanning, setIsPanning] = useState(false);
  const darkMode = false;
  const [brushColor, setBrushColor] = useState(() =>
    darkMode ? DEFAULT_BRUSH_COLOR_DARK : DEFAULT_BRUSH_COLOR_LIGHT,
  );
  const [highlighterColor, setHighlighterColor] = useState<string>(HIGHLIGHTER_COLOR_PRESETS[0]);
  /** Náznak rozdělení počítadlové dlaždice při hoveru nad mezerou mezi články */
  const [buildTileGapHover, setBuildTileGapHover] = useState<{ tileId: string; splitAfter: number } | null>(null);
  const [buildTileSnapGuides, setBuildTileSnapGuides] = useState<BuildTileSnapGuide[]>([]);
  /** Přetahování dlaždice ze spodní lišty: náhled + vodítka jako při táhnutí na desce */
  const [externalTileDragOverlay, setExternalTileDragOverlay] = useState<{
    tile: BuildNumberTileObject;
    guides: BuildTileSnapGuide[];
  } | null>(null);
  /** Přetahování číslic/znamének ze spodní lišty — náhled na plátně (stejně jako dlaždice). */
  const [externalMathGlyphDragOverlay, setExternalMathGlyphDragOverlay] = useState<{
    label: string;
    centerWorld: Point;
  } | null>(null);
  /** Úloha pytlíček, nad jejímž žlutým pytlíkem je právě tažená kulička ze lišty. */
  const [marbleBagDropTargetId, setMarbleBagDropTargetId] = useState<string | null>(null);
  /** Poslední kulička v úloze pytlíček uchopená myší — pro Smazat / Backspace. */
  const marbleBagHeldItemRef = useRef<{ exampleId: string; itemId: string } | null>(null);
  /** Výběr kuličky v pytlíku — rámeček „×“ a zrušení výběru klikem mimo. */
  const [marbleBagFocusedMarble, setMarbleBagFocusedMarble] = useState<{
    exampleId: string;
    itemId: string;
  } | null>(null);
  const [libraryPanelMode, setLibraryPanelMode] = useState<ObjectLibraryPanelMode>('closed');
  const libraryPanelOpen = libraryPanelMode !== 'closed';
  const [librarySideRailOnlyLayout, setLibrarySideRailOnlyLayout] = useState(false);
  const handleSideDockRailOnlyLayout = useCallback((railOnly: boolean) => {
    setLibrarySideRailOnlyLayout(railOnly);
  }, []);

  const [libraryDock, setLibraryDock] = useState<LibraryDockPosition>(readLibraryDockPosition);

  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_DOCK_STORAGE_KEY, libraryDock);
    } catch {
      /* noop */
    }
  }, [libraryDock]);

  const [appUiLightMode, setAppUiLightMode] = useState(() => readAppUiLightModeFromStorage());
  useEffect(() => {
    writeAppUiLightModeToStorage(appUiLightMode);
  }, [appUiLightMode]);

  useEffect(() => {
    const id = 'theme-color-app-chrome';
    let meta = document.getElementById(id) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.id = id;
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = appUiLightMode ? '#dee4f1' : '#272435';
  }, [appUiLightMode]);

  const [mathGlyphStripStyle, setMathGlyphStripStyle] = useState<MathGlyphStripStyle>(() =>
    readMathGlyphStripStyleFromStorage(),
  );
  useEffect(() => {
    writeMathGlyphStripStyleToStorage(mathGlyphStripStyle);
  }, [mathGlyphStripStyle]);

  const [machineSettings, setMachineSettings] = useState<
    | { kind: 'numberLine'; id: string }
    | { kind: 'beadCounter'; id: string }
    | { kind: 'diceTray'; id: string }
    | null
  >(null);
  const [diceTrayRollFlash, setDiceTrayRollFlash] = useState<Record<string, number>>({});
  const diceTrayRollTimerRef = useRef<number | null>(null);
  const [spatialTilingPick, setSpatialTilingPick] = useState<{
    boardId: string;
    shapeId: string;
    rotation: number;
  } | null>(null);
  const spatialTilingPickRef = useRef<{ boardId: string; shapeId: string; rotation: number } | null>(null);
  const [spatialTilingDropPreview, setSpatialTilingDropPreview] = useState<{
    boardId: string;
    gx: number;
    gy: number;
    pattern: boolean[][];
    valid: boolean;
  } | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [activeTaskSettings, setActiveTaskSettings] = useState<TaskAssignmentSettings | null>(null);
  /** Zvýší se při vložení úkolu nebo kliknutí na úkol — synchronizace formuláře v panelu Knihovna → Úkoly. */
  const [taskPanelSyncTick, setTaskPanelSyncTick] = useState(0);
  /** Učitel: po vložení úkolu zobrazit náhled režimu žáka; „Nastavit“ vrátí formulář. */
  const [teacherTaskPanelLayout, setTeacherTaskPanelLayout] = useState<'configure' | 'student-preview'>('configure');
  const [teacherArithmeticEdit, setTeacherArithmeticEdit] = useState<{
    exampleId: string;
    a: number;
    b: number;
    operation: ArithmeticOperation;
  } | null>(null);
  const [teacherArithmeticEditClientRect, setTeacherArithmeticEditClientRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const teacherArithmeticEditRef = useRef<string | null>(null);

  const [boardContextMenu, setBoardContextMenu] = useState<{
    clientX: number;
    clientY: number;
    world: Point;
    targetIds: string[];
  } | null>(null);
  const boardContextMenuRef = useRef<HTMLDivElement | null>(null);
  const clipboardBoardFallbackRef = useRef<string | null>(null);
  const restoredTaskPayloadRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const cloudFileIdRef = useRef<string | null>(null);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [lastShareUrl, setLastShareUrl] = useState<string | null>(null);
  const [lastTaskShareUrl, setLastTaskShareUrl] = useState<string | null>(null);
  const [lastLiveShareUrl, setLastLiveShareUrl] = useState<string | null>(null);
  const [liveCollabToken, setLiveCollabToken] = useState<string | null>(null);
  const [liveCollabSessionId, setLiveCollabSessionId] = useState<string | null>(null);
  const [liveCollabOwnerId, setLiveCollabOwnerId] = useState<string | null>(null);
  const [liveDisplayName, setLiveDisplayName] = useState('');
  const [livePeerCursors, setLivePeerCursors] = useState<
    Record<string, { wx: number; wy: number; name: string; color: string; t: number }>
  >({});
  const liveCollabTokenRef = useRef<string | null>(null);
  const liveChannelRef = useRef<import('@supabase/supabase-js').RealtimeChannel | null>(null);
  const liveChannelReadyRef = useRef(false);
  const liveApplyingRemoteRef = useRef(false);
  const liveRemoteDocTimeRef = useRef(0);
  const livePeerIdRef = useRef('');
  const liveDisplayNameRef = useRef('');
  const liveCursorLastSentRef = useRef(0);
  const documentDirtyRef = useRef(false);
  const [taskResultsOpen, setTaskResultsOpen] = useState(false);
  const [taskResultsBusy, setTaskResultsBusy] = useState(false);
  const [taskResultsError, setTaskResultsError] = useState<string | null>(null);
  const [taskResults, setTaskResults] = useState<
    Array<{ share: BoardTaskShareRow; submissions: BoardTaskSubmissionRow[] }>
  >([]);
  const [studentShare, setStudentShare] = useState<BoardContentShareRow | null>(null);
  const [studentTaskShare, setStudentTaskShare] = useState<BoardTaskShareRow | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentNameDraft, setStudentNameDraft] = useState('');
  const [studentSubmitBusy, setStudentSubmitBusy] = useState(false);
  const [studentSubmitted, setStudentSubmitted] = useState(false);
  const [studentTaskScore, setStudentTaskScore] = useState<BoardTaskScore | null>(null);
  const suppressDocumentDirtyRef = useRef(false);
  const viewportEffectSkipRef = useRef(true);
  const markDocumentDirtyRef = useRef<() => void>(() => {});
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const [documentTitle, setDocumentTitle] = useState('Nástěnka');
  const [fileDisplayLabel, setFileDisplayLabel] = useState('Bez názvu');
  const [documentDirty, setDocumentDirty] = useState(false);
  const documentCreatedAtRef = useRef<string>(new Date().toISOString());

  const [boardBackground, setBoardBackground] = useState<BoardBackgroundSettings>(DEFAULT_BOARD_BACKGROUND);
  const [documentMetadata, setDocumentMetadata] = useState<BoardDocumentMetadata>(DEFAULT_BOARD_METADATA);

  useEffect(() => {
    markDocumentDirtyRef.current = () => {
      if (suppressDocumentDirtyRef.current) return;
      setDocumentDirty(true);
      setLastShareUrl(null);
      setLastTaskShareUrl(null);
      setLastLiveShareUrl(null);
    };
  }, []);

  useEffect(() => {
    documentDirtyRef.current = documentDirty;
  }, [documentDirty]);

  /** Po prvním vykreslení ignoruj změnu viewportu pro „dirty“ — dál už jde o zoom/pan od uživatele. */
  useEffect(() => {
    if (viewportEffectSkipRef.current) {
      viewportEffectSkipRef.current = false;
      return;
    }
    if (suppressDocumentDirtyRef.current) return;
    setDocumentDirty(true);
  }, [viewport]);

  /** Varování při opuštění s neuloženými změnami. */
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!documentDirty) return;
      event.preventDefault();
      // eslint-disable-next-line no-param-reassign -- standardní vzor beforeunload
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [documentDirty]);

  /** Přehrávání počítání na dlaždicích: která buňka které dlaždice svítí. */
  const [buildTilePlaybackHighlight, setBuildTilePlaybackHighlight] = useState<{
    tileId: string;
    cellIndex: number;
  } | null>(null);
  const buildTilePlaybackTimersRef = useRef<number[]>([]);

  const pendingPinnedPlacementRef = useRef<PendingPinnedPlacement | null>(null);
  const [pendingPinnedPlacement, setPendingPinnedPlacement] = useState<PendingPinnedPlacement | null>(null);
  const [pinnedPreviewWorld, setPinnedPreviewWorld] = useState<Point | null>(null);

  const clearPendingPinnedPlacement = useCallback(() => {
    pendingPinnedPlacementRef.current = null;
    setPendingPinnedPlacement(null);
    setPinnedPreviewWorld(null);
  }, []);

  const toggleMathWriteTool = useCallback(() => {
    clearPendingPinnedPlacement();
    setTool((t) => (t === 'mathWrite' ? 'select' : 'mathWrite'));
  }, [clearPendingPinnedPlacement]);

  useEffect(() => {
    if (tool !== 'stamp') {
      clearPendingPinnedPlacement();
    }
  }, [tool, clearPendingPinnedPlacement]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const obj = objects.find((o) => o.id === id);
    if (obj?.kind === 'canvasFrame') {
      return;
    }
    if (obj?.kind === 'beadCounter') {
      setMachineSettings((prev) =>
        prev?.kind === 'beadCounter' && prev.id === id ? prev : { kind: 'beadCounter', id },
      );
      return;
    }
    if (obj?.kind === 'diceTray') {
      setMachineSettings((prev) =>
        prev?.kind === 'diceTray' && prev.id === id ? prev : { kind: 'diceTray', id },
      );
      return;
    }
    if (obj?.kind === 'numberLine') {
      setMachineSettings((prev) =>
        prev?.kind === 'numberLine' && prev.id === id ? prev : { kind: 'numberLine', id },
      );
    }
  }, [selectedIds, objects]);

  useEffect(() => {
    const onDragEndDoc = () => {
      setExternalTileDragOverlay(null);
      setExternalMathGlyphDragOverlay(null);
      setSpatialTilingDropPreview(null);
      setMarbleBagDropTargetId(null);
    };
    document.addEventListener('dragend', onDragEndDoc);
    return () => document.removeEventListener('dragend', onDragEndDoc);
  }, []);

  useEffect(() => {
    return () => {
      buildTilePlaybackTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    return () => {
      if (diceTrayRollTimerRef.current != null) {
        window.clearTimeout(diceTrayRollTimerRef.current);
        diceTrayRollTimerRef.current = null;
      }
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const boardContentBounds = useMemo(() => {
    if (objects.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const object of objects) {
      const b = objectBounds(object);
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
    };
  }, [objects]);
  const canvasFrames = useMemo(
    () =>
      objects
        .filter((object): object is CanvasFrameObject => object.kind === 'canvasFrame')
        .sort((a, b) => Number(a.label) - Number(b.label)),
    [objects],
  );
  const selectedCanvasFrame =
    selectedIds.length === 1 ? canvasFrames.find((frame) => frame.id === selectedIds[0]) ?? null : null;
  const selectedCanvasFramePopupPosition = useMemo(() => {
    if (!selectedCanvasFrame || svgViewportSize.width <= 0 || svgViewportSize.height <= 0) return null;
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!rect) return null;
    const worldWidth = svgViewportSize.width / viewport.scale;
    const worldHeight = svgViewportSize.height / viewport.scale;
    const labelX = selectedCanvasFrame.x + 18;
    const labelY = selectedCanvasFrame.y + 64;
    return {
      left: rect.left + ((labelX - viewport.x) / worldWidth) * rect.width,
      top: rect.top + ((labelY - viewport.y) / worldHeight) * rect.height,
    };
  }, [selectedCanvasFrame, svgViewportSize.height, svgViewportSize.width, viewport.scale, viewport.x, viewport.y]);

  const contextMenuTargetTiles = useMemo((): BuildNumberTileObject[] => {
    if (!boardContextMenu?.targetIds.length) return [];
    return boardContextMenu.targetIds
      .map((id) => objects.find((o) => o.id === id))
      .filter((o): o is BuildNumberTileObject => o?.kind === 'buildNumberTile');
  }, [boardContextMenu, objects]);

  const contextMenuCanMergeTiles =
    !!boardContextMenu &&
    boardContextMenu.targetIds.length >= 2 &&
    contextMenuTargetTiles.length === boardContextMenu.targetIds.length &&
    contextMenuTargetTiles.every((t) => !boardObjectIsLocked(t)) &&
    contextMenuTargetTiles.reduce((s, t) => s + t.value, 0) <= 10;

  const contextMenuCanPlayTiles =
    !!boardContextMenu &&
    boardContextMenu.targetIds.length >= 1 &&
    contextMenuTargetTiles.length === boardContextMenu.targetIds.length &&
    contextMenuTargetTiles.length > 0 &&
    contextMenuTargetTiles.every((t) => !boardObjectIsLocked(t));

  const contextMenuCanBringForward = useMemo(() => {
    if (!boardContextMenu?.targetIds.length) return false;
    return canBringBoardObjectsForward(objects, boardContextMenu.targetIds);
  }, [boardContextMenu, objects]);

  const contextMenuCanSendBackward = useMemo(() => {
    if (!boardContextMenu?.targetIds.length) return false;
    return canSendBoardObjectsBackward(objects, boardContextMenu.targetIds);
  }, [boardContextMenu, objects]);

  const contextMenuCanSplitMathGlyph = useMemo(() => {
    if (!boardContextMenu || boardContextMenu.targetIds.length !== 1) return false;
    const o = objects.find((x) => x.id === boardContextMenu.targetIds[0]);
    return (
      o &&
      !boardObjectIsLocked(o) &&
      o.kind === 'mathGlyph' &&
      o.label.length > 1 &&
      MATH_GLYPH_MERGE_LABEL_RE.test(o.label)
    );
  }, [boardContextMenu, objects]);

  const contextMenuAllTargetsLocked = useMemo(() => {
    if (!boardContextMenu?.targetIds.length) return false;
    return boardContextMenu.targetIds.every((id) => {
      const o = objects.find((x) => x.id === id);
      return o && boardObjectIsLocked(o);
    });
  }, [boardContextMenu, objects]);

  /** Pravé klikací menu: sekce dlaždic jen když je výběr čistě z dlaždic (stejně jako u Přehrát). */
  const showBoardContextMenuTileSection = contextMenuCanPlayTiles;
  const activeAssignmentExamples = useMemo(
    () =>
      objects.filter(
        (object): object is ArithmeticExampleObject | DominoExampleObject | MarbleBagExampleObject =>
          (object.kind === 'arithmeticExample' || object.kind === 'dominoExample' || object.kind === 'marbleBagExample') &&
          object.assignmentId === activeAssignmentId,
      ),
    [activeAssignmentId, objects],
  );
  const activeSequenceExamples = useMemo(
    () =>
      objects.filter(
        (object): object is SequenceExampleObject =>
          object.kind === 'sequenceExample' && object.assignmentId === activeAssignmentId,
      ),
    [activeAssignmentId, objects],
  );
  const activeTaskObjects = activeAssignmentExamples.length > 0 ? activeAssignmentExamples : activeSequenceExamples;
  const taskModeActive = activeAssignmentId !== null && activeTaskObjects.length > 0;
  const studentTaskMode = Boolean(studentTaskShare);
  const studentShareMode = Boolean(studentShare || studentTaskShare);
  const studentLockedUntilName = studentTaskMode && !studentName.trim();
  const studentTaskModeRef = useRef(false);
  const studentShareModeRef = useRef(false);
  const studentLockedUntilNameRef = useRef(false);
  useEffect(() => {
    studentTaskModeRef.current = studentTaskMode;
    studentShareModeRef.current = studentShareMode;
    studentLockedUntilNameRef.current = studentLockedUntilName;
  }, [studentLockedUntilName, studentShareMode, studentTaskMode]);

  const studentTaskCompletionRef = useRef<{ assignmentId: string | null; wasComplete: boolean }>({
    assignmentId: null,
    wasComplete: false,
  });
  const studentTaskCelebrationTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [studentTaskCelebration, setStudentTaskCelebration] = useState<{
    active: boolean;
    burstId: number;
    particles: Array<{ id: number; angle: number; delay: number; hue: number }>;
  }>({ active: false, burstId: 0, particles: [] });

  useEffect(() => {
    return () => {
      if (studentTaskCelebrationTimerRef.current) window.clearTimeout(studentTaskCelebrationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!studentTaskMode || !activeAssignmentId || studentLockedUntilName) {
      studentTaskCompletionRef.current = { assignmentId: activeAssignmentId, wasComplete: false };
      return;
    }
    const complete = isStudentAssignmentCompleteAndCorrect(objects, activeAssignmentId);
    const ref = studentTaskCompletionRef.current;
    if (ref.assignmentId !== activeAssignmentId) {
      studentTaskCompletionRef.current = { assignmentId: activeAssignmentId, wasComplete: complete };
      return;
    }
    if (complete && !ref.wasComplete) {
      const prefersReduce =
        typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const particles = prefersReduce
        ? []
        : Array.from({ length: 52 }, (_, i) => ({
            id: i,
            angle: (360 / 52) * i + (Math.random() - 0.5) * 14,
            delay: Math.random() * 0.35,
            hue: [38, 280, 330, 200, 160][i % 5] + Math.floor(Math.random() * 24),
          }));
      setStudentTaskCelebration((s) => ({
        active: true,
        burstId: s.burstId + 1,
        particles,
      }));
      if (studentTaskCelebrationTimerRef.current) window.clearTimeout(studentTaskCelebrationTimerRef.current);
      studentTaskCelebrationTimerRef.current = window.setTimeout(() => {
        studentTaskCelebrationTimerRef.current = null;
        setStudentTaskCelebration((s) => ({ ...s, active: false, particles: [] }));
      }, prefersReduce ? 2000 : 4500);
    }
    studentTaskCompletionRef.current = { assignmentId: activeAssignmentId, wasComplete: complete };
  }, [studentTaskMode, activeAssignmentId, studentLockedUntilName, objects]);

  useEffect(() => {
    teacherArithmeticEditRef.current = teacherArithmeticEdit?.exampleId ?? null;
  }, [teacherArithmeticEdit]);

  useEffect(() => {
    if (!taskModeActive || studentTaskMode) {
      setTeacherTaskPanelLayout('configure');
      setTeacherArithmeticEdit(null);
      setTeacherArithmeticEditClientRect(null);
    }
  }, [studentTaskMode, taskModeActive]);

  /** Kreslení: po změně výběru na objekt s lištou nastavení zavři panel kreslení a přepni na výběr. */
  useEffect(() => {
    if (studentTaskMode) return;

    if (libraryPanelMode !== 'drawing') {
      selectedIdsWhenDrawingRef.current = null;
      return;
    }

    const prev = selectedIdsWhenDrawingRef.current;
    selectedIdsWhenDrawingRef.current = selectedIds;

    if (prev === null) return;

    const unchanged =
      prev.length === selectedIds.length && prev.every((id, i) => id === selectedIds[i]);
    if (unchanged) return;

    if (selectedIds.length !== 1) return;
    const obj = objects.find((o) => o.id === selectedIds[0]);
    if (!obj || boardObjectIsLocked(obj)) return;
    if (obj.kind === 'spatialTilingBoard' || obj.kind === 'numberLine' || obj.kind === 'beadCounter' || obj.kind === 'diceTray') {
      setLibraryPanelMode('closed');
      setTool('select');
    }
  }, [studentTaskMode, libraryPanelMode, selectedIds, objects]);

  const liveCollabIsHost = useMemo(
    () => Boolean(user?.id && liveCollabOwnerId && user.id === liveCollabOwnerId),
    [user?.id, liveCollabOwnerId],
  );

  useEffect(() => {
    livePeerIdRef.current = getOrCreateLivePeerId();
  }, []);

  useEffect(() => {
    liveCollabTokenRef.current = liveCollabToken;
  }, [liveCollabToken]);

  useEffect(() => {
    liveDisplayNameRef.current = liveDisplayName;
  }, [liveDisplayName]);

  const hasGradableTaskObjects = useMemo(
    () =>
      objects.some(
        (object) =>
          object.kind === 'arithmeticExample' ||
          object.kind === 'dominoExample' ||
          object.kind === 'sequenceExample' ||
          object.kind === 'marbleBagExample',
      ),
    [objects],
  );
  const activeExample =
    activeAssignmentExamples.find((example) => example.id === activeExampleId) ?? activeAssignmentExamples[0] ?? null;
  const activeSequenceExample =
    activeSequenceExamples.find((example) => example.id === activeExampleId) ?? activeSequenceExamples[0] ?? null;
  const isStudentEditableMathGlyph = useCallback(
    (object: BoardObject): object is MathGlyphObject => {
      if (!studentTaskMode || object.kind !== 'mathGlyph') return false;
      return true;
    },
    [studentTaskMode],
  );
  const activeExampleIndex = activeExample
    ? activeAssignmentExamples.findIndex((example) => example.id === activeExample.id)
    : activeSequenceExample
      ? activeSequenceExamples.findIndex((example) => example.id === activeSequenceExample.id)
    : -1;
  const selectionUnionOutline = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const idSet = new Set(selectedIds);
    const selectedObjects = objects.filter((object) => idSet.has(object.id));
    return unionSelectionOutlines(selectedObjects);
  }, [objects, selectedIds]);

  const soleSelectedObject =
    selectedIds.length === 1 ? (objects.find((object) => object.id === selectedIds[0]) ?? null) : null;
  const soleStickyNote = soleSelectedObject?.kind === 'stickyNote' ? soleSelectedObject : null;
  const selectionIncludesLocked = useMemo(
    () =>
      selectedIds.some((id) => {
        const o = objects.find((x) => x.id === id);
        return o ? boardObjectIsLocked(o) : false;
      }),
    [objects, selectedIds],
  );

  useEffect(() => {
    spatialTilingPickRef.current = spatialTilingPick;
  }, [spatialTilingPick]);

  useEffect(() => {
    const end = () => {
      setSpatialTilingDropPreview(null);
      setSpatialTilingDragPayload(null);
    };
    window.addEventListener('dragend', end);
    return () => window.removeEventListener('dragend', end);
  }, []);

  /**
   * Stav picku synchronizovat jen při změně výběru / zamčení desky — ne při každé úpravě placedTiles,
   * jinak se effect zbytečně hádal s rotací tvaru z panelu.
   */
  const spatialTilingPickSyncKey = useMemo(() => {
    if (selectedIds.length !== 1) return '';
    const id = selectedIds[0];
    const o = objects.find((x) => x.id === id);
    if (o?.kind !== 'spatialTilingBoard') return '';
    return `${id}|${boardObjectIsLocked(o) ? 'locked' : 'open'}`;
  }, [selectedIds, objects]);

  useEffect(() => {
    if (!spatialTilingPickSyncKey) {
      setSpatialTilingPick(null);
      return;
    }
    const pipe = spatialTilingPickSyncKey.indexOf('|');
    if (pipe < 0) return;
    const boardId = spatialTilingPickSyncKey.slice(0, pipe);
    const state = spatialTilingPickSyncKey.slice(pipe + 1);
    if (state === 'locked') {
      setSpatialTilingPick(null);
      return;
    }
    setSpatialTilingPick((p) =>
      p?.boardId === boardId ? p : { boardId, shapeId: 'square', rotation: 0 },
    );
  }, [spatialTilingPickSyncKey]);

  const machineSettingsLine =
    machineSettings?.kind === 'numberLine'
      ? (objects.find(
          (object): object is NumberLineObject =>
            object.kind === 'numberLine' && object.id === machineSettings.id,
        ) ?? null)
      : null;
  const machineSettingsCounter =
    machineSettings?.kind === 'beadCounter'
      ? (objects.find(
          (object): object is BeadCounterObject =>
            object.kind === 'beadCounter' && object.id === machineSettings.id,
        ) ?? null)
      : null;
  const machineSettingsDiceTray =
    machineSettings?.kind === 'diceTray'
      ? (objects.find(
          (object): object is DiceTrayObject =>
            object.kind === 'diceTray' && object.id === machineSettings.id,
        ) ?? null)
      : null;

  useEffect(() => {
    if (!machineSettings) return;
    if (!selectedIds.includes(machineSettings.id)) {
      setMachineSettings(null);
      return;
    }
    const obj = objects.find((o) => o.id === machineSettings.id);
    if (obj && boardObjectIsLocked(obj)) {
      setMachineSettings(null);
      return;
    }
    if (
      !obj ||
      (machineSettings.kind === 'beadCounter' && obj.kind !== 'beadCounter') ||
      (machineSettings.kind === 'numberLine' && obj.kind !== 'numberLine') ||
      (machineSettings.kind === 'diceTray' && obj.kind !== 'diceTray')
    ) {
      setMachineSettings(null);
    }
  }, [machineSettings, objects, selectedIds]);

  /** Obrazovka v px — tlačítka výběru mají stálou velikost při zoomu plátna */
  const [selectionHudPx, setSelectionHudPx] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [stickyToolbarClientRect, setStickyToolbarClientRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const getSvgScreenMetrics = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const viewPxWidth = svgViewportSize.width || rect.width || window.innerWidth || 1200;
    const viewPxHeight = svgViewportSize.height || rect.height || window.innerHeight || 800;
    const worldWidth = viewPxWidth / viewport.scale;
    const worldHeight = viewPxHeight / viewport.scale;
    return {
      rect,
      worldWidth,
      worldHeight,
      scaleX: rect.width / worldWidth,
      scaleY: rect.height / worldHeight,
    };
  }, [svgViewportSize.height, svgViewportSize.width, viewport.scale]);

  const svgWorldRectToClientRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    const toClient = (x: number, y: number) => {
      point.x = x;
      point.y = y;
      return point.matrixTransform(matrix);
    };
    const p1 = toClient(rect.x, rect.y);
    const p2 = toClient(rect.x + rect.width, rect.y + rect.height);
    const left = Math.min(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    return {
      left,
      top,
      width: Math.max(Math.abs(p2.x - p1.x), 1),
      height: Math.max(Math.abs(p2.y - p1.y), 1),
    };
  }, []);

  const syncSelectionHudRef = useRef<() => void>(() => {});

  syncSelectionHudRef.current = () => {
    const outline = selectionUnionOutline;
    const clientRect = outline ? svgWorldRectToClientRect(outline) : null;
    if (!outline || !clientRect) {
      setSelectionHudPx(null);
      return;
    }
    setSelectionHudPx(clientRect);
  };

  useLayoutEffect(() => {
    syncSelectionHudRef.current();
  }, [
    selectionUnionOutline,
    viewport.x,
    viewport.y,
    viewport.scale,
    libraryPanelMode,
    libraryDock,
    svgViewportSize.width,
    svgViewportSize.height,
  ]);

  useLayoutEffect(() => {
    if (!soleStickyNote) {
      setStickyToolbarClientRect(null);
      return;
    }
    const cr = svgWorldRectToClientRect({
      x: soleStickyNote.x,
      y: soleStickyNote.y,
      width: soleStickyNote.width,
      height: soleStickyNote.height,
    });
    setStickyToolbarClientRect(cr);
  }, [
    soleStickyNote,
    svgWorldRectToClientRect,
    viewport.x,
    viewport.y,
    viewport.scale,
    svgViewportSize.width,
    svgViewportSize.height,
  ]);

  useLayoutEffect(() => {
    if (!teacherArithmeticEdit) {
      setTeacherArithmeticEditClientRect(null);
      return;
    }
    const ex = objects.find(
      (o): o is ArithmeticExampleObject => o.kind === 'arithmeticExample' && o.id === teacherArithmeticEdit.exampleId,
    );
    if (!ex) {
      setTeacherArithmeticEdit(null);
      setTeacherArithmeticEditClientRect(null);
      return;
    }
    const cr = svgWorldRectToClientRect(objectBounds(ex));
    setTeacherArithmeticEditClientRect(cr);
  }, [
    teacherArithmeticEdit,
    objects,
    svgWorldRectToClientRect,
    viewport.x,
    viewport.y,
    viewport.scale,
    svgViewportSize.width,
    svgViewportSize.height,
  ]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const syncSvgSize = () => {
      const rect = svg.getBoundingClientRect();
      setSvgViewportSize((current) => {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (current.width === width && current.height === height) return current;
        return { width, height };
      });
    };

    syncSvgSize();
    const observer = new ResizeObserver(syncSvgSize);
    observer.observe(svg);
    window.addEventListener('resize', syncSvgSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncSvgSize);
    };
  }, []);

  useEffect(() => {
    if (!machineSettings) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMachineSettings(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [machineSettings]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const run = () => syncSelectionHudRef.current();

    const observer = new ResizeObserver(run);
    observer.observe(svg);
    window.addEventListener('resize', run);
    window.addEventListener('scroll', run, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', run);
      window.removeEventListener('scroll', run, true);
    };
  }, []);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const metrics = getSvgScreenMetrics();
      if (!metrics) return { x: 0, y: 0 };
      return {
        x: viewport.x + ((clientX - metrics.rect.left) / metrics.rect.width) * metrics.worldWidth,
        y: viewport.y + ((clientY - metrics.rect.top) / metrics.rect.height) * metrics.worldHeight,
      };
    },
    [getSvgScreenMetrics, viewport.x, viewport.y],
  );

  const viewBox = useMemo(() => {
    const width = (svgViewportSize.width || window.innerWidth || 1200) / viewport.scale;
    const height = (svgViewportSize.height || window.innerHeight || 800) / viewport.scale;
    return `${viewport.x} ${viewport.y} ${width} ${height}`;
  }, [svgViewportSize.height, svgViewportSize.width, viewport]);

  const pushHistory = useCallback((nextObjects: BoardObject[]) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      nextHistory.push({ objects: cloneObjects(renumberCanvasFrames(nextObjects)) });
    if (nextHistory.length > 80) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setHistoryUI({
      canUndo: historyIndexRef.current > 0,
      canRedo: false,
    });
    markDocumentDirtyRef.current();
  }, []);

  const commitObjects = useCallback(
    (nextObjects: BoardObject[], nextSelectedIds = selectedIds) => {
      const cloned = cloneObjects(renumberCanvasFrames(nextObjects));
      objectsRef.current = cloned;
      setObjects(cloned);
      setSelectedIds(nextSelectedIds);
      pushHistory(cloned);
    },
    [pushHistory, selectedIds],
  );

  const clearSpatialBoardPlacedTiles = useCallback(() => {
    const pick = spatialTilingPickRef.current;
    if (!pick) return;
    const boardId = pick.boardId;
    commitObjects(
      objectsRef.current.map((o) =>
        o.kind === 'spatialTilingBoard' && o.id === boardId ? { ...o, placedTiles: [] } : o,
      ),
      selectedIdsRef.current,
    );
  }, [commitObjects]);

  const updateStickyContentLive = useCallback((id: string, content: string) => {
    const next = objectsRef.current.map((object) =>
      object.id === id && object.kind === 'stickyNote' ? { ...object, content } : object,
    );
    objectsRef.current = next;
    setObjects(next);
  }, []);

  const commitStickyTextEdit = useCallback(() => {
    setStickyEditingId(null);
    pushHistory(objectsRef.current);
  }, [pushHistory]);

  const patchStickyNoteObject = useCallback(
    (id: string, updates: Partial<StickyNoteObject>) => {
      commitObjects(
        objectsRef.current.map((object) =>
          object.id === id && object.kind === 'stickyNote' ? ({ ...object, ...updates } as StickyNoteObject) : object,
        ),
      );
    },
    [commitObjects],
  );

  const beginBoardBoundsResize = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (studentTaskMode) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const ids = selectedIdsRef.current;
      if (ids.length !== 1) return;
      const obj = objectsRef.current.find((o) => o.id === ids[0]);
      if (!obj || !supportsBoardBoundsResize(obj) || boardObjectIsLocked(obj)) return;
      const svg = svgRef.current;
      if (!svg) return;
      svg.setPointerCapture(event.pointerId);
      const world = clientToWorld(event.clientX, event.clientY);
      actionRef.current = {
        type: 'boundsResize',
        id: obj.id,
        startWorld: world,
        original: cloneObjects([obj])[0],
        moved: false,
      };
    },
    [clientToWorld, studentTaskMode],
  );

  const selectCanvasFrameFromLabel = useCallback((event: React.PointerEvent<SVGGElement>, id: string) => {
    if (studentTaskMode) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedIds([id]);
    setCanvasFrameToolbarOpenForId(id);
  }, [studentTaskMode]);

  const renameSelectedCanvasFrame = useCallback(() => {
    const id = selectedIdsRef.current[0];
    if (!id) return;
    queueMicrotask(() => {
      const frame = objectsRef.current.find((o): o is CanvasFrameObject => o.kind === 'canvasFrame' && o.id === id);
      if (!frame) return;
      const nextTitle = window.prompt('Název plátna', frame.title);
      if (nextTitle === null) return;
      const trimmed = nextTitle.trim();
      if (!trimmed) return;
      commitObjects(
        objectsRef.current.map((object) =>
          object.id === frame.id && object.kind === 'canvasFrame'
            ? { ...object, title: trimmed.slice(0, 80) }
            : object,
        ),
        [frame.id],
      );
    });
  }, [commitObjects]);

  const setSelectedCanvasFrameBackground = useCallback(
    (color: string | null) => {
      const id = selectedIdsRef.current[0];
      if (!id) return;
      commitObjects(
        objectsRef.current.map((object) =>
          object.id === id && object.kind === 'canvasFrame'
            ? { ...object, backgroundColor: color }
            : object,
        ),
        [id],
      );
    },
    [commitObjects],
  );

  const createCanvasFrameForObjects = useCallback(
    (items: BoardObject[], options?: { title?: string }) => {
      const bounds = unionObjectBounds(items, 88);
      if (!bounds) return null;
      return createCanvasFrameObject(bounds, canvasFrames.length + 1, {
        title: options?.title,
        backgroundColor: '#ffffff',
      });
    },
    [canvasFrames.length],
  );

  const createArithmeticAssignment = useCallback(
    (settings: ArithmeticTaskSettings): CreatedTaskAssignment | null => {
      const { examples, settingsOut } = prepareArithmeticExamplesForBoard(settings, null);
      if (examples.length === 0) return null;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * ARITHMETIC_EXAMPLE_WIDTH + (examples.length - 1) * ARITHMETIC_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - ARITHMETIC_EXAMPLE_HEIGHT / 2;
      const assignmentId = `assignment-${settingsOut.seed}-${Date.now()}`;
      const nextExamples: ArithmeticExampleObject[] = examples.map((example, index) => {
        return {
          kind: 'arithmeticExample',
          id: crypto.randomUUID(),
          assignmentId,
          x: startX + index * (ARITHMETIC_EXAMPLE_WIDTH + ARITHMETIC_EXAMPLE_GAP_X),
          y: startY,
          width: ARITHMETIC_EXAMPLE_WIDTH,
          height: ARITHMETIC_EXAMPLE_HEIGHT,
          example,
        };
      });
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...objectsRef.current, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(assignmentId);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settingsOut);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return { taskKind: 'arithmetic', taskSettings: settingsOut, assignmentId };
    },
    [commitObjects, createCanvasFrameForObjects, viewport],
  );

  const createSequenceAssignment = useCallback(
    (settings: SequenceTaskSettings): CreatedTaskAssignment | null => {
      const examples = generateSequenceExamples(settings);
      if (examples.length === 0) return null;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const cards = examples.map((example) => ({
        example,
        width: SEQUENCE_CARD_PAD * 2 + example.cols * SEQUENCE_CELL_SIZE + (example.cols - 1) * SEQUENCE_CELL_GAP,
        height: SEQUENCE_CARD_PAD * 2 + 44 + example.rows * SEQUENCE_CELL_SIZE + (example.rows - 1) * SEQUENCE_CELL_GAP,
      }));
      const totalWidth = cards.reduce((sum, card) => sum + card.width, 0) + (cards.length - 1) * SEQUENCE_EXAMPLE_GAP_X;
      let x = viewport.x + viewWidth / 2 - totalWidth / 2;
      const y = viewport.y + viewHeight / 2 - Math.max(...cards.map((card) => card.height)) / 2;
      const assignmentId = `sequence-${settings.seed}-${Date.now()}`;
      const nextExamples: SequenceExampleObject[] = cards.map((card) => {
        const object: SequenceExampleObject = {
          kind: 'sequenceExample',
          id: crypto.randomUUID(),
          assignmentId,
          x,
          y,
          width: card.width,
          height: card.height,
          example: card.example,
          activeCellId: card.example.cells.find((cell) => !cell.given)?.id ?? null,
        };
        x += card.width + SEQUENCE_EXAMPLE_GAP_X;
        return object;
      });
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...objectsRef.current, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(assignmentId);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setTool('select');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return { taskKind: 'sequence', taskSettings: settings, assignmentId };
    },
    [commitObjects, createCanvasFrameForObjects, viewport],
  );

  const createDominoAssignment = useCallback(
    (settings: DominoTaskSettings): CreatedTaskAssignment | null => {
      const examples = generateDominoExamples(settings);
      if (examples.length === 0) return null;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * DOMINO_EXAMPLE_WIDTH + (examples.length - 1) * DOMINO_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - DOMINO_EXAMPLE_HEIGHT / 2;
      const assignmentId = `domino-${settings.seed}-${Date.now()}`;
      const nextExamples: DominoExampleObject[] = examples.map((example, index) => ({
        kind: 'dominoExample',
        id: crypto.randomUUID(),
        assignmentId,
        x: startX + index * (DOMINO_EXAMPLE_WIDTH + DOMINO_EXAMPLE_GAP_X),
        y: startY,
        width: DOMINO_EXAMPLE_WIDTH,
        height: DOMINO_EXAMPLE_HEIGHT,
        example,
      }));
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...objectsRef.current, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(assignmentId);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return { taskKind: 'domino', taskSettings: settings, assignmentId };
    },
    [commitObjects, createCanvasFrameForObjects, viewport],
  );

  const createMarbleBagAssignment = useCallback(
    (settings: MarbleBagTaskSettings): CreatedTaskAssignment | null => {
      const examples = generateMarbleBagExamples(settings);
      if (examples.length === 0) return null;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * MARBLE_BAG_EXAMPLE_WIDTH + (examples.length - 1) * MARBLE_BAG_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - MARBLE_BAG_EXAMPLE_HEIGHT / 2;
      const assignmentId = `marble-bag-${settings.seed}-${Date.now()}`;
      const nextExamples: MarbleBagExampleObject[] = examples.map((example, index) => ({
        kind: 'marbleBagExample',
        id: crypto.randomUUID(),
        assignmentId,
        x: startX + index * (MARBLE_BAG_EXAMPLE_WIDTH + MARBLE_BAG_EXAMPLE_GAP_X),
        y: startY,
        width: MARBLE_BAG_EXAMPLE_WIDTH,
        height: MARBLE_BAG_EXAMPLE_HEIGHT,
        example,
        items: [],
      }));
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...objectsRef.current, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(assignmentId);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return { taskKind: 'marbleBag', taskSettings: settings, assignmentId };
    },
    [commitObjects, createCanvasFrameForObjects, viewport],
  );

  const replaceArithmeticAssignment = useCallback(
    (settings: ArithmeticTaskSettings): boolean => {
      const aid = activeAssignmentId;
      if (!aid) return false;
      const ordered = objectsRef.current
        .filter(
          (o): o is ArithmeticExampleObject =>
            o.kind === 'arithmeticExample' && o.assignmentId === aid,
        )
        .sort((a, b) => a.x - b.x)
        .map((o) => o.example);
      const { examples, settingsOut } = prepareArithmeticExamplesForBoard(settings, ordered);
      if (examples.length === 0) return false;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * ARITHMETIC_EXAMPLE_WIDTH + (examples.length - 1) * ARITHMETIC_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - ARITHMETIC_EXAMPLE_HEIGHT / 2;
      const base = removeAssignmentExamplesAndFrames(objectsRef.current, aid, ['arithmeticExample']);
      const nextExamples: ArithmeticExampleObject[] = examples.map((example, index) => ({
        kind: 'arithmeticExample',
        id: crypto.randomUUID(),
        assignmentId: aid,
        x: startX + index * (ARITHMETIC_EXAMPLE_WIDTH + ARITHMETIC_EXAMPLE_GAP_X),
        y: startY,
        width: ARITHMETIC_EXAMPLE_WIDTH,
        height: ARITHMETIC_EXAMPLE_HEIGHT,
        example,
      }));
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...base, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(aid);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settingsOut);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return true;
    },
    [activeAssignmentId, commitObjects, createCanvasFrameForObjects, viewport],
  );

  const replaceSequenceAssignment = useCallback(
    (settings: SequenceTaskSettings): boolean => {
      const aid = activeAssignmentId;
      if (!aid) return false;
      const examples = generateSequenceExamples(settings);
      if (examples.length === 0) return false;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const cards = examples.map((example) => ({
        example,
        width: SEQUENCE_CARD_PAD * 2 + example.cols * SEQUENCE_CELL_SIZE + (example.cols - 1) * SEQUENCE_CELL_GAP,
        height: SEQUENCE_CARD_PAD * 2 + 44 + example.rows * SEQUENCE_CELL_SIZE + (example.rows - 1) * SEQUENCE_CELL_GAP,
      }));
      const totalWidth = cards.reduce((sum, card) => sum + card.width, 0) + (cards.length - 1) * SEQUENCE_EXAMPLE_GAP_X;
      let x = viewport.x + viewWidth / 2 - totalWidth / 2;
      const y = viewport.y + viewHeight / 2 - Math.max(...cards.map((card) => card.height)) / 2;
      const base = removeAssignmentExamplesAndFrames(objectsRef.current, aid, ['sequenceExample']);
      const nextExamples: SequenceExampleObject[] = cards.map((card) => {
        const object: SequenceExampleObject = {
          kind: 'sequenceExample',
          id: crypto.randomUUID(),
          assignmentId: aid,
          x,
          y,
          width: card.width,
          height: card.height,
          example: card.example,
          activeCellId: card.example.cells.find((cell) => !cell.given)?.id ?? null,
        };
        x += card.width + SEQUENCE_EXAMPLE_GAP_X;
        return object;
      });
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...base, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(aid);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setTool('select');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return true;
    },
    [activeAssignmentId, commitObjects, createCanvasFrameForObjects, viewport],
  );

  const replaceDominoAssignment = useCallback(
    (settings: DominoTaskSettings): boolean => {
      const aid = activeAssignmentId;
      if (!aid) return false;
      const examples = generateDominoExamples(settings);
      if (examples.length === 0) return false;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * DOMINO_EXAMPLE_WIDTH + (examples.length - 1) * DOMINO_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - DOMINO_EXAMPLE_HEIGHT / 2;
      const base = removeAssignmentExamplesAndFrames(objectsRef.current, aid, ['dominoExample']);
      const nextExamples: DominoExampleObject[] = examples.map((example, index) => ({
        kind: 'dominoExample',
        id: crypto.randomUUID(),
        assignmentId: aid,
        x: startX + index * (DOMINO_EXAMPLE_WIDTH + DOMINO_EXAMPLE_GAP_X),
        y: startY,
        width: DOMINO_EXAMPLE_WIDTH,
        height: DOMINO_EXAMPLE_HEIGHT,
        example,
      }));
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...base, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(aid);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return true;
    },
    [activeAssignmentId, commitObjects, createCanvasFrameForObjects, viewport],
  );

  const replaceMarbleBagAssignment = useCallback(
    (settings: MarbleBagTaskSettings): boolean => {
      const aid = activeAssignmentId;
      if (!aid) return false;
      const examples = generateMarbleBagExamples(settings);
      if (examples.length === 0) return false;
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const totalWidth = examples.length * MARBLE_BAG_EXAMPLE_WIDTH + (examples.length - 1) * MARBLE_BAG_EXAMPLE_GAP_X;
      const startX = viewport.x + viewWidth / 2 - totalWidth / 2;
      const startY = viewport.y + viewHeight / 2 - MARBLE_BAG_EXAMPLE_HEIGHT / 2;
      const base = removeAssignmentExamplesAndFrames(objectsRef.current, aid, ['marbleBagExample']);
      const nextExamples: MarbleBagExampleObject[] = examples.map((example, index) => ({
        kind: 'marbleBagExample',
        id: crypto.randomUUID(),
        assignmentId: aid,
        x: startX + index * (MARBLE_BAG_EXAMPLE_WIDTH + MARBLE_BAG_EXAMPLE_GAP_X),
        y: startY,
        width: MARBLE_BAG_EXAMPLE_WIDTH,
        height: MARBLE_BAG_EXAMPLE_HEIGHT,
        example,
        items: [],
      }));
      const frames = nextExamples
        .map((example, index) => createCanvasFrameForObjects([example], { title: `Příklad ${index + 1}` }))
        .filter((frame): frame is CanvasFrameObject => !!frame);
      commitObjects([...base, ...frames, ...nextExamples], [nextExamples[0].id]);
      const firstFrame = frames[0];
      if (firstFrame) fitViewportToBoundsRef.current(objectBounds(firstFrame), { animated: true });
      setActiveAssignmentId(aid);
      setActiveExampleId(nextExamples[0].id);
      setActiveTaskSettings(settings);
      setPinnedMathGlyphs(true);
      setLibraryDock('side');
      setTool('stamp');
      setLibraryPanelMode('tasks');
      setTeacherTaskPanelLayout('student-preview');
      setTaskPanelSyncTick((n) => n + 1);
      return true;
    },
    [activeAssignmentId, commitObjects, createCanvasFrameForObjects, viewport],
  );

  const upsertArithmeticAssignment = useCallback(
    (settings: ArithmeticTaskSettings) => {
      if (studentTaskMode) return;
      const aid = activeAssignmentId;
      const canReplace =
        aid &&
        activeTaskSettings?.type === 'arithmetic' &&
        objectsRef.current.some((o) => o.kind === 'arithmeticExample' && o.assignmentId === aid);
      if (canReplace && replaceArithmeticAssignment(settings)) return;
      createArithmeticAssignment(settings);
    },
    [
      activeAssignmentId,
      activeTaskSettings?.type,
      createArithmeticAssignment,
      replaceArithmeticAssignment,
      studentTaskMode,
    ],
  );

  const upsertSequenceAssignment = useCallback(
    (settings: SequenceTaskSettings) => {
      if (studentTaskMode) return;
      const aid = activeAssignmentId;
      const canReplace =
        aid &&
        activeTaskSettings?.type === 'sequence' &&
        objectsRef.current.some((o) => o.kind === 'sequenceExample' && o.assignmentId === aid);
      if (canReplace && replaceSequenceAssignment(settings)) return;
      createSequenceAssignment(settings);
    },
    [
      activeAssignmentId,
      activeTaskSettings?.type,
      createSequenceAssignment,
      replaceSequenceAssignment,
      studentTaskMode,
    ],
  );

  const upsertDominoAssignment = useCallback(
    (settings: DominoTaskSettings) => {
      if (studentTaskMode) return;
      const aid = activeAssignmentId;
      const canReplace =
        aid &&
        activeTaskSettings?.type === 'domino' &&
        objectsRef.current.some((o) => o.kind === 'dominoExample' && o.assignmentId === aid);
      if (canReplace && replaceDominoAssignment(settings)) return;
      createDominoAssignment(settings);
    },
    [
      activeAssignmentId,
      activeTaskSettings?.type,
      createDominoAssignment,
      replaceDominoAssignment,
      studentTaskMode,
    ],
  );

  const upsertMarbleBagAssignment = useCallback(
    (settings: MarbleBagTaskSettings) => {
      if (studentTaskMode) return;
      const aid = activeAssignmentId;
      const canReplace =
        aid &&
        activeTaskSettings?.type === 'marbleBag' &&
        objectsRef.current.some((o) => o.kind === 'marbleBagExample' && o.assignmentId === aid);
      if (canReplace && replaceMarbleBagAssignment(settings)) return;
      createMarbleBagAssignment(settings);
    },
    [
      activeAssignmentId,
      activeTaskSettings?.type,
      createMarbleBagAssignment,
      replaceMarbleBagAssignment,
      studentTaskMode,
    ],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.startsWith('#share=')) return;
    const prefix = '#task=';
    if (!window.location.hash.startsWith(prefix)) return;
    const payload = window.location.hash.slice(prefix.length);
    if (!payload || restoredTaskPayloadRef.current === payload) return;
    const settings = decodeAssignmentFromUrlPayload(payload);
    if (!settings) return;
    restoredTaskPayloadRef.current = payload;
    if (settings.type === 'sequence') createSequenceAssignment(settings);
    else if (settings.type === 'domino') createDominoAssignment(settings);
    else if (settings.type === 'marbleBag') createMarbleBagAssignment(settings);
    else createArithmeticAssignment(settings);
  }, [createArithmeticAssignment, createDominoAssignment, createMarbleBagAssignment, createSequenceAssignment]);

  const flushActiveSplitAnimation = useCallback(() => {
    if (splitAnimRafRef.current !== null) {
      cancelAnimationFrame(splitAnimRafRef.current);
      splitAnimRafRef.current = null;
    }
    const meta = splitAnimMetaRef.current;
    if (!meta) return;
    splitAnimMetaRef.current = null;
    const snapped = objectsRef.current.map((object) =>
      object.kind === 'buildNumberTile' && object.id === meta.rightId ? { ...object, x: meta.rightXFinal } : object,
    );
    const cloned = cloneObjects(snapped);
    objectsRef.current = cloned;
    setObjects(cloned);
    pushHistory(cloned);
  }, [pushHistory]);

  const runBuildTileSplitAnimation = useCallback(
    (tile: BuildNumberTileObject, splitAfter: number) => {
      flushActiveSplitAnimation();
      const [leftFinal, rightFinal] = splitBuildNumberTileIntoTwo(tile, splitAfter);
      const rightStartX = tile.x + leftFinal.width;
      splitAnimMetaRef.current = { rightId: rightFinal.id, rightXFinal: rightFinal.x };

      const phase0 = [...objectsRef.current.filter((o) => o.id !== tile.id), leftFinal, { ...rightFinal, x: rightStartX }];
      const cloned0 = cloneObjects(phase0);
      objectsRef.current = cloned0;
      setObjects(cloned0);
      setSelectedIds([leftFinal.id, rightFinal.id]);
      setBuildTileGapHover(null);

      const t0 = performance.now();
      const dxTotal = rightFinal.x - rightStartX;

      const step = (now: number) => {
        const elapsed = Math.min(1, (now - t0) / BUILD_TILE_SPLIT_ANIM_MS);
        const eased = easeBuildTileSplitOut(elapsed);
        const rx = rightStartX + dxTotal * eased;
        const next = cloneObjects(objectsRef.current).map((object) =>
          object.kind === 'buildNumberTile' && object.id === rightFinal.id ? { ...object, x: rx } : object,
        );
        objectsRef.current = next;
        setObjects(next);
        if (elapsed < 1 - 2e-4) {
          splitAnimRafRef.current = requestAnimationFrame(step);
        } else {
          splitAnimRafRef.current = null;
          splitAnimMetaRef.current = null;
          const done = cloneObjects(objectsRef.current).map((object) =>
            object.kind === 'buildNumberTile' && object.id === rightFinal.id ? { ...object, x: rightFinal.x } : object,
          );
          objectsRef.current = done;
          setObjects(done);
          pushHistory(done);
        }
      };
      splitAnimRafRef.current = requestAnimationFrame(step);
    },
    [flushActiveSplitAnimation, pushHistory],
  );

  useEffect(() => {
    return () => {
      if (splitAnimRafRef.current !== null) cancelAnimationFrame(splitAnimRafRef.current);
      splitAnimRafRef.current = null;
      const meta = splitAnimMetaRef.current;
      splitAnimMetaRef.current = null;
      if (!meta) return;
      const snapped = objectsRef.current.map((object) =>
        object.kind === 'buildNumberTile' && object.id === meta.rightId ? { ...object, x: meta.rightXFinal } : object,
      );
      objectsRef.current = cloneObjects(snapped);
    };
  }, []);

  const stepSelectedBuildTileValue = useCallback(
    (delta: number) => {
      const sid = selectedIdsRef.current;
      if (sid.length !== 1) return;
      const id = sid[0];
      const list = objectsRef.current;
      const tile = list.find(
        (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile' && o.id === id,
      );
      if (!tile || boardObjectIsLocked(tile)) return;
      const updated = buildNumberTileWithValue(tile, tile.value + delta);
      if (updated === tile) return;
      commitObjects(
        list.map((o) => (o.id === id ? updated : o)),
        sid,
      );
    },
    [commitObjects],
  );

  const closeMathInlineEdit = useCallback(() => {
    const id = mathInlineEditIdRef.current;
    if (!id) return;
    const mode = mathInlineTypingKindRef.current;
    mathInlineTypingKindRef.current = null;
    mathInlineEditIdRef.current = null;
    setMathInlineEditId(null);
    const list = objectsRef.current;
    const sel = selectedIdsRef.current;
    const obj = list.find((o): o is MathGlyphObject => o.kind === 'mathGlyph' && o.id === id);
    if (!obj) return;
    const maxLen = mode === 'text' ? TEXT_INLINE_MAX_LEN : MATH_INLINE_MAX_LEN;
    const trimmed = obj.label.trim().slice(0, maxLen);
    if (!trimmed) {
      commitObjects(
        list.filter((o) => o.id !== id),
        sel.filter((sid) => sid !== id),
      );
    } else {
      commitObjects(
        list.map((o) =>
          o.id === id && o.kind === 'mathGlyph' ? mathGlyphRelabelKeepingCenter(o, trimmed) : o,
        ),
        sel,
      );
    }
  }, [commitObjects]);

  useEffect(() => {
    if (!mathInlineEditId) return;
    if (tool !== 'mathWrite' && tool !== 'textWrite') {
      closeMathInlineEdit();
    }
  }, [tool, mathInlineEditId, closeMathInlineEdit]);

  const cancelMathTypingFlow = useCallback(() => {
    closeMathInlineEdit();
  }, [closeMathInlineEdit]);

  const startGlyphInlineEdit = useCallback(
    (center: Point, kind: 'math' | 'text') => {
      mathInlineTypingKindRef.current = kind;
      const r = MATH_GLYPH_R;
      const id = crypto.randomUUID();
      const base = stripStyleToGlyphFields(mathGlyphStripStyle);
      const nextObject: MathGlyphObject = {
        kind: 'mathGlyph',
        id,
        x: center.x - r,
        y: center.y - r,
        r,
        label: '',
        ...base,
        ...(kind === 'text' ? { fontVariant: 'printed' as const } : {}),
      };
      commitObjects([...objectsRef.current, nextObject], [id]);
      setMathInlineEditingId(id);
    },
    [commitObjects, mathGlyphStripStyle, setMathInlineEditingId],
  );

  const appendMathGlyphChar = useCallback(
    (id: string, ch: string) => {
      const kind = mathInlineTypingKindRef.current;
      const norm = kind === 'text' ? ch : normalizeMathGlyphChar(ch);
      const maxLen = kind === 'text' ? TEXT_INLINE_MAX_LEN : MATH_INLINE_MAX_LEN;
      const list = objectsRef.current;
      const obj = list.find((o): o is MathGlyphObject => o.kind === 'mathGlyph' && o.id === id);
      if (!obj || obj.label.length >= maxLen) return;
      const nextLabel = obj.label + norm;
      commitObjects(
        list.map((o) =>
          o.id === id && o.kind === 'mathGlyph' ? mathGlyphRelabelKeepingCenter(o, nextLabel) : o,
        ),
        [id],
      );
    },
    [commitObjects],
  );

  const backspaceMathGlyph = useCallback(
    (id: string) => {
      const list = objectsRef.current;
      const obj = list.find((o): o is MathGlyphObject => o.kind === 'mathGlyph' && o.id === id);
      if (!obj || !obj.label.length) return;
      const nextLabel = obj.label.slice(0, -1);
      commitObjects(
        list.map((o) =>
          o.id === id && o.kind === 'mathGlyph' ? mathGlyphRelabelKeepingCenter(o, nextLabel) : o,
        ),
        [id],
      );
    },
    [commitObjects],
  );

  const handleMathInlineKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const id = mathInlineEditIdRef.current;
      if (!id) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        closeMathInlineEdit();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeMathInlineEdit();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        backspaceMathGlyph(id);
        return;
      }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const kind = mathInlineTypingKindRef.current;
        const ok = kind === 'text' ? isTextGlyphInputChar(e.key) : isMathGlyphInputChar(e.key);
        if (!ok) return;
        e.preventDefault();
        e.stopPropagation();
        appendMathGlyphChar(id, e.key);
      }
    },
    [appendMathGlyphChar, backspaceMathGlyph, closeMathInlineEdit],
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    const nextObjects = cloneObjects(snapshot.objects);
    objectsRef.current = nextObjects;
    setObjects(nextObjects);
    setSelectedIds([]);
    setHistoryUI({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
    markDocumentDirtyRef.current();
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    const nextObjects = cloneObjects(snapshot.objects);
    objectsRef.current = nextObjects;
    setObjects(nextObjects);
    setSelectedIds([]);
    setHistoryUI({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
    markDocumentDirtyRef.current();
  }, []);

  const deleteSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    const deletableIds = studentTaskMode
      ? selectedIds.filter((id) => {
          const object = objects.find((candidate) => candidate.id === id);
          return object ? isStudentEditableMathGlyph(object) : false;
        })
      : selectedIds;
    if (deletableIds.length === 0) return;
    const ids = new Set(deletableIds);
    commitObjects(
      objects.filter((object) => !ids.has(object.id)),
      [],
    );
  }, [commitObjects, selectedIds, objects, studentTaskMode, isStudentEditableMathGlyph]);

  const clearBoard = useCallback(() => {
    if (objects.length === 0) return;
    commitObjects([], []);
  }, [commitObjects, objects.length]);

  const getTaskForDocumentSave = useCallback((): TaskAssignmentSettings | null => {
    if (activeTaskSettings) return activeTaskSettings;
    if (typeof window === 'undefined') return null;
    if (!window.location.hash.startsWith('#task=')) return null;
    return decodeAssignmentFromUrlPayload(window.location.hash.slice(6));
  }, [activeTaskSettings]);

  const buildDocumentJsonPayload = useCallback(() => {
    const t = getTaskForDocumentSave();
    return buildBoardDocumentJson({
      title: documentTitle,
      viewport: viewportRef.current,
      objects: JSON.parse(JSON.stringify(objectsRef.current)) as unknown[],
      libraryDock,
      background: boardBackground,
      metadata: documentMetadata,
      createdAt: documentCreatedAtRef.current,
      ...(t !== null ? { task: t } : {}),
    });
  }, [documentTitle, libraryDock, boardBackground, documentMetadata, getTaskForDocumentSave]);

  const applyBoardDocument = useCallback(
    (
      doc: BoardDocumentV1,
      options?: {
        displayName?: string;
        fileHandle?: FileSystemFileHandle | null;
        cloudFileId?: string | null;
        preserveUrl?: boolean;
        /** Při sync z live session nepřepisovat viewport (každý může mít vlastní zoom/pan). */
        preserveViewport?: boolean;
      },
    ) => {
      suppressDocumentDirtyRef.current = true;
      const loadedObjects = cloneObjects(JSON.parse(JSON.stringify(doc.objects)) as BoardObject[]);
      historyRef.current = [{ objects: cloneObjects(loadedObjects) }];
      historyIndexRef.current = 0;
      const snapshot = cloneObjects(loadedObjects);
      objectsRef.current = snapshot;
      setObjects(snapshot);
      setHistoryUI({ canUndo: false, canRedo: false });
      setSelectedIds([]);
      if (!options?.preserveViewport) {
        setViewport(doc.viewport);
      }
      const normalizedDock = doc.ui.libraryDock === 'bottom' ? 'side' : doc.ui.libraryDock;
      setLibraryDock(normalizedDock);
      setBoardBackground(doc.ui.background ?? DEFAULT_BOARD_BACKGROUND);
      setDocumentMetadata(doc.ui.metadata ?? DEFAULT_BOARD_METADATA);
      try {
        localStorage.setItem(LIBRARY_DOCK_STORAGE_KEY, normalizedDock);
      } catch {
        /* noop */
      }
      setDocumentTitle(doc.title);
      documentCreatedAtRef.current = doc.createdAt;
      const { assignmentId, exampleId } = pickActiveTaskIdsFromObjects(loadedObjects);
      setActiveAssignmentId(assignmentId);
      setActiveExampleId(exampleId);
      setActiveTaskSettings(doc.task ?? null);
      setMachineSettings(null);
      setMathInlineEditingId(null);
      setBoardContextMenu(null);
      tempStrokeRef.current = null;
      setTempStroke(null);
      tempBoardShapeRef.current = null;
      setTempBoardShape(null);
      setLassoPoints([]);
      setTool('select');
      setLibraryPanelMode('closed');
      fileHandleRef.current = options?.fileHandle ?? null;
      cloudFileIdRef.current = options?.cloudFileId ?? null;
      setFileDisplayLabel(options?.displayName ?? doc.title);
      if (typeof window !== 'undefined' && options?.preserveUrl !== true) {
        const { pathname, search } = window.location;
        window.history.replaceState(null, '', `${pathname}${search}`);
        restoredTaskPayloadRef.current = null;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          suppressDocumentDirtyRef.current = false;
          setDocumentDirty(false);
        });
      });
    },
    [setMathInlineEditingId],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;
    const prefix = '#share=';
    if (!window.location.hash.startsWith(prefix)) return;
    const token = window.location.hash.slice(prefix.length);
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const result = await getBoardContentShareByToken(supabase, decodeURIComponent(token));
      if (cancelled) return;
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      applyBoardDocument(result.share.document, {
        displayName: `${result.share.title} (kopie)`,
        fileHandle: null,
        cloudFileId: null,
        preserveUrl: true,
      });
      setStudentShare(result.share);
      setStudentTaskShare(null);
      setStudentSubmitted(false);
      setStudentTaskScore(null);
      setStudentName('');
      setStudentNameDraft('');
      setDocumentTitle(result.share.title);
      cloudFileIdRef.current = null;
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, applyBoardDocument]);

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;
    const prefix = '#task-share=';
    if (!window.location.hash.startsWith(prefix)) return;
    const token = window.location.hash.slice(prefix.length);
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const result = await getBoardTaskShareByToken(supabase, decodeURIComponent(token));
      if (cancelled) return;
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      applyBoardDocument(result.share.document, {
        displayName: `${result.share.title} (úkol)`,
        fileHandle: null,
        cloudFileId: null,
        preserveUrl: true,
      });
      setStudentShare(null);
      setStudentTaskShare(result.share);
      setStudentSubmitted(false);
      setStudentTaskScore(null);
      setStudentName('');
      setStudentNameDraft('');
      setDocumentTitle(result.share.title);
      cloudFileIdRef.current = null;
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, applyBoardDocument]);

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;
    const prefix = '#live=';
    if (!window.location.hash.startsWith(prefix)) return;
    const token = window.location.hash.slice(prefix.length).trim();
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const result = await getBoardLiveSessionByToken(supabase, decodeURIComponent(token));
      if (cancelled) return;
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      let name = getStoredLiveDisplayName();
      if (!name.trim()) {
        const entered = window.prompt('Jak tě mají ostatní vidět u kurzoru?', 'Účastník')?.trim();
        name = entered || 'Účastník';
        setStoredLiveDisplayName(name);
      }
      applyBoardDocument(result.session.document, {
        displayName: result.session.title,
        fileHandle: null,
        cloudFileId: null,
        preserveUrl: true,
        preserveViewport: true,
      });
      setDocumentTitle(result.session.title);
      cloudFileIdRef.current = null;
      setStudentShare(null);
      setStudentTaskShare(null);
      setStudentSubmitted(false);
      setStudentTaskScore(null);
      setStudentName('');
      setStudentNameDraft('');
      setLiveCollabToken(result.session.room_token);
      setLiveCollabSessionId(result.session.id);
      setLiveCollabOwnerId(result.session.owner_id);
      setLiveDisplayName(name);
      liveRemoteDocTimeRef.current = Date.now();
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, applyBoardDocument]);

  useEffect(() => {
    if (!user?.id || !liveCollabOwnerId || user.id !== liveCollabOwnerId) return;
    setLiveDisplayName((n) => n.trim() || user.email?.split('@')[0]?.trim() || 'Učitel');
  }, [user?.id, user?.email, liveCollabOwnerId]);

  useEffect(() => {
    if (!supabase || !liveCollabToken) {
      liveChannelReadyRef.current = false;
      if (liveChannelRef.current) {
        const prev = liveChannelRef.current;
        liveChannelRef.current = null;
        void supabase?.removeChannel(prev);
      }
      return;
    }
    const peerId = getOrCreateLivePeerId();
    livePeerIdRef.current = peerId;

    const ch = supabase.channel(liveRealtimeChannelName(liveCollabToken), {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'cursor' }, (msg: { payload?: Record<string, unknown> }) => {
      const p = (msg && typeof msg === 'object' && 'payload' in msg
        ? (msg.payload as Record<string, unknown>)
        : msg) as Record<string, unknown>;
      const pid = typeof p.peerId === 'string' ? p.peerId : '';
      if (!pid || pid === peerId) return;
      const wx = p.wx;
      const wy = p.wy;
      if (typeof wx !== 'number' || typeof wy !== 'number') return;
      setLivePeerCursors((prev) => ({
        ...prev,
        [pid]: {
          wx,
          wy,
          name: (typeof p.name === 'string' ? p.name : 'Účastník').slice(0, 40),
          color: liveCursorColorForPeer(pid),
          t: typeof p.t === 'number' ? p.t : Date.now(),
        },
      }));
    });

    ch.on('broadcast', { event: 'doc' }, (msg: { payload?: Record<string, unknown> }) => {
      const p = (msg && typeof msg === 'object' && 'payload' in msg
        ? (msg.payload as Record<string, unknown>)
        : msg) as Record<string, unknown>;
      const pid = typeof p.peerId === 'string' ? p.peerId : '';
      if (!pid || pid === peerId) return;
      const t = typeof p.t === 'number' ? p.t : 0;
      if (t <= liveRemoteDocTimeRef.current) return;
      const docRaw = p.doc;
      if (!docRaw || typeof docRaw !== 'object') return;
      liveRemoteDocTimeRef.current = t;
      const parsed = parseBoardDocumentJson(JSON.stringify(docRaw));
      if (!parsed.ok) return;
      liveApplyingRemoteRef.current = true;
      try {
        applyBoardDocument(parsed.doc, {
          preserveUrl: true,
          preserveViewport: true,
        });
      } finally {
        requestAnimationFrame(() => {
          liveApplyingRemoteRef.current = false;
        });
      }
    });

    ch.subscribe((status) => {
      liveChannelReadyRef.current = status === 'SUBSCRIBED';
    });

    liveChannelRef.current = ch;

    return () => {
      liveChannelReadyRef.current = false;
      liveChannelRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [supabase, liveCollabToken, applyBoardDocument]);

  useEffect(() => {
    if (!liveCollabToken) {
      setLivePeerCursors({});
      return;
    }
    const id = window.setInterval(() => {
      const now = Date.now();
      setLivePeerCursors((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const k of Object.keys(next)) {
          if (now - next[k].t > 7000) {
            delete next[k];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2200);
    return () => clearInterval(id);
  }, [liveCollabToken]);

  const performSave = useCallback(async () => {
    const json = buildDocumentJsonPayload();
    const handle = fileHandleRef.current;
    if (handle) {
      try {
        await writeTextToFileHandle(handle, json);
        setDocumentDirty(false);
        return;
      } catch {
        fileHandleRef.current = null;
      }
    }
    downloadBoardDocumentBlob(suggestedBoardFileName(documentTitle), json);
    setDocumentDirty(false);
  }, [buildDocumentJsonPayload, documentTitle]);

  const performSaveAs = useCallback(async () => {
    const json = buildDocumentJsonPayload();
    const suggested = suggestedBoardFileName(documentTitle);
    const win = window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string;
        types?: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<FileSystemFileHandle>;
    };
    if (typeof win.showSaveFilePicker === 'function') {
      try {
        const handle = await win.showSaveFilePicker({
          suggestedName: suggested,
          types: [
            {
              description: 'Nástěnka (MA)',
              accept: { 'application/json': [BOARD_FILE_EXTENSION, '.json'] },
            },
          ],
        });
        await writeTextToFileHandle(handle, json);
        fileHandleRef.current = handle;
        cloudFileIdRef.current = null;
        const shortName = handle.name.replace(/\.(mnboard|json)$/i, '') || documentTitle;
        setFileDisplayLabel(shortName);
        setDocumentTitle(shortName);
        setDocumentDirty(false);
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }
    downloadBoardDocumentBlob(suggested, json);
    fileHandleRef.current = null;
    cloudFileIdRef.current = null;
    setDocumentDirty(false);
  }, [buildDocumentJsonPayload, documentTitle]);

  const performCloudSave = useCallback(async () => {
    if (!supabase || !user) {
      window.alert('Nejdřív se přihlas v horní liště (e-mail a heslo).');
      return;
    }
    const json = buildDocumentJsonPayload();
    const r = await saveBoardDocumentToCloud(supabase, user.id, json, {
      fileId: cloudFileIdRef.current,
      title: documentTitle,
    });
    if (!r.ok) {
      window.alert(r.error);
      return;
    }
    cloudFileIdRef.current = r.fileId;
    fileHandleRef.current = null;
    setFileDisplayLabel(documentTitle);
    setDocumentDirty(false);
  }, [supabase, user, buildDocumentJsonPayload, documentTitle]);

  const handleOpenCloudDocument = useCallback(
    (doc: BoardDocumentV1, meta: { title: string; cloudFileId: string }) => {
      if (documentDirty && !window.confirm('Zahodit neuložené změny a načíst soubor z cloudu?')) return;
      applyBoardDocument(doc, {
        displayName: meta.title,
        fileHandle: null,
        cloudFileId: meta.cloudFileId,
      });
      setDocumentTitle(meta.title);
    },
    [documentDirty, applyBoardDocument],
  );

  const handleNewBoardDocument = useCallback(() => {
    if (documentDirty && !window.confirm('Zahodit neuložené změny a začít novou nástěnku?')) return;
    suppressDocumentDirtyRef.current = true;
    historyRef.current = [{ objects: [] }];
    historyIndexRef.current = 0;
    objectsRef.current = [];
    setObjects([]);
    setHistoryUI({ canUndo: false, canRedo: false });
    setSelectedIds([]);
    setViewport({ x: -600, y: -360, scale: 1 });
    setActiveAssignmentId(null);
    setActiveExampleId(null);
    setActiveTaskSettings(null);
    setMachineSettings(null);
    setMathInlineEditingId(null);
    setBoardContextMenu(null);
    tempStrokeRef.current = null;
    setTempStroke(null);
    tempBoardShapeRef.current = null;
    setTempBoardShape(null);
    setLassoPoints([]);
    setTool('select');
    setLibraryPanelMode('closed');
    setBoardBackground(DEFAULT_BOARD_BACKGROUND);
    setDocumentMetadata(DEFAULT_BOARD_METADATA);
    setStudentShare(null);
    setStudentTaskShare(null);
    setStudentName('');
    setStudentSubmitted(false);
    setStudentTaskScore(null);
    setDocumentTitle('Nástěnka');
    setFileDisplayLabel('Bez názvu');
    documentCreatedAtRef.current = new Date().toISOString();
    fileHandleRef.current = null;
    cloudFileIdRef.current = null;
    if (typeof window !== 'undefined') {
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}`);
      restoredTaskPayloadRef.current = null;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        suppressDocumentDirtyRef.current = false;
        setDocumentDirty(false);
      });
    });
  }, [documentDirty, setMathInlineEditingId]);

  const handleBoardBackgroundChange = useCallback((next: BoardBackgroundSettings) => {
    setBoardBackground(next);
    markDocumentDirtyRef.current();
  }, []);

  const handleDocumentMetadataChange = useCallback((next: BoardDocumentMetadata) => {
    setDocumentMetadata(next);
    markDocumentDirtyRef.current();
  }, []);

  const boardSvgBackgroundStyle = useMemo(() => {
    const color = boardBackground.color;
    if (boardBackground.pattern === 'dots') {
      return {
        backgroundColor: color,
        backgroundImage: 'radial-gradient(circle, rgba(30, 27, 75, 0.22) 1.4px, transparent 1.6px)',
        backgroundSize: '28px 28px',
      };
    }
    if (boardBackground.pattern === 'denseDots') {
      return {
        backgroundColor: color,
        backgroundImage: 'radial-gradient(circle, rgba(30, 27, 75, 0.2) 1.2px, transparent 1.5px)',
        backgroundSize: '16px 16px',
      };
    }
    if (boardBackground.pattern === 'grid') {
      return {
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(rgba(30, 27, 75, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 27, 75, 0.16) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      };
    }
    if (boardBackground.pattern === 'largeGrid') {
      return {
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(rgba(30, 27, 75, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 27, 75, 0.14) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      };
    }
    if (boardBackground.pattern === 'lines') {
      return {
        backgroundColor: color,
        backgroundImage: 'linear-gradient(rgba(30, 27, 75, 0.16) 1px, transparent 1px)',
        backgroundSize: '100% 34px',
      };
    }
    if (boardBackground.pattern === 'wideLines') {
      return {
        backgroundColor: color,
        backgroundImage: 'linear-gradient(rgba(30, 27, 75, 0.14) 1px, transparent 1px)',
        backgroundSize: '100% 56px',
      };
    }
    if (boardBackground.pattern === 'notebook') {
      return {
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 1px, transparent 1px), linear-gradient(rgba(30, 27, 75, 0.14) 1px, transparent 1px)',
        backgroundSize: '100% 34px',
        backgroundPosition: '72px 0, 0 0',
      };
    }
    if (boardBackground.pattern === 'crosses') {
      return {
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(rgba(30, 27, 75, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 27, 75, 0.2) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundPosition: '10px 10px',
      };
    }
    if (boardBackground.pattern === 'isometric') {
      return {
        backgroundColor: color,
        backgroundImage:
          'linear-gradient(30deg, rgba(30, 27, 75, 0.13) 12%, transparent 12.5%, transparent 87%, rgba(30, 27, 75, 0.13) 87.5%, rgba(30, 27, 75, 0.13)), linear-gradient(150deg, rgba(30, 27, 75, 0.13) 12%, transparent 12.5%, transparent 87%, rgba(30, 27, 75, 0.13) 87.5%, rgba(30, 27, 75, 0.13)), linear-gradient(30deg, rgba(30, 27, 75, 0.13) 12%, transparent 12.5%, transparent 87%, rgba(30, 27, 75, 0.13) 87.5%, rgba(30, 27, 75, 0.13)), linear-gradient(150deg, rgba(30, 27, 75, 0.13) 12%, transparent 12.5%, transparent 87%, rgba(30, 27, 75, 0.13) 87.5%, rgba(30, 27, 75, 0.13))',
        backgroundSize: '48px 84px',
        backgroundPosition: '0 0, 0 0, 24px 42px, 24px 42px',
      };
    }
    return {
      background:
        `radial-gradient(circle at top left, rgba(255, 255, 255, 0.34), transparent 34%), ${color}`,
    };
  }, [boardBackground]);

  const currentBoardDocument = useCallback((): BoardDocumentV1 => {
    const parsed = parseBoardDocumentJson(buildDocumentJsonPayload());
    if (parsed.ok) return parsed.doc;
    return {
      formatVersion: 1,
      app: 'ma_nastenka',
      title: documentTitle,
      createdAt: documentCreatedAtRef.current,
      modifiedAt: new Date().toISOString(),
      viewport: viewportRef.current,
      objects: JSON.parse(JSON.stringify(objectsRef.current)) as unknown[],
      ui: { libraryDock, background: boardBackground, metadata: documentMetadata },
    };
  }, [buildDocumentJsonPayload, documentTitle, libraryDock, boardBackground, documentMetadata]);

  const currentBoardDocumentWithViewport = useCallback(
    (viewportOverride: Viewport): BoardDocumentV1 => {
      const doc = currentBoardDocument();
      return {
        ...doc,
        viewport: viewportOverride,
      };
    },
    [currentBoardDocument],
  );

  const currentBoardDocumentRef = useRef(currentBoardDocument);
  useEffect(() => {
    currentBoardDocumentRef.current = currentBoardDocument;
  }, [currentBoardDocument]);

  useEffect(() => {
    if (!liveCollabToken) return;
    const timer = window.setTimeout(() => {
      if (liveApplyingRemoteRef.current) return;
      const ch = liveChannelRef.current;
      if (!ch || !liveChannelReadyRef.current) return;
      const peerId = livePeerIdRef.current;
      const doc = currentBoardDocumentRef.current();
      void ch.send({
        type: 'broadcast',
        event: 'doc',
        payload: {
          t: Date.now(),
          peerId,
          name: liveDisplayNameRef.current,
          doc,
        },
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [objects, documentTitle, libraryDock, boardBackground, documentMetadata, liveCollabToken]);

  useEffect(() => {
    if (!supabase || !liveCollabSessionId || !liveCollabIsHost) return;
    const id = window.setInterval(() => {
      if (!documentDirtyRef.current) return;
      void updateBoardLiveSessionDocument(supabase, liveCollabSessionId, currentBoardDocumentRef.current());
    }, 20000);
    return () => clearInterval(id);
  }, [supabase, liveCollabSessionId, liveCollabIsHost]);

  const handleCreateContentShare = useCallback(async () => {
    if (!supabase || !user) {
      setShareError('Nejdřív se přihlas přes Supabase.');
      return;
    }
    setShareBusy(true);
    setShareError(null);
    try {
      const result = await createBoardContentShare(supabase, {
        ownerId: user.id,
        boardFileId: cloudFileIdRef.current,
        title: documentTitle,
        document: currentBoardDocument(),
      });
      if (!result.ok) {
        setShareError(result.error);
        return;
      }
      setLastShareUrl(boardShareUrl(result.share.token));
    } finally {
      setShareBusy(false);
    }
  }, [supabase, user, documentTitle, currentBoardDocument]);

  const handleStartLiveSession = useCallback(async () => {
    if (!supabase || !user) {
      setShareError('Nejdřív se přihlas přes Supabase.');
      return;
    }
    setShareBusy(true);
    setShareError(null);
    try {
      const result = await createBoardLiveSession(supabase, {
        ownerId: user.id,
        boardFileId: cloudFileIdRef.current,
        title: documentTitle,
        document: currentBoardDocument(),
      });
      if (!result.ok) {
        setShareError(result.error);
        return;
      }
      setLastLiveShareUrl(boardLiveSessionUrl(result.session.room_token));
      setLiveCollabToken(result.session.room_token);
      setLiveCollabSessionId(result.session.id);
      setLiveCollabOwnerId(result.session.owner_id);
      setLiveDisplayName(user.email?.split('@')[0]?.trim() || 'Učitel');
      liveRemoteDocTimeRef.current = Date.now();
    } finally {
      setShareBusy(false);
    }
  }, [supabase, user, documentTitle, currentBoardDocument]);

  const currentTaskShareMeta = useCallback((): {
    taskKind: BoardTaskShareRow['task_kind'];
    taskSettings: TaskAssignmentSettings | null;
    assignmentId: string | null;
  } | null => {
    const taskObjects = objectsRef.current.filter(
      (object): object is ArithmeticExampleObject | DominoExampleObject | SequenceExampleObject | MarbleBagExampleObject =>
        object.kind === 'arithmeticExample' ||
        object.kind === 'dominoExample' ||
        object.kind === 'sequenceExample' ||
        object.kind === 'marbleBagExample',
    );
    if (taskObjects.length === 0) return null;
    const firstAssignmentId = taskObjects[0]?.assignmentId ?? activeAssignmentId;
    const sameAssignment = taskObjects.every((object) => object.assignmentId === firstAssignmentId);
    const kinds = new Set(taskObjects.map((object) => object.kind));
    const taskKind =
      kinds.size > 1
        ? 'mixed'
        : kinds.has('sequenceExample')
          ? 'sequence'
          : kinds.has('dominoExample')
            ? 'domino'
            : kinds.has('marbleBagExample')
              ? 'marbleBag'
              : 'arithmetic';
    return {
      taskKind,
      taskSettings: getTaskForDocumentSave(),
      assignmentId: sameAssignment ? firstAssignmentId : activeAssignmentId,
    };
  }, [activeAssignmentId, getTaskForDocumentSave]);

  const createTaskShareFromMeta = useCallback(async (meta: {
    taskKind: BoardTaskShareRow['task_kind'];
    taskSettings: TaskAssignmentSettings | null;
    assignmentId: string | null;
    document?: BoardDocumentV1;
  }) => {
    if (!supabase || !user) {
      setShareError('Nejdřív se přihlas přes Supabase.');
      return null;
    }
    setShareBusy(true);
    setShareError(null);
    try {
      const cloudResult = await saveBoardDocumentToCloud(supabase, user.id, buildDocumentJsonPayload(), {
        fileId: cloudFileIdRef.current,
        title: documentTitle,
      });
      if (!cloudResult.ok) {
        setShareError(cloudResult.error);
        return null;
      }
      cloudFileIdRef.current = cloudResult.fileId;
      fileHandleRef.current = null;
      setFileDisplayLabel(documentTitle);
      setDocumentDirty(false);

      const result = await createBoardTaskShare(supabase, {
        ownerId: user.id,
        boardFileId: cloudResult.fileId,
        title: documentTitle,
        document: meta.document ?? currentBoardDocument(),
        taskKind: meta.taskKind,
        taskSettings: meta.taskSettings,
        assignmentId: meta.assignmentId,
      });
      if (!result.ok) {
        setShareError(result.error);
        return null;
      }
      const url = boardTaskShareUrl(result.share.token);
      setLastTaskShareUrl(url);
      setLastShareUrl(null);
      return result.share;
    } finally {
      setShareBusy(false);
    }
  }, [supabase, user, buildDocumentJsonPayload, documentTitle, currentBoardDocument]);

  const handleCreateTaskShare = useCallback(async () => {
    const meta = currentTaskShareMeta();
    if (!meta) {
      setShareError('Nejdřív vytvoř úkol, potom ho můžeš zadat žákům.');
      return;
    }
    await createTaskShareFromMeta(meta);
  }, [createTaskShareFromMeta, currentTaskShareMeta]);

  const handleSubmitStudentShare = useCallback(async () => {
    if (!supabase || !studentShare) return;
    const name = studentName.trim();
    if (!name) return;
    setStudentSubmitBusy(true);
    try {
      const result = await submitBoardShare(supabase, {
        shareId: studentShare.id,
        studentName: name,
        document: currentBoardDocument(),
      });
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setStudentSubmitted(true);
      setDocumentDirty(false);
    } finally {
      setStudentSubmitBusy(false);
    }
  }, [supabase, studentShare, studentName, currentBoardDocument]);

  const handleSubmitStudentTask = useCallback(async () => {
    if (!supabase || !studentTaskShare) return;
    const name = studentName.trim();
    if (!name) return;
    const score = calculateTaskScore(objectsRef.current, studentTaskShare.assignment_id);
    setStudentSubmitBusy(true);
    try {
      const result = await submitBoardTask(supabase, {
        taskShareId: studentTaskShare.id,
        studentName: name,
        document: currentBoardDocument(),
        score,
      });
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setStudentTaskScore(score);
      setStudentSubmitted(true);
      setDocumentDirty(false);
    } finally {
      setStudentSubmitBusy(false);
    }
  }, [supabase, studentTaskShare, studentName, currentBoardDocument]);

  const confirmStudentTaskName = useCallback(() => {
    const name = studentNameDraft.trim();
    if (!name) return;
    setStudentName(name);
  }, [studentNameDraft]);

  const handleOpenTaskResults = useCallback(async () => {
    if (!supabase || !user) {
      window.alert('Nejdřív se přihlas přes Supabase.');
      return;
    }
    if (!cloudFileIdRef.current) {
      window.alert('Nejdřív soubor ulož do cloudu nebo zadej úkol žákům.');
      return;
    }
    setTaskResultsOpen(true);
    setTaskResultsBusy(true);
    setTaskResultsError(null);
    try {
      const sharesResult = await listBoardTaskSharesForFile(supabase, cloudFileIdRef.current);
      if (!sharesResult.ok) {
        setTaskResultsError(sharesResult.error);
        setTaskResults([]);
        return;
      }
      const rows = await Promise.all(
        sharesResult.shares.map(async (share) => {
          const submissionsResult = await listBoardTaskSubmissions(supabase, share.id);
          return {
            share,
            submissions: submissionsResult.ok ? submissionsResult.submissions : [],
            error: submissionsResult.ok ? null : submissionsResult.error,
          };
        }),
      );
      const firstError = rows.find((row) => row.error)?.error ?? null;
      setTaskResultsError(firstError);
      setTaskResults(rows.map(({ share, submissions }) => ({ share, submissions })));
    } finally {
      setTaskResultsBusy(false);
    }
  }, [supabase, user]);

  const handleOpenBoardFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onOpenBoardFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const parsed = parseBoardDocumentJson(text);
        if (!parsed.ok) {
          window.alert(parsed.error);
          return;
        }
        const baseName = file.name.replace(/\.(mnboard|json)$/i, '');
        applyBoardDocument(parsed.doc, { displayName: baseName || parsed.doc.title, fileHandle: null });
      };
      reader.onerror = () => window.alert('Soubor se nepodařilo přečíst.');
      reader.readAsText(file, 'UTF-8');
    },
    [applyBoardDocument],
  );

  const performSelectAllBoardObjects = useCallback(() => {
    if (studentLockedUntilNameRef.current) return;
    if (mathInlineEditIdRef.current) {
      closeMathInlineEdit();
    }
    const allIds = objectsRef.current.map((o) => o.id);
    clearPendingPinnedPlacement();
    cancelMathTypingFlow();
    setLassoPoints([]);
    tempStrokeRef.current = null;
    setTempStroke(null);
    tempBoardShapeRef.current = null;
    setTempBoardShape(null);
    setSelectedIds(allIds);
    setTool('select');
  }, [cancelMathTypingFlow, clearPendingPinnedPlacement, closeMathInlineEdit]);

  const handleBoardContextMenu = useCallback(
    (event: React.MouseEvent<Element>) => {
      const el = event.target as Element | null;
      if (el?.closest?.('textarea, input, select, [contenteditable="true"]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (studentTaskMode) return;
      const world = clientToWorld(event.clientX, event.clientY);
      const tolerance = 10 / viewport.scale;
      const hit = pickBoardObjectHit(world, objectsRef.current, tolerance);
      const targetIds = resolveContextTargetIds(hit, selectedIdsRef.current);
      setBoardContextMenu({ clientX: event.clientX, clientY: event.clientY, world, targetIds });
    },
    [clientToWorld, studentTaskMode, viewport.scale],
  );

  const handleBoardContextSelectAll = useCallback(() => {
    performSelectAllBoardObjects();
    setBoardContextMenu(null);
  }, [performSelectAllBoardObjects]);

  const handleBoardContextCopy = useCallback(async () => {
    if (!boardContextMenu?.targetIds.length) return;
    const toCopy = objectsRef.current.filter((object) => boardContextMenu.targetIds.includes(object.id));
    if (toCopy.length === 0) return;
    const payload = JSON.stringify({ v: 1, app: BOARD_CLIPBOARD_MARKER, objects: toCopy });
    clipboardBoardFallbackRef.current = payload;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      /* záloha v ref pro vložení */
    }
    setBoardContextMenu(null);
  }, [boardContextMenu]);

  const handleBoardContextPaste = useCallback(async () => {
    const anchor = boardContextMenu?.world;
    if (!anchor) return;
    let text = clipboardBoardFallbackRef.current;
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) text = clip;
    } catch {
      /* jen fallback */
    }
    if (!text) {
      setBoardContextMenu(null);
      return;
    }
    const parsed = parseBoardClipboardPayload(text);
    if (!parsed || parsed.length === 0) {
      setBoardContextMenu(null);
      return;
    }
    const fresh = duplicateObjectsForPaste(parsed);
    const bounds = boundsOfBoardObjects(fresh);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const dx = anchor.x - cx;
    const dy = anchor.y - cy;
    const placed = fresh.map((object) => translateBoardObject(object, dx, dy));
    commitObjects([...objectsRef.current, ...placed], placed.map((object) => object.id));
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextDelete = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const drop = new Set(boardContextMenu.targetIds);
    commitObjects(
      objectsRef.current.filter((object) => !drop.has(object.id)),
      [],
    );
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextSplitMathGlyph = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const id = boardContextMenu.targetIds[0];
    const source = objectsRef.current.find((o): o is MathGlyphObject => o.kind === 'mathGlyph' && o.id === id);
    if (!source || boardObjectIsLocked(source) || source.label.length <= 1) return;
    const pieces = splitMathGlyphIntoSeparateGlyphs(source);
    if (pieces.length < 2) return;
    const next = objectsRef.current.flatMap((o) => (o.id === id ? pieces : [o]));
    commitObjects(next, pieces.map((p) => p.id));
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextBringForward = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const next = reorderBoardObjectsBringForward(objectsRef.current, boardContextMenu.targetIds);
    if (!next) return;
    commitObjects(next, selectedIdsRef.current);
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextSendBackward = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const next = reorderBoardObjectsSendBackward(objectsRef.current, boardContextMenu.targetIds);
    if (!next) return;
    commitObjects(next, selectedIdsRef.current);
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextToggleLock = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const targets = new Set(boardContextMenu.targetIds);
    const anyUnlocked = objectsRef.current.some((o) => targets.has(o.id) && !boardObjectIsLocked(o));
    const nextLocked = anyUnlocked;
    const editGlyphId = mathInlineEditIdRef.current;
    if (editGlyphId && targets.has(editGlyphId)) {
      closeMathInlineEdit();
    }
    setStickyEditingId((cur) => (cur && targets.has(cur) ? null : cur));
    setCanvasFrameToolbarOpenForId((cur) => (cur && targets.has(cur) ? null : cur));
    commitObjects(
      objectsRef.current.map((o) => (targets.has(o.id) ? { ...o, locked: nextLocked } : o)),
      selectedIdsRef.current,
    );
    setBoardContextMenu(null);
  }, [boardContextMenu, closeMathInlineEdit, commitObjects]);

  const clearBuildTilePlayback = useCallback(() => {
    buildTilePlaybackTimersRef.current.forEach((id) => window.clearTimeout(id));
    buildTilePlaybackTimersRef.current = [];
    setBuildTilePlaybackHighlight(null);
  }, []);

  const runBuildTileSelectionPlayback = useCallback(
    (tiles: BuildNumberTileObject[]) => {
      clearBuildTilePlayback();
      const sorted = sortBuildTilesReadingOrder(tiles);
      const steps: { tileId: string; cell: number; tileOrdinal: number }[] = [];
      sorted.forEach((tile, tOrd) => {
        for (let c = 0; c < tile.value; c += 1) {
          steps.push({ tileId: tile.id, cell: c, tileOrdinal: tOrd });
        }
      });
      if (steps.length === 0) return;
      const STEP_MS = Math.round(400 * 1.3);
      let i = 0;
      const tick = () => {
        if (i >= steps.length) {
          setBuildTilePlaybackHighlight(null);
          return;
        }
        const s = steps[i];
        setBuildTilePlaybackHighlight({ tileId: s.tileId, cellIndex: s.cell });
        playBuildTileCountBeep(s.tileOrdinal, s.cell);
        i += 1;
        buildTilePlaybackTimersRef.current.push(window.setTimeout(tick, STEP_MS));
      };
      tick();
    },
    [clearBuildTilePlayback],
  );

  const handleBoardContextMergeTiles = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const ids = boardContextMenu.targetIds;
    const tiles = ids
      .map((id) => objectsRef.current.find((o) => o.id === id))
      .filter((o): o is BuildNumberTileObject => o?.kind === 'buildNumberTile');
    if (tiles.length !== ids.length || tiles.length < 2) return;
    const merged = mergeBuildNumberTilesIfAllowed(tiles);
    if (!merged) return;
    const drop = new Set(ids);
    const next = objectsRef.current.filter((object) => !drop.has(object.id)).concat(merged);
    commitObjects(next, [merged.id]);
    setBoardContextMenu(null);
  }, [boardContextMenu, commitObjects]);

  const handleBoardContextPlayTiles = useCallback(() => {
    if (!boardContextMenu?.targetIds.length) return;
    const ids = boardContextMenu.targetIds;
    const tiles = ids
      .map((id) => objectsRef.current.find((o) => o.id === id))
      .filter((o): o is BuildNumberTileObject => o?.kind === 'buildNumberTile');
    if (tiles.length !== ids.length || tiles.length < 1) return;
    setBoardContextMenu(null);
    runBuildTileSelectionPlayback(tiles);
  }, [boardContextMenu, runBuildTileSelectionPlayback]);

  useEffect(() => {
    if (!boardContextMenu) return undefined;
    const onDocMouseDown = (event: MouseEvent) => {
      /* Pravé tlačítko: nejdřív mousedown, pak contextmenu — nezavírat nabídku před otevřením nové. */
      if (event.button === 2) return;
      if (boardContextMenuRef.current?.contains(event.target as Node)) return;
      setBoardContextMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBoardContextMenu(null);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [boardContextMenu]);

  const clearFigureTrail = useCallback((lineId: string, trailId: string) => {
    setTimeout(() => {
      const nextObjects = objectsRef.current.map((object) => {
        if (object.kind !== 'numberLine' || object.id !== lineId || !object.trails?.length) return object;
        return {
          ...object,
          trails: object.trails.filter((trail) => trail.id !== trailId),
        };
      });
      objectsRef.current = nextObjects;
      setObjects(nextObjects);
    }, 950);
  }, []);

  const addFigureToNumberLine = useCallback(
    (lineId: string) => {
      const nextObjects = objectsRef.current.map((object) => {
        if (object.kind !== 'numberLine' || object.id !== lineId) return object;
        const figures = getNumberLineFigures(object);
        if (figures.length >= 2) {
          return {
            ...object,
            mode: 'withFigure' as const,
            activeFigureId: figures[1].id,
            figures,
            figurePosition: figures[1].position,
            trails: object.trails ?? [],
          };
        }
        const nextFigure = {
          id: `figure-${crypto.randomUUID()}`,
          position: object.start,
          color: '#f97316',
        };
        return {
          ...object,
          mode: 'withFigure' as const,
          activeFigureId: nextFigure.id,
          figures: [...figures, nextFigure],
          figurePosition: nextFigure.position,
          trails: object.trails ?? [],
        };
      });
      commitObjects(nextObjects, [lineId]);
    },
    [commitObjects],
  );

  const selectNumberLineFigure = useCallback(
    (lineId: string, figureId: string) => {
      const nextObjects = objectsRef.current.map((object) => {
        if (object.kind !== 'numberLine' || object.id !== lineId) return object;
        const figure = getNumberLineFigures(object).find((candidate) => candidate.id === figureId);
        if (!figure) return object;
        return {
          ...object,
          activeFigureId: figure.id,
          figurePosition: figure.position,
        };
      });
      commitObjects(nextObjects, [lineId]);
    },
    [commitObjects],
  );

  const moveNumberLineFigure = useCallback(
    (lineId: string, direction: -1 | 1) => {
      const movedTrailIds: string[] = [];
      const nextObjects = objectsRef.current.map((object) => {
        if (object.kind !== 'numberLine' || object.id !== lineId || object.mode !== 'withFigure') return object;
        const figures = getNumberLineFigures(object);
        const activeFigure = getActiveFigure(object);
        if (!activeFigure) return object;
        const currentPosition = activeFigure.position;
        const nextPosition = Math.min(object.end, Math.max(object.start, currentPosition + direction));
        if (nextPosition === currentPosition) return object;
        const trailId = crypto.randomUUID();
        movedTrailIds.push(trailId);
        const nextFigures = figures.map((figure) =>
          figure.id === activeFigure.id ? { ...figure, position: nextPosition } : figure,
        );
        return {
          ...object,
          activeFigureId: activeFigure.id,
          figurePosition: nextPosition,
          figures: nextFigures,
          trails: [...(object.trails ?? []), { id: trailId, value: currentPosition, color: activeFigure.color }],
        };
      });

      if (movedTrailIds.length === 0) return;
      commitObjects(nextObjects, [lineId]);
      movedTrailIds.forEach((trailId) => clearFigureTrail(lineId, trailId));
    },
    [clearFigureTrail, commitObjects],
  );

  const cancelViewportAnimation = useCallback(() => {
    if (viewportAnimRafRef.current !== null) {
      cancelAnimationFrame(viewportAnimRafRef.current);
      viewportAnimRafRef.current = null;
    }
  }, []);

  const animateViewportTo = useCallback(
    (from: Viewport, to: Viewport, durationMs = 400) => {
      cancelViewportAnimation();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const e = easeInOutCubic(t);
        setViewport({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          scale: from.scale + (to.scale - from.scale) * e,
        });
        if (t < 1) {
          viewportAnimRafRef.current = requestAnimationFrame(step);
        } else {
          setViewport(to);
          viewportAnimRafRef.current = null;
        }
      };
      viewportAnimRafRef.current = requestAnimationFrame(step);
    },
    [cancelViewportAnimation],
  );

  const fitViewportToBounds = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }, options?: { animated?: boolean }) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const clientWidth = rect?.width ?? window.innerWidth;
      const clientHeight = rect?.height ?? window.innerHeight;
      const target = zoomViewportToFitWorldBounds(clientWidth, clientHeight, bounds);
      if (options?.animated) {
        animateViewportTo(viewportRefForAnim.current, target, 420);
      } else {
        cancelViewportAnimation();
        setViewport(target);
      }
    },
    [animateViewportTo, cancelViewportAnimation],
  );
  fitViewportToBoundsRef.current = fitViewportToBounds;

  const addCanvasFrameFromViewport = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
    const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
    const marginX = viewWidth * 0.1;
    const marginY = viewHeight * 0.12;
    const frame = createCanvasFrameObject(
      {
        x: viewport.x + marginX,
        y: viewport.y + marginY,
        width: viewWidth - marginX * 2,
        height: viewHeight - marginY * 2,
      },
      canvasFrames.length + 1,
    );
    const otherObjects = objectsRef.current.filter((object) => object.kind !== 'canvasFrame');
    commitObjects([...canvasFrames, frame, ...otherObjects], []);
    fitViewportToBounds(objectBounds(frame), { animated: true });
  }, [canvasFrames.length, commitObjects, fitViewportToBounds, viewport]);

  const navigateToCanvasFrame = useCallback(
    (frame: CanvasFrameObject) => {
      setSelectedIds([frame.id]);
      setCanvasFrameToolbarOpenForId(null);
      fitViewportToBounds(objectBounds(frame), { animated: true });
    },
    [fitViewportToBounds],
  );

  const findCanvasFrameContainingObject = useCallback(
    (object: BoardObject) => {
      const bounds = objectBounds(object);
      const center = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
      const containingFrames = canvasFrames.filter((frame) =>
        pointInRect(center, {
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
        }),
      );
      return (
        containingFrames.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null
      );
    },
    [canvasFrames],
  );

  const focusArithmeticExample = useCallback(
    (example: ArithmeticExampleObject | DominoExampleObject, options?: { animated?: boolean }) => {
      const frame = findCanvasFrameContainingObject(example);
      if (frame) {
        setSelectedIds(studentTaskModeRef.current ? [] : [frame.id]);
        setActiveExampleId(example.id);
        fitViewportToBounds(objectBounds(frame), options);
        return;
      }
      const rect = svgRef.current?.getBoundingClientRect();
      const clientWidth = rect?.width ?? window.innerWidth;
      const clientHeight = rect?.height ?? window.innerHeight;
      const target = zoomViewportToFitWorldBounds(clientWidth, clientHeight, {
        x: example.x - 80,
        y: example.y - 80,
        width: example.width + 160,
        height: example.height + 160,
      });
      setSelectedIds([example.id]);
      setActiveExampleId(example.id);
      if (options?.animated) {
        animateViewportTo(viewportRefForAnim.current, target, 420);
      } else {
        cancelViewportAnimation();
        setViewport(target);
      }
    },
    [animateViewportTo, cancelViewportAnimation, findCanvasFrameContainingObject, fitViewportToBounds],
  );

  const stepActiveExample = useCallback(
    (direction: -1 | 1) => {
      if (!activeTaskObjects.length || activeExampleIndex < 0) return;
      const nextIndex = Math.min(
        activeTaskObjects.length - 1,
        Math.max(0, activeExampleIndex + direction),
      );
      const next = activeTaskObjects[nextIndex];
      if (!next) return;
      if (next.kind === 'arithmeticExample' || next.kind === 'dominoExample' || next.kind === 'marbleBagExample') {
        focusArithmeticExample(next, { animated: true });
        return;
      }
      const rect = svgRef.current?.getBoundingClientRect();
      const clientWidth = rect?.width ?? window.innerWidth;
      const clientHeight = rect?.height ?? window.innerHeight;
      const frame = findCanvasFrameContainingObject(next);
      if (frame) {
        setSelectedIds(studentTaskModeRef.current ? [] : [frame.id]);
        setActiveExampleId(next.id);
        fitViewportToBounds(objectBounds(frame), { animated: true });
        return;
      }
      const target = zoomViewportToFitWorldBounds(clientWidth, clientHeight, {
        x: next.x - 80,
        y: next.y - 80,
        width: next.width + 160,
        height: next.height + 160,
      });
      setSelectedIds([next.id]);
      setActiveExampleId(next.id);
      animateViewportTo(viewportRefForAnim.current, target, 420);
    },
    [activeTaskObjects, activeExampleIndex, animateViewportTo, findCanvasFrameContainingObject, fitViewportToBounds, focusArithmeticExample],
  );

  const submitActiveExample = useCallback(() => {
    if (!activeExample) return;
    commitObjects(
      objectsRef.current.map((object) =>
        (object.kind === 'arithmeticExample' || object.kind === 'dominoExample' || object.kind === 'marbleBagExample') &&
        object.id === activeExample.id
          ? { ...object, submitted: true }
          : object,
      ),
      [activeExample.id],
    );
  }, [activeExample, commitObjects]);

  const fillActiveSequenceCell = useCallback(
    (choiceKey: string) => {
      if (!activeSequenceExample) return;
      const activeCellId =
        activeSequenceExample.activeCellId ??
        activeSequenceExample.example.cells.find((cell) => !cell.given && cell.answerKey === undefined)?.id ??
        null;
      if (!activeCellId) return;
      const openCells = activeSequenceExample.example.cells.filter((cell) => !cell.given);
      const currentIndex = openCells.findIndex((cell) => cell.id === activeCellId);
      const nextCell = openCells.slice(currentIndex + 1).find((cell) => cell.answerKey === undefined) ?? null;
      commitObjects(
        objectsRef.current.map((object) =>
          object.kind === 'sequenceExample' && object.id === activeSequenceExample.id
            ? {
                ...object,
                activeCellId: nextCell?.id ?? activeCellId,
                example: {
                  ...object.example,
                  cells: object.example.cells.map((cell) =>
                    cell.id === activeCellId ? { ...cell, answerKey: choiceKey } : cell,
                  ),
                },
              }
            : object,
        ),
        [activeSequenceExample.id],
      );
    },
    [activeSequenceExample, commitObjects],
  );

  const insertSticker = useCallback(
    (sticker: StickerItem, position?: Point, options: { selectInserted?: boolean; keepTool?: boolean } = {}) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const size = 120 / viewport.scale;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const nextObject: ImageObject = {
        kind: 'image',
        id: crypto.randomUUID(),
        x: center.x - size / 2,
        y: center.y - size / 2,
        width: size,
        height: size,
        url: sticker.url,
        name: sticker.name,
      };
      commitObjects([...objectsRef.current, nextObject], options.selectInserted === false ? [] : [nextObject.id]);
      if (!position) {
        const rect = svgRef.current?.getBoundingClientRect();
        const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
        const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
        const margin = 80 / viewport.scale;
        setViewport((current) => {
          let nextX = current.x;
          let nextY = current.y;
          if (nextObject.x + nextObject.width + margin > current.x + viewWidth) {
            nextX = nextObject.x + nextObject.width + margin - viewWidth;
          }
          if (nextObject.x - margin < nextX) {
            nextX = nextObject.x - margin;
          }
          if (nextObject.y + nextObject.height + margin > current.y + viewHeight) {
            nextY = nextObject.y + nextObject.height + margin - viewHeight;
          }
          if (nextObject.y - margin < nextY) {
            nextY = nextObject.y - margin;
          }
          return nextX === current.x && nextY === current.y ? current : { ...current, x: nextX, y: nextY };
        });
      }
      if (!options.keepTool) {
        setTool('select');
      }
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const insertMathGlyph = useCallback(
    (label: string, center: Point, options: { keepTool?: boolean; selectInserted?: boolean; commitSelectionIds?: string[] } = {}) => {
      const trimmed = label.trim().slice(0, 8);
      if (!trimmed) return;
      const r = MATH_GLYPH_R;
      const { width, height } = mathGlyphPillDimensions(trimmed, r);
      const nextObject: MathGlyphObject = {
        kind: 'mathGlyph',
        id: crypto.randomUUID(),
        x: center.x - width / 2,
        y: center.y - height / 2,
        r,
        label: trimmed,
        ...stripStyleToGlyphFields(mathGlyphStripStyle),
      };
      const listWithGlyph = [...objectsRef.current, nextObject];
      const merged = isMergeParticipantMathGlyph(nextObject)
        ? mergeTouchingNumberGlyphs(listWithGlyph, nextObject.id)
        : { objects: listWithGlyph, selectedId: nextObject.id };
      const sel =
        options.commitSelectionIds ??
        (options.selectInserted === false ? [] : [merged.selectedId ?? nextObject.id]);
      commitObjects(merged.objects, sel);
      if (!options.keepTool) {
        setTool('select');
      }
    },
    [commitObjects, mathGlyphStripStyle],
  );

  const placeGlyphInDominoAnswer = useCallback(
    (example: DominoExampleObject, label: string) => {
      const rects = dominoInputRects(example);
      for (let ri = 0; ri < rects.length; ri += 1) {
        const answerRect = rects[ri];
        const existing = objectsRef.current
          .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
          .filter((glyph) => glyphOverlapsAnswerRect(glyph, answerRect))
          .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);

        if (/^[0-9]$/.test(label) && existing.length > 0) {
          const right = existing[existing.length - 1];
          if (isMergeableNumberGlyph(right)) {
            const newLabel = `${right.label}${label}`.slice(0, 8);
            const updated = mathGlyphRelabelKeepingCenter(right, newLabel);
            commitObjects(
              objectsRef.current.map((object) => (object.id === right.id ? updated : object)),
              [right.id],
            );
            return true;
          }
        }
      }
      for (let ri = 0; ri < rects.length; ri += 1) {
        const answerRect = rects[ri];
        const existing = objectsRef.current
          .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
          .filter((glyph) => glyphOverlapsAnswerRect(glyph, answerRect))
          .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);
        if (existing.length > 0) continue;
        const r = MATH_GLYPH_R;
        const { width } = mathGlyphPillDimensions(label, r);
        const center = {
          x: answerRect.x + answerRect.width / 2,
          y: answerRect.y + answerRect.height / 2,
        };
        insertMathGlyph(
          label,
          { x: Math.min(answerRect.x + answerRect.width - width / 2 - 4, center.x), y: center.y },
          {
            keepTool: true,
          },
        );
        return true;
      }
      return false;
    },
    [commitObjects, insertMathGlyph],
  );

  const placeGlyphInArithmeticAnswer = useCallback(
    (example: ArithmeticExampleObject, label: string) => {
      const existing = objectsRef.current
        .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
        .filter((glyph) => mathGlyphOverlapsAnswerZone(glyph, example))
        .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);

      if (/^[0-9]$/.test(label) && existing.length > 0) {
        const right = existing[existing.length - 1];
        if (isMergeableNumberGlyph(right)) {
          const newLabel = `${right.label}${label}`.slice(0, 8);
          const updated = mathGlyphRelabelKeepingCenter(right, newLabel);
          commitObjects(
            objectsRef.current.map((object) => (object.id === right.id ? updated : object)),
            [right.id],
          );
          return true;
        }
      }

      const answerRect = arithmeticAnswerRect(example);
      const r = MATH_GLYPH_R;
      const { width } = mathGlyphPillDimensions(label, r);
      const gap = 10;
      const centerX =
        existing.length > 0
          ? Math.max(
              answerRect.x + width / 2 + 8,
              mathGlyphCenter(existing[existing.length - 1]).x + existing[existing.length - 1].r * 1.45 + gap,
            )
          : answerRect.x + answerRect.width / 2;
      const center = {
        x: Math.min(answerRect.x + answerRect.width - width / 2 + 10, centerX),
        y: answerRect.y + answerRect.height / 2,
      };
      insertMathGlyph(label, center, {
        keepTool: true,
      });
      return true;
    },
    [commitObjects, insertMathGlyph],
  );

  const placeGlyphInMarbleBagAnswer = useCallback(
    (example: MarbleBagExampleObject, label: string) => {
      const existing = objectsRef.current
        .filter((object): object is MathGlyphObject => object.kind === 'mathGlyph')
        .filter((glyph) => mathGlyphOverlapsMarbleBagAnswerZone(glyph, example))
        .sort((a, b) => mathGlyphCenter(a).x - mathGlyphCenter(b).x);

      if (/^[0-9]$/.test(label) && existing.length > 0) {
        const right = existing[existing.length - 1];
        if (isMergeableNumberGlyph(right)) {
          const newLabel = `${right.label}${label}`.slice(0, 8);
          const updated = mathGlyphRelabelKeepingCenter(right, newLabel);
          commitObjects(
            objectsRef.current.map((object) => (object.id === right.id ? updated : object)),
            [right.id],
          );
          return true;
        }
      }

      const answerRect = marbleBagAnswerRect(example);
      const r = MATH_GLYPH_R;
      const { width } = mathGlyphPillDimensions(label, r);
      const gap = 10;
      const centerX =
        existing.length > 0
          ? Math.max(
              answerRect.x + width / 2 + 8,
              mathGlyphCenter(existing[existing.length - 1]).x + existing[existing.length - 1].r * 1.45 + gap,
            )
          : answerRect.x + answerRect.width / 2;
      const center = {
        x: Math.min(answerRect.x + answerRect.width - width / 2 + 10, centerX),
        y: answerRect.y + answerRect.height / 2,
      };
      insertMathGlyph(label, center, {
        keepTool: true,
      });
      return true;
    },
    [commitObjects, insertMathGlyph],
  );

  const placeGlyphInActiveAnswer = useCallback(
    (label: string) => {
      if (!activeExample) return false;
      if (activeExample.kind === 'marbleBagExample') {
        return placeGlyphInMarbleBagAnswer(activeExample, label);
      }
      if (activeExample.kind === 'dominoExample') {
        return placeGlyphInDominoAnswer(activeExample, label);
      }
      return placeGlyphInArithmeticAnswer(activeExample, label);
    },
    [activeExample, placeGlyphInArithmeticAnswer, placeGlyphInDominoAnswer, placeGlyphInMarbleBagAnswer],
  );

  const insertBuildNumberTile = useCallback(
    (value: number, variant: 'stacked' | 'flat', position?: Point, options: { selectInserted?: boolean } = {}) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const cellWidth = variant === 'flat' ? 44 : 34;
      const height = variant === 'flat' ? 44 : cellWidth * (83 / 60);
      const width = cellWidth * value;
      const selectedIdSet = new Set(selectedIds);
      const anchorTile =
        objectsRef.current.find(
          (object): object is BuildNumberTileObject => object.kind === 'buildNumberTile' && selectedIdSet.has(object.id),
        ) ??
        [...objectsRef.current].reverse().find((object): object is BuildNumberTileObject => object.kind === 'buildNumberTile');
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const x = position ? center.x - width / 2 : anchorTile ? anchorTile.x + anchorTile.width : center.x - width / 2;
      const y = position
        ? center.y - height / 2
        : anchorTile
          ? anchorTile.y + anchorTile.height - height
          : center.y - height / 2;
      const nextObject: BuildNumberTileObject = {
        kind: 'buildNumberTile',
        id: crypto.randomUUID(),
        x,
        y,
        value,
        variant,
        cellWidth,
        width,
        height,
      };
      commitObjects([...objectsRef.current, nextObject], options.selectInserted === false ? [] : [nextObject.id]);
      if (options.selectInserted !== false) {
        setTool('select');
      }
      setLibraryPanelMode('closed');
    },
    [commitObjects, selectedIds, viewport],
  );

  const armPinnedTilePlacement = useCallback(
    (value: number, variant: 'stacked' | 'flat') => {
      cancelMathTypingFlow();
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const payload: PendingPinnedPlacement = { kind: 'tile', value, variant };
      pendingPinnedPlacementRef.current = payload;
      setPendingPinnedPlacement(payload);
      setPinnedPreviewWorld(center);
      setTool('stamp');
      setLibraryPanelMode('closed');
    },
    [cancelMathTypingFlow, viewport.scale, viewport.x, viewport.y],
  );

  const armPinnedStickerPlacement = useCallback(
    (sticker: StickerItem) => {
      cancelMathTypingFlow();
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const payload: PendingPinnedPlacement = { kind: 'sticker', sticker };
      pendingPinnedPlacementRef.current = payload;
      setPendingPinnedPlacement(payload);
      setPinnedPreviewWorld(center);
      setTool('stamp');
      setLibraryPanelMode('closed');
    },
    [cancelMathTypingFlow, viewport.scale, viewport.x, viewport.y],
  );

  const armMathGlyphPlacement = useCallback(
    (label: string) => {
      cancelMathTypingFlow();
      if (taskModeActive && activeExample) {
        if (activeExample.kind === 'marbleBagExample') {
          if (activeExample.example.answerMode === 'number' && /^[0-9]$/.test(label)) {
            placeGlyphInActiveAnswer(label);
          }
        } else if (activeExample.kind === 'dominoExample') {
          if (/^[0-9]$/.test(label)) {
            placeGlyphInDominoAnswer(activeExample, label);
          }
        } else {
          placeGlyphInArithmeticAnswer(activeExample, label);
        }
        return;
      }
      if (taskModeActive && activeSequenceExample) {
        const choice = activeSequenceExample.example.choices.find((item) => item.kind === 'number' && item.label === label);
        if (choice) {
          fillActiveSequenceCell(choice.key);
          return;
        }
      }
      if (/^[0-9]$/.test(label) && selectedIdsRef.current.length === 1) {
        const sel = objectsRef.current.find((o) => o.id === selectedIdsRef.current[0]);
        if (sel?.kind === 'arithmeticExample') {
          placeGlyphInArithmeticAnswer(sel, label);
          return;
        }
        if (sel?.kind === 'dominoExample') {
          placeGlyphInDominoAnswer(sel, label);
          return;
        }
        if (sel?.kind === 'marbleBagExample') {
          placeGlyphInActiveAnswer(label);
          return;
        }
      }
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const payload: PendingPinnedPlacement = { kind: 'mathGlyph', label };
      pendingPinnedPlacementRef.current = payload;
      setPendingPinnedPlacement(payload);
      setPinnedPreviewWorld(center);
      setTool('stamp');
    },
    [
      activeExample,
      activeSequenceExample,
      cancelMathTypingFlow,
      fillActiveSequenceCell,
      placeGlyphInActiveAnswer,
      placeGlyphInArithmeticAnswer,
      placeGlyphInDominoAnswer,
      taskModeActive,
      viewport.scale,
      viewport.x,
      viewport.y,
    ],
  );

  const insertNumberLine = useCallback(
    (start: number, end: number, withFigure = false, position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const spacing = 44;
      const height = withFigure ? 132 : 58;
      const width = (end - start) * spacing + 34;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const nextObject: NumberLineObject = {
        kind: 'numberLine',
        id: crypto.randomUUID(),
        x: center.x - width / 2,
        y: center.y - height / 2,
        start,
        end,
        spacing,
        width,
        height,
        mode: withFigure ? 'withFigure' : 'plain',
        figurePosition: withFigure ? start : null,
        activeFigureId: withFigure ? 'figure-1' : null,
        figures: withFigure ? [{ id: 'figure-1', position: start, color: '#38bdf8' }] : [],
        trails: [],
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const insertBeadCounter = useCallback(
    (variant: BeadCounterVariant = 'ten', position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const isTwentyCounter = variant === 'twenty';
      const width = isTwentyCounter ? 700 : 460;
      const height = isTwentyCounter ? 132 : 84;
      const beadRadius = isTwentyCounter ? 14 : 18;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const beadCount = isTwentyCounter ? 20 : 10;
      const beadGap = isTwentyCounter ? beadRadius * 1.38 : beadRadius * 1.55;
      const beadStart = isTwentyCounter ? 72 : 70;
      const beads = Array.from({ length: beadCount }, (_, index) => {
        const isYellowGroup = Math.floor(index / 5) % 2 === 0;
        return isYellowGroup
          ? { color: '#f6c34b', imageUrl: HALF_MOON_BEAD_URLS.yellow }
          : { color: '#2368d9', imageUrl: HALF_MOON_BEAD_URLS.blue };
      });
      const nextObject: BeadCounterObject = {
        kind: 'beadCounter',
        id: crypto.randomUUID(),
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        beadRadius,
        variant,
        beads: beads.map((bead, index) => ({
          id: crypto.randomUUID(),
          color: bead.color,
          imageUrl: bead.imageUrl,
          position: beadStart + index * beadGap,
        })),
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const patchDiceTray = useCallback((trayId: string, updater: (t: DiceTrayObject) => DiceTrayObject) => {
    commitObjects(
      objectsRef.current.map((o) => (o.kind === 'diceTray' && o.id === trayId ? updater(o) : o)),
      selectedIdsRef.current,
    );
  }, [commitObjects]);

  const rollDiceTray = useCallback(
    (trayId: string) => {
      if (diceTrayRollTimerRef.current != null) return;
      const tray = objectsRef.current.find((o) => o.kind === 'diceTray' && o.id === trayId);
      if (!tray || tray.kind !== 'diceTray' || tray.dice.length === 0) return;
      let step = 0;
      const maxSteps = 15;
      const tick = () => {
        step += 1;
        const snapshot = objectsRef.current.map((o) => {
          if (o.kind !== 'diceTray' || o.id !== trayId) return o;
          return {
            ...o,
            dice: o.dice.map((d) => ({ ...d, value: randomDiceRoll(d.sides) })),
          };
        });
        objectsRef.current = snapshot;
        setObjects(cloneObjects(snapshot));
        if (step < maxSteps) {
          diceTrayRollTimerRef.current = window.setTimeout(tick, 52);
        } else {
          diceTrayRollTimerRef.current = null;
          pushHistory(objectsRef.current);
          setDiceTrayRollFlash((prev) => ({ ...prev, [trayId]: (prev[trayId] ?? 0) + 1 }));
        }
      };
      diceTrayRollTimerRef.current = window.setTimeout(tick, 0);
    },
    [pushHistory],
  );

  const insertDiceTray = useCallback(
    (position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const sides: DiceSides = 6;
      const nextObject: DiceTrayObject = {
        kind: 'diceTray',
        id: crypto.randomUUID(),
        x: center.x - DICE_TRAY_DEFAULT_W / 2,
        y: center.y - DICE_TRAY_DEFAULT_H / 2,
        width: DICE_TRAY_DEFAULT_W,
        height: DICE_TRAY_DEFAULT_H,
        defaultSides: sides,
        dice: [{ id: crypto.randomUUID(), sides, value: randomDiceRoll(sides) }],
        accentColor: '#221d6e',
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const insertMarbleBag = useCallback(
    (position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const nextObject: MarbleBagObject = {
        kind: 'marbleBag',
        id: crypto.randomUUID(),
        x: center.x - MARBLE_BAG_DEFAULT_W / 2,
        y: center.y - MARBLE_BAG_DEFAULT_H / 2,
        width: MARBLE_BAG_DEFAULT_W,
        height: MARBLE_BAG_DEFAULT_H,
        items: [],
        accentColor: '#1e1b4b',
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const addItemToMarbleBagAt = useCallback(
    (dropPoint: Point, item: Omit<MarbleBagItem, 'id'>): boolean => {
      const target = [...objectsRef.current].reverse().find((object): object is MarbleBagObject => {
        if (object.kind !== 'marbleBag' || boardObjectIsLocked(object)) return false;
        return pointInRect(dropPoint, objectBounds(object));
      });
      if (!target) return false;
      const nextItem: MarbleBagItem = { ...item, id: crypto.randomUUID() };
      commitObjects(
        objectsRef.current.map((object) =>
          object.kind === 'marbleBag' && object.id === target.id
            ? { ...object, items: [...object.items, nextItem] }
            : object,
        ),
        [target.id],
      );
      return true;
    },
    [commitObjects],
  );

  const insertDominoTile = useCallback(
    (position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const w = DOMINO_TILE_WIDTH;
      const h = DOMINO_TILE_HEIGHT;
      const nextObject: DominoTileObject = {
        kind: 'dominoTile',
        id: crypto.randomUUID(),
        x: center.x - w / 2,
        y: center.y - h / 2,
        width: w,
        height: h,
        leftPips: 2,
        rightPips: 2,
        editingSide: null,
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const insertSpatialTilingBoard = useCallback(
    (position?: Point) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const viewWidth = (rect?.width || window.innerWidth || 1200) / viewport.scale;
      const viewHeight = (rect?.height || window.innerHeight || 800) / viewport.scale;
      const center = position ?? {
        x: viewport.x + viewWidth / 2,
        y: viewport.y + viewHeight / 2,
      };
      const cols = SPATIAL_TILING_DEFAULT_COLS;
      const rows = SPATIAL_TILING_DEFAULT_ROWS;
      const cs = SPATIAL_TILING_DEFAULT_CELL;
      const w = cols * cs;
      const h = rows * cs;
      const nextObject: SpatialTilingBoardObject = {
        kind: 'spatialTilingBoard',
        id: crypto.randomUUID(),
        x: center.x - w / 2,
        y: center.y - h / 2,
        width: w,
        height: h,
        cols,
        rows,
        placedTiles: [],
      };
      commitObjects([...objectsRef.current, nextObject], [nextObject.id]);
      setTool('select');
      setLibraryPanelMode('closed');
    },
    [commitObjects, viewport],
  );

  const handleDominoTileAdjustPips = useCallback(
    (id: string, side: 'left' | 'right', delta: number) => {
      const target = objectsRef.current.find((o): o is DominoTileObject => o.kind === 'dominoTile' && o.id === id);
      if (!target || boardObjectIsLocked(target)) return;
      commitObjects(
        objectsRef.current.map((o) => {
          if (o.kind !== 'dominoTile' || o.id !== id) return o;
          if (side === 'left') {
            return { ...o, leftPips: clamp(o.leftPips + delta, 0, 9) };
          }
          return { ...o, rightPips: clamp(o.rightPips + delta, 0, 9) };
        }),
        selectedIdsRef.current,
      );
    },
    [commitObjects],
  );

  const beginNumberLineResize = useCallback(
    (event: React.PointerEvent<SVGGElement>, line: NumberLineObject, side: 'start' | 'end') => {
      if (boardObjectIsLocked(line)) return;
      event.stopPropagation();
      const svg = svgRef.current;
      svg?.setPointerCapture(event.pointerId);
      actionRef.current = {
        type: 'numberLineResize',
        id: line.id,
        side,
        startWorld: clientToWorld(event.clientX, event.clientY),
        originalLine: { ...line },
        moved: false,
      };
      setSelectedIds([line.id]);
    },
    [clientToWorld],
  );

  const beginSpatialTilingGridResize = useCallback(
    (event: React.PointerEvent<SVGGElement>, board: SpatialTilingBoardObject, edge: 'cols' | 'rows') => {
      if (boardObjectIsLocked(board)) return;
      event.stopPropagation();
      const svg = svgRef.current;
      svg?.setPointerCapture(event.pointerId);
      const geom = spatialTilingGeometry(board);
      actionRef.current = {
        type: 'spatialTilingGridResize',
        id: board.id,
        edge,
        startWorld: clientToWorld(event.clientX, event.clientY),
        originalBoard: {
          ...board,
          placedTiles: board.placedTiles.map((t) => ({
            ...t,
            pattern: t.pattern.map((row) => [...row]),
          })),
        },
        originalCellSize: geom.cellSize,
        originalGridW: geom.gridW,
        originalGridH: geom.gridH,
        moved: false,
      };
      setSelectedIds([board.id]);
    },
    [clientToWorld],
  );

  const beginBeadDrag = useCallback(
    (event: React.PointerEvent<SVGGElement>, counter: BeadCounterObject, beadId: string) => {
      if (boardObjectIsLocked(counter)) return;
      event.stopPropagation();
      const svg = svgRef.current;
      svg?.setPointerCapture(event.pointerId);
      setSelectedIds([counter.id]);
      actionRef.current = {
        type: 'beadDrag',
        counterId: counter.id,
        beadId,
        startWorld: clientToWorld(event.clientX, event.clientY),
        originalCounter: { ...counter, beads: counter.beads.map((bead) => ({ ...bead })) },
        moved: false,
      };
    },
    [clientToWorld],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<SVGSVGElement>) => {
      const types = event.dataTransfer.types;
      const hasBuildTile = types.includes('application/x-build-number-tile');
      const hasSequenceChoice = types.includes(SEQUENCE_CHOICE_DRAG);
      const hasMathGlyph = types.includes(MATH_GLYPH_DRAG);
      const hasMarbleBagItem = types.includes(MARBLE_BAG_ITEM_DRAG);
      const spatialMime = spatialTilingDragMimeType();
      const hasSpatial = types.includes(spatialMime);
      if (studentTaskMode && !hasMathGlyph && !hasSpatial && !hasMarbleBagItem) return;
      const hasLibraryDrag =
        hasBuildTile ||
        hasSequenceChoice ||
        types.includes('application/x-sticker') ||
        hasMathGlyph ||
        types.includes('application/x-number-line') ||
        types.includes('application/x-bead-counter') ||
        types.includes('application/x-dice-tray') ||
        types.includes(MARBLE_BAG_DRAG) ||
        hasMarbleBagItem ||
        hasSpatial;

      if (!hasLibraryDrag) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';

      if (hasSequenceChoice) {
        setMarbleBagDropTargetId(null);
        setExternalTileDragOverlay(null);
        setExternalMathGlyphDragOverlay(null);
        setSpatialTilingDropPreview(null);
      } else if (hasBuildTile) {
        setMarbleBagDropTargetId(null);
        setSpatialTilingDropPreview(null);
        const payload = peekBuildTileDragPayload();
        if (payload) {
          const world = clientToWorld(event.clientX, event.clientY);
          const anchors = objectsRef.current.filter(
            (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile',
          );
          const snapped = snapNewBuildTilePosition(
            world,
            payload.value,
            payload.variant,
            anchors,
            viewport.scale,
          );
          const cellWidth = payload.variant === 'flat' ? 44 : 34;
          const height = payload.variant === 'flat' ? 44 : cellWidth * (83 / 60);
          const width = cellWidth * payload.value;
          const nextOverlay = {
            tile: {
              kind: 'buildNumberTile' as const,
              id: EXTERNAL_DRAG_NEW_TILE_ID,
              x: snapped.x,
              y: snapped.y,
              value: payload.value,
              variant: payload.variant,
              cellWidth,
              width,
              height,
            },
            guides: snapped.guides,
          };
          setExternalTileDragOverlay((prev) => (externalTileDragOverlayEqual(prev, nextOverlay) ? prev : nextOverlay));
        } else {
          setExternalTileDragOverlay(null);
        }
        setExternalMathGlyphDragOverlay(null);
      } else if (hasMathGlyph) {
        setMarbleBagDropTargetId(null);
        const glyphPayload = peekMathGlyphDragPayload();
        setExternalTileDragOverlay(null);
        setSpatialTilingDropPreview(null);
        if (glyphPayload && typeof glyphPayload.label === 'string' && glyphPayload.label.length > 0) {
          const centerWorld = clientToWorld(event.clientX, event.clientY);
          setExternalMathGlyphDragOverlay((prev) =>
            prev &&
            prev.label === glyphPayload.label &&
            prev.centerWorld.x === centerWorld.x &&
            prev.centerWorld.y === centerWorld.y
              ? prev
              : { label: glyphPayload.label, centerWorld },
          );
        } else {
          setExternalMathGlyphDragOverlay(null);
        }
      } else if (hasSpatial) {
        setMarbleBagDropTargetId(null);
        setExternalTileDragOverlay(null);
        setExternalMathGlyphDragOverlay(null);
        const payload = peekSpatialTilingDragPayload();
        if (!payload || typeof payload.shapeId !== 'string') {
          setSpatialTilingDropPreview(null);
          return;
        }
        const world = clientToWorld(event.clientX, event.clientY);
        const board = findSpatialTilingBoardAtPoint(world, objectsRef.current);
        if (!board) {
          setSpatialTilingDropPreview(null);
          return;
        }
        const geom = spatialTilingGeometry(board);
        const cell = worldPointToGridCell(board, world, geom);
        if (!cell) {
          setSpatialTilingDropPreview(null);
          return;
        }
        const pattern = getTilePatternWithRotation(payload.shapeId, payload.rotation);
        const valid = canPlaceSpatialPattern(pattern, cell.cx, cell.cy, board.cols, board.rows, board.placedTiles);
        setSpatialTilingDropPreview({ boardId: board.id, gx: cell.cx, gy: cell.cy, pattern, valid });
      } else if (hasMarbleBagItem) {
        setExternalTileDragOverlay(null);
        setExternalMathGlyphDragOverlay(null);
        setSpatialTilingDropPreview(null);
        const world = clientToWorld(event.clientX, event.clientY);
        const target = [...objectsRef.current].reverse().find((object): object is MarbleBagExampleObject => {
          if (object.kind !== 'marbleBagExample' || boardObjectIsLocked(object)) return false;
          return worldPointOverMarbleBagYellowPytlik(object, world);
        });
        const nextId = target?.id ?? null;
        setMarbleBagDropTargetId((prev) => (prev === nextId ? prev : nextId));
      } else {
        setExternalTileDragOverlay(null);
        setExternalMathGlyphDragOverlay(null);
        setSpatialTilingDropPreview(null);
        setMarbleBagDropTargetId(null);
      }
    },
    [clientToWorld, viewport.scale, studentTaskMode],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<SVGSVGElement>) => {
      const rawTile = event.dataTransfer.getData('application/x-build-number-tile');
      const rawSticker = event.dataTransfer.getData('application/x-sticker');
      const rawMathGlyph = event.dataTransfer.getData(MATH_GLYPH_DRAG);
      const rawSequenceChoice = event.dataTransfer.getData(SEQUENCE_CHOICE_DRAG);
      const rawNumberLine = event.dataTransfer.getData('application/x-number-line');
      const rawBeadCounter = event.dataTransfer.getData('application/x-bead-counter');
      const rawDiceTray = event.dataTransfer.getData('application/x-dice-tray');
      const rawMarbleBag = event.dataTransfer.getData(MARBLE_BAG_DRAG);
      const rawMarbleBagItem = event.dataTransfer.getData(MARBLE_BAG_ITEM_DRAG);
      const rawSpatial = event.dataTransfer.getData(spatialTilingDragMimeType());
      if (
        !rawTile &&
        !rawSticker &&
        !rawMathGlyph &&
        !rawSequenceChoice &&
        !rawNumberLine &&
        !rawBeadCounter &&
        !rawDiceTray &&
        !rawMarbleBag &&
        !rawMarbleBagItem &&
        !rawSpatial
      )
        return;

      try {
        event.preventDefault();
        const dropPoint = clientToWorld(event.clientX, event.clientY);

        if (rawSpatial) {
          const parsed = JSON.parse(rawSpatial) as { shapeId?: string; rotation?: unknown };
          const shapeId = parsed.shapeId;
          if (typeof shapeId !== 'string') return;
          const rot =
            typeof parsed.rotation === 'number' && Number.isFinite(parsed.rotation)
              ? Math.trunc(parsed.rotation)
              : 0;
          const board = findSpatialTilingBoardAtPoint(dropPoint, objectsRef.current);
          if (!board) return;
          const geom = spatialTilingGeometry(board);
          const cell = worldPointToGridCell(board, dropPoint, geom);
          if (!cell) return;
          const pattern = getTilePatternWithRotation(shapeId, rot);
          if (!canPlaceSpatialPattern(pattern, cell.cx, cell.cy, board.cols, board.rows, board.placedTiles)) {
            return;
          }
          const newTile = {
            id: crypto.randomUUID(),
            shapeId,
            gx: cell.cx,
            gy: cell.cy,
            rotation: ((rot % 4) + 4) % 4,
            pattern: pattern.map((r) => [...r]),
          };
          commitObjects(
            objectsRef.current.map((o) =>
              o.kind === 'spatialTilingBoard' && o.id === board.id
                ? { ...o, placedTiles: [...o.placedTiles, newTile] }
                : o,
            ),
            [board.id],
          );
          setSpatialTilingDropPreview(null);
          setSpatialTilingDragPayload(null);
          return;
        }

        if (rawSequenceChoice) {
          const parsed = JSON.parse(rawSequenceChoice) as { key?: unknown };
          if (typeof parsed.key !== 'string' || parsed.key.length === 0) return;
          const choiceKey = parsed.key;
          const sequenceHit = [...objectsRef.current].reverse().find((object): object is SequenceExampleObject => {
            if (object.kind !== 'sequenceExample' || boardObjectIsLocked(object)) return false;
            return (
              dropPoint.x >= object.x &&
              dropPoint.x <= object.x + object.width &&
              dropPoint.y >= object.y &&
              dropPoint.y <= object.y + object.height
            );
          });
          if (!sequenceHit) return;
          const cellHit = sequenceHit.example.cells.find((cell) => {
            if (cell.given) return false;
            return pointInRect(dropPoint, sequenceCellRect(sequenceHit, cell.row, cell.col));
          });
          if (!cellHit) return;
          commitObjects(
            objectsRef.current.map((object) =>
              object.kind === 'sequenceExample' && object.id === sequenceHit.id
                ? {
                    ...object,
                    activeCellId: cellHit.id,
                    example: {
                      ...object.example,
                      cells: object.example.cells.map((cell) =>
                        cell.id === cellHit.id ? { ...cell, answerKey: choiceKey } : cell,
                      ),
                    },
                  }
                : object,
            ),
            [sequenceHit.id],
          );
          setActiveAssignmentId(sequenceHit.assignmentId);
          setActiveExampleId(sequenceHit.id);
          return;
        }

        if (rawMathGlyph) {
          const parsed = JSON.parse(rawMathGlyph) as { label?: unknown };
          if (typeof parsed.label !== 'string' || parsed.label.length === 0) return;
          const taskBagHit = [...objectsRef.current].reverse().find((object): object is MarbleBagExampleObject => {
            if (object.kind !== 'marbleBagExample' || boardObjectIsLocked(object)) return false;
            return (
              dropPoint.x >= object.x &&
              dropPoint.x <= object.x + object.width &&
              dropPoint.y >= object.y &&
              dropPoint.y <= object.y + object.height
            );
          });
          if (taskBagHit) {
            setActiveAssignmentId(taskBagHit.assignmentId);
            setActiveExampleId(taskBagHit.id);
            placeGlyphInMarbleBagAnswer(taskBagHit, parsed.label);
            return;
          }
          if (addItemToMarbleBagAt(dropPoint, { kind: 'number', label: parsed.label })) return;
          if (studentTaskMode) {
            const label = parsed.label;
            const arithmeticHit = [...objectsRef.current].reverse().find((object): object is ArithmeticExampleObject => {
              if (object.kind !== 'arithmeticExample' || boardObjectIsLocked(object)) return false;
              return (
                dropPoint.x >= object.x &&
                dropPoint.x <= object.x + object.width &&
                dropPoint.y >= object.y &&
                dropPoint.y <= object.y + object.height
              );
            });
            if (arithmeticHit) {
              setActiveAssignmentId(arithmeticHit.assignmentId);
              setActiveExampleId(arithmeticHit.id);
              placeGlyphInArithmeticAnswer(arithmeticHit, label);
              return;
            }
            const dominoHit = [...objectsRef.current].reverse().find((object): object is DominoExampleObject => {
              if (object.kind !== 'dominoExample' || boardObjectIsLocked(object)) return false;
              return (
                dropPoint.x >= object.x &&
                dropPoint.x <= object.x + object.width &&
                dropPoint.y >= object.y &&
                dropPoint.y <= object.y + object.height
              );
            });
            if (dominoHit && /^[0-9]$/.test(label)) {
              setActiveAssignmentId(dominoHit.assignmentId);
              setActiveExampleId(dominoHit.id);
              placeGlyphInDominoAnswer(dominoHit, label);
              return;
            }
            insertMathGlyph(label, dropPoint, { keepTool: true });
            return;
          }
          insertMathGlyph(parsed.label, dropPoint, {});
          return;
        }

        if (rawMarbleBagItem) {
          const parsed = JSON.parse(rawMarbleBagItem) as { color?: unknown };
          const taskBagHit = [...objectsRef.current].reverse().find((object): object is MarbleBagExampleObject => {
            if (object.kind !== 'marbleBagExample' || boardObjectIsLocked(object)) return false;
            return (
              dropPoint.x >= object.x &&
              dropPoint.x <= object.x + object.width &&
              dropPoint.y >= object.y &&
              dropPoint.y <= object.y + object.height
            );
          });
          if (taskBagHit) {
            const { scale, sx, gy } = marbleBagExampleGeometry(taskBagHit);
            commitObjects(
              objectsRef.current.map((object) =>
                object.kind === 'marbleBagExample' && object.id === taskBagHit.id
                  ? {
                      ...object,
                      submitted: false,
                      items: [
                        ...object.items,
                        {
                          id: crypto.randomUUID(),
                          kind: 'marble',
                          color: typeof parsed.color === 'string' ? parsed.color : '#44b968',
                          x: (dropPoint.x - sx(0)) / scale,
                          y: (dropPoint.y - gy(0)) / scale,
                        },
                      ],
                    }
                  : object,
              ),
              [taskBagHit.id],
            );
            setActiveAssignmentId(taskBagHit.assignmentId);
            setActiveExampleId(taskBagHit.id);
            return;
          }
          if (studentTaskMode) return;
        }

        if (studentTaskMode) return;

        if (rawTile) {
          const tile = JSON.parse(rawTile) as { value?: unknown; variant?: unknown };
          if (typeof tile.value !== 'number' || (tile.variant !== 'flat' && tile.variant !== 'stacked')) return;
          const anchors = objectsRef.current.filter(
            (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile',
          );
          const snapped = snapNewBuildTilePosition(
            dropPoint,
            tile.value,
            tile.variant,
            anchors,
            viewport.scale,
          );
          const cellWidth = tile.variant === 'flat' ? 44 : 34;
          const tileH = tile.variant === 'flat' ? 44 : cellWidth * (83 / 60);
          const tileW = cellWidth * tile.value;
          const centerSnap = { x: snapped.x + tileW / 2, y: snapped.y + tileH / 2 };
          insertBuildNumberTile(tile.value, tile.variant, centerSnap);
          return;
        }

        if (rawSticker) {
          const sticker = JSON.parse(rawSticker) as StickerItem;
          if (typeof sticker.url !== 'string' || typeof sticker.name !== 'string') return;
          insertSticker(sticker, dropPoint);
          return;
        }

        if (rawNumberLine) {
          const numberLine = JSON.parse(rawNumberLine) as { start?: unknown; end?: unknown; withFigure?: unknown };
          if (typeof numberLine.start !== 'number' || typeof numberLine.end !== 'number') return;
          insertNumberLine(numberLine.start, numberLine.end, numberLine.withFigure === true, dropPoint);
          return;
        }

        if (rawDiceTray) {
          insertDiceTray(dropPoint);
          return;
        }

        if (rawMarbleBag) {
          insertMarbleBag(dropPoint);
          return;
        }

        if (rawMarbleBagItem) {
          const parsed = JSON.parse(rawMarbleBagItem) as { kind?: unknown; color?: unknown; label?: unknown };
          const kind = parsed.kind === 'number' ? 'number' : 'marble';
          const item = {
            kind,
            color: typeof parsed.color === 'string' ? parsed.color : '#f6d64f',
            label: typeof parsed.label === 'string' ? parsed.label : undefined,
          } satisfies Omit<MarbleBagItem, 'id'>;
          if (addItemToMarbleBagAt(dropPoint, item)) return;
          return;
        }

        if (!rawBeadCounter) return;

        const beadCounter = JSON.parse(rawBeadCounter) as { variant?: unknown };
        const variant = beadCounter.variant === 'twenty' ? 'twenty' : 'ten';
        insertBeadCounter(variant, dropPoint);
      } catch {
        return;
      } finally {
        setExternalTileDragOverlay(null);
        setExternalMathGlyphDragOverlay(null);
        setSpatialTilingDropPreview(null);
        setMarbleBagDropTargetId(null);
      }
    },
    [
      clientToWorld,
      commitObjects,
      insertBeadCounter,
      insertBuildNumberTile,
      insertDiceTray,
      insertMathGlyph,
      insertMarbleBag,
      insertNumberLine,
      insertSticker,
      addItemToMarbleBagAt,
      viewport.scale,
      placeGlyphInMarbleBagAnswer,
    ],
  );

  const setZoom = useCallback(
    (nextScale: number) => {
      cancelViewportAnimation();
      const rect = svgRef.current?.getBoundingClientRect();
      setViewport((current) => {
        const scale = Math.min(MAX_BOARD_ZOOM_SCALE, Math.max(MIN_BOARD_ZOOM_SCALE, Number(nextScale.toFixed(2))));
        const clientWidth = rect?.width || window.innerWidth || 1200;
        const clientHeight = rect?.height || window.innerHeight || 800;
        const centerX = current.x + clientWidth / current.scale / 2;
        const centerY = current.y + clientHeight / current.scale / 2;
        return {
          scale,
          x: centerX - clientWidth / scale / 2,
          y: centerY - clientHeight / scale / 2,
        };
      });
    },
    [cancelViewportAnimation],
  );

  const zoomBy = useCallback(
    (delta: number) => {
      setZoom(viewport.scale + delta);
    },
    [setZoom, viewport.scale],
  );

  const zoomToFitSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    const svg = svgRef.current;
    const clientRect = svg?.getBoundingClientRect();
    if (!clientRect || clientRect.width < 8 || clientRect.height < 8) return;

    cancelViewportAnimation();
    const idSet = new Set(ids);
    const selectedObjects = objectsRef.current.filter((object) => idSet.has(object.id));
    if (selectedObjects.length === 0) return;

    const minWorldSize = 28;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const object of selectedObjects) {
      const raw = objectBounds(object);
      let x = raw.x;
      let y = raw.y;
      let width = raw.width;
      let height = raw.height;
      if (width < minWorldSize) {
        x -= (minWorldSize - width) / 2;
        width = minWorldSize;
      }
      if (height < minWorldSize) {
        y -= (minWorldSize - height) / 2;
        height = minWorldSize;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }

    const bounds = {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
    };

    /* clientRect = jen oblast plátna; chrome z innerWidth by znovu odečetl levý dok a zužil výřez i střed —
       proto jen malý padding uvnitř SVG a vyšší maxScale pro „co největší“ přiblížení. */
    setViewport(
      zoomViewportToFitWorldBounds(
        clientRect.width,
        clientRect.height,
        bounds,
        { left: 0, rightFit: 0, top: 0, bottom: 0 },
        { padPx: 28, maxScale: MAX_BOARD_ZOOM_SCALE },
      ),
    );
  }, [cancelViewportAnimation]);

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    cancelViewportAnimation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
    const deltaX = event.deltaX * deltaMultiplier * 2;
    const deltaY = event.deltaY * deltaMultiplier * 2;

    // Figma-like trackpad behavior: two-finger scroll pans; pinch/ctrl-wheel zooms.
    if (!event.ctrlKey && !event.metaKey) {
      setViewport((current) => ({
        ...current,
        x: current.x + deltaX / current.scale,
        y: current.y + deltaY / current.scale,
      }));
      return;
    }

    const before = clientToWorld(event.clientX, event.clientY);
    const scaleFactor = Math.exp(-deltaY * 0.004);
    const nextScale = Math.min(MAX_BOARD_ZOOM_SCALE, Math.max(MIN_BOARD_ZOOM_SCALE, Number((viewport.scale * scaleFactor).toFixed(3))));
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    setViewport({
      scale: nextScale,
      x: before.x - mouseX / nextScale,
      y: before.y - mouseY / nextScale,
    });
  }, [cancelViewportAnimation, clientToWorld, viewport.scale]);

  const handleWheelRef = useRef(handleWheel);
  handleWheelRef.current = handleWheel;

  /* Nativní non-passive wheel: jinak může prohlížeč „sežrat“ gesto (trackpad, scrollovací panel) místo pohybu plátna. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      handleWheelRef.current(e as unknown as React.WheelEvent<SVGSVGElement>);
    };
    svg.addEventListener('wheel', onWheelNative, { passive: false });
    return () => svg.removeEventListener('wheel', onWheelNative);
  }, []);

  const beginStickyNoteFromHtml = useCallback(
    (event: React.PointerEvent<HTMLElement>, noteId: string) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const svg = svgRef.current;
      if (!svg) return;
      flushActiveSplitAnimation();
      cancelViewportAnimation();
      svg.setPointerCapture(event.pointerId);

      const world = clientToWorld(event.clientX, event.clientY);
      const hit = objectsRef.current.find((o): o is StickyNoteObject => o.id === noteId && o.kind === 'stickyNote');
      if (!hit) return;

      if (tool === 'select' || tool === 'mathWrite' || tool === 'textWrite') {
        const editingId = mathInlineEditIdRef.current;
        if (editingId) {
          closeMathInlineEdit();
        }
      }

      if (stickyEditingId && hit.id !== stickyEditingId) {
        setStickyEditingId(null);
      }

      const nextSelectedIds = event.shiftKey
        ? selectedSet.has(hit.id)
          ? selectedIds.filter((id) => id !== hit.id)
          : [...selectedIds, hit.id]
        : selectedSet.has(hit.id)
          ? selectedIds
          : [hit.id];

      setSelectedIds(nextSelectedIds);
      actionRef.current = {
        type: 'drag',
        startWorld: world,
        originalObjects: cloneObjects(objectsRef.current),
        selectedIds: nextSelectedIds,
        moved: false,
      };
    },
    [
      cancelViewportAnimation,
      clientToWorld,
      closeMathInlineEdit,
      flushActiveSplitAnimation,
      selectedIds,
      selectedSet,
      setSelectedIds,
      stickyEditingId,
      tool,
    ],
  );

  const eraseStrokesAtWorld = useCallback((world: Point) => {
    const tol = 22 / viewport.scale;
    const before = objectsRef.current;
    const next = before.filter((o) => {
      if (boardObjectIsLocked(o)) return true;
      if (o.kind === 'stroke') return !hitStroke(world, o, tol);
      if (o.kind === 'boardShape') return !hitBoardShape(world, o, tol);
      return true;
    });
    if (next.length === before.length) return;
    eraserMutatedRef.current = true;
    objectsRef.current = next;
    setObjects(next);
    setSelectedIds((ids) => ids.filter((id) => next.some((o) => o.id === id)));
  }, [viewport.scale]);

  const beginPointerAction = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const middleButtonPan = event.pointerType === 'mouse' && event.button === 1;
      if (event.pointerType === 'mouse' && event.button !== 0 && !middleButtonPan) return;
      const rawTarget = event.target;
      if (rawTarget instanceof Element) {
        const inSticky = rawTarget.closest('.board-sticky-root');
        if (inSticky) {
          const el = rawTarget as HTMLElement;
          if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.closest('textarea, input')) {
            return;
          }
        }
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      flushActiveSplitAnimation();
      cancelViewportAnimation();
      const world = clientToWorld(event.clientX, event.clientY);
      if (marbleBagFocusedMarble) {
        const focusedEx = objectsRef.current.find(
          (o): o is MarbleBagExampleObject =>
            o.kind === 'marbleBagExample' && o.id === marbleBagFocusedMarble.exampleId,
        );
        const focusedItem = focusedEx?.items.find((i) => i.id === marbleBagFocusedMarble.itemId);
        if (
          focusedEx &&
          focusedItem &&
          focusedItem.kind === 'marble' &&
          !boardObjectIsLocked(focusedEx) &&
          marbleBagDeleteChipHit(focusedEx, focusedItem, world, viewport.scale)
        ) {
          event.preventDefault();
          commitObjects(
            objectsRef.current.map((o) =>
              o.kind === 'marbleBagExample' && o.id === focusedEx.id
                ? { ...o, submitted: false, items: o.items.filter((i) => i.id !== focusedItem.id) }
                : o,
            ),
            selectedIdsRef.current,
          );
          setMarbleBagFocusedMarble(null);
          marbleBagHeldItemRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          return;
        }
      }
      marbleBagHeldItemRef.current = null;

      if (middleButtonPan) {
        event.preventDefault();
        actionRef.current = {
          type: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          startViewport: viewport,
        };
        setIsPanning(true);
        return;
      }

      const drawingOrEraseTool =
        tool === 'brush' || tool === 'highlighter' || tool === 'drawShapes' || tool === 'eraser';

      if (!drawingOrEraseTool) {
        for (const tile of [...objects].reverse()) {
          if (tile.kind !== 'buildNumberTile' || tile.value <= 1 || boardObjectIsLocked(tile)) continue;
          const b = objectBounds(tile);
          if (!pointInRect(world, b)) continue;
          const splitAfter = hitBuildTileSplitButton(tile, world, viewport.scale);
          if (splitAfter === null) continue;
          actionRef.current = {
            type: 'buildTileSplitPending',
            tileId: tile.id,
            splitAfter,
            startWorld: world,
            shiftKey: event.shiftKey,
          };
          return;
        }
      }

      if (tool === 'pan') {
        actionRef.current = {
          type: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          startViewport: viewport,
        };
        setIsPanning(true);
        return;
      }

      if (tool === 'brush' || tool === 'highlighter') {
        const isHi = tool === 'highlighter';
        const stroke: Stroke = {
          kind: 'stroke',
          id: crypto.randomUUID(),
          points: [world],
          color: isHi ? highlighterColor : brushColor,
          width: isHi ? 34 : BRUSH_WIDTH,
          strokeKind: isHi ? 'highlighter' : 'ink',
        };
        tempStrokeRef.current = stroke;
        setTempStroke(stroke);
        actionRef.current = { type: 'brush' };
        return;
      }

      if (tool === 'drawShapes') {
        const draft: TempBoardShape = {
          shape: drawShapeKindRef.current,
          x: world.x,
          y: world.y,
          w: 0,
          h: 0,
          color: brushColor,
          strokeWidth: 3,
        };
        tempBoardShapeRef.current = draft;
        setTempBoardShape(draft);
        actionRef.current = { type: 'drawShape', startWorld: world };
        return;
      }

      if (tool === 'eraser') {
        eraserMutatedRef.current = false;
        eraseStrokesAtWorld(world);
        actionRef.current = { type: 'eraser' };
        return;
      }

      if (tool === 'stamp') {
        const pendingPlacement = pendingPinnedPlacementRef.current;
        if (pendingPlacement?.kind === 'sticker') {
          insertSticker(pendingPlacement.sticker, world, { selectInserted: false, keepTool: true });
          setPinnedPreviewWorld(world);
          event.currentTarget.releasePointerCapture(event.pointerId);
          return;
        }
        if (pendingPlacement?.kind === 'mathGlyph') {
          insertMathGlyph(pendingPlacement.label, world, { keepTool: true, selectInserted: false });
          setPinnedPreviewWorld(world);
          event.currentTarget.releasePointerCapture(event.pointerId);
          return;
        }
      }

      const tolerance = 10 / viewport.scale;
      const submitHit = [...objects].reverse().find((object): object is ArithmeticExampleObject => {
        if (object.kind !== 'arithmeticExample' || boardObjectIsLocked(object)) return false;
        const center = arithmeticSubmitButtonCenter(object);
        return distance(world, center) <= submitCircleHitRadiusPx() / viewport.scale;
      });
      if (submitHit) {
        setActiveAssignmentId(submitHit.assignmentId);
        setActiveExampleId(submitHit.id);
        commitObjects(
          objectsRef.current.map((object) =>
            object.kind === 'arithmeticExample' && object.id === submitHit.id
              ? { ...object, submitted: true }
              : object,
          ),
          [submitHit.id],
        );
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      const dominoSubmitHit = [...objects].reverse().find((object): object is DominoExampleObject => {
        if (object.kind !== 'dominoExample' || boardObjectIsLocked(object)) return false;
        const center = arithmeticSubmitButtonCenter(object);
        return distance(world, center) <= submitCircleHitRadiusPx() / viewport.scale;
      });
      if (dominoSubmitHit) {
        setActiveAssignmentId(dominoSubmitHit.assignmentId);
        setActiveExampleId(dominoSubmitHit.id);
        commitObjects(
          objectsRef.current.map((object) =>
            object.kind === 'dominoExample' && object.id === dominoSubmitHit.id
              ? { ...object, submitted: true }
              : object,
          ),
          [dominoSubmitHit.id],
        );
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      const marbleBagSubmitHit = [...objects].reverse().find((object): object is MarbleBagExampleObject => {
        if (object.kind !== 'marbleBagExample' || boardObjectIsLocked(object)) return false;
        const center = marbleBagSubmitButtonCenter(object);
        return distance(world, center) <= submitCircleHitRadiusPx() / viewport.scale;
      });
      if (marbleBagSubmitHit) {
        setActiveAssignmentId(marbleBagSubmitHit.assignmentId);
        setActiveExampleId(marbleBagSubmitHit.id);
        commitObjects(
          objectsRef.current.map((object) =>
            object.kind === 'marbleBagExample' && object.id === marbleBagSubmitHit.id
              ? { ...object, submitted: true }
              : object,
          ),
          [marbleBagSubmitHit.id],
        );
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      const sequenceHit = [...objects].reverse().find((object): object is SequenceExampleObject => {
        if (object.kind !== 'sequenceExample' || boardObjectIsLocked(object)) return false;
        return (
          world.x >= object.x &&
          world.x <= object.x + object.width &&
          world.y >= object.y &&
          world.y <= object.y + object.height
        );
      });
      if (sequenceHit) {
        const cellHit = sequenceHit.example.cells.find((cell) => {
          if (cell.given) return false;
          const rect = sequenceCellRect(sequenceHit, cell.row, cell.col);
          return pointInRect(world, rect);
        });
        if (cellHit) {
          setActiveAssignmentId(sequenceHit.assignmentId);
          setActiveExampleId(sequenceHit.id);
          commitObjects(
            objectsRef.current.map((object) =>
              object.kind === 'sequenceExample' && object.id === sequenceHit.id
                ? { ...object, activeCellId: cellHit.id }
                : object,
            ),
            [sequenceHit.id],
          );
          event.currentTarget.releasePointerCapture(event.pointerId);
          return;
        }
      }
      const marbleBagItemHit = [...objectsRef.current].reverse().find((object): object is MarbleBagExampleObject => {
        if (object.kind !== 'marbleBagExample' || boardObjectIsLocked(object)) return false;
        return marbleBagItemHitAt(object, world) !== null;
      });
      if (marbleBagItemHit) {
        const item = marbleBagItemHitAt(marbleBagItemHit, world);
        if (item) {
          event.preventDefault();
          setActiveAssignmentId(marbleBagItemHit.assignmentId);
          setActiveExampleId(marbleBagItemHit.id);
          setSelectedIds([]);
          marbleBagHeldItemRef.current = { exampleId: marbleBagItemHit.id, itemId: item.id };
          setMarbleBagFocusedMarble({ exampleId: marbleBagItemHit.id, itemId: item.id });
          actionRef.current = {
            type: 'marbleBagItemDrag',
            exampleId: marbleBagItemHit.id,
            itemId: item.id,
            startWorld: world,
            originalExample: {
              ...marbleBagItemHit,
              items: marbleBagItemHit.items.map((candidate) => ({ ...candidate })),
            },
            moved: false,
          };
          return;
        }
      }
      if (studentTaskMode) {
        const glyphHit = [...objects].reverse().find((object) => {
          if (!isStudentEditableMathGlyph(object) || boardObjectIsLocked(object)) return false;
          const b = objectBounds(object);
          const pad = tolerance * 0.12;
          return pointInRect(world, {
            x: b.x - pad,
            y: b.y - pad,
            width: b.width + pad * 2,
            height: b.height + pad * 2,
          });
        });
        if (glyphHit) {
          setSelectedIds([glyphHit.id]);
          actionRef.current = {
            type: 'drag',
            startWorld: world,
            originalObjects: cloneObjects(objects),
            selectedIds: [glyphHit.id],
            moved: false,
          };
          return;
        }
        if (mathInlineEditIdRef.current) {
          closeMathInlineEdit();
        }
        setSelectedIds([]);
        actionRef.current = {
          type: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          startViewport: viewport,
        };
        setIsPanning(true);
        return;
      }
      const selectedImageForCrop =
        event.altKey && selectedIds.length === 1
          ? objects.find(
              (object): object is ImageObject =>
                object.kind === 'image' &&
                object.id === selectedIds[0] &&
                !boardObjectIsLocked(object) &&
                world.x >= object.x &&
                world.x <= object.x + object.width &&
                world.y >= object.y &&
                world.y <= object.y + object.height,
            )
          : null;
      if (selectedImageForCrop) {
        actionRef.current = {
          type: 'imageCropPan',
          id: selectedImageForCrop.id,
          startWorld: world,
          originalImage: { ...selectedImageForCrop },
          moved: false,
        };
        return;
      }

      const beadHit = [...objects].reverse().find((object): object is BeadCounterObject => {
        if (object.kind !== 'beadCounter' || boardObjectIsLocked(object)) return false;
        return object.beads.some((bead) => {
          const beadPoint = { x: object.x + bead.position, y: beadY(object) };
          return distance(world, beadPoint) <= object.beadRadius + tolerance;
        });
      });
      if (beadHit) {
        const bead = beadHit.beads.find((candidate) => {
          const beadPoint = { x: beadHit.x + candidate.position, y: beadY(beadHit) };
          return distance(world, beadPoint) <= beadHit.beadRadius + tolerance;
        });
        if (bead) {
          setSelectedIds([beadHit.id]);
          actionRef.current = {
            type: 'beadDrag',
            counterId: beadHit.id,
            beadId: bead.id,
            startWorld: world,
            originalCounter: { ...beadHit, beads: beadHit.beads.map((item) => ({ ...item })) },
            moved: false,
          };
          return;
        }
      }

      const frameControlHit = [...objects].reverse().find((object): object is CanvasFrameObject => {
        if (object.kind !== 'canvasFrame' || boardObjectIsLocked(object)) return false;
        const labelText = object.title?.trim() || object.label;
        const headerRect = {
          x: object.x + 18,
          y: object.y + 18,
          width: canvasFrameLabelPillWidth(labelText),
          height: 38,
        };
        const edgePad = 14 / viewport.scale;
        const outer = {
          x: object.x - edgePad,
          y: object.y - edgePad,
          width: object.width + edgePad * 2,
          height: object.height + edgePad * 2,
        };
        const inner = {
          x: object.x + edgePad,
          y: object.y + edgePad,
          width: Math.max(0, object.width - edgePad * 2),
          height: Math.max(0, object.height - edgePad * 2),
        };
        return pointInRect(world, headerRect) || (pointInRect(world, outer) && !pointInRect(world, inner));
      });
      if (frameControlHit) {
        const nextSelectedIds = event.shiftKey
          ? selectedSet.has(frameControlHit.id)
            ? selectedIds.filter((id) => id !== frameControlHit.id)
            : [...selectedIds, frameControlHit.id]
          : selectedSet.has(frameControlHit.id)
            ? selectedIds
            : [frameControlHit.id];

        setSelectedIds(nextSelectedIds);
        setCanvasFrameToolbarOpenForId(null);
        actionRef.current = {
          type: 'drag',
          startWorld: world,
          originalObjects: cloneObjects(objects),
          selectedIds: nextSelectedIds,
          moved: false,
        };
        return;
      }

      const hit = [...objects].reverse().find((object) => {
        if (boardObjectIsLocked(object)) return false;

        if (object.kind === 'canvasFrame') {
          return false;
        }

        if (object.kind === 'image') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'buildNumberTile') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'mathGlyph') {
          const b = objectBounds(object);
          const pad = tolerance * 0.12;
          return pointInRect(world, {
            x: b.x - pad,
            y: b.y - pad,
            width: b.width + pad * 2,
            height: b.height + pad * 2,
          });
        }

        if (object.kind === 'numberLine') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'beadCounter') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'diceTray') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'marbleBag') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'arithmeticExample') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'dominoExample') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'marbleBagExample') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'dominoTile') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'spatialTilingBoard') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'sequenceExample') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'stickyNote') {
          return (
            world.x >= object.x &&
            world.x <= object.x + object.width &&
            world.y >= object.y &&
            world.y <= object.y + object.height
          );
        }

        if (object.kind === 'boardShape') {
          return hitBoardShape(world, object, tolerance);
        }

        return hitStroke(world, object, tolerance);
      });

      if (tool === 'select' && hit?.kind === 'spatialTilingBoard') {
        const board = hit;
        const geom = spatialTilingGeometry(board);
        const cell = worldPointToGridCell(board, world, geom);
        if (cell) {
          if (event.shiftKey) {
            const tile = findPlacedTileAtCell(board.placedTiles, cell.cx, cell.cy);
            if (tile) {
              commitObjects(
                objectsRef.current.map((o) =>
                  o.kind === 'spatialTilingBoard' && o.id === board.id
                    ? { ...o, placedTiles: o.placedTiles.filter((t) => t.id !== tile.id) }
                    : o,
                ),
                [board.id],
              );
              setSelectedIds([board.id]);
              event.currentTarget.releasePointerCapture(event.pointerId);
              actionRef.current = EMPTY_ACTION;
              return;
            }
          }
          const tileAt = findPlacedTileAtCell(board.placedTiles, cell.cx, cell.cy);
          if (tileAt) {
            const local = spatialPatternLocalHit(tileAt, cell.cx, cell.cy);
            if (local) {
              actionRef.current = {
                type: 'spatialTileDrag',
                boardId: board.id,
                tileId: tileAt.id,
                patternColIndex: local.patternCi,
                patternRowIndex: local.patternRi,
                startWorld: world,
                moved: false,
              };
              setSelectedIds([board.id]);
              return;
            }
          }
          const pick = spatialTilingPickRef.current;
          if (pick && pick.boardId === board.id) {
            const pattern = getTilePatternWithRotation(pick.shapeId, pick.rotation);
            if (canPlaceSpatialPattern(pattern, cell.cx, cell.cy, board.cols, board.rows, board.placedTiles)) {
              const newTile = {
                id: crypto.randomUUID(),
                shapeId: pick.shapeId,
                gx: cell.cx,
                gy: cell.cy,
                rotation: pick.rotation,
                pattern: pattern.map((r) => [...r]),
              };
              commitObjects(
                objectsRef.current.map((o) =>
                  o.kind === 'spatialTilingBoard' && o.id === board.id
                    ? { ...o, placedTiles: [...o.placedTiles, newTile] }
                    : o,
                ),
                [board.id],
              );
              setSelectedIds([board.id]);
              event.currentTarget.releasePointerCapture(event.pointerId);
              actionRef.current = EMPTY_ACTION;
              return;
            }
          }
        }
      }

      if (tool === 'select' || tool === 'mathWrite' || tool === 'textWrite') {
        const editingId = mathInlineEditIdRef.current;
        if (editingId && (!hit || hit.id !== editingId)) {
          closeMathInlineEdit();
        }
      }

      if (stickyEditingId) {
        if (!hit || hit.kind !== 'stickyNote' || hit.id !== stickyEditingId) {
          setStickyEditingId(null);
        }
      }

      if (tool === 'mathWrite' && pinnedMathGlyphsRef.current && !hit) {
        actionRef.current = EMPTY_ACTION;
        setLassoPoints([]);
        startGlyphInlineEdit(world, 'math');
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      if (tool === 'textWrite' && !hit) {
        actionRef.current = EMPTY_ACTION;
        setLassoPoints([]);
        startGlyphInlineEdit(world, 'text');
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      if (tool === 'stickyNote' && !hit) {
        actionRef.current = EMPTY_ACTION;
        setLassoPoints([]);
        const w = STICKY_DEFAULT_SIZE.width;
        const h = STICKY_DEFAULT_SIZE.height;
        const id = crypto.randomUUID();
        const note: StickyNoteObject = {
          kind: 'stickyNote',
          id,
          x: world.x - w / 2,
          y: world.y - h / 2,
          width: w,
          height: h,
          content: '',
          color: '#fff475',
          fontSize: 22,
          fontWeight: 'normal',
          shape: 'rounded',
        };
        commitObjects([...objectsRef.current, note], [id]);
        setTool('select');
        setStickyEditingId(id);
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      if (tool === 'select' && !hit) {
        if (!studentTaskMode && activeAssignmentId) {
          setActiveAssignmentId(null);
          setActiveExampleId(null);
          setTeacherTaskPanelLayout('configure');
          setLibraryPanelMode('closed');
        }
        setSelectedIds([]);
        setMarbleBagFocusedMarble(null);
        setLassoPoints([world]);
        actionRef.current = { type: 'lasso' };
        return;
      }

      if (tool === 'stamp' && pendingPinnedPlacementRef.current?.kind === 'tile') {
        const pending = pendingPinnedPlacementRef.current;
        pendingPinnedPlacementRef.current = null;
        setPendingPinnedPlacement(null);
        setPinnedPreviewWorld(null);
        insertBuildNumberTile(pending.value, pending.variant, world, { selectInserted: false });
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      if (!hit) {
        if (!studentTaskMode && activeAssignmentId) {
          setActiveAssignmentId(null);
          setActiveExampleId(null);
          setTeacherTaskPanelLayout('configure');
          setLibraryPanelMode('closed');
        }
        setMarbleBagFocusedMarble(null);
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }

      const nextSelectedIds = event.shiftKey
        ? selectedSet.has(hit.id)
          ? selectedIds.filter((id) => id !== hit.id)
          : [...selectedIds, hit.id]
        : selectedSet.has(hit.id)
          ? selectedIds
          : [hit.id];

      setSelectedIds(nextSelectedIds);
      if (
        !studentTaskMode &&
        hit.kind !== 'arithmeticExample' &&
        hit.kind !== 'sequenceExample' &&
        hit.kind !== 'dominoExample' &&
        hit.kind !== 'marbleBagExample' &&
        activeAssignmentId
      ) {
        setActiveAssignmentId(null);
        setActiveExampleId(null);
        setTeacherTaskPanelLayout('configure');
        setLibraryPanelMode('closed');
      }
      if (hit.kind === 'arithmeticExample') {
        setActiveAssignmentId(hit.assignmentId);
        setActiveExampleId(hit.id);
        if (!studentTaskMode) {
          if (!event.shiftKey && nextSelectedIds.length === 1 && nextSelectedIds[0] === hit.id) {
            const frame = findCanvasFrameContainingObject(hit);
            if (frame) {
              setSelectedIds([frame.id]);
              setCanvasFrameToolbarOpenForId(null);
            }
          }
          setLibraryPanelMode('closed');
          setTaskPanelSyncTick((n) => n + 1);
        }
        actionRef.current = EMPTY_ACTION;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      if (hit.kind === 'sequenceExample') {
        setActiveAssignmentId(hit.assignmentId);
        setActiveExampleId(hit.id);
        if (!studentTaskMode) {
          if (!event.shiftKey && nextSelectedIds.length === 1 && nextSelectedIds[0] === hit.id) {
            const frame = findCanvasFrameContainingObject(hit);
            if (frame) {
              setSelectedIds([frame.id]);
              setCanvasFrameToolbarOpenForId(null);
            }
          }
          setLibraryPanelMode('closed');
          setTaskPanelSyncTick((n) => n + 1);
        }
        actionRef.current = EMPTY_ACTION;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      if (hit.kind === 'dominoExample') {
        setActiveAssignmentId(hit.assignmentId);
        setActiveExampleId(hit.id);
        if (!studentTaskMode) {
          if (!event.shiftKey && nextSelectedIds.length === 1 && nextSelectedIds[0] === hit.id) {
            const frame = findCanvasFrameContainingObject(hit);
            if (frame) {
              setSelectedIds([frame.id]);
              setCanvasFrameToolbarOpenForId(null);
            }
          }
          setLibraryPanelMode('closed');
          setTaskPanelSyncTick((n) => n + 1);
        }
        actionRef.current = EMPTY_ACTION;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      if (hit.kind === 'marbleBagExample') {
        setActiveAssignmentId(hit.assignmentId);
        setActiveExampleId(hit.id);
        if (!studentTaskMode) {
          if (!event.shiftKey && nextSelectedIds.length === 1 && nextSelectedIds[0] === hit.id) {
            const frame = findCanvasFrameContainingObject(hit);
            if (frame) {
              setSelectedIds([frame.id]);
              setCanvasFrameToolbarOpenForId(null);
            }
          }
          setLibraryPanelMode('closed');
          setTaskPanelSyncTick((n) => n + 1);
        }
        actionRef.current = EMPTY_ACTION;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      actionRef.current = {
        type: 'drag',
        startWorld: world,
        originalObjects: cloneObjects(objects),
        selectedIds: nextSelectedIds,
        moved: false,
      };
    },
    [
      brushColor,
      highlighterColor,
      cancelViewportAnimation,
      clientToWorld,
      closeMathInlineEdit,
      flushActiveSplitAnimation,
      insertBuildNumberTile,
      insertMathGlyph,
      insertSticker,
      selectedIds,
      selectedSet,
      startGlyphInlineEdit,
      objects,
      tool,
      viewport,
      setLassoPoints,
      commitObjects,
      setTool,
      stickyEditingId,
      eraseStrokesAtWorld,
      isStudentEditableMathGlyph,
      studentTaskMode,
      activeAssignmentId,
      setActiveAssignmentId,
      setActiveExampleId,
      setTeacherTaskPanelLayout,
      setCanvasFrameToolbarOpenForId,
      setSelectedIds,
      findCanvasFrameContainingObject,
      setLibraryPanelMode,
      marbleBagFocusedMarble,
      setMarbleBagFocusedMarble,
    ],
  );

  const beginDragSelectionFromHud = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (selectedIds.length === 0) return;
      if (
        selectedIds.some((id) => {
          const o = objectsRef.current.find((x) => x.id === id);
          return o ? boardObjectIsLocked(o) : false;
        })
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      svg.setPointerCapture(event.pointerId);
      const world = clientToWorld(event.clientX, event.clientY);
      actionRef.current = {
        type: 'drag',
        startWorld: world,
        originalObjects: cloneObjects(objectsRef.current),
        selectedIds: [...selectedIds],
        moved: false,
      };
    },
    [clientToWorld, selectedIds],
  );

  const updatePointerAction = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (pendingPinnedPlacementRef.current && tool === 'stamp') {
        setPinnedPreviewWorld(clientToWorld(event.clientX, event.clientY));
      }

      let action = actionRef.current;
      const world = clientToWorld(event.clientX, event.clientY);

      if (
        liveCollabTokenRef.current &&
        liveChannelRef.current &&
        liveChannelReadyRef.current &&
        livePeerIdRef.current
      ) {
        const nowMs = performance.now();
        if (nowMs - liveCursorLastSentRef.current > 55) {
          liveCursorLastSentRef.current = nowMs;
          void liveChannelRef.current.send({
            type: 'broadcast',
            event: 'cursor',
            payload: {
              peerId: livePeerIdRef.current,
              name: liveDisplayNameRef.current,
              wx: world.x,
              wy: world.y,
              t: Date.now(),
            },
          });
        }
      }

      if (action.type === 'buildTileSplitPending') {
        const pend = action;
        const moveThresh = BUILD_TILE_SPLIT_CLICK_MAX_MOVE_SCREEN_PX / Math.max(viewport.scale, 1e-6);
        if (distance(world, pend.startWorld) <= moveThresh) {
          return;
        }
        const tileNow = objectsRef.current.find(
          (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile' && o.id === pend.tileId,
        );
        if (!tileNow || tileNow.value <= 1) {
          actionRef.current = EMPTY_ACTION;
          return;
        }
        if (boardObjectIsLocked(tileNow)) {
          actionRef.current = EMPTY_ACTION;
          return;
        }
        const idsNow = selectedIdsRef.current;
        const selSet = new Set(idsNow);
        const nextSel = pend.shiftKey
          ? selSet.has(tileNow.id)
            ? idsNow.filter((id) => id !== tileNow.id)
            : [...idsNow, tileNow.id]
          : selSet.has(tileNow.id)
            ? idsNow
            : [tileNow.id];
        setSelectedIds(nextSel);
        actionRef.current = {
          type: 'drag',
          startWorld: pend.startWorld,
          originalObjects: cloneObjects(objectsRef.current),
          selectedIds: nextSel,
          moved: false,
        };
        action = actionRef.current;
      }

      let nextGapHover: { tileId: string; splitAfter: number } | null = null;
      if (action.type === 'idle') {
        for (const obj of [...objectsRef.current].reverse()) {
          if (obj.kind !== 'buildNumberTile' || obj.value <= 1 || boardObjectIsLocked(obj)) continue;
          const b = objectBounds(obj);
          if (!pointInRect(world, b)) continue;
          const splitAfter = hitBuildTileSplitGap(obj, world);
          if (splitAfter !== null) {
            nextGapHover = { tileId: obj.id, splitAfter };
            break;
          }
        }
      }
      setBuildTileGapHover((prev) => {
        if (
          prev &&
          nextGapHover &&
          prev.tileId === nextGapHover.tileId &&
          prev.splitAfter === nextGapHover.splitAfter
        ) {
          return prev;
        }
        return nextGapHover;
      });

      if (action.type === 'pan') {
        const dx = (event.clientX - action.startClient.x) / action.startViewport.scale;
        const dy = (event.clientY - action.startClient.y) / action.startViewport.scale;
        setViewport({
          ...action.startViewport,
          x: action.startViewport.x - dx,
          y: action.startViewport.y - dy,
        });
        return;
      }

      if (action.type === 'boundsResize') {
        const dx = world.x - action.startWorld.x;
        const dy = world.y - action.startWorld.y;
        const b0 = objectBounds(action.original);
        const mins = boundsResizeMinimums(action.original);
        const nw = Math.max(mins.mw, b0.width + dx);
        const nh = Math.max(mins.mh, b0.height + dy);
        if (Math.abs(nw - b0.width) < 0.25 && Math.abs(nh - b0.height) < 0.25) return;
        const patched = applyBoardObjectBoundsResize(action.original, nw, nh);
        if (!patched) return;
        actionRef.current = { ...action, moved: true };
        const nextObjects = objectsRef.current.map((obj) => (obj.id === action.id ? patched : obj));
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'brush') {
        setTempStroke((current) => {
          if (!current) return current;
          const last = current.points[current.points.length - 1];
          if (distance(last, world) < 1.5 / viewport.scale) return current;
          const next = { ...current, points: [...current.points, world] };
          tempStrokeRef.current = next;
          return next;
        });
        return;
      }

      if (action.type === 'drawShape') {
        const cur = tempBoardShapeRef.current;
        if (!cur) return;
        const next = { ...cur, w: world.x - action.startWorld.x, h: world.y - action.startWorld.y };
        tempBoardShapeRef.current = next;
        setTempBoardShape(next);
        return;
      }

      if (action.type === 'eraser') {
        eraseStrokesAtWorld(world);
        return;
      }

      if (action.type === 'lasso') {
        setLassoPoints((current) => {
          const start = current[0];
          if (!start) return [world];
          return [start, world];
        });
        return;
      }

      if (action.type === 'drag') {
        const dxRaw = world.x - action.startWorld.x;
        const dyRaw = world.y - action.startWorld.y;
        if (Math.hypot(dxRaw, dyRaw) < 1 / viewport.scale) return;
        actionRef.current = { ...action, moved: true };

        let dx = dxRaw;
        let dy = dyRaw;
        const ids = new Set(
          action.selectedIds.filter((id) => {
            const orig = action.originalObjects.find((o) => o.id === id);
            return orig && !boardObjectIsLocked(orig);
          }),
        );
        const snapping =
          [...action.originalObjects].some(
            (o) => o.kind === 'buildNumberTile' && ids.has(o.id),
          ) &&
          [...action.originalObjects].some(
            (o) => o.kind === 'buildNumberTile' && !ids.has(o.id),
          );
        let guidesNext: BuildTileSnapGuide[] = [];
        if (snapping) {
          const snapped = computeBuildTileSnapAdjustment(
            action.originalObjects,
            action.selectedIds,
            dxRaw,
            dyRaw,
            viewport.scale,
          );
          dx = snapped.dx;
          dy = snapped.dy;
          guidesNext = snapped.guides;
          setBuildTileSnapGuides((prev) => (buildTileSnapGuidesEqual(prev, guidesNext) ? prev : guidesNext));
        } else {
          setBuildTileSnapGuides((prev) => (prev.length === 0 ? prev : []));
        }

        const nextObjects = action.originalObjects.map((object) =>
          ids.has(object.id)
            ? {
                ...object,
                ...(object.kind === 'stroke'
                  ? { points: object.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) }
                  : object.kind === 'canvasFrame'
                    ? { x: object.x + dx, y: object.y + dy }
                  : { x: object.x + dx, y: object.y + dy }),
              }
            : object,
        );
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'numberLineResize') {
        const deltaSteps =
          action.side === 'start'
            ? Math.floor((action.startWorld.x - world.x) / action.originalLine.spacing)
            : Math.floor((world.x - action.startWorld.x) / action.originalLine.spacing);
        const minSpan = 1;
        const maxShrink =
          action.side === 'start'
            ? action.originalLine.end - action.originalLine.start - minSpan
            : action.originalLine.end - action.originalLine.start - minSpan;
        const steps = Math.max(-maxShrink, deltaSteps);
        if (steps === 0) return;

        actionRef.current = { ...action, moved: true };
        const nextObjects = objectsRef.current.map((object) => {
          if (object.kind !== 'numberLine' || object.id !== action.id) return object;
          if (action.side === 'start') {
            return {
              ...action.originalLine,
              x: action.originalLine.x - steps * action.originalLine.spacing,
              start: action.originalLine.start - steps,
              width: action.originalLine.width + steps * action.originalLine.spacing,
            };
          }
          return {
            ...action.originalLine,
            end: action.originalLine.end + steps,
            width: action.originalLine.width + steps * action.originalLine.spacing,
          };
        });
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'spatialTilingGridResize') {
        const ob = action.originalBoard;
        const cs = action.originalCellSize;
        const chromeX = ob.width - action.originalGridW;
        const chromeY = ob.height - action.originalGridH;
        const deltaCols =
          action.edge === 'cols' ? Math.floor((world.x - action.startWorld.x) / cs) : 0;
        const deltaRows =
          action.edge === 'rows' ? Math.floor((world.y - action.startWorld.y) / cs) : 0;
        const newCols = clamp(ob.cols + deltaCols, SPATIAL_TILING_GRID_MIN_COLS, SPATIAL_TILING_GRID_MAX_COLS);
        const newRows = clamp(ob.rows + deltaRows, SPATIAL_TILING_GRID_MIN_ROWS, SPATIAL_TILING_GRID_MAX_ROWS);
        if (newCols === ob.cols && newRows === ob.rows) return;

        actionRef.current = { ...action, moved: true };
        const newWidth = newCols * cs + chromeX;
        const newHeight = newRows * cs + chromeY;
        const placedTiles = filterSpatialPlacedTilesToGrid(ob.placedTiles, newCols, newRows);
        const nextBoard: SpatialTilingBoardObject = {
          ...ob,
          cols: newCols,
          rows: newRows,
          width: newWidth,
          height: newHeight,
          placedTiles,
        };
        const nextObjects = objectsRef.current.map((o) =>
          o.kind === 'spatialTilingBoard' && o.id === action.id ? nextBoard : o,
        );
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'imageCropPan') {
        const dx = world.x - action.startWorld.x;
        const dy = world.y - action.startWorld.y;
        if (Math.hypot(dx, dy) < 1 / viewport.scale) return;
        actionRef.current = { ...action, moved: true };
        const cropScale = 1.35;
        const scaledWidth = action.originalImage.width * cropScale;
        const scaledHeight = action.originalImage.height * cropScale;
        const minCropX = action.originalImage.width - scaledWidth;
        const minCropY = action.originalImage.height - scaledHeight;
        const nextCropX = clamp((action.originalImage.cropX ?? minCropX / 2) + dx, minCropX, 0);
        const nextCropY = clamp((action.originalImage.cropY ?? minCropY / 2) + dy, minCropY, 0);
        const nextObjects = objectsRef.current.map((object) =>
          object.kind === 'image' && object.id === action.id
            ? { ...object, cropX: nextCropX, cropY: nextCropY }
            : object,
        );
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'marbleBagItemDrag') {
        const dxRaw = world.x - action.startWorld.x;
        const dyRaw = world.y - action.startWorld.y;
        if (Math.hypot(dxRaw, dyRaw) < 0.4 / viewport.scale) return;
        actionRef.current = { ...action, moved: true };
        const { scale } = marbleBagExampleGeometry(action.originalExample);
        const dx = dxRaw / scale;
        const dy = dyRaw / scale;
        const nextObjects = objectsRef.current.map((object) => {
          if (object.kind !== 'marbleBagExample' || object.id !== action.exampleId) return object;
          return {
            ...action.originalExample,
            submitted: false,
            items: action.originalExample.items.map((item) => {
              if (item.id !== action.itemId) return item;
              if (item.kind !== 'marble') return item;
              const p = marbleBagMarbleLayoutPosition(action.originalExample, item);
              return { ...item, x: p.x + dx, y: p.y + dy };
            }),
          };
        });
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'beadDrag') {
        const targetPosition = action.originalCounter.beads.find((bead) => bead.id === action.beadId)?.position ?? 0;
        const nextCounter = moveBead(action.originalCounter, action.beadId, targetPosition + (world.x - action.startWorld.x));
        actionRef.current = { ...action, moved: true };
        const nextObjects = objectsRef.current.map((object) =>
          object.kind === 'beadCounter' && object.id === action.counterId ? nextCounter : object,
        );
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }

      if (action.type === 'spatialTileDrag') {
        const board = objectsRef.current.find(
          (o) => o.kind === 'spatialTilingBoard' && o.id === action.boardId,
        );
        if (!board || board.kind !== 'spatialTilingBoard') return;
        const geom = spatialTilingGeometry(board);
        const cell = worldPointToGridCell(board, world, geom);
        if (!cell) return;
        const newGx = cell.cx - action.patternColIndex;
        const newGy = cell.cy - action.patternRowIndex;
        const tile = board.placedTiles.find((t) => t.id === action.tileId);
        if (!tile) return;
        const pattern = tile.pattern;
        if (
          !canPlaceSpatialPatternExcluding(
            pattern,
            newGx,
            newGy,
            board.cols,
            board.rows,
            board.placedTiles,
            action.tileId,
          )
        ) {
          return;
        }
        if (tile.gx === newGx && tile.gy === newGy) return;
        actionRef.current = { ...action, moved: true };
        const nextTiles = board.placedTiles.map((t) =>
          t.id === action.tileId ? { ...t, gx: newGx, gy: newGy } : t,
        );
        const nextBoard = { ...board, placedTiles: nextTiles };
        const nextObjects = objectsRef.current.map((o) => (o.id === board.id ? nextBoard : o));
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
        return;
      }
    },
    [clientToWorld, eraseStrokesAtWorld, tool, viewport.scale],
  );

  const finishPointerAction = useCallback(() => {
    const action = actionRef.current;
    actionRef.current = EMPTY_ACTION;
    setIsPanning(false);
    setBuildTileSnapGuides([]);

    if (action.type === 'buildTileSplitPending') {
      const tile = objectsRef.current.find(
        (o): o is BuildNumberTileObject => o.kind === 'buildNumberTile' && o.id === action.tileId,
      );
      if (tile && tile.value > 1) {
        runBuildTileSplitAnimation(tile, action.splitAfter);
      }
      return;
    }

    if (action.type === 'drawShape') {
      const draft = tempBoardShapeRef.current;
      tempBoardShapeRef.current = null;
      setTempBoardShape(null);
      if (!draft) return;
      const norm = normalizeBoardShapeCommit(draft);
      if (!norm) return;
      const obj: BoardShapeObject = {
        kind: 'boardShape',
        id: crypto.randomUUID(),
        shape: draft.shape,
        x: norm.x,
        y: norm.y,
        w: norm.w,
        h: norm.h,
        color: draft.color,
        strokeWidth: draft.strokeWidth,
      };
      commitObjects([...objectsRef.current, obj], [obj.id]);
      return;
    }

    if (action.type === 'brush') {
      const current = tempStrokeRef.current;
      tempStrokeRef.current = null;
      setTempStroke(null);
      if (!current || current.points.length < 2) return;
      commitObjects([...objectsRef.current, current], [current.id]);
      return;
    }

    if (action.type === 'eraser') {
      if (eraserMutatedRef.current) pushHistory(objectsRef.current);
      eraserMutatedRef.current = false;
      return;
    }

    if (action.type === 'lasso') {
      if (lassoPoints.length >= 2) {
        const selectionRect = rectFromPoints(lassoPoints[0], lassoPoints[1]);
        setSelectedIds(
          objectsRef.current
            .filter((object) => {
              if (boardObjectIsLocked(object)) return false;
              if (object.kind !== 'stroke') {
                const bounds = objectBounds(object);
                const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
                return pointInRect(center, selectionRect);
              }
              return strokeIntersectsRect(object, selectionRect);
            })
            .map((object) => object.id),
        );
      }
      setLassoPoints([]);
      setTool((prev) => (prev === 'stamp' ? 'stamp' : 'select'));
      return;
    }

    if (action.type === 'drag' && action.moved) {
      const draggedMergeGlyphId = action.selectedIds.find((id) =>
        objectsRef.current.some(
          (object) => object.id === id && object.kind === 'mathGlyph' && isMergeParticipantMathGlyph(object),
        ),
      );
      if (draggedMergeGlyphId) {
        const merged = mergeTouchingNumberGlyphs(objectsRef.current, draggedMergeGlyphId);
        objectsRef.current = merged.objects;
        setObjects(merged.objects);
        if (merged.selectedId) setSelectedIds([merged.selectedId]);
        pushHistory(merged.objects);
      } else {
        const needClearEditing = objectsRef.current.some(
          (o) => o.kind === 'dominoTile' && action.selectedIds.includes(o.id) && o.editingSide,
        );
        if (needClearEditing) {
          const cleared = objectsRef.current.map((o) =>
            o.kind === 'dominoTile' && action.selectedIds.includes(o.id) ? { ...o, editingSide: null } : o,
          );
          objectsRef.current = cleared;
          setObjects(cleared);
        }
        pushHistory(objectsRef.current);
      }
    }

    if (action.type === 'numberLineResize' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'spatialTilingGridResize' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'imageCropPan' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'beadDrag' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'boundsResize' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'spatialTileDrag' && action.moved) {
      pushHistory(objectsRef.current);
    }

    if (action.type === 'marbleBagItemDrag') {
      const ex = objectsRef.current.find(
        (o): o is MarbleBagExampleObject => o.id === action.exampleId && o.kind === 'marbleBagExample',
      );
      if (ex && !boardObjectIsLocked(ex)) {
        const item = ex.items.find((i) => i.id === action.itemId);
        if (item?.kind === 'marble') {
          const p = marbleBagMarbleLayoutPosition(ex, item);
          if (!isMarbleCenterInPytlikDesign(p)) {
            commitObjects(
              objectsRef.current.map((o) =>
                o.kind === 'marbleBagExample' && o.id === action.exampleId
                  ? { ...o, submitted: false, items: o.items.filter((i) => i.id !== action.itemId) }
                  : o,
              ),
              selectedIdsRef.current,
            );
            setMarbleBagFocusedMarble((prev) =>
              prev?.exampleId === action.exampleId && prev.itemId === action.itemId ? null : prev,
            );
            marbleBagHeldItemRef.current = null;
            return;
          }
        }
      }
      if (action.moved) {
        pushHistory(objectsRef.current);
      }
    }
  }, [commitObjects, lassoPoints, pushHistory, runBuildTileSplitAnimation, setMarbleBagFocusedMarble]);

  const openStickyNoteEditor = useCallback(
    (noteId: string) => {
      const note = objectsRef.current.find((o): o is StickyNoteObject => o.kind === 'stickyNote' && o.id === noteId);
      if (!note || boardObjectIsLocked(note)) return;
      finishPointerAction();
      if (mathInlineEditIdRef.current) {
        closeMathInlineEdit();
      }
      setLibraryPanelMode('closed');
      setTool('select');
      setSelectedIds([noteId]);
      setStickyEditingId(noteId);
    },
    [closeMathInlineEdit, finishPointerAction],
  );

  const applyTeacherArithmeticEdit = useCallback(() => {
    if (!teacherArithmeticEdit) return;
    const { exampleId, a, b, operation } = teacherArithmeticEdit;
    const na = Math.round(Number(a));
    const nb = Math.round(Number(b));
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return;
    commitObjects(
      objectsRef.current.map((object) => {
        if (object.id !== exampleId || object.kind !== 'arithmeticExample') return object;
        return {
          ...object,
          example: {
            ...object.example,
            a: na,
            b: nb,
            operation,
            expectedAnswer: computeArithmeticExpectedAnswer(na, nb, operation),
          },
        };
      }),
      selectedIdsRef.current,
    );
    setTeacherArithmeticEdit(null);
  }, [teacherArithmeticEdit, commitObjects]);

  const handleBoardDoubleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const world = clientToWorld(event.clientX, event.clientY);
      if (studentTaskMode) {
        const glyph = [...objectsRef.current].reverse().find((object) => {
          if (!isStudentEditableMathGlyph(object) || boardObjectIsLocked(object)) return false;
          return pointInRect(world, objectBounds(object));
        });
        if (!glyph) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedIds([glyph.id]);
        setTool('mathWrite');
        mathInlineTypingKindRef.current = 'math';
        setMathInlineEditingId(glyph.id);
        return;
      }
      if (taskModeActive && activeTaskSettings?.type === 'arithmetic' && activeAssignmentId) {
        const arith = [...objectsRef.current]
          .reverse()
          .find(
            (o): o is ArithmeticExampleObject =>
              o.kind === 'arithmeticExample' &&
              o.assignmentId === activeAssignmentId &&
              !boardObjectIsLocked(o) &&
              pointInRect(world, objectBounds(o)),
          );
        if (arith) {
          event.preventDefault();
          event.stopPropagation();
          setTeacherArithmeticEdit({
            exampleId: arith.id,
            a: arith.example.a,
            b: arith.example.b,
            operation: arith.example.operation,
          });
          return;
        }
      }
      const sticky = [...objectsRef.current]
        .reverse()
        .find(
          (o): o is StickyNoteObject =>
            o.kind === 'stickyNote' &&
            !boardObjectIsLocked(o) &&
            pointInRect(world, { x: o.x, y: o.y, width: o.width, height: o.height }),
        );
      if (!sticky) return;

      event.preventDefault();
      event.stopPropagation();

      openStickyNoteEditor(sticky.id);
    },
    [
      activeAssignmentId,
      activeTaskSettings?.type,
      clientToWorld,
      isStudentEditableMathGlyph,
      openStickyNoteEditor,
      setMathInlineEditingId,
      setTool,
      studentTaskMode,
      taskModeActive,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const editId = mathInlineEditIdRef.current;
      if (editId && !mod) {
        const cap = mathInlineInputRef.current;
        if (cap && (event.target as Node | null) === cap) {
          return;
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault();
          backspaceMathGlyph(editId);
          return;
        }
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.preventDefault();
          closeMathInlineEdit();
          return;
        }
        const kind = mathInlineTypingKindRef.current;
        if (event.key.length === 1 && !event.altKey) {
          const ok = kind === 'text' ? isTextGlyphInputChar(event.key) : isMathGlyphInputChar(event.key);
          if (ok) {
            event.preventDefault();
            appendMathGlyphChar(editId, event.key);
            return;
          }
        }
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
      if (isTyping) return;

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        marbleBagFocusedMarble &&
        !mod
      ) {
        const held = marbleBagFocusedMarble;
        const ex = objectsRef.current.find(
          (o): o is MarbleBagExampleObject => o.kind === 'marbleBagExample' && o.id === held.exampleId,
        );
        if (
          ex &&
          !boardObjectIsLocked(ex) &&
          ex.items.some((i) => i.id === held.itemId && i.kind === 'marble')
        ) {
          event.preventDefault();
          commitObjects(
            objectsRef.current.map((o) =>
              o.kind === 'marbleBagExample' && o.id === held.exampleId
                ? { ...o, submitted: false, items: o.items.filter((i) => i.id !== held.itemId) }
                : o,
            ),
            selectedIdsRef.current,
          );
          setMarbleBagFocusedMarble(null);
          marbleBagHeldItemRef.current = null;
          return;
        }
        setMarbleBagFocusedMarble(null);
        marbleBagHeldItemRef.current = null;
      }

      if (mod && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        performSelectAllBoardObjects();
        return;
      }

      if (teacherArithmeticEditRef.current && event.key === 'Escape') {
        event.preventDefault();
        setTeacherArithmeticEdit(null);
        return;
      }

      if (studentTaskModeRef.current || studentShareModeRef.current) {
        if (studentLockedUntilNameRef.current) return;
        if (studentTaskModeRef.current && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault();
          deleteSelection();
          return;
        }
        if (studentTaskModeRef.current && /^[0-9]$/.test(event.key)) {
          event.preventDefault();
          placeGlyphInActiveAnswer(event.key);
          return;
        }
        if (studentTaskModeRef.current && (event.key === '-' || event.key === '−') && activeExample?.kind === 'arithmeticExample') {
          event.preventDefault();
          placeGlyphInActiveAnswer('−');
          return;
        }
        if (studentTaskModeRef.current && event.key === 'Enter') {
          event.preventDefault();
          submitActiveExample();
        }
        return;
      }

      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (event.shiftKey) {
          void performSaveAs();
        } else {
          void performSave();
        }
        return;
      }
      if (mod && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        fileInputRef.current?.click();
        return;
      }
      if (mod && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleNewBoardDocument();
        return;
      }
      if (mod && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        addCanvasFrameFromViewport();
        return;
      }

      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (mod && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (event.key === 'Escape') {
        clearPendingPinnedPlacement();
        cancelMathTypingFlow();
        setSelectedIds([]);
        setLassoPoints([]);
        tempStrokeRef.current = null;
        setTempStroke(null);
        tempBoardShapeRef.current = null;
        setTempBoardShape(null);
        setTool('select');
        return;
      }
      if (!mod && event.key.toLowerCase() === 'r') {
        const ids = selectedIdsRef.current;
        if (ids.length === 1 && spatialTilingPickRef.current?.boardId === ids[0]) {
          const brd = objectsRef.current.find((o) => o.id === ids[0]);
          if (brd && boardObjectIsLocked(brd)) return;
          event.preventDefault();
          setSpatialTilingPick((p) => (p ? { ...p, rotation: (p.rotation + 1) % 4 } : p));
          return;
        }
      }
      if (taskModeActive && /^[0-9]$/.test(event.key)) {
        event.preventDefault();
        placeGlyphInActiveAnswer(event.key);
        return;
      }
      if (taskModeActive && event.key === 'Enter') {
        event.preventDefault();
        submitActiveExample();
        return;
      }
      if (event.key.toLowerCase() === 'v') setTool('select');
      if (event.key.toLowerCase() === 'g' && pinnedMathGlyphsRef.current) {
        event.preventDefault();
        clearPendingPinnedPlacement();
        setTool('mathWrite');
        return;
      }
      if (event.key.toLowerCase() === 'h') setTool('pan');
      if (event.key.toLowerCase() === 'b') setTool('brush');
      if (event.key.toLowerCase() === 'y') setTool('highlighter');
      if (event.key.toLowerCase() === 'e') setTool('eraser');
      if (event.key.toLowerCase() === 'n') setTool('stickyNote');
      if (event.key.toLowerCase() === 't') setTool('textWrite');
      if (event.key.toLowerCase() === 'l') setTool('select');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    appendMathGlyphChar,
    backspaceMathGlyph,
    addCanvasFrameFromViewport,
    cancelMathTypingFlow,
    clearPendingPinnedPlacement,
    closeMathInlineEdit,
    commitObjects,
    deleteSelection,
    handleNewBoardDocument,
    performSave,
    performSaveAs,
    performSelectAllBoardObjects,
    placeGlyphInActiveAnswer,
    redo,
    submitActiveExample,
    taskModeActive,
    undo,
    setSpatialTilingPick,
    marbleBagFocusedMarble,
    setMarbleBagFocusedMarble,
  ]);

  const pinnedStripBoardSelection = useMemo((): PinnedStripBoardSelection | null => {
    if (pendingPinnedPlacement?.kind === 'sticker') {
      return { kind: 'sticker', url: pendingPinnedPlacement.sticker.url };
    }
    if (pendingPinnedPlacement?.kind === 'tile') {
      return { kind: 'tile', value: pendingPinnedPlacement.value, variant: pendingPinnedPlacement.variant };
    }
    if (pendingPinnedPlacement?.kind === 'mathGlyph') {
      return { kind: 'mathGlyph', label: pendingPinnedPlacement.label };
    }
    if (selectedIds.length !== 1) return null;
    const sole = objects.find((object) => object.id === selectedIds[0]);
    if (!sole) return null;
    if (sole.kind === 'image') return { kind: 'sticker', url: sole.url };
    if (sole.kind === 'buildNumberTile') return { kind: 'tile', value: sole.value, variant: sole.variant };
    if (sole.kind === 'mathGlyph') return { kind: 'mathGlyph', label: sole.label };
    return null;
  }, [pendingPinnedPlacement, selectedIds, objects]);

  const lassoRect = lassoPoints.length > 1 ? rectFromPoints(lassoPoints[0], lassoPoints[1]) : null;

  const boardContextSelectAllKbd = useMemo(
    () =>
      typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent || '')
        ? '⌘A'
        : 'Ctrl+A',
    [],
  );

  return (
    <main
      className={[
        'app-shell',
        (studentTaskMode || libraryDock === 'side') ? 'library-dock-side' : '',
        !studentTaskMode &&
        libraryDock === 'side' &&
        librarySideRailOnlyLayout &&
        libraryPanelMode === 'closed'
          ? 'library-dock-side--rail-only'
          : '',
        !studentTaskMode && libraryDock === 'side' && libraryPanelMode === 'drawing' ? 'library-side-drawing-open' : '',
        pinnedMathGlyphs && tool === 'mathWrite' ? 'is-math-write-canvas' : '',
        tool === 'textWrite' ? 'is-text-write-canvas' : '',
        taskModeActive ? 'task-mode-active' : '',
        !studentTaskMode && taskModeActive && teacherTaskPanelLayout === 'student-preview'
          ? 'teacher-task-library-student-preview'
          : '',
        studentTaskMode ? 'student-task-mode' : '',
        studentLockedUntilName ? 'student-task-mode--locked' : '',
        appUiLightMode ? 'app-shell--light-ui' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ObjectLibraryPanel
        open={
          !studentTaskMode &&
          libraryPanelOpen &&
          !(libraryDock === 'bottom' && libraryPanelMode === 'drawing')
        }
        panelMode={libraryPanelMode}
        onClose={() => setLibraryPanelMode('closed')}
        onToggleLibraryOpen={() => {
          setLibraryPanelMode((m) => (m === 'catalog' ? 'closed' : 'catalog'));
        }}
        onInsertSticker={insertSticker}
        onInsertBuildNumberTile={insertBuildNumberTile}
        onPinnedPickBuildNumberTile={armPinnedTilePlacement}
        onPinnedPickSticker={armPinnedStickerPlacement}
        onInsertNumberLine={insertNumberLine}
        onInsertBeadCounter={insertBeadCounter}
        onInsertDiceTray={insertDiceTray}
        onInsertDominoTile={insertDominoTile}
        onInsertSpatialTilingBoard={insertSpatialTilingBoard}
        onCreateArithmeticAssignment={(settings) => {
          void upsertArithmeticAssignment(settings);
        }}
        onCreateSequenceAssignment={(settings) => {
          void upsertSequenceAssignment(settings);
        }}
        onCreateDominoAssignment={(settings) => {
          void upsertDominoAssignment(settings);
        }}
        onCreateMarbleBagAssignment={(settings) => {
          void upsertMarbleBagAssignment(settings);
        }}
        activeSequenceChoices={activeSequenceExample?.example.choices ?? null}
        onPickSequenceChoice={(choiceKey) => {
          fillActiveSequenceCell(choiceKey);
        }}
        pinnedStripBoardSelection={pinnedStripBoardSelection}
        onArmMathGlyph={armMathGlyphPlacement}
        pinnedMathGlyphs={studentTaskMode || pinnedMathGlyphs}
        onPinnedMathGlyphsChange={studentTaskMode ? () => undefined : setPinnedMathGlyphs}
        mathGlyphStripStyle={mathGlyphStripStyle}
        onMathGlyphStripStyleChange={setMathGlyphStripStyle}
        boardTool={tool}
        onToggleMathWrite={toggleMathWriteTool}
        onSelectDrawingTool={(t) => {
          setTool(t);
        }}
        drawShapeKind={drawShapeKind}
        onDrawShapeKindChange={setDrawShapeKind}
        brushColor={brushColor}
        onBrushColorChange={setBrushColor}
        highlighterColor={highlighterColor}
        onHighlighterColorChange={setHighlighterColor}
        embeddedToolPalette={
          !studentTaskMode && (libraryDock === 'bottom' || libraryDock === 'side') ? (
            <ToolPalette
              tool={tool}
              selectedCount={selectedCount}
              boardObjectCount={objects.length}
              suppressActiveTool={libraryPanelOpen && tool !== 'select' && tool !== 'pan'}
              leadingItemLabel={libraryDock === 'side' ? 'Menu' : undefined}
              leadingItem={
                <BoardFileMenu
                  variant="menu"
                  fileLabel={fileDisplayLabel}
                  documentDirty={documentDirty}
                  metadata={documentMetadata}
                  onMetadataChange={handleDocumentMetadataChange}
                  onNew={handleNewBoardDocument}
                  onOpenClick={handleOpenBoardFile}
                  onSave={() => {
                    void performSave();
                  }}
                  onSaveAs={() => {
                    void performSaveAs();
                  }}
                  cloudAvailable={Boolean(supabase && user)}
                  onCloudSave={() => void performCloudSave()}
                  onOpenCloud={() => setCloudModalOpen(true)}
                  onBackgroundSettings={() => setBackgroundModalOpen(true)}
                  onShare={() => {
                    setShareError(null);
                    setShareModalOpen(true);
                  }}
                  onTaskResults={handleOpenTaskResults}
                  lightUiMode={appUiLightMode}
                  onLightUiModeChange={setAppUiLightMode}
                />
              }
              libraryItemLabel={libraryDock === 'side' ? 'Knihovna' : undefined}
              libraryItem={
                <button
                  type="button"
                  className={`palette-button${libraryPanelMode === 'catalog' ? ' is-active' : ''}`}
                  aria-label={libraryPanelMode === 'catalog' ? 'Zavřít knihovnu' : 'Otevřít knihovnu'}
                  aria-expanded={libraryPanelMode === 'catalog'}
                  onClick={() => {
                    setLibraryPanelMode((m) => (m === 'catalog' ? 'closed' : 'catalog'));
                  }}
                >
                  <Shapes size={18} strokeWidth={2.2} className="library-launcher-shapes" aria-hidden />
                </button>
              }
              drawingItemLabel={libraryDock === 'side' ? 'Kreslení' : undefined}
              drawingItem={
                <button
                  type="button"
                  className={`palette-button${libraryPanelMode === 'drawing' ? ' is-active' : ''}`}
                  aria-label={libraryPanelMode === 'drawing' ? 'Zavřít kreslení' : 'Otevřít kreslení'}
                  aria-expanded={libraryPanelMode === 'drawing'}
                  onClick={() => setLibraryPanelMode((m) => (m === 'drawing' ? 'closed' : 'drawing'))}
                >
                  <PenTool size={18} strokeWidth={2.2} aria-hidden />
                </button>
              }
              tasksItemLabel={libraryDock === 'side' ? 'Úkoly' : undefined}
              tasksItem={
                <button
                  type="button"
                  className={`palette-button${libraryPanelMode === 'tasks' ? ' is-active' : ''}`}
                  aria-label={libraryPanelMode === 'tasks' ? 'Zavřít úkoly' : 'Otevřít úkoly'}
                  aria-expanded={libraryPanelMode === 'tasks'}
                  onClick={() => setLibraryPanelMode((m) => (m === 'tasks' ? 'closed' : 'tasks'))}
                >
                  <ListChecks size={18} strokeWidth={2.2} aria-hidden />
                </button>
              }
              onToolChange={(nextTool) => {
                if (nextTool !== 'select' && nextTool !== 'pan') {
                  setLibraryPanelMode('closed');
                }
                setTool(nextTool);
              }}
              onDeleteSelection={() => {
                setLibraryPanelMode('closed');
                deleteSelection();
              }}
              onClearBoard={() => {
                setLibraryPanelMode('closed');
                clearBoard();
              }}
            />
          ) : null
        }
        libraryDock={studentTaskMode ? 'side' : libraryDock}
        onLibraryDockChange={(position) => {
          setLibraryDock(position === 'bottom' ? 'side' : position);
          syncSelectionHudRef.current();
        }}
        onSideDockRailOnlyLayout={handleSideDockRailOnlyLayout}
        taskModeActive={taskModeActive}
        studentTaskMode={studentTaskMode}
        activeAssignmentId={activeAssignmentId}
        activeTaskSettings={activeTaskSettings}
        taskPanelSyncTick={taskPanelSyncTick}
        teacherTaskPanelLayout={teacherTaskPanelLayout}
        onTeacherTaskPanelLayoutChange={setTeacherTaskPanelLayout}
        embeddedSpatialTilingToolbar={
          !studentTaskMode &&
          soleSelectedObject?.kind === 'spatialTilingBoard' &&
          !boardObjectIsLocked(soleSelectedObject) &&
          spatialTilingPick && spatialTilingPick.boardId === soleSelectedObject.id ? (
            <SpatialTilingLibraryToolbar
              pick={spatialTilingPick}
              onPickShape={(shapeId) => setSpatialTilingPick((p) => (p ? { ...p, shapeId } : p))}
              onRotate={() =>
                setSpatialTilingPick((prev) => {
                  if (!prev) return prev;
                  return { ...prev, rotation: (prev.rotation + 1) % 4 };
                })
              }
              onClearPlacedTiles={clearSpatialBoardPlacedTiles}
            />
          ) : null
        }
        embeddedMachineToolbar={
          !studentTaskMode && machineSettingsLine ? (
            <NumberLineMachineBottomStrip
              draft={numberLineToDraft(machineSettingsLine)}
              figureSlot={
                machineSettingsLine.mode === 'withFigure' && !boardObjectIsLocked(machineSettingsLine) ? (
                  <NumberLineFigureMachineControls
                    figures={getNumberLineFigures(machineSettingsLine)}
                    activeFigureId={machineSettingsLine.activeFigureId ?? null}
                    rangeStart={machineSettingsLine.start}
                    rangeEnd={machineSettingsLine.end}
                    onSelectFigure={(figureId) => selectNumberLineFigure(machineSettingsLine.id, figureId)}
                    onAddFigure={() => addFigureToNumberLine(machineSettingsLine.id)}
                    onStep={(delta) => moveNumberLineFigure(machineSettingsLine.id, delta)}
                  />
                ) : null
              }
              onCommit={(draft) => {
                const updated = rebuildNumberLineFromDraft(machineSettingsLine, draft);
                commitObjects(
                  objectsRef.current.map((object) => (object.id === machineSettingsLine.id ? updated : object)),
                  selectedIdsRef.current,
                );
              }}
            />
          ) : !studentTaskMode && machineSettingsDiceTray && !boardObjectIsLocked(machineSettingsDiceTray) ? (
            <DiceTrayMachineStrip
              dice={machineSettingsDiceTray.dice}
              defaultSides={normalizeDiceSides(machineSettingsDiceTray.defaultSides)}
              maxDice={MAX_DICE_TRAY_DICE}
              onRoll={() => rollDiceTray(machineSettingsDiceTray.id)}
              onAddDie={() =>
                patchDiceTray(machineSettingsDiceTray.id, (t) => {
                  if (t.dice.length >= MAX_DICE_TRAY_DICE) return t;
                  const sides = normalizeDiceSides(t.defaultSides);
                  return {
                    ...t,
                    dice: [...t.dice, { id: crypto.randomUUID(), sides, value: randomDiceRoll(sides) }],
                  };
                })
              }
              onDefaultSidesChange={(sides) =>
                patchDiceTray(machineSettingsDiceTray.id, (t) => ({ ...t, defaultSides: sides }))
              }
              onDieSidesChange={(dieId, sides) =>
                patchDiceTray(machineSettingsDiceTray.id, (t) => ({
                  ...t,
                  dice: t.dice.map((d) =>
                    d.id === dieId ? { ...d, sides, value: clampDiceValue(d.value, sides) } : d,
                  ),
                }))
              }
            />
          ) : !studentTaskMode && machineSettingsCounter ? (
            <BeadCounterMachineBottomStrip
              draft={beadCounterToDraft(machineSettingsCounter)}
              onCommit={(draft) => {
                const updated = applyBeadCounterMachineDraft(machineSettingsCounter, draft);
                commitObjects(
                  objectsRef.current.map((object) => (object.id === machineSettingsCounter.id ? updated : object)),
                  selectedIdsRef.current,
                );
              }}
            />
          ) : null
        }
      />

      {!studentTaskMode ? <input
        ref={fileInputRef}
        type="file"
        accept=".mnboard,application/json,.json"
        className="board-file-input-hidden"
        aria-hidden
        tabIndex={-1}
        onChange={onOpenBoardFileChange}
      /> : null}

      {!studentTaskMode ? <header className="board-top-bar">
        <div className="board-top-bar__trailing" />
        <TopControls
          className="top-controls--in-board-bar"
          canUndo={historyUI.canUndo}
          canRedo={historyUI.canRedo}
          zoom={viewport.scale}
          onUndo={undo}
          onRedo={redo}
          onZoomIn={() => zoomBy(0.15)}
          onZoomOut={() => zoomBy(-0.15)}
          onZoomReset={() => setZoom(1)}
          onZoomChange={setZoom}
        />
      </header> : null}

      {studentTaskMode && taskModeActive && activeTaskObjects.length > 0 && !studentLockedUntilName ? (
        <div className="student-task-progress-strip" aria-label="Postup úkolu">
          <span className="student-task-progress-strip__label">Příklady:</span>
          <div className="student-task-progress-strip__items">
            {activeTaskObjects.map((example, index) => (
              <button
                key={example.id}
                type="button"
                className={`student-task-progress-strip__item${example.id === (activeExample?.id ?? activeSequenceExample?.id) ? ' is-active' : ''}`}
                aria-label={`Příklad ${index + 1}`}
                aria-current={example.id === (activeExample?.id ?? activeSequenceExample?.id) ? 'step' : undefined}
                onClick={() => {
                  setActiveAssignmentId(example.assignmentId);
                  setActiveExampleId(example.id);
                  if (example.kind === 'arithmeticExample' || example.kind === 'dominoExample' || example.kind === 'marbleBagExample') {
                    focusArithmeticExample(example);
                  }
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {studentTaskMode && studentTaskCelebration.active ? (
        <div
          className="student-task-celebration"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="student-task-celebration__backdrop" aria-hidden />
          <div className="student-task-celebration__burst" aria-hidden>
            <div className="student-task-celebration__center">
              {studentTaskCelebration.particles.map((p) => (
                <span
                  key={`${studentTaskCelebration.burstId}-${p.id}`}
                  className="student-task-celebration__arm"
                  style={{ '--celebr-angle': `${p.angle}deg` }}
                >
                  <span
                    className="student-task-celebration__spark"
                    style={{ '--celebr-delay': `${p.delay}s`, '--celebr-hue': p.hue }}
                  />
                </span>
              ))}
            </div>
          </div>
          <div className="student-task-celebration__message">
            <p className="student-task-celebration__title">Výborně — všechno správně!</p>
            <p className="student-task-celebration__sub">Můžeš úkol poslat učiteli.</p>
          </div>
        </div>
      ) : null}

      {taskModeActive && activeTaskObjects.length > 0 && canvasFrames.length > 1 ? (
        <>
          <button
            className="task-side-arrow task-side-arrow--prev"
            type="button"
            aria-label="Předchozí příklad"
            disabled={activeExampleIndex <= 0}
            onClick={() => stepActiveExample(-1)}
          >
            ‹
          </button>
          <button
            className="task-side-arrow task-side-arrow--next"
            type="button"
            aria-label="Další příklad"
            disabled={activeExampleIndex >= activeTaskObjects.length - 1}
            onClick={() => stepActiveExample(1)}
          >
            ›
          </button>
        </>
      ) : null}

      {!studentTaskMode &&
      selectedCanvasFrame &&
      !boardObjectIsLocked(selectedCanvasFrame) &&
      canvasFrameToolbarOpenForId === selectedCanvasFrame.id &&
      selectedCanvasFramePopupPosition ? (
        <div
          className="canvas-frame-toolbar"
          aria-label="Nastavení plátna"
          onPointerDownCapture={(e) => e.stopPropagation()}
          style={{
            left: selectedCanvasFramePopupPosition.left,
            top: selectedCanvasFramePopupPosition.top,
          }}
        >
          <button
            type="button"
            className="canvas-frame-toolbar__rename"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              renameSelectedCanvasFrame();
            }}
          >
            Přejmenovat
          </button>
          <div className="canvas-frame-toolbar__palette" aria-label="Barva plátna">
            {CANVAS_FRAME_COLOR_PRESETS.map((color, index) => (
              <button
                key={color ?? 'transparent'}
                type="button"
                className={`canvas-frame-color-swatch${selectedCanvasFrame.backgroundColor === color ? ' is-active' : ''}${color === null ? ' is-transparent' : ''}`}
                title={color === null ? 'Průhledné' : `Barva ${index + 1}`}
                style={color === null ? undefined : { backgroundColor: color }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCanvasFrameBackground(color);
                }}
              >
                {color === null ? '×' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="board-work-stage" onContextMenu={!studentTaskMode ? handleBoardContextMenu : undefined}>
        <div className="board-work-frame">
          {!studentTaskMode ? (
            <div className="board-canvas-switcher-float">
              <div className="top-control-pill canvas-switcher-pill" aria-label="Plátna">
                <span className="canvas-switcher-pill__label">Plátna:</span>
                <div className="canvas-switcher-pill__items">
                  {canvasFrames.map((frame) => (
                    <button
                      key={frame.id}
                      className={`canvas-switcher-pill__item${selectedCanvasFrame?.id === frame.id ? ' is-active' : ''}`}
                      type="button"
                      title={frame.title}
                      onClick={() => navigateToCanvasFrame(frame)}
                    >
                      {frame.label}
                    </button>
                  ))}
                </div>
                <div className="canvas-switcher-pill__separator" />
                <button
                  className="canvas-switcher-pill__add"
                  type="button"
                  title="Přidat plátno"
                  onClick={addCanvasFrameFromViewport}
                >
                  <Plus size={19} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ) : null}
          <svg
            ref={svgRef}
            className={`board-svg is-${tool}${isPanning ? ' is-panning' : ''}${pendingPinnedPlacement && tool === 'stamp' ? ' is-stamp-armed' : ''}`}
            style={boardSvgBackgroundStyle}
            viewBox={viewBox}
            onPointerDown={beginPointerAction}
            onPointerMove={updatePointerAction}
            onPointerLeave={() => setPinnedPreviewWorld(null)}
            onPointerUp={finishPointerAction}
            onPointerCancel={finishPointerAction}
            onDoubleClick={handleBoardDoubleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {canvasFrames.map((frame) => (
              <CanvasFrameSvg
                key={frame.id}
                object={frame}
                selected={!studentTaskMode && selectedSet.has(frame.id)}
                onLabelPointerDown={selectCanvasFrameFromLabel}
              />
            ))}

            {objects.filter((object) => object.kind !== 'canvasFrame').map((object) => {
              const showSelectionOutline =
                selectedSet.has(object.id) &&
                (!studentTaskMode || isStudentEditableMathGlyph(object)) &&
                object.kind !== 'arithmeticExample' &&
                object.kind !== 'sequenceExample' &&
                object.kind !== 'dominoExample' &&
                object.kind !== 'marbleBagExample' &&
                object.kind !== 'stickyNote';
              const outlineBounds = showSelectionOutline ? objectBounds(object) : null;
              return (
                <g key={object.id}>
                  {object.kind === 'image' ? (
                    <>
                      {object.cropX !== undefined || object.cropY !== undefined ? (
                        <defs>
                          <clipPath id={`image-crop-${object.id}`}>
                            <rect x={object.x} y={object.y} width={object.width} height={object.height} rx={10} />
                          </clipPath>
                        </defs>
                      ) : null}
                      <image
                        href={object.url}
                        x={object.x + (object.cropX ?? 0)}
                        y={object.y + (object.cropY ?? 0)}
                        width={object.width * (object.cropX !== undefined || object.cropY !== undefined ? 1.35 : 1)}
                        height={object.height * (object.cropX !== undefined || object.cropY !== undefined ? 1.35 : 1)}
                        preserveAspectRatio="xMidYMid meet"
                        clipPath={
                          object.cropX !== undefined || object.cropY !== undefined
                            ? `url(#image-crop-${object.id})`
                            : undefined
                        }
                      />
                    </>
                  ) : object.kind === 'buildNumberTile' ? (
                    <BuildNumberTileSvg
                      tile={object}
                      viewportScale={viewport.scale}
                      splitHoverAfter={buildTileGapHover?.tileId === object.id ? buildTileGapHover.splitAfter : null}
                      playbackHighlightCell={
                        buildTilePlaybackHighlight?.tileId === object.id ? buildTilePlaybackHighlight.cellIndex : null
                      }
                    />
                  ) : object.kind === 'mathGlyph' ? (
                    <MathGlyphSvg
                      object={object}
                      editing={object.id === mathInlineEditId}
                      caretVisible={mathCaretBlink}
                      ink="#1e1b4b"
                    />
                  ) : object.kind === 'numberLine' ? (
                    <NumberLineSvg
                      line={object}
                      selected={showSelectionOutline && !boardObjectIsLocked(object)}
                      onResizeStart={beginNumberLineResize}
                    />
                  ) : object.kind === 'beadCounter' ? (
                    <BeadCounterSvg counter={object} onBeadPointerDown={beginBeadDrag} />
                  ) : object.kind === 'diceTray' ? (
                    <DiceTraySvg
                      tray={object}
                      selected={Boolean(showSelectionOutline && !boardObjectIsLocked(object))}
                      rollAnimKey={diceTrayRollFlash[object.id] ?? 0}
                    />
                  ) : object.kind === 'marbleBag' ? (
                    <MarbleBagSvg
                      bag={object}
                      selected={Boolean(showSelectionOutline && !boardObjectIsLocked(object))}
                    />
                  ) : object.kind === 'arithmeticExample' ? (
                    <ArithmeticExampleSvg
                      object={object}
                      answer={arithmeticAnswerFromGlyphs(object, objects)}
                      status={arithmeticExampleStatus(object, arithmeticAnswerFromGlyphs(object, objects))}
                      selected={activeExample?.id === object.id}
                    />
                  ) : object.kind === 'dominoExample' ? (
                    <DominoExampleSvg
                      object={object}
                      answer={dominoAnswerFromGlyphs(object, objects)}
                      status={dominoExampleStatus(object, dominoAnswerFromGlyphs(object, objects))}
                      selected={activeExampleId === object.id}
                    />
                  ) : object.kind === 'marbleBagExample' ? (
                    <MarbleBagExampleSvg
                      object={object}
                      selected={activeExampleId === object.id}
                      allObjects={objects}
                      dropTarget={marbleBagDropTargetId === object.id}
                      focusedMarbleItemId={
                        marbleBagFocusedMarble?.exampleId === object.id ? marbleBagFocusedMarble.itemId : null
                      }
                    />
                  ) : object.kind === 'sequenceExample' ? (
                    <SequenceExampleSvg object={object} selected={activeSequenceExample?.id === object.id} />
                  ) : object.kind === 'dominoTile' ? (
                    <InteractiveDominoTileSvg tile={object} />
                  ) : object.kind === 'spatialTilingBoard' ? (
                    <SpatialTilingBoardSvg
                      board={object}
                      selected={Boolean(showSelectionOutline && !boardObjectIsLocked(object))}
                      onGridResizeStart={beginSpatialTilingGridResize}
                    />
                  ) : object.kind === 'stickyNote' ? (
                    <BoardStickyNoteSvg
                      object={object}
                      selected={selectedSet.has(object.id)}
                      editing={object.id === stickyEditingId}
                      boardTool={tool}
                      onContentLive={(v) => updateStickyContentLive(object.id, v)}
                      onContentCommit={commitStickyTextEdit}
                      onRequestEdit={() => openStickyNoteEditor(object.id)}
                      onBodyPointerDown={beginStickyNoteFromHtml}
                    />
                  ) : object.kind === 'boardShape' ? (
                    <BoardShapeMark
                      shape={object.shape}
                      x={object.x}
                      y={object.y}
                      w={object.w}
                      h={object.h}
                      color={object.color}
                      strokeWidth={object.strokeWidth}
                    />
                  ) : (
                    <path
                      d={pointsToPath(object.points)}
                      fill="none"
                      stroke={object.color}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={object.width}
                      style={
                        object.strokeKind === 'highlighter' ? { mixBlendMode: 'multiply', opacity: 0.5 } : undefined
                      }
                    />
                  )}
                  {outlineBounds ? (
                    <rect
                      className="selection-outline"
                      x={outlineBounds.x - 8}
                      y={outlineBounds.y - 8}
                      width={outlineBounds.width + 16}
                      height={outlineBounds.height + 16}
                      rx={10}
                    />
                  ) : null}
                </g>
              );
            })}

            {buildTileSnapGuides.length > 0 ? (
              <g className="build-tile-snap-guides" pointerEvents="none" aria-hidden>
                {buildTileSnapGuides.flatMap((guide, index) =>
                  guide.kind === 'v'
                    ? [
                        <line
                          key={`sv-h-${index}`}
                          className="build-tile-snap-guide build-tile-snap-guide-halo"
                          x1={guide.x}
                          y1={guide.y0}
                          x2={guide.x}
                          y2={guide.y1}
                        />,
                        <line
                          key={`sv-${index}`}
                          className="build-tile-snap-guide"
                          x1={guide.x}
                          y1={guide.y0}
                          x2={guide.x}
                          y2={guide.y1}
                        />,
                      ]
                    : [
                        <line
                          key={`sh-h-${index}`}
                          className="build-tile-snap-guide build-tile-snap-guide-halo"
                          x1={guide.x0}
                          y1={guide.y}
                          x2={guide.x1}
                          y2={guide.y}
                        />,
                        <line
                          key={`sh-${index}`}
                          className="build-tile-snap-guide"
                          x1={guide.x0}
                          y1={guide.y}
                          x2={guide.x1}
                          y2={guide.y}
                        />,
                      ],
                )}
              </g>
            ) : null}

            {externalTileDragOverlay && externalTileDragOverlay.guides.length > 0 ? (
              <g className="build-tile-snap-guides" pointerEvents="none" aria-hidden>
                {externalTileDragOverlay.guides.flatMap((guide, index) =>
                  guide.kind === 'v'
                    ? [
                        <line
                          key={`ex-sv-h-${index}`}
                          className="build-tile-snap-guide build-tile-snap-guide-halo"
                          x1={guide.x}
                          y1={guide.y0}
                          x2={guide.x}
                          y2={guide.y1}
                        />,
                        <line
                          key={`ex-sv-${index}`}
                          className="build-tile-snap-guide"
                          x1={guide.x}
                          y1={guide.y0}
                          x2={guide.x}
                          y2={guide.y1}
                        />,
                      ]
                    : [
                        <line
                          key={`ex-sh-h-${index}`}
                          className="build-tile-snap-guide build-tile-snap-guide-halo"
                          x1={guide.x0}
                          y1={guide.y}
                          x2={guide.x1}
                          y2={guide.y}
                        />,
                        <line
                          key={`ex-sh-${index}`}
                          className="build-tile-snap-guide"
                          x1={guide.x0}
                          y1={guide.y}
                          x2={guide.x1}
                          y2={guide.y}
                        />,
                      ],
                )}
              </g>
            ) : null}

            {externalTileDragOverlay ? (
              <g className="pinned-placement-ghost" pointerEvents="none" opacity={0.68}>
                <BuildNumberTileSvg tile={externalTileDragOverlay.tile} viewportScale={viewport.scale} />
              </g>
            ) : null}

            {externalMathGlyphDragOverlay ? (
              <g className="pinned-placement-ghost" pointerEvents="none" opacity={0.68}>
                <MathGlyphSvg
                  object={(() => {
                    const r = MATH_GLYPH_R;
                    const { width, height } = mathGlyphPillDimensions(externalMathGlyphDragOverlay.label, r);
                    return {
                      kind: 'mathGlyph',
                      id: 'external-drag-math-glyph',
                      x: externalMathGlyphDragOverlay.centerWorld.x - width / 2,
                      y: externalMathGlyphDragOverlay.centerWorld.y - height / 2,
                      r,
                      label: externalMathGlyphDragOverlay.label,
                      ...stripStyleToGlyphFields(mathGlyphStripStyle),
                    };
                  })()}
                  ink="#1e1b4b"
                />
              </g>
            ) : null}

            {spatialTilingDropPreview
              ? (() => {
                  const b = objects.find(
                    (o) =>
                      o.kind === 'spatialTilingBoard' && o.id === spatialTilingDropPreview.boardId,
                  );
                  if (!b || b.kind !== 'spatialTilingBoard') return null;
                  const g = spatialTilingGeometry(b);
                  const ox = g.originX + spatialTilingDropPreview.gx * g.cellSize;
                  const oy = g.originY + spatialTilingDropPreview.gy * g.cellSize;
                  const th = SPATIAL_TILING_DROP_PREVIEW;
                  return (
                    <SpatialTilingPatternOverlaySvg
                      originX={ox}
                      originY={oy}
                      cellSize={g.cellSize}
                      pattern={spatialTilingDropPreview.pattern}
                      fill={spatialTilingDropPreview.valid ? th.valid : th.invalid}
                      stroke={spatialTilingDropPreview.valid ? th.validStroke : th.invalidStroke}
                    />
                  );
                })()
              : null}

            {pendingPinnedPlacement && pinnedPreviewWorld && tool === 'stamp' ? (
              <g className="pinned-placement-ghost" pointerEvents="none" opacity={0.62}>
                {pendingPinnedPlacement.kind === 'tile' ? (
                  <BuildNumberTileSvg
                    tile={ghostTileAtCenter(
                      pendingPinnedPlacement.value,
                      pendingPinnedPlacement.variant,
                      pinnedPreviewWorld,
                    )}
                    viewportScale={viewport.scale}
                  />
                ) : pendingPinnedPlacement.kind === 'sticker' ? (
                  <image
                    href={pendingPinnedPlacement.sticker.url}
                    x={pinnedPreviewWorld.x - 120 / viewport.scale / 2}
                    y={pinnedPreviewWorld.y - 120 / viewport.scale / 2}
                    width={120 / viewport.scale}
                    height={120 / viewport.scale}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <MathGlyphSvg
                    object={(() => {
                      const r = MATH_GLYPH_R;
                      const { width, height } = mathGlyphPillDimensions(pendingPinnedPlacement.label, r);
                      return {
                        kind: 'mathGlyph',
                        id: 'ghost-math',
                        x: pinnedPreviewWorld.x - width / 2,
                        y: pinnedPreviewWorld.y - height / 2,
                        r,
                        label: pendingPinnedPlacement.label,
                        ...stripStyleToGlyphFields(mathGlyphStripStyle),
                      };
                    })()}
                    ink="#1e1b4b"
                  />
                )}
              </g>
            ) : null}

            {tempStroke ? (
              <path
                d={pointsToPath(tempStroke.points)}
                fill="none"
                stroke={tempStroke.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={tempStroke.width}
                style={
                  tempStroke.strokeKind === 'highlighter' ? { mixBlendMode: 'multiply', opacity: 0.5 } : undefined
                }
              />
            ) : null}

            {tempBoardShape ? (
              <BoardShapeMark
                shape={tempBoardShape.shape}
                x={tempBoardShape.x}
                y={tempBoardShape.y}
                w={tempBoardShape.w}
                h={tempBoardShape.h}
                color={tempBoardShape.color}
                strokeWidth={tempBoardShape.strokeWidth}
                preview
              />
            ) : null}

            {lassoRect ? (
              <rect
                className="lasso-path"
                x={lassoRect.x}
                y={lassoRect.y}
                width={lassoRect.width}
                height={lassoRect.height}
              />
            ) : null}

            {liveCollabToken && Object.keys(livePeerCursors).length > 0 ? (
              <g className="board-live-cursors" aria-hidden pointerEvents="none">
                {Object.entries(livePeerCursors).map(([id, c]) => {
                  const pillW = liveCollabNamePillWidth(c.name);
                  const pillX = 14;
                  /** Spodek štítku srovná se s „ramenem“ šipky (y ≈ 11–12). */
                  const pillY = -12;
                  const pillH = 23;
                  const pillR = Math.min(12, pillH / 2);
                  return (
                    <g key={id} transform={`translate(${c.wx}, ${c.wy})`}>
                      <rect
                        x={pillX}
                        y={pillY}
                        width={pillW}
                        height={pillH}
                        rx={pillR}
                        fill="#ffffff"
                        stroke={c.color}
                        strokeWidth={1.75}
                        className="board-live-cursor-pill"
                      />
                      <path
                        d={LIVE_COLLAB_CURSOR_POINTER_D}
                        fill={c.color}
                        stroke="#0a0a0a"
                        strokeWidth={1}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="board-live-cursor-pointer"
                      />
                      <text
                        x={pillX + pillW / 2}
                        y={pillY + pillH / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#111827"
                        fontSize={12.5}
                        fontWeight={600}
                        className="board-live-cursor-name"
                      >
                        {c.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            ) : null}
          </svg>
        </div>
        {!studentLockedUntilName ? (
          <BoardScrollbars
            viewport={viewport}
            svgViewportSize={svgViewportSize}
            contentBounds={boardContentBounds}
            onViewportChange={(updater) => {
              cancelViewportAnimation();
              setViewport(updater);
            }}
          />
        ) : null}
      </div>

      {!studentTaskMode && soleStickyNote && !soleStickyNote.locked && stickyToolbarClientRect ? (
        <div
          className="board-sticky-toolbar board-sticky-toolbar--above-note"
          role="toolbar"
          aria-label="Úpravy lístečku"
          style={{
            position: 'fixed',
            left: Math.max(
              8,
              Math.min(
                stickyToolbarClientRect.left,
                (typeof window !== 'undefined' ? window.innerWidth : 1200) - 328,
              ),
            ),
            top: Math.max(10, stickyToolbarClientRect.top - 10),
            zIndex: 350,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="board-sticky-toolbar-row board-sticky-toolbar-colors">
            {STICKY_NOTE_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`board-sticky-color-swatch${soleStickyNote.color === c.value ? ' is-active' : ''}`}
                title={c.name}
                aria-label={c.name}
                style={{ backgroundColor: c.value }}
                onClick={() => patchStickyNoteObject(soleStickyNote.id, { color: c.value })}
              />
            ))}
          </div>
          <div className="board-sticky-toolbar-row">
            {[16, 22, 30].map((size) => (
              <button
                key={size}
                type="button"
                className={`board-sticky-tool-btn${soleStickyNote.fontSize === size ? ' is-active' : ''}`}
                onClick={() => patchStickyNoteObject(soleStickyNote.id, { fontSize: size })}
              >
                {size === 16 ? 'S' : size === 22 ? 'M' : 'L'}
              </button>
            ))}
            <button
              type="button"
              className={`board-sticky-tool-btn${soleStickyNote.fontWeight === 'bold' ? ' is-active' : ''}`}
              aria-label="Tučné"
              onClick={() =>
                patchStickyNoteObject(soleStickyNote.id, {
                  fontWeight: soleStickyNote.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
            >
              <Bold size={16} strokeWidth={2.2} aria-hidden />
            </button>
            <span className="board-sticky-toolbar-sep" aria-hidden />
            <button
              type="button"
              title="Hranatý"
              className={`board-sticky-tool-btn${soleStickyNote.shape === 'square' ? ' is-active' : ''}`}
              onClick={() => patchStickyNoteObject(soleStickyNote.id, { shape: 'square' })}
            >
              <Square size={16} strokeWidth={2.2} aria-hidden />
            </button>
            <button
              type="button"
              title="Zaoblený"
              className={`board-sticky-tool-btn${soleStickyNote.shape === 'rounded' ? ' is-active' : ''}`}
              onClick={() => patchStickyNoteObject(soleStickyNote.id, { shape: 'rounded' })}
            >
              <Square size={16} strokeWidth={2.2} className="board-sticky-shape-icon--rounded" aria-hidden />
            </button>
            <button
              type="button"
              title="Kruh"
              className={`board-sticky-tool-btn${soleStickyNote.shape === 'circle' ? ' is-active' : ''}`}
              onClick={() => patchStickyNoteObject(soleStickyNote.id, { shape: 'circle' })}
            >
              <Circle size={16} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
          <input
            key={soleStickyNote.id}
            type="url"
            className="board-sticky-link-input"
            placeholder="Odkaz (volitelně)"
            defaultValue={soleStickyNote.linkUrl ?? ''}
            onBlur={(e) =>
              patchStickyNoteObject(soleStickyNote.id, {
                linkUrl: e.target.value.trim() || undefined,
              })
            }
          />
        </div>
      ) : null}

      {!studentTaskMode && boardContextMenu ? (
        <div
          ref={boardContextMenuRef}
          className="board-context-menu"
          role="menu"
          aria-label="Kontextová nabídka plátna"
          style={{
            position: 'fixed',
            left: Math.min(
              boardContextMenu.clientX,
              typeof window !== 'undefined' ? window.innerWidth - 220 : boardContextMenu.clientX,
            ),
            top: Math.min(
              boardContextMenu.clientY,
              typeof window !== 'undefined' ? window.innerHeight - 360 : boardContextMenu.clientY,
            ),
            zIndex: 400,
          }}
        >
          {showBoardContextMenuTileSection ? (
            <>
              <div className="board-context-menu-section-label" id="board-context-menu-tiles-heading">
                Dlaždice:
              </div>
              <button
                type="button"
                role="menuitem"
                className="board-context-menu-item"
                disabled={!contextMenuCanPlayTiles}
                title="Postupně zvýraznit tečky a pípnout"
                onClick={handleBoardContextPlayTiles}
              >
                <Play className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                <span>Přehrát</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="board-context-menu-item"
                disabled={!contextMenuCanMergeTiles}
                title={
                  boardContextMenu
                    ? contextMenuCanMergeTiles
                      ? 'Sloučit vybrané dlaždice do jedné (nejvýše do hodnoty 10)'
                      : 'Sloučit lze jen dvě a více dlaždic se součtem hodnot nejvýše 10'
                    : undefined
                }
                onClick={handleBoardContextMergeTiles}
              >
                <Combine className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                <span>Sloučit</span>
              </button>
              <div className="board-context-menu-sep" role="separator" />
            </>
          ) : null}

          <button
            type="button"
            role="menuitem"
            className="board-context-menu-item"
            disabled={objects.length === 0}
            title={objects.length === 0 ? 'Na plátně nic není' : undefined}
            onClick={handleBoardContextSelectAll}
          >
            <BoxSelect className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
            <span>Vybrat vše</span>
            <span className="board-context-menu-item__kbd">{boardContextSelectAllKbd}</span>
          </button>
          <div className="board-context-menu-sep" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="board-context-menu-item"
            disabled={boardContextMenu.targetIds.length === 0}
            onClick={() => void handleBoardContextCopy()}
          >
            <Copy className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
            <span>Kopírovat</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="board-context-menu-item"
            onClick={() => void handleBoardContextPaste()}
          >
            <ClipboardPaste className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
            <span>Vložit</span>
          </button>
          {contextMenuCanSplitMathGlyph ? (
            <button
              type="button"
              role="menuitem"
              className="board-context-menu-item"
              title="Rozdělit slepený text na jednotlivé bobánky"
              onClick={handleBoardContextSplitMathGlyph}
            >
              <Scissors className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
              <span>Rozdělit</span>
            </button>
          ) : null}
          {boardContextMenu.targetIds.length > 0 ? (
            <>
              <div className="board-context-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="board-context-menu-item"
                disabled={!contextMenuCanBringForward}
                title="O úroveň výš (nad sousední objekt)"
                onClick={handleBoardContextBringForward}
              >
                <ArrowUp className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                <span>Posunout nad</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="board-context-menu-item"
                disabled={!contextMenuCanSendBackward}
                title="O úroveň níž (pod sousední objekt)"
                onClick={handleBoardContextSendBackward}
              >
                <ArrowDown className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                <span>Posunout pod</span>
              </button>
            </>
          ) : null}
          {boardContextMenu.targetIds.length > 0 ? (
            <>
              <div className="board-context-menu-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="board-context-menu-item"
                title={contextMenuAllTargetsLocked ? 'Povolit přesouvání a úpravy' : 'Zablokovat tažení a úpravy z plátna'}
                onClick={handleBoardContextToggleLock}
              >
                {contextMenuAllTargetsLocked ? (
                  <LockOpen className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                ) : (
                  <Lock className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
                )}
                <span>{contextMenuAllTargetsLocked ? 'Odemknout' : 'Zamknout'}</span>
              </button>
            </>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="board-context-menu-item board-context-menu-item--danger"
            disabled={boardContextMenu.targetIds.length === 0}
            onClick={handleBoardContextDelete}
          >
            <Trash2 className="board-context-menu-item-icon" size={17} strokeWidth={2.2} aria-hidden />
            <span>Smazat</span>
          </button>
        </div>
      ) : null}

      {(!studentTaskMode || (soleSelectedObject ? isStudentEditableMathGlyph(soleSelectedObject) : false)) &&
      selectionHudPx &&
      selectionUnionOutline &&
      !selectedIds.every((id) =>
        objects.some(
          (object) =>
            object.id === id &&
            (object.kind === 'arithmeticExample' ||
              object.kind === 'sequenceExample' ||
              object.kind === 'dominoExample' ||
              object.kind === 'marbleBagExample'),
        ),
      ) ? (
        <div
          className="selection-machine-controls-hud"
          style={{
            position: 'fixed',
            left: selectionHudPx.left,
            top: selectionHudPx.top,
            width: selectionHudPx.width,
            height: selectionHudPx.height,
            pointerEvents: 'none',
          }}
        >
          <div className="selection-machine-controls">
            <button
              type="button"
              className="machine-outline-drag-handle"
              title="Přesunout výběr"
              aria-label="Přesunout výběr"
              disabled={selectionIncludesLocked}
              onPointerDown={beginDragSelectionFromHud}
            >
              <GripHorizontal size={17} strokeWidth={2.35} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="machine-outline-control machine-outline-control-zoom"
              title="Zazoomovat výběr na celou obrazovku"
              aria-label="Zazoomovat výběr na celou obrazovku"
              onPointerDown={(event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                zoomToFitSelection();
              }}
            >
              <Maximize size={13} strokeWidth={2.45} aria-hidden className="selection-zoom-fullscreen-icon" />
            </button>
            <button
              type="button"
              className="machine-outline-control machine-outline-control-delete"
              title="Smazat výběr"
              aria-label="Smazat výběr"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                deleteSelection();
              }}
            >
              <Trash2 size={17} strokeWidth={2.35} aria-hidden="true" />
            </button>
            {!studentTaskMode &&
            soleSelectedObject &&
            supportsBoardBoundsResize(soleSelectedObject) &&
            !boardObjectIsLocked(soleSelectedObject) ? (
              <button
                type="button"
                className="machine-outline-control machine-outline-control-bounds"
                title="Změnit velikost"
                aria-label="Změnit velikost objektu (pravý dolní roh)"
                onPointerDown={(event) => {
                  beginBoardBoundsResize(event);
                }}
              >
                <span className="selection-bounds-scale-icon-wrap" aria-hidden>
                  <BoardResizeSeHandleMarkup />
                </span>
              </button>
            ) : null}

            {soleSelectedObject?.kind === 'buildNumberTile' && !boardObjectIsLocked(soleSelectedObject) ? (
              <>
                <button
                  type="button"
                  className="machine-outline-control machine-outline-tile-minus"
                  title="Méně částí (dlaždice)"
                  aria-label="O jednu část dlaždice méně"
                  disabled={soleSelectedObject.value <= 1}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    stepSelectedBuildTileValue(-1);
                  }}
                >
                  <Minus size={17} strokeWidth={2.35} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="machine-outline-control machine-outline-tile-plus"
                  title="Víc částí (dlaždice)"
                  aria-label="O jednu část dlaždice více"
                  disabled={soleSelectedObject.value >= 10}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    stepSelectedBuildTileValue(1);
                  }}
                >
                  <Plus size={17} strokeWidth={2.35} aria-hidden="true" />
                </button>
              </>
            ) : soleSelectedObject?.kind === 'dominoTile' && !boardObjectIsLocked(soleSelectedObject) ? (
              <>
                <div className="selection-domino-edge-stack selection-domino-edge-stack--left">
                  <button
                    type="button"
                    className="machine-outline-control"
                    title="Méně teček vlevo"
                    aria-label="O jednu tečku méně na levé polovině"
                    disabled={soleSelectedObject.leftPips <= 0}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDominoTileAdjustPips(soleSelectedObject.id, 'left', -1);
                    }}
                  >
                    <Minus size={17} strokeWidth={2.35} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="machine-outline-control"
                    title="Víc teček vlevo"
                    aria-label="O jednu tečku více na levé polovině"
                    disabled={soleSelectedObject.leftPips >= 9}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDominoTileAdjustPips(soleSelectedObject.id, 'left', 1);
                    }}
                  >
                    <Plus size={17} strokeWidth={2.35} aria-hidden="true" />
                  </button>
                </div>
                <div className="selection-domino-edge-stack selection-domino-edge-stack--right">
                  <button
                    type="button"
                    className="machine-outline-control"
                    title="Méně teček vpravo"
                    aria-label="O jednu tečku méně na pravé polovině"
                    disabled={soleSelectedObject.rightPips <= 0}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDominoTileAdjustPips(soleSelectedObject.id, 'right', -1);
                    }}
                  >
                    <Minus size={17} strokeWidth={2.35} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="machine-outline-control"
                    title="Víc teček vpravo"
                    aria-label="O jednu tečku více na pravé polovině"
                    disabled={soleSelectedObject.rightPips >= 9}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDominoTileAdjustPips(soleSelectedObject.id, 'right', 1);
                    }}
                  >
                    <Plus size={17} strokeWidth={2.35} aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <input
        ref={mathInlineInputRef}
        className="math-inline-key-capture"
        type="text"
        autoComplete="off"
        aria-label="Zadání znaku do kolečka či textu při zápisu"
        tabIndex={-1}
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 4,
          height: 4,
          opacity: 0,
        }}
        onKeyDown={handleMathInlineKeyDown}
      />
      {supabase && user ? (
        <BoardCloudModal
          open={cloudModalOpen}
          supabase={supabase}
          onClose={() => setCloudModalOpen(false)}
          onOpenDocument={handleOpenCloudDocument}
        />
      ) : null}
      {!studentTaskMode ? <BoardBackgroundModal
        open={backgroundModalOpen}
        value={boardBackground}
        onChange={handleBoardBackgroundChange}
        onClose={() => setBackgroundModalOpen(false)}
      /> : null}
      {!studentTaskMode ? <BoardShareModal
        open={shareModalOpen}
        shareUrl={lastShareUrl}
        taskShareUrl={lastTaskShareUrl}
        liveShareUrl={lastLiveShareUrl}
        hasGradableTask={hasGradableTaskObjects}
        cloudEnabled={Boolean(supabase)}
        signedIn={Boolean(user)}
        busy={shareBusy}
        error={shareError}
        onCreateContentShare={handleCreateContentShare}
        onCreateTaskShare={handleCreateTaskShare}
        onStartLiveSession={handleStartLiveSession}
        onClose={() => setShareModalOpen(false)}
      /> : null}
      {!studentTaskMode && taskResultsOpen ? (
        <div className="board-cloud-modal-root" role="presentation">
          <button
            type="button"
            className="board-cloud-modal__backdrop"
            aria-label="Zavřít výsledky"
            onClick={() => setTaskResultsOpen(false)}
          />
          <div className="board-cloud-modal board-task-results-modal" role="dialog" aria-modal="true" aria-labelledby="board-task-results-title">
            <div className="board-cloud-modal__head">
              <h2 id="board-task-results-title" className="board-cloud-modal__title">
                Výsledky žáků
              </h2>
              <button type="button" className="board-cloud-modal__close" onClick={() => setTaskResultsOpen(false)} aria-label="Zavřít">
                ×
              </button>
            </div>
            <div className="board-task-results-modal__body">
              {taskResultsBusy ? <p className="board-cloud-modal__hint">Načítám výsledky…</p> : null}
              {taskResultsError ? <p className="board-cloud-modal__error">{taskResultsError}</p> : null}
              {!taskResultsBusy && taskResults.length === 0 ? (
                <p className="board-cloud-modal__hint">Zatím tu nejsou žádná zadání ani odevzdání pro tento soubor.</p>
              ) : null}
              {taskResults.map(({ share, submissions }) => (
                <section className="board-task-results-card" key={share.id}>
                  <div className="board-task-results-card__head">
                    <div>
                      <h3>{share.title}</h3>
                      <p>
                        {share.task_kind === 'sequence'
                          ? 'Řady'
                          : share.task_kind === 'domino'
                            ? 'Domino'
                            : share.task_kind === 'marbleBag'
                              ? 'Zjisti'
                            : share.task_kind === 'arithmetic'
                              ? 'Příklady'
                              : 'Smíšený úkol'}
                      </p>
                    </div>
                    <span>{submissions.length} odevzdání</span>
                  </div>
                  {submissions.length === 0 ? (
                    <p className="board-task-results-card__empty">Zatím nikdo neodevzdal.</p>
                  ) : (
                    <div className="board-task-results-table">
                      {submissions.map((submission) => (
                        <div className="board-task-results-row" key={submission.id}>
                          <span>{submission.student_name}</span>
                          <strong>
                            {submission.score.correct} / {submission.score.total} ({submission.score.percent} %)
                          </strong>
                          <time>{new Date(submission.created_at).toLocaleString('cs-CZ')}</time>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {studentLockedUntilName ? (
        <div className="student-task-name-gate" role="dialog" aria-modal="true" aria-labelledby="student-task-name-title">
          <form
            className="student-task-name-card"
            onSubmit={(event) => {
              event.preventDefault();
              confirmStudentTaskName();
            }}
          >
            <h2 id="student-task-name-title">Nejdřív napiš svoje jméno</h2>
            <p>Jméno se uloží k odevzdanému úkolu, aby učitel viděl tvoje řešení a skóre.</p>
            <input
              autoFocus
              value={studentNameDraft}
              onChange={(event) => setStudentNameDraft(event.currentTarget.value)}
              placeholder="Tvoje jméno"
              maxLength={80}
            />
            <button type="submit" disabled={!studentNameDraft.trim()}>
              Začít úkol
            </button>
          </form>
        </div>
      ) : null}
      {!studentTaskMode && teacherArithmeticEdit && teacherArithmeticEditClientRect ? (
        <div
          className="teacher-arithmetic-edit-popover"
          role="dialog"
          aria-label="Upravit zadání příkladu"
          tabIndex={-1}
          style={{
            left: Math.max(
              8,
              Math.min(
                teacherArithmeticEditClientRect.left,
                (typeof window !== 'undefined' ? window.innerWidth : 1200) - 216,
              ),
            ),
            top: teacherArithmeticEditClientRect.top + teacherArithmeticEditClientRect.height + 8,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setTeacherArithmeticEdit(null);
            }
          }}
        >
          <div className="teacher-arithmetic-edit-popover__row">
            <label>
              <span>A</span>
              <input
                type="number"
                value={Number.isFinite(teacherArithmeticEdit.a) ? teacherArithmeticEdit.a : 0}
                onChange={(e) =>
                  setTeacherArithmeticEdit((prev) =>
                    prev ? { ...prev, a: e.target.value === '' ? 0 : Number(e.target.value) } : prev,
                  )
                }
              />
            </label>
            <label>
              <span>Operace</span>
              <select
                value={teacherArithmeticEdit.operation}
                onChange={(e) =>
                  setTeacherArithmeticEdit((prev) =>
                    prev ? { ...prev, operation: e.target.value as ArithmeticOperation } : prev,
                  )
                }
              >
                <option value="add">Sčítání</option>
                <option value="subtract">Odčítání</option>
                <option value="multiply">Násobení</option>
              </select>
            </label>
            <label>
              <span>B</span>
              <input
                type="number"
                value={Number.isFinite(teacherArithmeticEdit.b) ? teacherArithmeticEdit.b : 0}
                onChange={(e) =>
                  setTeacherArithmeticEdit((prev) =>
                    prev ? { ...prev, b: e.target.value === '' ? 0 : Number(e.target.value) } : prev,
                  )
                }
              />
            </label>
          </div>
          <p className="teacher-arithmetic-edit-popover__hint">
            Očekávaná odpověď:{' '}
            <strong>
              {computeArithmeticExpectedAnswer(
                teacherArithmeticEdit.a,
                teacherArithmeticEdit.b,
                teacherArithmeticEdit.operation,
              )}
            </strong>
          </p>
          <div className="teacher-arithmetic-edit-popover__actions">
            <button type="button" className="teacher-arithmetic-edit-popover__btn ghost" onClick={() => setTeacherArithmeticEdit(null)}>
              Zrušit
            </button>
            <button type="button" className="teacher-arithmetic-edit-popover__btn primary" onClick={() => applyTeacherArithmeticEdit()}>
              Uložit
            </button>
          </div>
        </div>
      ) : null}
      {studentShare || (studentTaskShare && !studentLockedUntilName) ? (
        <StudentShareSubmitBar
          studentName={studentName}
          submitted={studentSubmitted}
          busy={studentSubmitBusy}
          mode={studentTaskShare ? 'task' : 'content'}
          score={studentTaskScore}
          onNameChange={setStudentName}
          onSubmit={studentTaskShare ? handleSubmitStudentTask : handleSubmitStudentShare}
        />
      ) : null}
    </main>
  );
}