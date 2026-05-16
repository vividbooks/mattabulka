import type { TaskAssignmentSettings } from './taskAssignments';

export const BOARD_DOCUMENT_FORMAT_VERSION = 1 as const;

export const BOARD_FILE_EXTENSION = '.mnboard';

export interface BoardDocumentViewport {
  x: number;
  y: number;
  scale: number;
}

export type BoardBackgroundPattern =
  | 'blank'
  | 'dots'
  | 'denseDots'
  | 'grid'
  | 'largeGrid'
  | 'lines'
  | 'wideLines'
  | 'isometric'
  | 'crosses'
  | 'notebook';

export interface BoardBackgroundSettings {
  color: string;
  pattern: BoardBackgroundPattern;
}

export const DEFAULT_BOARD_BACKGROUND: BoardBackgroundSettings = {
  color: '#faf3d4',
  pattern: 'blank',
};

export interface BoardDocumentMetadata {
  subject: string;
  grade: string;
  part: string;
}

export const DEFAULT_BOARD_METADATA: BoardDocumentMetadata = {
  subject: 'Matematika',
  grade: '',
  part: '',
};

export interface BoardDocumentV1 {
  formatVersion: 1;
  app: 'ma_nastenka';
  title: string;
  createdAt: string;
  modifiedAt: string;
  viewport: BoardDocumentViewport;
  /** Serializované objekty plátna (stejné struktury jako v runtime). */
  objects: unknown[];
  ui: {
    libraryDock: 'side' | 'bottom';
    background?: BoardBackgroundSettings;
    metadata?: BoardDocumentMetadata;
  };
  /** Volitelně uložené nastavení generátoru úlohy (odkaz na sdílení v URL). */
  task?: TaskAssignmentSettings | null;
}

export type BoardDocumentParseResult =
  | { ok: true; doc: BoardDocumentV1 }
  | { ok: false; error: string };

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function validateViewport(v: unknown): BoardDocumentViewport | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!isFiniteNumber(o.x) || !isFiniteNumber(o.y) || !isFiniteNumber(o.scale)) return null;
  return { x: o.x, y: o.y, scale: o.scale };
}

function validateLibraryDock(v: unknown): 'side' | 'bottom' | null {
  return v === 'side' || v === 'bottom' ? v : null;
}

function validateTask(v: unknown): TaskAssignmentSettings | null {
  if (v === null || v === undefined) return null;
  if (!v || typeof v !== 'object') return null;
  const t = (v as { type?: unknown }).type;
  if (t === 'arithmetic' || t === 'sequence' || t === 'domino') {
    return v as TaskAssignmentSettings;
  }
  return null;
}

function validateBackground(v: unknown): BoardBackgroundSettings {
  if (!v || typeof v !== 'object') return DEFAULT_BOARD_BACKGROUND;
  const o = v as Record<string, unknown>;
  const color = typeof o.color === 'string' && /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : DEFAULT_BOARD_BACKGROUND.color;
  const pattern =
    o.pattern === 'dots' ||
    o.pattern === 'denseDots' ||
    o.pattern === 'grid' ||
    o.pattern === 'largeGrid' ||
    o.pattern === 'lines' ||
    o.pattern === 'wideLines' ||
    o.pattern === 'isometric' ||
    o.pattern === 'crosses' ||
    o.pattern === 'notebook' ||
    o.pattern === 'blank'
      ? o.pattern
      : DEFAULT_BOARD_BACKGROUND.pattern;
  return { color, pattern };
}

function validateMetadata(v: unknown): BoardDocumentMetadata {
  if (!v || typeof v !== 'object') return DEFAULT_BOARD_METADATA;
  const o = v as Record<string, unknown>;
  return {
    subject: typeof o.subject === 'string' ? o.subject.trim().slice(0, 80) || DEFAULT_BOARD_METADATA.subject : DEFAULT_BOARD_METADATA.subject,
    grade: typeof o.grade === 'string' ? o.grade.trim().slice(0, 20) : DEFAULT_BOARD_METADATA.grade,
    part: typeof o.part === 'string' ? o.part.trim().slice(0, 20) : DEFAULT_BOARD_METADATA.part,
  };
}

export function parseBoardDocumentJson(text: string): BoardDocumentParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Soubor není platný JSON.' };
  }
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Kořen dokumentu musí být objekt.' };
  }
  const doc = raw as Record<string, unknown>;
  if (doc.formatVersion !== 1) {
    return { ok: false, error: `Nepodporovaná verze formátu (${String(doc.formatVersion)}).` };
  }
  if (doc.app !== 'ma_nastenka') {
    return { ok: false, error: 'Soubor nepochází z této aplikace.' };
  }
  if (typeof doc.title !== 'string') {
    return { ok: false, error: 'Chybí název dokumentu.' };
  }
  const viewport = validateViewport(doc.viewport);
  if (!viewport) {
    return { ok: false, error: 'Neplatný viewport (očekává se { x, y, scale }).' };
  }
  if (!Array.isArray(doc.objects)) {
    return { ok: false, error: 'Pole objektů musí být pole.' };
  }
  const ui = doc.ui;
  if (!ui || typeof ui !== 'object') {
    return { ok: false, error: 'Chybí sekce ui.' };
  }
  const libraryDock = validateLibraryDock((ui as { libraryDock?: unknown }).libraryDock);
  if (!libraryDock) {
    return { ok: false, error: 'Neplatná hodnota ui.libraryDock.' };
  }
  const createdAt = typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString();
  const modifiedAt = typeof doc.modifiedAt === 'string' ? doc.modifiedAt : new Date().toISOString();
  const task = doc.task !== undefined ? validateTask(doc.task) : undefined;

  const out: BoardDocumentV1 = {
    formatVersion: 1,
    app: 'ma_nastenka',
    title: doc.title.trim() || 'Nástěnka',
    createdAt,
    modifiedAt,
    viewport,
    objects: doc.objects as unknown[],
    ui: {
      libraryDock,
      background: validateBackground((ui as { background?: unknown }).background),
      metadata: validateMetadata((ui as { metadata?: unknown }).metadata),
    },
  };
  if (task !== undefined) {
    out.task = task;
  }
  return { ok: true, doc: out };
}

export function buildBoardDocumentJson(input: {
  title: string;
  viewport: BoardDocumentViewport;
  objects: unknown[];
  libraryDock: 'side' | 'bottom';
  background?: BoardBackgroundSettings;
  metadata?: BoardDocumentMetadata;
  createdAt?: string;
  task?: TaskAssignmentSettings | null;
}): string {
  const now = new Date().toISOString();
  const doc: BoardDocumentV1 = {
    formatVersion: 1,
    app: 'ma_nastenka',
    title: input.title.trim() || 'Nástěnka',
    createdAt: input.createdAt ?? now,
    modifiedAt: now,
    viewport: input.viewport,
    objects: input.objects,
    ui: {
      libraryDock: input.libraryDock,
      background: input.background ?? DEFAULT_BOARD_BACKGROUND,
      metadata: input.metadata ?? DEFAULT_BOARD_METADATA,
    },
  };
  if (input.task !== undefined) {
    doc.task = input.task;
  }
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function suggestedBoardFileName(title: string): string {
  const base =
    title
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'nastenka';
  return `${base}${BOARD_FILE_EXTENSION}`;
}

export function downloadBoardDocumentBlob(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith(BOARD_FILE_EXTENSION) ? filename : `${filename}${BOARD_FILE_EXTENSION}`;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}
