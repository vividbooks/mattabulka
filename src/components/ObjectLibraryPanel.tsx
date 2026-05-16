import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Keyboard,
  ListChecks,
  Shapes,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  formatLibraryCurriculumLine,
  getLibraryHomeFilterVisibility,
  LIBRARY_GRADE_LABELS,
  LIBRARY_VOLUME_OPTIONS,
  readLibraryCurriculumFromStorage,
  writeLibraryCurriculumToStorage,
  type LibraryGrade,
  type LibraryVolumePart,
} from '../lib/libraryCurriculumFilter';
import { setBuildTileDragPayload } from '../lib/buildTileDragPayload';
import {
  BRUSH_COLOR_PRESETS,
  HIGHLIGHTER_COLOR_PRESETS,
} from '../lib/drawingToolColors';
import { MARBLE_BAG_ITEM_DRAG } from '../lib/marbleBagDragMime';
import { setMathGlyphDragPayload } from '../lib/mathGlyphDragPayload';
import { KULICKA_ZELENA_SVG } from '../lib/countingGameMarbleAssets';
import { numberLineBoardGameFigureUrl } from '../lib/numberLineBoardGameFigures';
import { useStickerCatalog, type StickerCategory, type StickerItem } from '../lib/stickerLibrary';
import {
  ARITHMETIC_DIFFICULTY_PRESETS,
  createTaskSeed,
  defaultArithmeticTaskSettings,
  defaultDominoTaskSettings,
  defaultMarbleBagTaskSettings,
  defaultSequenceTaskSettings,
  type MarbleBagAnswerMode,
  type MarbleBagTotalDisplayMode,
  type MarbleBagTaskSettings,
  type ArithmeticDifficulty,
  type ArithmeticExampleVariety,
  type ArithmeticOperation,
  type ArithmeticTaskSettings,
  type DominoExerciseMode,
  type DominoTaskSettings,
  type SequenceDifficulty,
  type SequenceItem,
  type SequenceItemKind,
  type SequencePatternKind,
  type SequenceTaskSettings,
  type TaskAssignmentSettings,
} from '../lib/taskAssignments';
import { BuildNumberTile } from './BuildNumberTile';
import type { MathGlyphStripStyle } from '../lib/mathGlyphStripStyle';
import type { Tool } from './ToolPalette';
import { MathGlyphStripStyleControl } from './MathGlyphStripStyleControl';
import {
  DrawingToolBrushIllustration,
  DrawingToolEraserIllustration,
  DrawingToolHighlighterIllustration,
  DrawingToolShapesIllustration,
  DrawingToolStickyNoteIllustration,
  DrawingToolTextIllustration,
} from './DrawingToolIcons';

/** Režim postranního / plovoucího panelu knihovny (dokumentové menu je zvlášť u hamburgeru v paletě). */
export type ObjectLibraryPanelMode = 'closed' | 'catalog' | 'tasks' | 'drawing';
type SideColumnMode = 'tool-strip' | 'catalog' | 'tasks' | 'drawing' | 'teacher-task' | 'student-task';

type LibraryView = 'home' | 'tiles' | 'numberLines' | 'beadCounter' | 'diceTray' | 'tasks' | `sticker:${string}`;
type TileVariant = 'stacked' | 'flat';
type BeadCounterVariant = 'ten' | 'twenty';
type TasksDetailKind = 'sequence' | 'arithmetic' | 'domino' | 'marbleBag';

/** Umístění pásu knihovny a nástrojů */
export type LibraryDockPosition = 'bottom' | 'side';

export type PinnedStripBoardSelection =
  | { kind: 'sticker'; url: string }
  | { kind: 'tile'; value: number; variant: TileVariant }
  | { kind: 'mathGlyph'; label: string };

const MATH_GLYPH_DRAG = 'application/x-math-glyph';
const SEQUENCE_CHOICE_DRAG = 'application/x-sequence-choice';

/** Jedna dostupná kulička (dříve zelená) — barva pro přetahování i vykreslení. */
const MARBLE_BAG_MARBLE_COLOR = '#44b968';

/** Stejný asset jako minihra Zjišťujeme / Vividbooks (`kulicka_zelena.svg`). */
function MarbleBagMarbleKeyGlyph({ className }: { className?: string }) {
  return (
    <img
      src={KULICKA_ZELENA_SVG}
      alt=""
      width={44}
      height={44}
      draggable={false}
      className={className ? `marble-bag-marble-key-img ${className}` : 'marble-bag-marble-key-img'}
      aria-hidden
    />
  );
}

function armMathGlyphDragTransfer(event: React.DragEvent, label: string) {
  event.dataTransfer.setData(MATH_GLYPH_DRAG, JSON.stringify({ label }));
  event.dataTransfer.effectAllowed = 'copy';
  setMathGlyphDragPayload({ label });
}

function clearMathGlyphDragTransfer() {
  setMathGlyphDragPayload(null);
}
const MATH_STRIP_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const MATH_STRIP_OPS = ['+', '−', '×', '÷', '=', ','] as const;
const MATH_CALCULATOR_DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'] as const;

const LIBRARY_POPOVER_MARGIN_PX = 14;
const LIBRARY_POPOVER_GAP_PX = 10;

/** Širší než 620px: levý dok má druhý sloupec pro katalog (ne úzký mobilní režim). */
function useSideDockNotNarrow() {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const mq = window.matchMedia('(max-width: 620px)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' ? !window.matchMedia('(max-width: 620px)').matches : true),
    () => true,
  );
}

/** Max. výška obsahu jako u plovoucí knihovny nad spodní lištou. */
function libraryPopoverMaxHeightPx(launcherTop: number): number {
  const innerH = window.innerHeight;
  const spaceAbove = launcherTop - LIBRARY_POPOVER_MARGIN_PX - LIBRARY_POPOVER_GAP_PX;
  return Math.min(innerH * 0.74, Math.max(220, Math.min(spaceAbove, innerH * 0.8)));
}

interface ObjectLibraryPanelProps {
  open: boolean;
  panelMode: ObjectLibraryPanelMode;
  onClose: () => void;
  /** Levý spodní pruh: otevřít/zavřít knihovnu (popover z tlačítka) */
  onToggleLibraryOpen: () => void;
  onInsertSticker: (sticker: StickerItem) => void;
  onInsertBuildNumberTile: (value: number, variant: 'stacked' | 'flat') => void;
  /** When set, the pinned strip arms placement-on-click instead of inserting immediately. */
  onPinnedPickBuildNumberTile?: (value: number, variant: 'stacked' | 'flat') => void;
  onPinnedPickSticker?: (sticker: StickerItem) => void;
  onInsertNumberLine: (start: number, end: number, withFigure?: boolean) => void;
  onInsertBeadCounter: (variant: BeadCounterVariant) => void;
  onInsertDiceTray: () => void;
  onInsertDominoTile: () => void;
  onInsertSpatialTilingBoard: () => void;
  onCreateArithmeticAssignment: (settings: ArithmeticTaskSettings) => void | Promise<void>;
  onCreateSequenceAssignment: (settings: SequenceTaskSettings) => void | Promise<void>;
  onCreateDominoAssignment: (settings: DominoTaskSettings) => void | Promise<void>;
  onCreateMarbleBagAssignment: (settings: MarbleBagTaskSettings) => void | Promise<void>;
  activeSequenceChoices?: SequenceItem[] | null;
  onPickSequenceChoice?: (choiceKey: string) => void;
  pinnedStripBoardSelection?: PinnedStripBoardSelection | null;
  /** Čísla a znaménka – spodní pás z knihovny */
  onArmMathGlyph?: (label: string) => void;
  pinnedMathGlyphs: boolean;
  onPinnedMathGlyphsChange: (pinned: boolean) => void;
  mathGlyphStripStyle: MathGlyphStripStyle;
  onMathGlyphStripStyleChange: (next: MathGlyphStripStyle) => void;
  /** Aktuální nástroj (pro přepínač psaní vs. výběr). */
  boardTool?: Tool;
  /** Přepnutí nástroje Psát na plátno ↔ Výběr (hodí se se zapnutým pásem matematických glyfů). */
  onToggleMathWrite?: () => void;
  /** Hlavní paleta nástrojů, v režimu spodní knihovny navazuje na knihovní lištu. */
  embeddedToolPalette?: ReactNode;
  libraryAnchorRef?: RefObject<HTMLButtonElement | null>;
  embeddedMachineToolbar?: ReactNode;
  embeddedSpatialTilingToolbar?: ReactNode;
  /** Spodní nebo pravý panel s knihovnou */
  libraryDock: LibraryDockPosition;
  onLibraryDockChange: (position: LibraryDockPosition) => void;
  /** Široký layout levého doku (rail + obsah) vs. jen ikonový rail — pro roztažení pracovní plochy na širokém okně. */
  onSideDockRailOnlyLayout?: (railOnly: boolean) => void;
  taskModeActive?: boolean;
  studentTaskMode?: boolean;
  /** Stav úlohy na plátně (učitel) — synchronizace formuláře Úkoly v knihovně. */
  activeAssignmentId?: string | null;
  activeTaskSettings?: TaskAssignmentSettings | null;
  /** Učitel: náhled „jako žák“ vs. formulář nastavení. */
  teacherTaskPanelLayout?: 'configure' | 'student-preview';
  onTeacherTaskPanelLayoutChange?: (layout: 'configure' | 'student-preview') => void;
  /** Spolu s activeTaskSettings znovu otevře podsekci nastavení (vložení / klik na úkol). */
  taskPanelSyncTick?: number;
  /** Výběr nástroje z režimu Kreslení (druhý sloupec). */
  onSelectDrawingTool?: (
    tool: Extract<Tool, 'brush' | 'highlighter' | 'eraser' | 'textWrite' | 'stickyNote' | 'drawShapes'>,
  ) => void;
  /** Aktivní tvar u nástroje Tvary (kruh / čtverec / šipka). */
  drawShapeKind?: 'circle' | 'square' | 'arrow';
  onDrawShapeKindChange?: (kind: 'circle' | 'square' | 'arrow') => void;
  /** Barvy tužky a zvýrazňovače (jako u tvarů — pop-up u nástroje). */
  brushColor?: string;
  onBrushColorChange?: (color: string) => void;
  highlighterColor?: string;
  onHighlighterColorChange?: (color: string) => void;
}

