/**
 * Kurikulum ve výsuvné knihovně (ročník + titul/díly).
 * Mapování „co je v dílu“ doplníte sem — zatím se zobrazuje celý obsah.
 */

export type LibraryGrade = 1 | 2;

/** Číslo dílu titulu (1., 2., 3. díl) — rozšířitelné o další díly. */
export type LibraryVolumePart = 1 | 2 | 3;

export type LibraryInteractiveCategoryId =
  | 'numberLines'
  | 'beadCounter'
  | 'diceTray'
  | 'tiles'
  | 'mathGlyphs'
  | 'dominoTile'
  | 'spatialTiling';

export const LIBRARY_GRADE_LABELS: readonly { grade: LibraryGrade; label: string }[] = [
  { grade: 1, label: '1. ročník' },
  { grade: 2, label: '2. ročník' },
];

export const LIBRARY_VOLUME_OPTIONS: readonly { id: LibraryVolumePart; label: string }[] = [
  { id: 1, label: '1. díl' },
  { id: 2, label: '2. díl' },
  { id: 3, label: '3. díl' },
];

export const LIBRARY_SUBJECT_LABEL = 'Matematika';

export const LIBRARY_CURRICULUM_STORAGE_KEY = 'ma-library-curriculum';

export function readLibraryCurriculumFromStorage(): { grade: LibraryGrade; volume: LibraryVolumePart } {
  try {
    const raw = localStorage.getItem(LIBRARY_CURRICULUM_STORAGE_KEY);
    if (!raw) return { grade: 1, volume: 1 };
    const j = JSON.parse(raw) as { grade?: unknown; volume?: unknown };
    const g = Number(j.grade);
    const v = Number(j.volume);
    if (g === 1 || g === 2) {
      if (v === 1 || v === 2 || v === 3) {
        return { grade: g as LibraryGrade, volume: v as LibraryVolumePart };
      }
    }
  } catch {
    /* noop */
  }
  return { grade: 1, volume: 1 };
}

export function writeLibraryCurriculumToStorage(grade: LibraryGrade, volume: LibraryVolumePart): void {
  try {
    localStorage.setItem(LIBRARY_CURRICULUM_STORAGE_KEY, JSON.stringify({ grade, volume }));
  } catch {
    /* noop */
  }
}

/** Jedna řádka „Pro: Matematika …“ pro záhlaví knihovny. */
export function formatLibraryCurriculumLine(grade: LibraryGrade, volume: LibraryVolumePart): string {
  const g = LIBRARY_GRADE_LABELS.find((x) => x.grade === grade)?.label ?? `${grade}. ročník`;
  const v = LIBRARY_VOLUME_OPTIONS.find((x) => x.id === volume)?.label ?? `${volume}. díl`;
  return `Pro: ${LIBRARY_SUBJECT_LABEL} ${g}, ${v}`;
}

export interface LibraryHomeFilterVisibility {
  /** Zobrazené karty v sekci „Interaktivní rozhraní“. */
  interactive: ReadonlySet<LibraryInteractiveCategoryId>;
  /** `null` = všechny kategorie sticker knihovny; jinak jen tyto ID. */
  stickerCategoryIds: ReadonlySet<string> | null;
}

const ALL_INTERACTIVE: ReadonlySet<LibraryInteractiveCategoryId> = new Set([
  'numberLines',
  'beadCounter',
  'diceTray',
  'tiles',
  'mathGlyphs',
  'dominoTile',
  'spatialTiling',
]);

/** TODO: podle grade + volume vraťte podmnožinu kategorií / interaktivek podle VAŠÍ tabulky dílů. */
export function getLibraryHomeFilterVisibility(
  _grade: LibraryGrade,
  _volume: LibraryVolumePart,
): LibraryHomeFilterVisibility {
  void _grade;
  void _volume;
  return {
    interactive: ALL_INTERACTIVE,
    stickerCategoryIds: null,
  };
}