function LibraryDrawingColorPopover({
  presets,
  current,
  onPick,
  ariaLabel,
  style,
  inline,
}: {
  presets: readonly string[];
  current: string;
  onPick: (color: string) => void;
  ariaLabel: string;
  style?: CSSProperties;
  inline?: boolean;
}) {
  return (
    <div
      className={`library-draw-color-popover${inline ? ' library-draw-color-popover--inline' : ''}`}
      style={style}
      role="group"
      aria-label={ariaLabel}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {presets.map((c) => (
        <button
          key={c}
          type="button"
          className={`library-draw-color-swatch${current === c ? ' is-active' : ''}`}
          style={{ backgroundColor: c }}
          aria-pressed={current === c}
          aria-label={c}
          title={c}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

const RAIL_FLOATING_POP_MARGIN = 10;
const RAIL_COLOR_SWATCH = 28;
const RAIL_COLOR_GAP = 6;
const RAIL_SHAPE_BTN = 36;
const RAIL_SHAPE_GAP = 5;
const RAIL_SHAPE_PAD = 14;

function estimateRailColorPopoverHeight(presetCount: number) {
  if (presetCount <= 0) return 40;
  return presetCount * (RAIL_COLOR_SWATCH + RAIL_COLOR_GAP) - RAIL_COLOR_GAP + 16;
}

function estimateRailShapesPopoverHeight() {
  return 3 * RAIL_SHAPE_BTN + 2 * RAIL_SHAPE_GAP + RAIL_SHAPE_PAD;
}

/** Pozice fixed popoveru u railu: střed na výšku kotvy, ale vždy v viewportu; při nedostatku místa uprostřed + scroll v CSS. */
function clampRailFloatingPopoverPosition(
  anchor: DOMRect,
  popoverHalfHeight: number,
  popoverWidth: number,
): { top: number; left: number } {
  const m = RAIL_FLOATING_POP_MARGIN;
  const centerY = anchor.top + anchor.height / 2;
  const minCy = m + popoverHalfHeight;
  const maxCy = window.innerHeight - m - popoverHalfHeight;
  let top: number;
  if (minCy > maxCy) {
    top = window.innerHeight / 2;
  } else {
    top = Math.min(maxCy, Math.max(minCy, centerY));
  }
  let left = anchor.right + 10;
  if (left + popoverWidth > window.innerWidth - m) {
    left = anchor.left - popoverWidth - 10;
  }
  left = Math.min(window.innerWidth - m - popoverWidth, Math.max(m, left));
  return { top, left };
}

let tileDragPreviewElement: HTMLCanvasElement | null = null;
const TILE_VALUES = Array.from({ length: 10 }, (_, index) => index + 1);
/** Stejné dílky jako `<BuildNumberTile variant="stacked" />` na liště — zmenšené do vějíře */
const VARIANT_PICK_STACKED_FAN_SCALE = 0.29;
const NUMBER_LINE_PRESETS = [
  { label: '0–5', start: 0, end: 5 },
  { label: '1–5', start: 1, end: 5 },
  { label: '0–10', start: 0, end: 10 },
  { label: '1–10', start: 1, end: 10 },
  { label: '10–20', start: 10, end: 20 },
  { label: '0–20', start: 0, end: 20 },
  { label: '0–100', start: 0, end: 100 },
];
const FIGURE_NUMBER_LINE_PRESET = { label: '0–10 s figurkou', start: 0, end: 10, withFigure: true };

/** Barvy náhledů dlaždic v knihovně. */
const TILE_COLORS: Record<number, { light: string; dark: string; lightCircle: string; darkCircle: string }> = {
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

function getRowLabel(categoryId: string, row: number) {
  const categoryRowLabels: Record<string, string[]> = {
    emoji: ['Reakce', 'Tvary a emoce'],
    dice: ['Kostky'],
    'geometric-symbols': ['Kolečka', 'Kříže', 'Čtverce', 'Trojúhelníky'],
    'color-symbols': ['Knoflíky', 'Půlměsíce', 'Jablka', 'Bonbony'],
    money: ['Mince'],
    'other-symbols': ['Plody', 'Předměty', 'Zvířata'],
    tables: ['Tabulky'],
  };

  return categoryRowLabels[categoryId]?.[row - 1] ?? `Řada ${row}`;
}

function arithmeticDifficultyLabel(difficulty: ArithmeticDifficulty) {
  switch (difficulty) {
    case 'easy':
      return 'Lehká';
    case 'medium':
      return 'Střední';
    case 'hard':
      return 'Těžší';
  }
}

function sequenceDifficultyLabel(difficulty: SequenceDifficulty) {
  switch (difficulty) {
    case 'easy':
      return 'Lehká (1 řádek)';
    case 'medium':
      return 'Střední (2 řádky)';
    case 'hard':
      return 'Těžká (3 řádky)';
  }
}

function sequenceKindLabel(kind: SequenceItemKind) {
  switch (kind) {
    case 'number':
      return 'Čísla';
    case 'tile':
      return 'Kostky';
    case 'shape':
      return 'Objekty';
  }
}

function dominoModeLabel(mode: DominoExerciseMode) {
  switch (mode) {
    case 'missingAddition':
      return 'Doplň součet';
    case 'dominoSum':
      return 'Součet dvou polovin';
    case 'partition':
      return 'Rozklad čísla';
    default:
      return mode;
  }
}

function toggleSequenceKind(kinds: SequenceItemKind[], kind: SequenceItemKind): SequenceItemKind[] {
  if (kinds.includes(kind)) {
    const next = kinds.filter((item) => item !== kind);
    return next.length ? next : kinds;
  }
  return [...kinds, kind];
}

function SequenceChoicePreview({ choice }: { choice: SequenceItem }) {
  if (choice.kind === 'number') return <span className="sequence-choice-number">{choice.label}</span>;
  if (choice.kind === 'tile') return <span className="sequence-choice-tile" aria-label={choice.label} />;
  if (choice.key.includes('square')) return <span className="sequence-choice-square" aria-label={choice.label} />;
  if (choice.key.includes('plus')) return <span className="sequence-choice-plus">+</span>;
  return <span className="sequence-choice-circle" aria-label={choice.label} />;
}

function sequencePatternLabel(pattern: SequencePatternKind) {
  switch (pattern) {
    case 'AB':
      return 'AB, AB, AB';
    case 'ABC':
      return 'ABC, ABC';
    case 'ABCD':
      return 'ABCD, ABCD';
  }
}

function arithmeticOperationLabel(operation: ArithmeticOperation) {
  switch (operation) {
    case 'add':
      return 'Sčítání';
    case 'subtract':
      return 'Odčítání';
    case 'multiply':
      return 'Násobení';
  }
}

function toggleArithmeticOperation(
  operations: ArithmeticOperation[],
  operation: ArithmeticOperation,
): ArithmeticOperation[] {
  if (operations.includes(operation)) {
    const next = operations.filter((item) => item !== operation);
    return next.length ? next : operations;
  }
  return [...operations, operation];
}

function clearTileDragPreview() {
  tileDragPreviewElement?.remove();
  tileDragPreviewElement = null;
}

function setTileDragPreview(event: React.DragEvent<HTMLButtonElement>, value: number, variant: 'stacked' | 'flat') {
  clearTileDragPreview();

  const colors = TILE_COLORS[value] ?? TILE_COLORS[1];
  const cellWidth = variant === 'flat' ? 44 : 34;
  const width = cellWidth * value;
  const height = variant === 'flat' ? 44 : cellWidth * (83 / 60);
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.position = 'fixed';
  canvas.style.left = '-10000px';
  canvas.style.top = '-10000px';
  canvas.style.pointerEvents = 'none';

  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(dpr, dpr);

  if (variant === 'flat') {
    const circleSize = cellWidth * 0.5;
    context.fillStyle = colors.light;
    context.strokeStyle = colors.dark;
    context.lineWidth = 2;
    context.fillRect(0, 0, width, height);
    context.strokeRect(1, 1, width - 2, height - 2);

    for (let index = 0; index < value; index += 1) {
      context.beginPath();
      context.arc(cellWidth * index + cellWidth / 2, height / 2, circleSize / 2, 0, Math.PI * 2);
      context.fillStyle = colors.lightCircle;
      context.fill();
      context.strokeStyle = colors.dark;
      context.stroke();
    }
  } else {
    const topHeight = cellWidth * (40 / 60);
    const bottomHeight = cellWidth * 0.5;
    const circleSize = cellWidth * (40 / 60);
    const circleGap = cellWidth * (10 / 60);
    const circleOffset = cellWidth * (37 / 60);
    const totalHeight = bottomHeight + topHeight + circleSize + circleGap - circleOffset;

    for (let index = 0; index < value; index += 1) {
      const x = index * cellWidth;
      const bottomY = totalHeight - bottomHeight;
      const topY = bottomY - topHeight;
      const circleY = totalHeight - (bottomHeight + topHeight - circleOffset) - circleSize;
      const topCircleY = totalHeight - (bottomHeight + topHeight - circleOffset + circleGap) - circleSize;

      context.fillStyle = colors.dark;
      context.fillRect(x, bottomY, cellWidth, bottomHeight);
      context.fillStyle = colors.light;
      context.fillRect(x, topY, cellWidth, topHeight);
      context.beginPath();
      context.arc(x + cellWidth / 2, circleY + circleSize / 2, circleSize / 2, 0, Math.PI * 2);
      context.fillStyle = colors.darkCircle;
      context.fill();
      context.beginPath();
      context.arc(x + cellWidth / 2, topCircleY + circleSize / 2, circleSize / 2, 0, Math.PI * 2);
      context.fillStyle = colors.lightCircle;
      context.fill();
    }
  }

  document.body.appendChild(canvas);
  tileDragPreviewElement = canvas;
  event.dataTransfer.setDragImage(canvas, width / 2, height / 2);
}

function setStickerDragPreview(event: React.DragEvent<HTMLButtonElement>) {
  const preview = event.currentTarget.querySelector<HTMLImageElement>('img');
  if (!preview) return;

  const rect = preview.getBoundingClientRect();
  event.dataTransfer.setDragImage(preview, rect.width / 2, rect.height / 2);
}

function getStickerCategoryPreviewItems(category: StickerCategory) {
  return category.rows.flatMap((row) => row.items).slice(0, 4);
}

function getLibraryViewLabel(view: LibraryView, selectedStickerCategory: StickerCategory | null) {
  if (view === 'tiles') return 'Dlaždice';
  if (view === 'numberLines') return 'Číselné osy';
  if (view === 'beadCounter') return 'Korálkové počítadlo';
  if (view === 'diceTray') return 'Hrací kostky';
  if (view === 'tasks') return 'Úkoly a příklady';
  if (view.startsWith('sticker:')) return selectedStickerCategory?.label ?? null;
  return null;
}

function scrollPinnedStrip(event: React.MouseEvent<HTMLButtonElement>, direction: -1 | 1) {
  const items = event.currentTarget.parentElement?.querySelector<HTMLElement>('.pinned-sticker-items');
  items?.scrollBy({ left: direction * 240, behavior: 'smooth' });
}

function usePinnedStripScrollArrows(
  containerRef: React.RefObject<HTMLDivElement | null>,
  /** Obnovit měření když se změní obsah / viditelnost */
  resetKey: string | number,
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sync = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const eps = 2;
    setCanScrollLeft(scrollLeft > eps);
    setCanScrollRight(maxScroll > eps && scrollLeft < maxScroll - eps);
  }, [containerRef]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    /* Po změně obsahu / klíče vždy začít vlevo — center + overflow řídí oříznutí prvního prvku. */
    if (el) el.scrollLeft = 0;
    sync();
    if (!el) return undefined;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, resetKey]);

  return { canScrollLeft, canScrollRight, sync };
}

export function ObjectLibraryPanel({
  open,
  panelMode,
  onClose,
  onToggleLibraryOpen,
  onInsertSticker,
  onInsertBuildNumberTile,
  onPinnedPickBuildNumberTile,
  onPinnedPickSticker,
  onInsertNumberLine,
  onInsertBeadCounter,
  onInsertDiceTray,
  onInsertDominoTile,
  onInsertSpatialTilingBoard,
  onCreateArithmeticAssignment,
  onCreateSequenceAssignment,
  onCreateDominoAssignment,
  onCreateMarbleBagAssignment,
  activeSequenceChoices = null,
  onPickSequenceChoice,
  pinnedStripBoardSelection = null,
  onArmMathGlyph,
  pinnedMathGlyphs,
  onPinnedMathGlyphsChange,
  mathGlyphStripStyle,
  onMathGlyphStripStyleChange,
  boardTool = 'select',
  onToggleMathWrite,
  embeddedToolPalette = null,
  libraryAnchorRef,
  embeddedMachineToolbar = null,
  embeddedSpatialTilingToolbar = null,
  libraryDock,
  onSideDockRailOnlyLayout,
  taskModeActive = false,
  studentTaskMode = false,
  activeAssignmentId = null,
  activeTaskSettings = null,
  teacherTaskPanelLayout = 'configure',
  onTeacherTaskPanelLayoutChange,
  taskPanelSyncTick = 0,
  onSelectDrawingTool,
  drawShapeKind = 'circle',
  onDrawShapeKindChange,
  brushColor = BRUSH_COLOR_PRESETS[0],
  onBrushColorChange,
  highlighterColor = HIGHLIGHTER_COLOR_PRESETS[0],
  onHighlighterColorChange,
}: ObjectLibraryPanelProps) {
  const sideDockNotNarrow = useSideDockNotNarrow();
  const sideDockPanelOpen = open && libraryDock === 'side' && sideDockNotNarrow && panelMode !== 'closed';
  const sideColumnMode: SideColumnMode =
    studentTaskMode && taskModeActive
      ? 'student-task'
      : sideDockPanelOpen
          ? panelMode
          : taskModeActive
            ? 'teacher-task'
            : 'tool-strip';
  const catalogDockedInSideColumn =
    sideColumnMode === 'catalog' || sideColumnMode === 'tasks' || sideColumnMode === 'drawing';
  const renderToolStripColumn = sideColumnMode === 'tool-strip' || sideColumnMode === 'teacher-task' || sideColumnMode === 'student-task';

  const [libraryView, setLibraryView] = useState<LibraryView>('home');
  const [tasksDetail, setTasksDetail] = useState<TasksDetailKind | null>(null);
  const [activeStickerRowId, setActiveStickerRowId] = useState<string | null>(null);
  const [activeTileVariant, setActiveTileVariant] = useState<TileVariant | null>(null);
  const [arithmeticSettings, setArithmeticSettings] = useState<ArithmeticTaskSettings>(defaultArithmeticTaskSettings);
  const [sequenceSettings, setSequenceSettings] = useState<SequenceTaskSettings>(defaultSequenceTaskSettings);
  const [dominoSettings, setDominoSettings] = useState(defaultDominoTaskSettings);
  const [marbleBagSettings, setMarbleBagSettings] = useState(defaultMarbleBagTaskSettings);
  const tileStripItemsRef = useRef<HTMLDivElement>(null);
  const stickerStripItemsRef = useRef<HTMLDivElement>(null);
  const mathGlyphsItemsRef = useRef<HTMLDivElement>(null);
  const drawShapesRailAnchorRef = useRef<HTMLDivElement>(null);
  const brushRailAnchorRef = useRef<HTMLDivElement>(null);
  const highlighterRailAnchorRef = useRef<HTMLDivElement>(null);

  const [drawShapesPopoverFixed, setDrawShapesPopoverFixed] = useState<{ top: number; left: number } | null>(null);
  const [brushColorPopoverFixed, setBrushColorPopoverFixed] = useState<{ top: number; left: number } | null>(null);
  const [highlighterColorPopoverFixed, setHighlighterColorPopoverFixed] = useState<{
    top: number;
    left: number;
  } | null>(null);
  /** Po výběru barvy skrýt pop-up; znovu zobrazit kliknutím na stejný nástroj nebo přepnutím jinam a zpět. */
  const [brushColorPickerHidden, setBrushColorPickerHidden] = useState(false);
  const [highlighterColorPickerHidden, setHighlighterColorPickerHidden] = useState(false);

  const { categories: stickerCategories, loading: stickersLoading, error: stickersError } = useStickerCatalog();

  const [libraryGrade, setLibraryGrade] = useState<LibraryGrade>(() => readLibraryCurriculumFromStorage().grade);
  const [libraryVolume, setLibraryVolume] = useState<LibraryVolumePart>(
    () => readLibraryCurriculumFromStorage().volume,
  );
  const [libraryCurriculumMenuOpen, setLibraryCurriculumMenuOpen] = useState(false);
  const libraryCurriculumMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    writeLibraryCurriculumToStorage(libraryGrade, libraryVolume);
  }, [libraryGrade, libraryVolume]);

  useEffect(() => {
    if (!libraryCurriculumMenuOpen) return undefined;
    const onDocDown = (e: MouseEvent) => {
      const el = libraryCurriculumMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setLibraryCurriculumMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLibraryCurriculumMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [libraryCurriculumMenuOpen]);

  useEffect(() => {
    if (!open) setLibraryCurriculumMenuOpen(false);
  }, [open]);

  const libraryFilterVisibility = useMemo(
    () => getLibraryHomeFilterVisibility(libraryGrade, libraryVolume),
    [libraryGrade, libraryVolume],
  );

  const visibleStickerCategories = useMemo(() => {
    const ids = libraryFilterVisibility.stickerCategoryIds;
    if (ids === null) return stickerCategories;
    return stickerCategories.filter((c) => ids.has(c.id));
  }, [stickerCategories, libraryFilterVisibility.stickerCategoryIds]);

  const selectedStickerCategory = libraryView.startsWith('sticker:')
    ? (stickerCategories.find((category) => category.id === libraryView.replace('sticker:', '')) ?? null)
    : null;
  const activeStickerCategory =
    stickerCategories.find((category) => category.rows.some((row) => row.id === activeStickerRowId)) ?? null;
  const activeStickerRow = activeStickerCategory?.rows.find((row) => row.id === activeStickerRowId) ?? null;

  const tileStripScrollKey = activeTileVariant ? `tiles-${activeTileVariant}` : 'tiles-off';
  const stickerStripScrollKey =
    activeStickerRow && activeStickerRow.items.length > 0
      ? `stickers-${activeStickerRowId}-${activeStickerRow.items.length}`
      : 'stickers-off';

  const tileStripArrows = usePinnedStripScrollArrows(tileStripItemsRef, tileStripScrollKey);
  const stickerStripArrows = usePinnedStripScrollArrows(stickerStripItemsRef, stickerStripScrollKey);
  const mathStripScrollKey = [
    pinnedMathGlyphs ? 'math-glyphs-on' : 'math-glyphs-off',
    libraryDock,
    taskModeActive ? 'task' : 'learn',
  ].join('|');
  const mathStripArrows = usePinnedStripScrollArrows(mathGlyphsItemsRef, mathStripScrollKey);

  const internalLibraryLauncherRef = useRef<HTMLButtonElement>(null);
  const libraryLauncherRef = libraryAnchorRef ?? internalLibraryLauncherRef;

  const prevPanelModeRef = useRef(panelMode);
  useEffect(() => {
    const prev = prevPanelModeRef.current;
    prevPanelModeRef.current = panelMode;
    if (panelMode === 'closed') return;
    if (prev !== panelMode) {
      if (
        panelMode === 'tasks' &&
        taskModeActive &&
        activeTaskSettings &&
        activeAssignmentId &&
        !studentTaskMode
      ) {
        setLibraryView('tasks');
        if (activeTaskSettings.type === 'arithmetic') {
          setTasksDetail('arithmetic');
          setArithmeticSettings(activeTaskSettings);
        } else if (activeTaskSettings.type === 'sequence') {
          setTasksDetail('sequence');
          setSequenceSettings(activeTaskSettings);
        } else if (activeTaskSettings.type === 'domino') {
          setTasksDetail('domino');
          setDominoSettings(activeTaskSettings);
        } else {
          setTasksDetail('marbleBag');
          setMarbleBagSettings(activeTaskSettings);
        }
      } else {
        setLibraryView('home');
        setTasksDetail(null);
      }
    }
  }, [panelMode, taskModeActive, activeTaskSettings, activeAssignmentId, studentTaskMode]);

  /** Pozice plovoucího panelu (fixed px), živě přepočet při otevření / resize */
  const [libraryPopoverGeom, setLibraryPopoverGeom] = useState<{
    left: number;
    width: number;
    maxHeight: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const computeLibraryPopoverGeom = useCallback(() => {
    const btn = libraryLauncherRef.current;
    if (!btn) return null;

    const innerW = window.innerWidth;
    const innerH = window.innerHeight;
    const r = btn.getBoundingClientRect();

    const width = Math.min(400, Math.max(296, innerW - LIBRARY_POPOVER_MARGIN_PX * 2));
    let left = Math.min(r.left, innerW - LIBRARY_POPOVER_MARGIN_PX - width);
    left = Math.max(LIBRARY_POPOVER_MARGIN_PX, left);

    const sideDockWide =
      libraryDock === 'side' &&
      typeof window.matchMedia !== 'undefined' &&
      !window.matchMedia('(max-width: 620px)').matches;

    /* Boční dok na širším viewportu: katalog je v CSS sloupci (ne fixed popover přes plátno). */
    if (sideDockWide) {
      return null;
    }

    const bottom = innerH - r.top + LIBRARY_POPOVER_GAP_PX;
    const maxHeight = libraryPopoverMaxHeightPx(r.top);

    return { left, bottom, width, maxHeight };
  }, [libraryDock]);

  const refreshLibraryPopoverGeom = useCallback(() => {
    if (!open) return;
    setLibraryPopoverGeom(computeLibraryPopoverGeom());
  }, [open, computeLibraryPopoverGeom]);

  useLayoutEffect(() => {
    if (!open) {
      setLibraryPopoverGeom(null);
      return;
    }
    /* Synchronously before paint — avoids one frame with no maxHeight / position (uncropped flash). */
    refreshLibraryPopoverGeom();
  }, [
    open,
    refreshLibraryPopoverGeom,
    libraryView,
    panelMode,
    pinnedMathGlyphs,
    activeTileVariant,
    activeStickerRowId,
    embeddedMachineToolbar,
    embeddedSpatialTilingToolbar,
    libraryDock,
  ]);

  useEffect(() => {
    if (!open) return;
    const onViewportChange = () => refreshLibraryPopoverGeom();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    let ro: ResizeObserver | undefined;
    if (libraryLauncherRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onViewportChange);
      ro.observe(libraryLauncherRef.current);
      const dockPanel = libraryLauncherRef.current.closest('.library-bottom-panel');
      if (dockPanel) ro.observe(dockPanel);
    }

    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      ro?.disconnect();
    };
  }, [open, refreshLibraryPopoverGeom]);

  useEffect(() => {
    if (!libraryCurriculumMenuOpen) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (libraryView !== 'tasks') setTasksDetail(null);
  }, [libraryView]);

  useEffect(() => {
    if (boardTool !== 'brush') setBrushColorPickerHidden(false);
  }, [boardTool]);
  useEffect(() => {
    if (boardTool !== 'highlighter') setHighlighterColorPickerHidden(false);
  }, [boardTool]);

  useLayoutEffect(() => {
    const base = open && panelMode === 'drawing' && libraryDock === 'side' && libraryView === 'home';
    const cleaners: Array<() => void> = [];

    const subscribe = (
      active: boolean,
      ref: RefObject<HTMLDivElement | null>,
      setFixed: Dispatch<SetStateAction<{ top: number; left: number } | null>>,
      halfHeight: number,
      popoverWidth: number,
    ) => {
      if (!active) {
        setFixed(null);
        return;
      }
      const el = ref.current;
      if (!el) {
        setFixed(null);
        return;
      }
      const sync = () => {
        const r = el.getBoundingClientRect();
        setFixed(clampRailFloatingPopoverPosition(r, halfHeight, popoverWidth));
      };
      sync();
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
      ro?.observe(el);
      window.addEventListener('resize', sync);
      window.addEventListener('scroll', sync, true);
      cleaners.push(() => {
        ro?.disconnect();
        window.removeEventListener('resize', sync);
        window.removeEventListener('scroll', sync, true);
      });
    };

    const brushH = estimateRailColorPopoverHeight(BRUSH_COLOR_PRESETS.length);
    const hiH = estimateRailColorPopoverHeight(HIGHLIGHTER_COLOR_PRESETS.length);
    const shapesH = estimateRailShapesPopoverHeight();

    subscribe(
      base && boardTool === 'brush' && !brushColorPickerHidden && Boolean(onBrushColorChange),
      brushRailAnchorRef,
      setBrushColorPopoverFixed,
      brushH / 2,
      44,
    );
    subscribe(
      base && boardTool === 'highlighter' && !highlighterColorPickerHidden && Boolean(onHighlighterColorChange),
      highlighterRailAnchorRef,
      setHighlighterColorPopoverFixed,
      hiH / 2,
      44,
    );
    subscribe(base && boardTool === 'drawShapes', drawShapesRailAnchorRef, setDrawShapesPopoverFixed, shapesH / 2, 52);

    return () => {
      for (const c of cleaners) c();
    };
  }, [
    open,
    panelMode,
    libraryDock,
    libraryView,
    boardTool,
    brushColorPickerHidden,
    highlighterColorPickerHidden,
    onBrushColorChange,
    onHighlighterColorChange,
  ]);

  useEffect(() => {
    if (!open) setTasksDetail(null);
  }, [open]);

  const lastTeacherTaskFormSyncTickRef = useRef(-1);
  const prevLibraryPanelModeRef = useRef<ObjectLibraryPanelMode | null>(null);
  useEffect(() => {
    if (!open || panelMode !== 'tasks' || studentTaskMode) {
      prevLibraryPanelModeRef.current = panelMode;
      return;
    }
    if (!taskModeActive || !activeTaskSettings || !activeAssignmentId) {
      prevLibraryPanelModeRef.current = panelMode;
      return;
    }

    const prevMode = prevLibraryPanelModeRef.current;
    prevLibraryPanelModeRef.current = panelMode;

    const openedTasksPanel = prevMode !== null && prevMode !== 'tasks';
    const tickChanged = taskPanelSyncTick !== lastTeacherTaskFormSyncTickRef.current;
    if (!tickChanged && !openedTasksPanel) return;
    if (tickChanged) lastTeacherTaskFormSyncTickRef.current = taskPanelSyncTick;

    setLibraryView('tasks');
    if (activeTaskSettings.type === 'arithmetic') {
      setTasksDetail('arithmetic');
      setArithmeticSettings(activeTaskSettings);
    } else if (activeTaskSettings.type === 'sequence') {
      setTasksDetail('sequence');
      setSequenceSettings(activeTaskSettings);
    } else if (activeTaskSettings.type === 'domino') {
      setTasksDetail('domino');
      setDominoSettings(activeTaskSettings);
    } else {
      setTasksDetail('marbleBag');
      setMarbleBagSettings(activeTaskSettings);
    }
  }, [
    open,
    panelMode,
    studentTaskMode,
    taskModeActive,
    activeAssignmentId,
    activeTaskSettings,
    taskPanelSyncTick,
  ]);

  /** Úkol už je na plátně: při otevření Úkolů neukazovat výběr typu — rovnou panel daného úkolu (klávesnice zůstane pod výsuvem). */
  useEffect(() => {
    if (!open || panelMode !== 'tasks' || studentTaskMode) return;
    if (!taskModeActive || !activeTaskSettings || !activeAssignmentId) return;
    if (libraryView !== 'home') return;
    setLibraryView('tasks');
    if (activeTaskSettings.type === 'arithmetic') {
      setTasksDetail('arithmetic');
      setArithmeticSettings(activeTaskSettings);
    } else if (activeTaskSettings.type === 'sequence') {
      setTasksDetail('sequence');
      setSequenceSettings(activeTaskSettings);
    } else if (activeTaskSettings.type === 'domino') {
      setTasksDetail('domino');
      setDominoSettings(activeTaskSettings);
    } else {
      setTasksDetail('marbleBag');
      setMarbleBagSettings(activeTaskSettings);
    }
  }, [
    open,
    panelMode,
    studentTaskMode,
    taskModeActive,
    activeAssignmentId,
    activeTaskSettings,
    libraryView,
  ]);

  const teacherPanelShowsStudentPreview = Boolean(
    taskModeActive &&
      !studentTaskMode &&
      teacherTaskPanelLayout === 'student-preview' &&
      activeTaskSettings &&
      activeAssignmentId &&
      ((tasksDetail === 'arithmetic' && activeTaskSettings.type === 'arithmetic') ||
        (tasksDetail === 'sequence' && activeTaskSettings.type === 'sequence') ||
        (tasksDetail === 'domino' && activeTaskSettings.type === 'domino') ||
        (tasksDetail === 'marbleBag' && activeTaskSettings.type === 'marbleBag')),
  );

  const openCategoryLabel = useMemo(() => {
    if (libraryView === 'tasks') {
      switch (tasksDetail) {
        case 'sequence':
          return 'Řady a posloupnosti';
        case 'arithmetic':
          return 'Jednoduché příklady';
        case 'domino':
          return 'Domino úlohy';
        case 'marbleBag':
          return 'Zjisti';
        default:
          return 'Úkoly a příklady';
      }
    }
    return getLibraryViewLabel(libraryView, selectedStickerCategory);
  }, [libraryView, tasksDetail, selectedStickerCategory]);
  const stripToolbarLabel =
    pinnedMathGlyphs
      ? 'Čísla a znaménka'
      : activeTileVariant !== null
        ? 'Dlaždice'
        : activeStickerCategory !== null && activeStickerRow !== null
          ? `${activeStickerCategory.label} · ${getRowLabel(activeStickerCategory.id, activeStickerRow.row)}`
          : null;
  const launcherCaption = taskModeActive ? null : (openCategoryLabel ?? stripToolbarLabel);

  const libraryLauncherAriaLabel = launcherCaption
    ? `Knihovna objektů – ${launcherCaption}${open ? ' (otevřeno)' : ''}`
    : `Knihovna objektů${open ? ' (otevřeno)' : ''}`;

  const openStickerCategory = (category: StickerCategory) => {
    setActiveTileVariant(null);
    onPinnedMathGlyphsChange(false);
    const onlyRow = category.rows.length === 1 ? category.rows[0] : null;
    if (onlyRow) {
      setActiveStickerRowId(onlyRow.id);
      onClose();
      return;
    }
    setLibraryView(`sticker:${category.id}`);
    setActiveStickerRowId(category.rows[0]?.id ?? null);
  };

  const taskNeedsMathGlyphStrip =
    taskModeActive &&
    activeTaskSettings &&
    (activeTaskSettings.type === 'arithmetic' ||
      activeTaskSettings.type === 'domino' ||
      activeTaskSettings.type === 'marbleBag');
  const mathStripNumbersOnly = activeTaskSettings?.type === 'marbleBag';
  const showMathGlyphStrip =
    (pinnedMathGlyphs || taskNeedsMathGlyphStrip) && !embeddedMachineToolbar && !embeddedSpatialTilingToolbar;
  const showSequenceChoiceStrip = taskModeActive && !studentTaskMode && activeSequenceChoices && activeSequenceChoices.length > 0;
  /** Spodní dok: nástroje kreslení přímo v liště místo pásu z knihovny (FigJam-style). */
  const showDrawingBottomStrip =
    libraryDock === 'bottom' &&
    panelMode === 'drawing' &&
    !embeddedMachineToolbar &&
    !embeddedSpatialTilingToolbar &&
    !showSequenceChoiceStrip;

  const sideDockRailOnlyLayout = useMemo(() => {
    if (libraryDock !== 'side' || studentTaskMode) return false;
    if (!sideDockNotNarrow) return false;
    if (panelMode !== 'closed') return false;
    if (showSequenceChoiceStrip) return false;
    if (showMathGlyphStrip) return false;
    if (embeddedSpatialTilingToolbar) return false;
    if (embeddedMachineToolbar) return false;
    if (activeTileVariant) return false;
    if (activeStickerCategory && activeStickerRow) return false;
    return true;
  }, [
    libraryDock,
    studentTaskMode,
    sideDockNotNarrow,
    panelMode,
    showSequenceChoiceStrip,
    showMathGlyphStrip,
    embeddedSpatialTilingToolbar,
    embeddedMachineToolbar,
    activeTileVariant,
    activeStickerCategory,
    activeStickerRow,
  ]);

  useLayoutEffect(() => {
    onSideDockRailOnlyLayout?.(sideDockRailOnlyLayout);
  }, [sideDockRailOnlyLayout, onSideDockRailOnlyLayout]);

  const pickBrushColor = useCallback(
    (c: string) => {
      onBrushColorChange?.(c);
      setBrushColorPickerHidden(true);
    },
    [onBrushColorChange],
  );
  const pickHighlighterColor = useCallback(
    (c: string) => {
      onHighlighterColorChange?.(c);
      setHighlighterColorPickerHidden(true);
    },
    [onHighlighterColorChange],
  );

  const renderBackHeader = () => (
    <div className="library-drill-header">
      <button type="button" onClick={() => setLibraryView('home')}>
        <ArrowLeft size={17} strokeWidth={2.3} />
        <span>Zpět</span>
      </button>
      <button className="object-library-close" type="button" aria-label="Zavřít knihovnu objektů" onClick={onClose}>
        <X size={18} strokeWidth={2.3} />
      </button>
    </div>
  );

  const renderTasksDrillHeader = () => (
    <div className="tasks-drill-header library-drill-header">
      <button
        type="button"
        onClick={() => {
          if (taskModeActive) {
            onClose();
          } else {
            setLibraryView('home');
            setTasksDetail(null);
          }
        }}
      >
        <ArrowLeft size={17} strokeWidth={2.3} />
        <span>{taskModeActive ? 'Zavřít' : 'Zpět'}</span>
      </button>
      <button className="object-library-close" type="button" aria-label="Zavřít knihovnu objektů" onClick={onClose}>
        <X size={18} strokeWidth={2.3} />
      </button>
    </div>
  );

  return (
    <>
      {showSequenceChoiceStrip ? (
        <div
          className="library-bottom-panel library-bottom-panel--inline sequence-choice-panel"
          aria-label="Výběr prvku do řady"
        >
          {embeddedToolPalette ? (
            <div className="library-bottom-tool-palette" aria-label="Nástroje nástěnky">
              {embeddedToolPalette}
            </div>
          ) : null}
          <div className="library-bottom-panel__inline-strip sequence-choice-strip" aria-label="Prvky do řady">
            {activeSequenceChoices.map((choice) => (
              <button
                type="button"
                key={choice.key}
                className="sequence-choice-button"
                title={choice.label}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(SEQUENCE_CHOICE_DRAG, JSON.stringify({ key: choice.key }));
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onPickSequenceChoice?.(choice.key)}
              >
                <SequenceChoicePreview choice={choice} />
              </button>
            ))}
          </div>
        </div>
      ) : renderToolStripColumn && showDrawingBottomStrip ? (
        <div
          className="library-bottom-panel library-bottom-panel--inline library-bottom-panel--drawing-tools"
          aria-label="Kreslení"
        >
          {embeddedToolPalette ? (
            <div className="library-bottom-tool-palette" aria-label="Nástroje nástěnky">
              {embeddedToolPalette}
            </div>
          ) : null}
          <span className="library-math-unified-divider" aria-hidden />
            <div
            className="library-bottom-panel__inline-strip library-bottom-panel__inline-strip--drawing"
            role="toolbar"
            aria-label="Nástroje kreslení"
          >
            <div className="library-drawing-inline-tool-wrap">
              <button
                type="button"
                className={`library-drawing-inline-tool${boardTool === 'brush' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'brush'}
                aria-label="Tužka"
                onClick={() => {
                  if (boardTool === 'brush') setBrushColorPickerHidden((h) => !h);
                  else onSelectDrawingTool?.('brush');
                }}
              >
                <span className="library-drawing-inline-tool__icon library-drawing-stroke-icon-rotate" aria-hidden>
                  <DrawingToolBrushIllustration size={48} />
                </span>
              </button>
              {boardTool === 'brush' && onBrushColorChange && !brushColorPickerHidden ? (
                <LibraryDrawingColorPopover
                  presets={BRUSH_COLOR_PRESETS}
                  current={brushColor}
                  onPick={pickBrushColor}
                  ariaLabel="Barva tužky"
                  inline
                />
              ) : null}
            </div>
            <div className="library-drawing-inline-tool-wrap">
              <button
                type="button"
                className={`library-drawing-inline-tool${boardTool === 'highlighter' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'highlighter'}
                aria-label="Zvýrazňovač"
                onClick={() => {
                  if (boardTool === 'highlighter') setHighlighterColorPickerHidden((h) => !h);
                  else onSelectDrawingTool?.('highlighter');
                }}
              >
                <span className="library-drawing-inline-tool__icon library-drawing-stroke-icon-rotate" aria-hidden>
                  <DrawingToolHighlighterIllustration size={48} />
                </span>
              </button>
              {boardTool === 'highlighter' && onHighlighterColorChange && !highlighterColorPickerHidden ? (
                <LibraryDrawingColorPopover
                  presets={HIGHLIGHTER_COLOR_PRESETS}
                  current={highlighterColor}
                  onPick={pickHighlighterColor}
                  ariaLabel="Barva zvýrazňovače"
                  inline
                />
              ) : null}
            </div>
            <button
              type="button"
              className={`library-drawing-inline-tool${boardTool === 'eraser' ? ' is-active' : ''}`}
              aria-pressed={boardTool === 'eraser'}
              aria-label="Guma"
              onClick={() => onSelectDrawingTool?.('eraser')}
            >
              <span className="library-drawing-inline-tool__icon library-drawing-stroke-icon-rotate" aria-hidden>
                <DrawingToolEraserIllustration size={48} />
              </span>
            </button>
            <button
              type="button"
              className={`library-drawing-inline-tool${boardTool === 'textWrite' ? ' is-active' : ''}`}
              aria-pressed={boardTool === 'textWrite'}
              aria-label="Text na plátno"
              onClick={() => onSelectDrawingTool?.('textWrite')}
            >
              <span className="library-drawing-inline-tool__icon" aria-hidden>
                <DrawingToolTextIllustration size={56} />
              </span>
            </button>
            <button
              type="button"
              className={`library-drawing-inline-tool${boardTool === 'stickyNote' ? ' is-active' : ''}`}
              aria-pressed={boardTool === 'stickyNote'}
              aria-label="Lísteček"
              onClick={() => onSelectDrawingTool?.('stickyNote')}
            >
              <span className="library-drawing-inline-tool__icon" aria-hidden>
                <DrawingToolStickyNoteIllustration size={48} />
              </span>
            </button>
            <div className="library-drawing-inline-tool-wrap">
              <button
                type="button"
                className={`library-drawing-inline-tool${boardTool === 'drawShapes' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'drawShapes'}
                aria-label="Tvary na plátno"
                onClick={() => onSelectDrawingTool?.('drawShapes')}
              >
                <span className="library-drawing-inline-tool__icon" aria-hidden>
                  <DrawingToolShapesIllustration size={48} />
                </span>
              </button>
              {boardTool === 'drawShapes' ? (
                <div
                  className="library-draw-shape-popover library-draw-shape-popover--inline"
                  role="group"
                  aria-label="Tvar"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`library-draw-shape-kind-btn${drawShapeKind === 'circle' ? ' is-active' : ''}`}
                    aria-pressed={drawShapeKind === 'circle'}
                    title="Kruh"
                    onClick={() => onDrawShapeKindChange?.('circle')}
                  >
                    ○
                  </button>
                  <button
                    type="button"
                    className={`library-draw-shape-kind-btn${drawShapeKind === 'square' ? ' is-active' : ''}`}
                    aria-pressed={drawShapeKind === 'square'}
                    title="Čtverec"
                    onClick={() => onDrawShapeKindChange?.('square')}
                  >
                    □
                  </button>
                  <button
                    type="button"
                    className={`library-draw-shape-kind-btn${drawShapeKind === 'arrow' ? ' is-active' : ''}`}
                    aria-pressed={drawShapeKind === 'arrow'}
                    title="Šipka"
                    onClick={() => onDrawShapeKindChange?.('arrow')}
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : renderToolStripColumn && showMathGlyphStrip ? (
        <div
          className="library-bottom-panel library-bottom-panel--inline"
          aria-label="Knihovna a čísla a znaménka"
        >
          {embeddedToolPalette ? (
            <div className="library-bottom-tool-palette" aria-label="Nástroje nástěnky">
              {embeddedToolPalette}
            </div>
          ) : null}
          <>
            {!studentTaskMode ? (
              <div className="library-side-math-header">
              <button
                ref={internalLibraryLauncherRef}
                type="button"
                className={`library-launcher-button library-launcher-button--in-panel${launcherCaption ? '' : ' is-icon-only'}${open ? ' is-open' : ''}`}
                aria-label={libraryLauncherAriaLabel}
                aria-expanded={open}
                onClick={onToggleLibraryOpen}
              >
                <Shapes size={18} strokeWidth={2.2} className="library-launcher-shapes" aria-hidden />
                {launcherCaption ? <span className="library-launcher-caption">{launcherCaption}</span> : null}
              </button>
              {libraryDock === 'side' ? (
                <div className="library-side-math-header-actions" aria-label="Styl a psaní čísel">
                  <MathGlyphStripStyleControl style={mathGlyphStripStyle} onChange={onMathGlyphStripStyleChange} />
                  <button
                    type="button"
                    className={`pinned-sticker-button pinned-math-write-btn is-icon-only${
                      boardTool === 'mathWrite' ? ' is-write-mode is-active' : ' is-select-mode'
                    }`}
                    title={
                      boardTool === 'mathWrite'
                        ? 'Nástroj Psát na plátno (stejný jako klávesa G): klik na prázdné místo a piš. Klikni pro nástroj Výběr a obdélníkem vybírej.'
                        : 'Zapnout nástroj Psát na plátno (klávesa G): kurzor tužky, klik na volné místo a piš. V levém panelu zůstává Výběr (V) jako jiný nástroj.'
                    }
                    aria-label={
                      boardTool === 'mathWrite'
                        ? 'Psát na plátno je zapnuto. Klikni pro přepnutí na výběr.'
                        : 'Zapnout psaní na plátno. Klikni pro nástroj Psát.'
                    }
                    aria-pressed={boardTool === 'mathWrite'}
                    onClick={() => onToggleMathWrite?.()}
                  >
                    <Keyboard size={21} strokeWidth={2.2} className="pinned-math-write-icon" aria-hidden />
                  </button>
                </div>
              ) : null}
              </div>
            ) : null}
            {libraryDock === 'side' ? null : <span className="library-math-unified-divider" aria-hidden />}
          </>
          <div
            className="library-bottom-panel__inline-strip library-bottom-panel__inline-strip--math"
            aria-label="Čísla a znaménka na plátno"
          >
            {mathStripArrows.canScrollLeft ? (
              <button
                className="pinned-sticker-scroll"
                type="button"
                aria-label="Posunout doleva"
                onClick={(event) => scrollPinnedStrip(event, -1)}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
            ) : null}
            <div className="pinned-sticker-items" ref={mathGlyphsItemsRef}>
              {libraryDock !== 'side' ? (
                <>
                  <MathGlyphStripStyleControl style={mathGlyphStripStyle} onChange={onMathGlyphStripStyleChange} />
                  <button
                    type="button"
                    className={`pinned-sticker-button pinned-math-write-btn is-icon-only${
                      boardTool === 'mathWrite' ? ' is-write-mode is-active' : ' is-select-mode'
                    }`}
                    title={
                      boardTool === 'mathWrite'
                        ? 'Nástroj Psát na plátno (stejný jako klávesa G): klik na prázdné místo a piš. Klikni pro nástroj Výběr a obdélníkem vybírej.'
                        : 'Zapnout nástroj Psát na plátno (klávesa G): kurzor tužky, klik na volné místo a piš. V levém panelu zůstává Výběr (V) jako jiný nástroj.'
                    }
                    aria-label={
                      boardTool === 'mathWrite'
                        ? 'Psát na plátno je zapnuto. Klikni pro přepnutí na výběr.'
                        : 'Zapnout psaní na plátno. Klikni pro nástroj Psát.'
                    }
                    aria-pressed={boardTool === 'mathWrite'}
                    onClick={() => onToggleMathWrite?.()}
                  >
                    <Keyboard size={21} strokeWidth={2.2} className="pinned-math-write-icon" aria-hidden />
                  </button>
                  <span className="pinned-math-strip-sep" aria-hidden />
                </>
              ) : null}
              {taskModeActive && activeTaskSettings?.type === 'marbleBag' && panelMode === 'tasks' ? (
                <>
                  <div className="marble-bag-task-marble-stack">
                    <span className="marble-bag-task-math-hint marble-bag-task-math-hint--instruction">
                      <span className="marble-bag-task-math-hint__line">PŘETÁHNI KULIČKU DO PYTLÍKU</span>
                    </span>
                    <button
                      type="button"
                      className="pinned-sticker-button pinned-math-glyph marble-bag-marble-key"
                      draggable
                      title="Přetáhnout kuličku do pytlíčku"
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          MARBLE_BAG_ITEM_DRAG,
                          JSON.stringify({ kind: 'marble', color: MARBLE_BAG_MARBLE_COLOR }),
                        );
                        event.dataTransfer.effectAllowed = 'copy';
                      }}
                    >
                      <MarbleBagMarbleKeyGlyph />
                      <span className="sr-only">
                        Přetáhni kuličku do pytlíku, nebo zadej číslo klávesami níže.
                      </span>
                    </button>
                    <span className="marble-bag-task-math-hint marble-bag-task-math-hint--instruction">
                      <span className="marble-bag-task-math-hint__line">NEBO ZADEJ ČÍSLO</span>
                    </span>
                  </div>
                  <span className="pinned-math-strip-sep" aria-hidden />
                </>
              ) : null}
              {libraryDock === 'side' ? (
                <>
                  <span className="pinned-math-calculator-group pinned-math-calculator-digits" aria-label="Čísla">
                    {MATH_CALCULATOR_DIGITS.map((digit) => (
                      <button
                        type="button"
                        key={digit}
                        className={`pinned-sticker-button pinned-math-glyph${
                          pinnedStripBoardSelection?.kind === 'mathGlyph' && pinnedStripBoardSelection.label === digit
                            ? ' is-board-selected'
                            : ''
                        }`}
                        title={`Číslo ${digit}`}
                        draggable={Boolean(onArmMathGlyph)}
                        onDragStart={(e) => {
                          armMathGlyphDragTransfer(e, digit);
                        }}
                        onDragEnd={clearMathGlyphDragTransfer}
                        onClick={() => onArmMathGlyph?.(digit)}
                      >
                        {digit}
                      </button>
                    ))}
                  </span>
                  {!mathStripNumbersOnly ? (
                    <span className="pinned-math-calculator-group pinned-math-calculator-ops" aria-label="Znaménka">
                      {MATH_STRIP_OPS.map((op) => (
                        <button
                          type="button"
                          key={op}
                          className={`pinned-sticker-button pinned-math-glyph is-op${
                            pinnedStripBoardSelection?.kind === 'mathGlyph' && pinnedStripBoardSelection.label === op
                              ? ' is-board-selected'
                              : ''
                          }`}
                          title={`Znaménko ${op}`}
                          draggable={Boolean(onArmMathGlyph)}
                          onDragStart={(e) => {
                            armMathGlyphDragTransfer(e, op);
                          }}
                          onDragEnd={clearMathGlyphDragTransfer}
                          onClick={() => onArmMathGlyph?.(op)}
                        >
                          {op}
                        </button>
                      ))}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
              {MATH_STRIP_DIGITS.map((digit) => (
                <button
                  type="button"
                  key={digit}
                  className={`pinned-sticker-button pinned-math-glyph${
                    pinnedStripBoardSelection?.kind === 'mathGlyph' && pinnedStripBoardSelection.label === digit
                      ? ' is-board-selected'
                      : ''
                  }`}
                  title={`Číslo ${digit}`}
                  draggable={Boolean(onArmMathGlyph)}
                  onDragStart={(e) => {
                    armMathGlyphDragTransfer(e, digit);
                  }}
                  onDragEnd={clearMathGlyphDragTransfer}
                  onClick={() => onArmMathGlyph?.(digit)}
                >
                  {digit}
                </button>
              ))}
              {!mathStripNumbersOnly ? (
                <>
                  <span className="pinned-math-strip-sep" aria-hidden />
                  {MATH_STRIP_OPS.map((op) => (
                    <button
                      type="button"
                      key={op}
                      className={`pinned-sticker-button pinned-math-glyph is-op${
                        pinnedStripBoardSelection?.kind === 'mathGlyph' && pinnedStripBoardSelection.label === op
                          ? ' is-board-selected'
                          : ''
                      }`}
                      title={`Znaménko ${op}`}
                      draggable={Boolean(onArmMathGlyph)}
                      onDragStart={(e) => {
                        armMathGlyphDragTransfer(e, op);
                      }}
                      onDragEnd={clearMathGlyphDragTransfer}
                      onClick={() => onArmMathGlyph?.(op)}
                    >
                      {op}
                    </button>
                  ))}
                </>
              ) : null}
                </>
              )}
            </div>
            {mathStripArrows.canScrollRight ? (
              <button
                className="pinned-sticker-scroll"
                type="button"
                aria-label="Posunout doprava"
                onClick={(event) => scrollPinnedStrip(event, 1)}
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      ) : renderToolStripColumn ? (
        <div className="library-bottom-panel library-bottom-panel--inline">
          {embeddedToolPalette ? (
            <div className="library-bottom-tool-palette" aria-label="Nástroje nástěnky">
              {embeddedToolPalette}
            </div>
          ) : null}
          <button
            ref={internalLibraryLauncherRef}
            type="button"
            className={`library-launcher-button library-launcher-button--in-panel${
              launcherCaption ? '' : ' is-icon-only'
            }${open ? ' is-open' : ''}`}
            aria-label={libraryLauncherAriaLabel}
            aria-expanded={open}
            onClick={onToggleLibraryOpen}
          >
            <Shapes size={18} strokeWidth={2.2} className="library-launcher-shapes" aria-hidden />
            {launcherCaption ? <span className="library-launcher-caption">{launcherCaption}</span> : null}
          </button>
          {embeddedSpatialTilingToolbar ? (
            <>
              <span className="library-math-unified-divider" aria-hidden />
              <div
                className="library-bottom-panel__inline-strip library-bottom-panel__inline-strip--spatial-tiling"
                aria-label="Tvary dlaždic na mřížce"
              >
                {embeddedSpatialTilingToolbar}
              </div>
            </>
          ) : embeddedMachineToolbar ? (
            <>
              <span className="library-math-unified-divider" aria-hidden />
              <div
                className="library-bottom-panel__inline-strip library-bottom-panel__inline-strip--machine"
                aria-label="Nastavení nástroje"
              >
                {embeddedMachineToolbar}
              </div>
            </>
          ) : activeTileVariant ? (
            <>
              <span className="library-math-unified-divider" aria-hidden />
              <div className="library-bottom-panel__inline-strip library-bottom-panel__inline-strip--tiles" aria-label="Dlaždice">
                {tileStripArrows.canScrollLeft ? (
                  <button
                    className="pinned-sticker-scroll"
                    type="button"
                    aria-label="Posunout doleva"
                    onClick={(event) => scrollPinnedStrip(event, -1)}
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
                <div className="pinned-sticker-items pinned-sticker-items--tiles" ref={tileStripItemsRef}>
                  {TILE_VALUES.map((value) => (
                    <button
                      className={`pinned-sticker-button pinned-tile-button ${activeTileVariant}${
                        pinnedStripBoardSelection?.kind === 'tile' &&
                        pinnedStripBoardSelection.variant === activeTileVariant &&
                        pinnedStripBoardSelection.value === value
                          ? ' is-board-selected'
                          : ''
                      }`}
                      type="button"
                      key={`${activeTileVariant}-${value}`}
                      title={`Dlaždice ${value}`}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          'application/x-build-number-tile',
                          JSON.stringify({ value, variant: activeTileVariant }),
                        );
                        event.dataTransfer.effectAllowed = 'copy';
                        setBuildTileDragPayload({ value, variant: activeTileVariant });
                        setTileDragPreview(event, value, activeTileVariant);
                      }}
                      onDragEnd={() => {
                        clearTileDragPreview();
                        setBuildTileDragPayload(null);
                      }}
                      onClick={() =>
                        (onPinnedPickBuildNumberTile ?? onInsertBuildNumberTile)(value, activeTileVariant)
                      }
                    >
                      <span className="pinned-tile-number">{value}</span>
                      <BuildNumberTile
                        value={value}
                        scale={activeTileVariant === 'flat' ? 0.68 : 0.34}
                        variant={activeTileVariant}
                      />
                    </button>
                  ))}
                </div>
                {tileStripArrows.canScrollRight ? (
                  <button
                    className="pinned-sticker-scroll"
                    type="button"
                    aria-label="Posunout doprava"
                    onClick={(event) => scrollPinnedStrip(event, 1)}
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            </>
          ) : activeStickerCategory && activeStickerRow ? (
            <>
              <span className="library-math-unified-divider" aria-hidden />
              <div className="library-bottom-panel__inline-strip" aria-label="Objekty z knihovny">
                {stickerStripArrows.canScrollLeft ? (
                  <button
                    className="pinned-sticker-scroll"
                    type="button"
                    aria-label="Posunout doleva"
                    onClick={(event) => scrollPinnedStrip(event, -1)}
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
                <div className="pinned-sticker-items" ref={stickerStripItemsRef}>
                  {activeStickerRow.items.map((sticker) => (
                    <button
                      className={`pinned-sticker-button${
                        pinnedStripBoardSelection?.kind === 'sticker' &&
                        pinnedStripBoardSelection.url === sticker.url
                          ? ' is-board-selected'
                          : ''
                      }`}
                      type="button"
                      key={sticker.id}
                      title={sticker.name}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/x-sticker', JSON.stringify(sticker));
                        event.dataTransfer.effectAllowed = 'copy';
                        setStickerDragPreview(event);
                      }}
                      onClick={() => (onPinnedPickSticker ?? onInsertSticker)(sticker)}
                    >
                      <img src={sticker.url} alt={sticker.name} loading="lazy" />
                    </button>
                  ))}
                </div>
                {stickerStripArrows.canScrollRight ? (
                  <button
                    className="pinned-sticker-scroll"
                    type="button"
                    aria-label="Posunout doprava"
                    onClick={(event) => scrollPinnedStrip(event, 1)}
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : embeddedToolPalette ? (
        <div className="library-bottom-panel library-bottom-panel--inline library-bottom-panel--rail-only" aria-hidden="true">
          <div className="library-bottom-tool-palette" aria-label="Nástroje nástěnky">
            {embeddedToolPalette}
          </div>
        </div>
      ) : null}

      {/* Bez plovoucího překrýváku: jinak při otevřené knihovně (úzké okno) kradl pointer kreslícím nástrojům včetně gumy. */}
      {catalogDockedInSideColumn || (!sideDockNotNarrow && open) ? (
      <aside
        className={`object-library object-library--popover ${open ? 'is-open' : ''}${
          catalogDockedInSideColumn ? ' object-library--side-embedded' : ''
        }${open && panelMode === 'drawing' ? ' object-library--drawing-rail' : ''}${
          open && catalogDockedInSideColumn && panelMode === 'tasks' ? ' object-library--tasks-panel' : ''
        }${
          open &&
          libraryDock === 'side' &&
          !catalogDockedInSideColumn &&
          typeof window !== 'undefined' &&
          !window.matchMedia('(max-width: 620px)').matches
            ? ' object-library--opens-below-launcher'
            : ''
        }`}
        role={catalogDockedInSideColumn ? 'region' : 'dialog'}
        aria-modal={open && !catalogDockedInSideColumn ? true : undefined}
        aria-label={
          panelMode === 'drawing' ? 'Kreslení' : panelMode === 'tasks' ? 'Úkoly' : 'Knihovna objektů'
        }
        aria-hidden={!open}
        inert={!open ? true : undefined}
        style={
          open && libraryPopoverGeom && !catalogDockedInSideColumn
            ? {
                left: libraryPopoverGeom.left,
                width: libraryPopoverGeom.width,
                maxHeight: libraryPopoverGeom.maxHeight,
                ...(libraryPopoverGeom.bottom !== undefined ? { bottom: libraryPopoverGeom.bottom } : {}),
                ...(libraryPopoverGeom.top !== undefined ? { top: libraryPopoverGeom.top } : {}),
              }
            : undefined
        }
      >
        <div className="object-library-body">
      {libraryView === 'home' ? (
        <>
          {panelMode !== 'drawing' ? (
            <div className="object-library-header">
              {panelMode === 'tasks' ? (
                <>
                  <ListChecks size={22} strokeWidth={2.35} className="object-library-menu-icon" aria-hidden />
                  <h2 id="object-library-dialog-title" className="object-library-dialog-title">
                    Úkoly
                  </h2>
                </>
              ) : (
                <>
                  <Shapes size={22} strokeWidth={2.35} className="object-library-menu-icon" aria-hidden />
                  <span className="object-library-header-spacer" aria-hidden />
                </>
              )}
              <button className="object-library-close" type="button" aria-label="Zavřít panel" onClick={onClose}>
                <X size={18} strokeWidth={2.3} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {libraryView === 'home' && panelMode === 'tasks' ? (
        <div className="library-category-list">
          <div className="library-home-tab-panel" role="tabpanel" aria-label="Typ úlohy">
            <p className="library-home-tab-hint">Vyber typ úlohy — otevře se nastavení a můžeš úkol vložit na plátno.</p>
            <div className="library-interactive-tile-grid">
              <button
                type="button"
                className="library-category-card library-category-card--interactive library-interactive-tile"
                onClick={() => {
                  setLibraryView('tasks');
                  setTasksDetail('sequence');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                }}
              >
                <span className="library-category-preview library-task-preview" aria-hidden="true">
                  <ListChecks size={38} strokeWidth={2.2} />
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Řady a posloupnosti</strong>
                  <small>vzory AB, ABC — výběr z nabídky</small>
                </span>
              </button>
              <button
                type="button"
                className="library-category-card library-category-card--interactive library-interactive-tile"
                onClick={() => {
                  setLibraryView('tasks');
                  setTasksDetail('arithmetic');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                }}
              >
                <span className="library-category-preview library-task-preview" aria-hidden="true">
                  <ListChecks size={28} strokeWidth={2.2} />
                  <span>8 + 4 =</span>
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Jednoduché příklady</strong>
                  <small>sčítání, odčítání, násobení</small>
                </span>
              </button>
              <button
                type="button"
                className="library-category-card library-category-card--interactive library-interactive-tile"
                onClick={() => {
                  setLibraryView('tasks');
                  setTasksDetail('domino');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                }}
              >
                <span className="library-category-preview library-domino-tile-preview" aria-hidden="true">
                  <span className="library-domino-tile-preview__half library-domino-tile-preview__half--left">
                    <span className="library-domino-tile-preview__pip" />
                    <span className="library-domino-tile-preview__pip" />
                  </span>
                  <span className="library-domino-tile-preview__half library-domino-tile-preview__half--right">
                    <span className="library-domino-tile-preview__pip" />
                  </span>
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Domino úlohy</strong>
                  <small>úlohy s kartami domino</small>
                </span>
              </button>
              <button
                type="button"
                className="library-category-card library-category-card--interactive library-interactive-tile"
                onClick={() => {
                  setLibraryView('tasks');
                  setTasksDetail('marbleBag');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                }}
              >
                <span className="library-category-preview library-marble-bag-preview" aria-hidden="true">
                  <span className="library-marble-bag-preview__bag" />
                  <span className="library-marble-bag-preview__marble is-green" />
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Zjisti</strong>
                  <small>pytlíček, kulička nebo číslo</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : libraryView === 'home' && panelMode === 'drawing' ? (
        <div className="library-category-list library-category-list--drawing-rail">
          <div
            className="library-home-tab-panel library-home-tab-panel--drawing-rail"
            role="tabpanel"
            aria-label="Nástroje kreslení"
          >
            <div className="library-drawing-rail-peek">
              <div className="library-drawing-tools-rail" role="toolbar" aria-label="Nástroje kreslení">
              <div ref={brushRailAnchorRef} className="library-drawing-rail-tool-anchor">
                <button
                  type="button"
                  className={`library-drawing-rail-tool${boardTool === 'brush' ? ' is-active' : ''}`}
                  aria-pressed={boardTool === 'brush'}
                  aria-label="Tužka"
                  onClick={() => {
                    if (boardTool === 'brush') setBrushColorPickerHidden((h) => !h);
                    else onSelectDrawingTool?.('brush');
                  }}
                >
                  <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                    <DrawingToolBrushIllustration size={72} />
                  </span>
                </button>
              </div>
              <div ref={highlighterRailAnchorRef} className="library-drawing-rail-tool-anchor">
                <button
                  type="button"
                  className={`library-drawing-rail-tool${boardTool === 'highlighter' ? ' is-active' : ''}`}
                  aria-pressed={boardTool === 'highlighter'}
                  aria-label="Zvýrazňovač"
                  onClick={() => {
                    if (boardTool === 'highlighter') setHighlighterColorPickerHidden((h) => !h);
                    else onSelectDrawingTool?.('highlighter');
                  }}
                >
                  <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                    <DrawingToolHighlighterIllustration size={72} />
                  </span>
                </button>
              </div>
              <button
                type="button"
                className={`library-drawing-rail-tool${boardTool === 'eraser' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'eraser'}
                aria-label="Guma"
                onClick={() => onSelectDrawingTool?.('eraser')}
              >
                <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                  <DrawingToolEraserIllustration size={72} />
                </span>
              </button>
              <button
                type="button"
                className={`library-drawing-rail-tool${boardTool === 'textWrite' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'textWrite'}
                aria-label="Text na plátno"
                onClick={() => onSelectDrawingTool?.('textWrite')}
              >
                <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                  <DrawingToolTextIllustration size={86} />
                </span>
              </button>
              <button
                type="button"
                className={`library-drawing-rail-tool${boardTool === 'stickyNote' ? ' is-active' : ''}`}
                aria-pressed={boardTool === 'stickyNote'}
                aria-label="Lísteček"
                onClick={() => onSelectDrawingTool?.('stickyNote')}
              >
                <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                  <DrawingToolStickyNoteIllustration size={72} />
                </span>
              </button>
              <div className="library-drawing-rail-tool-wrap">
                <div ref={drawShapesRailAnchorRef} className="library-drawing-rail-tool-anchor">
                  <button
                    type="button"
                    className={`library-drawing-rail-tool${boardTool === 'drawShapes' ? ' is-active' : ''}`}
                    aria-pressed={boardTool === 'drawShapes'}
                    aria-label="Tvary na plátno"
                    onClick={() => onSelectDrawingTool?.('drawShapes')}
                  >
                    <span className="library-drawing-rail-tool__icon" aria-hidden="true">
                      <DrawingToolShapesIllustration size={72} />
                    </span>
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : libraryView === 'home' && panelMode === 'catalog' ? (
        <div className="library-category-list">
          <div className="library-catalog-scope" ref={libraryCurriculumMenuRef}>
            <h2 id="object-library-dialog-title" className="library-catalog-scope__title">
              Knihovna funkcí
            </h2>
            <p className="library-catalog-scope__pro">{formatLibraryCurriculumLine(libraryGrade, libraryVolume)}</p>
            <div className="library-catalog-scope__change-wrap">
              <button
                type="button"
                className="library-catalog-scope__change"
                aria-expanded={libraryCurriculumMenuOpen}
                aria-haspopup="dialog"
                aria-controls="library-curriculum-menu"
                onClick={() => setLibraryCurriculumMenuOpen((open) => !open)}
              >
                (změnit)
              </button>
              {libraryCurriculumMenuOpen ? (
                <div
                  id="library-curriculum-menu"
                  className="library-catalog-scope__menu"
                  role="dialog"
                  aria-label="Změna rozsahu knihovny (ročník a díl)"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="library-catalog-scope__menu-label">Ročník</span>
                  <div className="library-catalog-scope__menu-pills" role="group" aria-label="Ročník">
                    {LIBRARY_GRADE_LABELS.map(({ grade, label }) => (
                      <button
                        key={grade}
                        type="button"
                        className={`library-catalog-scope__pill${libraryGrade === grade ? ' is-active' : ''}`}
                        aria-pressed={libraryGrade === grade}
                        onClick={() => {
                          setLibraryGrade(grade);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <span className="library-catalog-scope__menu-label">Díl titulu</span>
                  <div className="library-catalog-scope__menu-pills" role="group" aria-label="Díl titulu">
                    {LIBRARY_VOLUME_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`library-catalog-scope__pill${libraryVolume === id ? ' is-active' : ''}`}
                        aria-pressed={libraryVolume === id}
                        onClick={() => {
                          setLibraryVolume(id);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="library-interactive-tile-grid">
            {libraryFilterVisibility.interactive.has('tiles') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  setLibraryView('tiles');
                  setActiveStickerRowId(null);
                  onPinnedMathGlyphsChange(false);
                  setActiveTileVariant('stacked');
                }}
              >
                <span className="library-category-preview tile-fan-preview" aria-hidden="true">
                  {[2, 3, 4].map((value, index) => (
                    <span
                      className={`tile-fan-preview-item tile-fan-preview-item-${index + 1}`}
                      key={value}
                      style={{
                        backgroundColor: TILE_COLORS[value].light,
                        borderColor: TILE_COLORS[value].dark,
                      }}
                    >
                      {Array.from({ length: value }).map((_, dotIndex) => (
                        <span
                          className="tile-fan-preview-dot"
                          key={dotIndex}
                          style={{
                            backgroundColor: TILE_COLORS[value].lightCircle,
                            borderColor: TILE_COLORS[value].dark,
                          }}
                        />
                      ))}
                    </span>
                  ))}
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Dlaždice</strong>
                  <small>Slož číslo, 1-10</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('mathGlyphs') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(true);
                  onClose();
                }}
              >
                <span className="library-category-preview library-math-glyphs-preview" aria-hidden="true">
                  {(['3', '5', '7', '+'] as const).map((ch) => (
                    <span className="library-math-glyphs-preview-cell" key={ch}>
                      {ch}
                    </span>
                  ))}
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Čísla a znaménka</strong>
                  <small>0–9 a operátory — spodní lišta</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('dominoTile') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  onInsertDominoTile();
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(false);
                  onClose();
                }}
              >
                <span className="library-category-preview library-domino-tile-preview" aria-hidden="true">
                  <span className="library-domino-tile-preview__half library-domino-tile-preview__half--left">
                    <span className="library-domino-tile-preview__pip" />
                    <span className="library-domino-tile-preview__pip" />
                  </span>
                  <span className="library-domino-tile-preview__half library-domino-tile-preview__half--right">
                    <span className="library-domino-tile-preview__pip" />
                  </span>
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Domino</strong>
                  <small>± tečky na polovinách</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('numberLines') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  setLibraryView('numberLines');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(false);
                }}
              >
                <span className="library-category-preview number-line-preview" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((value) => (
                    <span className="number-line-preview-node" key={value}>
                      {value}
                    </span>
                  ))}
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Číselné osy</strong>
                  <small>0–5 až 0–100, s figurkou</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('beadCounter') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  setLibraryView('beadCounter');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(false);
                }}
              >
                <span className="library-category-preview bead-counter-preview" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span className="bead-counter-preview-bead is-yellow" key={`yellow-${index}`} />
                  ))}
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span className="bead-counter-preview-bead is-blue" key={`blue-${index}`} />
                  ))}
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Korálkové počítadlo</strong>
                  <small>posouvací korálky na šňůrce</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('diceTray') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  setLibraryView('diceTray');
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(false);
                }}
              >
                <span className="library-category-preview library-dice-preview" aria-hidden="true">
                  <span className="library-dice-preview-die" />
                  <span className="library-dice-preview-die library-dice-preview-die--two" />
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Hrací kostky</strong>
                  <small>3D dojem, hoďte z panelu</small>
                </span>
              </button>
            ) : null}
            {libraryFilterVisibility.interactive.has('spatialTiling') ? (
              <button
                className="library-category-card library-category-card--interactive library-interactive-tile"
                type="button"
                onClick={() => {
                  onInsertSpatialTilingBoard();
                  setActiveStickerRowId(null);
                  setActiveTileVariant(null);
                  onPinnedMathGlyphsChange(false);
                }}
              >
                <span className="library-category-preview library-spatial-tiling-preview" aria-hidden="true">
                  <Grid3x3 size={36} strokeWidth={2.2} />
                </span>
                <span className="library-interactive-tile-label">
                  <strong>Dlaždice na mřížce</strong>
                  <small>tvary jako v Pokládání dlaždic</small>
                </span>
              </button>
            ) : null}
          </div>
          {stickersError ? (
            <div className="sticker-library-error">
              <AlertCircle size={16} strokeWidth={2.2} />
              <span>Knihovnu objektů se nepodařilo načíst.</span>
            </div>
          ) : null}
          {stickersLoading ? <div className="library-category-placeholder">Načítám Vividboard objekty...</div> : null}
          {!stickersLoading && !stickersError ? (
            <div className="library-svg-tile-grid">
              {visibleStickerCategories.map((category) => {
                const previewItems = getStickerCategoryPreviewItems(category);
                return (
                  <button
                    className="library-category-card library-category-card--svg library-svg-tile"
                    type="button"
                    key={category.id}
                    onClick={() => openStickerCategory(category)}
                  >
                    <span className="library-category-preview sticker-category-preview" aria-hidden="true">
                      <span className="sticker-category-preview-cluster">
                        {previewItems.map((sticker, index) => (
                          <span className={`sticker-category-preview-item item-${index + 1}`} key={sticker.id}>
                            <img src={sticker.url} alt="" loading="lazy" />
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="library-svg-tile-label">
                      <strong>{category.label}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {!stickersLoading && !stickersError && visibleStickerCategories.length === 0 && stickerCategories.length > 0 ? (
            <p className="library-filter-empty-hint">V knihovně pro tento dokument zatím nic není.</p>
          ) : null}
        </div>
      ) : null}

      {libraryView === 'tiles' && (
        <div className="build-number-library-block">
          {renderBackHeader()}
          <div className="sticker-library-heading">
            <span>Dlaždice</span>
          </div>
          <div className="library-tile-variant-grid" role="radiogroup" aria-label="Varianta dlaždic">
            <button
              type="button"
              role="radio"
              aria-checked={activeTileVariant === 'stacked'}
              className={`library-tile-variant-pick-cell${activeTileVariant === 'stacked' ? ' is-active' : ''}`}
              aria-label="Prostorové dlaždice"
              onClick={() => {
                setActiveStickerRowId(null);
                onPinnedMathGlyphsChange(false);
                setActiveTileVariant('stacked');
                onClose();
              }}
            >
              <div className="library-tile-variant-pick-visual" aria-hidden="true">
                <span className="tile-stacked-3d-fan-preview">
                  {[2, 3, 4].map((value, i) => (
                    <span
                      key={value}
                      className={`tile-stacked-3d-fan-item tile-stacked-3d-fan-item-${i + 1}`}
                    >
                      <BuildNumberTile
                        value={value}
                        variant="stacked"
                        scale={VARIANT_PICK_STACKED_FAN_SCALE}
                      />
                    </span>
                  ))}
                </span>
              </div>
              <span className="library-tile-variant-pick-heading">Prostorové</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={activeTileVariant === 'flat'}
              className={`library-tile-variant-pick-cell${activeTileVariant === 'flat' ? ' is-active' : ''}`}
              aria-label="Ploché dlaždice"
              onClick={() => {
                setActiveStickerRowId(null);
                onPinnedMathGlyphsChange(false);
                setActiveTileVariant('flat');
                onClose();
              }}
            >
              <div className="library-tile-variant-pick-visual" aria-hidden="true">
                <span className="tile-flat-fan-preview">
                  {[2, 3, 4].map((value, index) => (
                    <span
                      key={value}
                      className={`tile-flat-fan-item tile-flat-fan-item-${index + 1}`}
                      style={{
                        backgroundColor: TILE_COLORS[value].light,
                        borderColor: TILE_COLORS[value].dark,
                      }}
                    >
                      {Array.from({ length: value }).map((_, dotIndex) => (
                        <span
                          key={dotIndex}
                          className="tile-flat-fan-dot"
                          style={{
                            backgroundColor: TILE_COLORS[value].lightCircle,
                            borderColor: TILE_COLORS[value].dark,
                          }}
                        />
                      ))}
                    </span>
                  ))}
                </span>
              </div>
              <span className="library-tile-variant-pick-heading">Ploché</span>
            </button>
          </div>
        </div>
      )}

      {libraryView === 'tasks' && tasksDetail ? (
        <div className="task-library-block">
          {renderTasksDrillHeader()}
          {!teacherPanelShowsStudentPreview ? (
          <div className="sticker-library-heading">
            <span>
              {tasksDetail === 'sequence'
                ? 'Řady a posloupnosti'
                : tasksDetail === 'arithmetic'
                  ? 'Jednoduché příklady'
                  : tasksDetail === 'domino'
                    ? 'Domino úlohy'
                    : 'Zjisti'}
            </span>
          </div>
          ) : null}
          {tasksDetail === 'sequence' ? (
            teacherPanelShowsStudentPreview ? (
              <div className="task-teacher-student-preview-panel task-teacher-student-preview-panel--compact task-config-card">
                <button
                  type="button"
                  className="task-teacher-configure-btn"
                  onClick={() => onTeacherTaskPanelLayoutChange?.('configure')}
                >
                  Nastavit
                </button>
              </div>
            ) : (
          <div className="task-config-card">
            <div className="task-config-intro">
              <strong>Řady a posloupnosti</strong>
              <small>Dítě klikne na prázdné políčko a vybere správný prvek z nabídky.</small>
            </div>

            <label className="task-config-field">
              <span>Obtížnost</span>
              <select
                value={sequenceSettings.difficulty}
                onChange={(event) =>
                  setSequenceSettings((current) => ({
                    ...current,
                    difficulty: event.target.value as SequenceDifficulty,
                    seed: createTaskSeed(),
                  }))
                }
              >
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {sequenceDifficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>

            <label className="task-config-field">
              <span>Vzor</span>
              <select
                value={sequenceSettings.patternKind}
                onChange={(event) =>
                  setSequenceSettings((current) => ({
                    ...current,
                    patternKind: event.target.value as SequencePatternKind,
                    seed: createTaskSeed(),
                  }))
                }
              >
                {(['AB', 'ABC', 'ABCD'] as const).map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {sequencePatternLabel(pattern)}
                  </option>
                ))}
              </select>
            </label>

            <div className="task-config-field">
              <span>Prvky</span>
              <div className="task-operation-pills" role="group" aria-label="Prvky posloupnosti">
                {(['shape', 'number', 'tile'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={sequenceSettings.itemKinds.includes(kind) ? 'is-active' : ''}
                    aria-pressed={sequenceSettings.itemKinds.includes(kind)}
                    onClick={() =>
                      setSequenceSettings((current) => ({
                        ...current,
                        itemKinds: toggleSequenceKind(current.itemKinds, kind),
                        seed: createTaskSeed(),
                      }))
                    }
                  >
                    {sequenceKindLabel(kind)}
                  </button>
                ))}
              </div>
            </div>

            <label className="task-config-field">
              <span>Počet řad</span>
              <input
                type="number"
                min={1}
                max={12}
                value={sequenceSettings.exampleCount}
                onChange={(event) =>
                  setSequenceSettings((current) => ({
                    ...current,
                    exampleCount: Number(event.target.value),
                  }))
                }
              />
            </label>

            <div className="task-config-actions">
              <button
                type="button"
                className="task-primary-action"
                onClick={() => {
                  void onCreateSequenceAssignment({
                    ...sequenceSettings,
                    seed: sequenceSettings.seed || createTaskSeed(),
                  });
                }}
              >
                Vložit řady
              </button>
            </div>
          </div>
            )
          ) : null}
          {tasksDetail === 'arithmetic' ? (
            teacherPanelShowsStudentPreview ? (
              <div className="task-teacher-student-preview-panel task-teacher-student-preview-panel--compact task-config-card">
                <button
                  type="button"
                  className="task-teacher-configure-btn"
                  onClick={() => onTeacherTaskPanelLayoutChange?.('configure')}
                >
                  Nastavit
                </button>
              </div>
            ) : (
          <div className="task-config-card">
            <div className="task-config-intro">
              <strong>Jednoduché příklady</strong>
              <small>Žák skládá odpověď z čísel a znamének na ploše.</small>
            </div>

            <label className="task-config-field">
              <span>Úroveň</span>
              <select
                value={arithmeticSettings.difficulty}
                onChange={(event) => {
                  const difficulty = event.target.value as ArithmeticDifficulty;
                  const preset = ARITHMETIC_DIFFICULTY_PRESETS[difficulty];
                  setArithmeticSettings((current) => ({
                    ...current,
                    difficulty,
                    ...preset,
                  }));
                }}
              >
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {arithmeticDifficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>

            <div className="task-config-field">
              <span>Operace</span>
              <div className="task-operation-pills" role="group" aria-label="Operace příkladů">
                {(['add', 'subtract', 'multiply'] as const).map((operation) => (
                  <button
                    key={operation}
                    type="button"
                    className={arithmeticSettings.operations.includes(operation) ? 'is-active' : ''}
                    aria-pressed={arithmeticSettings.operations.includes(operation)}
                    onClick={() =>
                      setArithmeticSettings((current) => ({
                        ...current,
                        operations: toggleArithmeticOperation(current.operations, operation),
                        seed: createTaskSeed(),
                      }))
                    }
                  >
                    {arithmeticOperationLabel(operation)}
                  </button>
                ))}
              </div>
            </div>

            <div className="task-config-field">
              <span>Při znovu vložit</span>
              <div className="task-operation-pills" role="group" aria-label="Jak zacházet s příklady na plátně">
                {(
                  [
                    { v: 'uniqueEachInsert' as ArithmeticExampleVariety, label: 'Nové (náhodně)' },
                    { v: 'keepCanvas' as ArithmeticExampleVariety, label: 'Stejné jako na plátně' },
                  ] as const
                ).map(({ v, label }) => {
                  const active = (arithmeticSettings.exampleVariety ?? 'uniqueEachInsert') === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      className={active ? 'is-active' : ''}
                      aria-pressed={active}
                      onClick={() =>
                        setArithmeticSettings((current) => ({
                          ...current,
                          exampleVariety: v,
                        }))
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="task-config-grid">
              <label className="task-config-field">
                <span>Počet</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={arithmeticSettings.exampleCount}
                  onChange={(event) =>
                    setArithmeticSettings((current) => ({
                      ...current,
                      exampleCount: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="task-config-field">
                <span>Čísla od</span>
                <input
                  type="number"
                  value={arithmeticSettings.operandMin}
                  onChange={(event) =>
                    setArithmeticSettings((current) => ({
                      ...current,
                      operandMin: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="task-config-field">
                <span>Čísla do</span>
                <input
                  type="number"
                  value={arithmeticSettings.operandMax}
                  onChange={(event) =>
                    setArithmeticSettings((current) => ({
                      ...current,
                      operandMax: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="task-config-field">
                <span>Výsledek od</span>
                <input
                  type="number"
                  value={arithmeticSettings.resultMin ?? ''}
                  onChange={(event) =>
                    setArithmeticSettings((current) => ({
                      ...current,
                      resultMin: event.target.value === '' ? undefined : Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="task-config-field">
                <span>Výsledek do</span>
                <input
                  type="number"
                  value={arithmeticSettings.resultMax ?? ''}
                  onChange={(event) =>
                    setArithmeticSettings((current) => ({
                      ...current,
                      resultMax: event.target.value === '' ? undefined : Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="task-config-actions">
              <button
                type="button"
                className="task-primary-action"
                onClick={() => {
                  void onCreateArithmeticAssignment({
                    ...arithmeticSettings,
                    seed: arithmeticSettings.seed || createTaskSeed(),
                  });
                }}
              >
                Vložit
              </button>
            </div>
          </div>
            )
          ) : null}
          {tasksDetail === 'domino' ? (
            teacherPanelShowsStudentPreview ? (
              <div className="task-teacher-student-preview-panel task-teacher-student-preview-panel--compact task-config-card">
                <button
                  type="button"
                  className="task-teacher-configure-btn"
                  onClick={() => onTeacherTaskPanelLayoutChange?.('configure')}
                >
                  Nastavit
                </button>
              </div>
            ) : (
          <div className="task-config-card">
            <div className="task-config-intro">
              <strong>Domino</strong>
              <small>Úlohy s kartami domino — žák skládá odpověď čísly z lišty.</small>
            </div>

            <label className="task-config-field">
              <span>Režim</span>
              <select
                value={dominoSettings.mode}
                onChange={(event) =>
                  setDominoSettings((current) => ({
                    ...current,
                    mode: event.target.value as DominoExerciseMode,
                    seed: createTaskSeed(),
                  }))
                }
              >
                {(['missingAddition', 'dominoSum', 'partition'] as const).map((mode) => (
                  <option key={mode} value={mode}>
                    {dominoModeLabel(mode)}
                  </option>
                ))}
              </select>
            </label>

            <label className="task-config-field">
              <span>Úroveň</span>
              <select
                value={dominoSettings.difficulty}
                onChange={(event) => {
                  const difficulty = event.target.value as ArithmeticDifficulty;
                  setDominoSettings((current) => ({
                    ...current,
                    difficulty,
                    seed: createTaskSeed(),
                  }));
                }}
              >
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {arithmeticDifficultyLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>

            <label className="task-config-field">
              <span>Počet karet</span>
              <input
                type="number"
                min={1}
                max={14}
                value={dominoSettings.exampleCount}
                onChange={(event) =>
                  setDominoSettings((current) => ({
                    ...current,
                    exampleCount: Number(event.target.value),
                  }))
                }
              />
            </label>

            <div className="task-config-actions">
              <button
                type="button"
                className="task-primary-action"
                onClick={() => {
                  void onCreateDominoAssignment({
                    ...dominoSettings,
                    seed: dominoSettings.seed || createTaskSeed(),
                  });
                }}
              >
                Vložit domino
              </button>
            </div>
          </div>
            )
          ) : null}
          {tasksDetail === 'marbleBag' ? (
            teacherPanelShowsStudentPreview ? (
              <div className="task-teacher-student-preview-panel task-teacher-student-preview-panel--compact task-config-card">
                <button
                  type="button"
                  className="task-teacher-configure-btn"
                  onClick={() => onTeacherTaskPanelLayoutChange?.('configure')}
                >
                  Nastavit
                </button>
              </div>
            ) : (
          <div className="task-config-card">
            <div className="task-config-intro">
              <strong>Zjisti</strong>
              <small>Žák vidí celkem a část venku, do pytlíčku doplní chybějící počet.</small>
            </div>

            <div className="task-config-grid">
              <label className="task-config-field">
                <span>Celkem od</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={marbleBagSettings.totalMin}
                  onChange={(event) =>
                    setMarbleBagSettings((current) => ({
                      ...current,
                      totalMin: Number(event.target.value),
                      seed: createTaskSeed(),
                    }))
                  }
                />
              </label>
              <label className="task-config-field">
                <span>Celkem do</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={marbleBagSettings.totalMax}
                  onChange={(event) =>
                    setMarbleBagSettings((current) => ({
                      ...current,
                      totalMax: Number(event.target.value),
                      seed: createTaskSeed(),
                    }))
                  }
                />
              </label>
            </div>

            <div className="task-config-field">
              <span>Zobrazit celkem</span>
              <div className="task-operation-pills" role="group" aria-label="Zobrazení celkového počtu">
                {(
                  [
                    { v: 'lines' as MarbleBagTotalDisplayMode, label: 'Čárky' },
                    { v: 'number' as MarbleBagTotalDisplayMode, label: 'Číslo' },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    className={marbleBagSettings.totalDisplayMode === v ? 'is-active' : ''}
                    aria-pressed={marbleBagSettings.totalDisplayMode === v}
                    onClick={() =>
                      setMarbleBagSettings((current) => ({
                        ...current,
                        totalDisplayMode: v,
                        seed: createTaskSeed(),
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="task-config-field">
              <span>Doplňování</span>
              <div className="task-operation-pills" role="group" aria-label="Způsob doplnění pytlíčku">
                {(
                  [
                    { v: 'marbles' as MarbleBagAnswerMode, label: 'Kuličkami' },
                    { v: 'number' as MarbleBagAnswerMode, label: 'Číslem' },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    className={marbleBagSettings.answerMode === v ? 'is-active' : ''}
                    aria-pressed={marbleBagSettings.answerMode === v}
                    onClick={() =>
                      setMarbleBagSettings((current) => ({
                        ...current,
                        answerMode: v,
                        seed: createTaskSeed(),
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="task-config-field">
              <span>Počet úkolů</span>
              <input
                type="number"
                min={1}
                max={16}
                value={marbleBagSettings.exampleCount}
                onChange={(event) =>
                  setMarbleBagSettings((current) => ({
                    ...current,
                    exampleCount: Number(event.target.value),
                  }))
                }
              />
            </label>

            <div className="task-config-actions">
              <button
                type="button"
                className="task-primary-action"
                onClick={() => {
                  void onCreateMarbleBagAssignment({
                    ...marbleBagSettings,
                    seed: marbleBagSettings.seed || createTaskSeed(),
                  });
                }}
              >
                Vložit Zjisti
              </button>
            </div>
          </div>
            )
          ) : null}
        </div>
      ) : null}

      {libraryView === 'numberLines' && (
        <div className="number-line-library-block">
          {renderBackHeader()}
          <div className="sticker-library-heading">
            <span>Číselné osy</span>
            <span>{NUMBER_LINE_PRESETS.length + 1} předvolby</span>
          </div>
          <div className="number-line-preset-list">
            {NUMBER_LINE_PRESETS.map((preset) => (
              <button
                className="number-line-preset-card"
                type="button"
                key={preset.label}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-number-line', JSON.stringify(preset));
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onInsertNumberLine(preset.start, preset.end)}
              >
                <span>{preset.label}</span>
                <div className="number-line-preset-preview" aria-hidden="true">
                  {Array.from({ length: Math.min(6, preset.end - preset.start + 1) }, (_, index) => preset.start + index).map(
                    (value) => (
                      <span key={value}>{value}</span>
                    ),
                  )}
                </div>
              </button>
            ))}
            <button
              className="number-line-preset-card figure-number-line-card"
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-number-line', JSON.stringify(FIGURE_NUMBER_LINE_PRESET));
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onInsertNumberLine(FIGURE_NUMBER_LINE_PRESET.start, FIGURE_NUMBER_LINE_PRESET.end, true)}
            >
              <span>{FIGURE_NUMBER_LINE_PRESET.label}</span>
              <div className="number-line-preset-preview figure-number-line-preview" aria-hidden="true">
                {[FIGURE_NUMBER_LINE_PRESET.start, 5, FIGURE_NUMBER_LINE_PRESET.end].map((value) => (
                  <span key={value}>{value}</span>
                ))}
                <img
                  className="figure-preview-ludo-piece"
                  src={numberLineBoardGameFigureUrl(0)}
                  alt=""
                  draggable={false}
                />
              </div>
            </button>
          </div>
        </div>
      )}

      {libraryView === 'beadCounter' && (
        <div className="number-line-library-block">
          {renderBackHeader()}
          <div className="sticker-library-heading">
            <span>Korálkové počítadlo</span>
            <span>2 typy</span>
          </div>
          <button
            className="bead-counter-card"
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-bead-counter', JSON.stringify({ type: 'beadCounter', variant: 'ten' }));
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onInsertBeadCounter('ten')}
          >
            <div className="bead-counter-card-preview" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((index) => (
                <span className="bead-counter-card-bead is-yellow" key={`yellow-${index}`} />
              ))}
              {[0, 1, 2, 3, 4].map((index) => (
                <span className="bead-counter-card-bead is-blue" key={`blue-${index}`} />
              ))}
            </div>
            <span>Do 10</span>
          </button>
          <button
            className="bead-counter-card"
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-bead-counter', JSON.stringify({ type: 'beadCounter', variant: 'twenty' }));
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onInsertBeadCounter('twenty')}
          >
            <div className="bead-counter-card-preview is-twenty" aria-hidden="true">
              {Array.from({ length: 20 }, (_, index) => (
                <span
                  className={`bead-counter-card-bead ${Math.floor(index / 5) % 2 === 0 ? 'is-yellow' : 'is-blue'}`}
                  key={index}
                />
              ))}
            </div>
            <span>Do 20</span>
          </button>
        </div>
      )}

      {libraryView === 'diceTray' && (
        <div className="number-line-library-block">
          {renderBackHeader()}
          <div className="sticker-library-heading">
            <span>Hrací kostky</span>
            <span>Panel vlevo</span>
          </div>
          <button
            className="dice-tray-library-card"
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-dice-tray', JSON.stringify({ type: 'diceTray' }));
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onInsertDiceTray()}
          >
            <div className="dice-tray-library-card-preview" aria-hidden="true">
              <span className="dice-tray-library-mini die-a" />
              <span className="dice-tray-library-mini die-b" />
            </div>
            <span className="dice-tray-library-card-title">Vložit stolek kostek</span>
            <span className="dice-tray-library-card-hint">
              Po výběru: v dokumentovém panelu Hoďit, + Kostka a typ D4–D20.
            </span>
          </button>
        </div>
      )}

      {selectedStickerCategory && (
        <div className="sticker-library-block">
          {renderBackHeader()}
          <div className="sticker-library-heading">
            <span>{selectedStickerCategory.label}</span>
          </div>
          <p className="library-type-picker-hint">
            Vyber řadu — obrázky se hned objeví ve spodní liště k přetahování nebo kliknutí.
          </p>

          <div className="sticker-category-list">
            <section className="sticker-category sticker-category-rows-pick">
              {selectedStickerCategory.rows.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  className={`library-variant-pick-row sticker-row-pick-tile${activeStickerRowId === row.id ? ' is-active' : ''}`}
                  aria-label={`Zobrazit řadu ${getRowLabel(selectedStickerCategory.id, row.row)} ve spodní liště`}
                  onClick={() => {
                    setActiveTileVariant(null);
                    onPinnedMathGlyphsChange(false);
                    setActiveStickerRowId(row.id);
                  }}
                >
                  <span className="library-category-preview sticker-category-preview sticker-row-pick-preview" aria-hidden="true">
                    {row.items.slice(0, 4).map((sticker, index) => (
                      <span className={`sticker-category-preview-item item-${index + 1}`} key={sticker.id}>
                        <img src={sticker.url} alt="" loading="lazy" />
                      </span>
                    ))}
                  </span>
                  <div className="library-variant-pick-text">
                    <span className="sticker-row-label sticker-row-label--pick">{getRowLabel(selectedStickerCategory.id, row.row)}</span>
                  </div>
                </button>
              ))}
            </section>
          </div>
        </div>
      )}
        </div>
      </aside>
      ) : null}
      {drawShapesPopoverFixed
        ? createPortal(
            <div
              className="library-draw-shape-popover"
              style={{
                position: 'fixed',
                top: drawShapesPopoverFixed.top,
                left: drawShapesPopoverFixed.left,
                transform: 'translateY(-50%)',
                zIndex: 95,
              }}
              role="group"
              aria-label="Tvar"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={`library-draw-shape-kind-btn${drawShapeKind === 'circle' ? ' is-active' : ''}`}
                aria-pressed={drawShapeKind === 'circle'}
                title="Kruh"
                onClick={() => onDrawShapeKindChange?.('circle')}
              >
                ○
              </button>
              <button
                type="button"
                className={`library-draw-shape-kind-btn${drawShapeKind === 'square' ? ' is-active' : ''}`}
                aria-pressed={drawShapeKind === 'square'}
                title="Čtverec"
                onClick={() => onDrawShapeKindChange?.('square')}
              >
                □
              </button>
              <button
                type="button"
                className={`library-draw-shape-kind-btn${drawShapeKind === 'arrow' ? ' is-active' : ''}`}
                aria-pressed={drawShapeKind === 'arrow'}
                title="Šipka"
                onClick={() => onDrawShapeKindChange?.('arrow')}
              >
                →
              </button>
            </div>,
            document.body
          )
        : null}
      {brushColorPopoverFixed && onBrushColorChange && !brushColorPickerHidden
        ? createPortal(
            <LibraryDrawingColorPopover
              presets={BRUSH_COLOR_PRESETS}
              current={brushColor}
              onPick={pickBrushColor}
              ariaLabel="Barva tužky"
              style={{
                position: 'fixed',
                top: brushColorPopoverFixed.top,
                left: brushColorPopoverFixed.left,
                transform: 'translateY(-50%)',
                zIndex: 95,
              }}
            />,
            document.body,
          )
        : null}
      {highlighterColorPopoverFixed && onHighlighterColorChange && !highlighterColorPickerHidden
        ? createPortal(
            <LibraryDrawingColorPopover
              presets={HIGHLIGHTER_COLOR_PRESETS}
              current={highlighterColor}
              onPick={pickHighlighterColor}
              ariaLabel="Barva zvýrazňovače"
              style={{
                position: 'fixed',
                top: highlighterColorPopoverFixed.top,
                left: highlighterColorPopoverFixed.left,
                transform: 'translateY(-50%)',
                zIndex: 95,
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}
