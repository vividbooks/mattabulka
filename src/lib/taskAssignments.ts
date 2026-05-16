export type ArithmeticOperation = 'add' | 'subtract' | 'multiply';

/** uniqueEachInsert = při každém „Vložit“ nová náhodná sada; keepCanvas = zachovat čísla z příkladů už na plátně (doplň jen chybějící). */
export type ArithmeticExampleVariety = 'uniqueEachInsert' | 'keepCanvas';

export type ArithmeticDifficulty = 'easy' | 'medium' | 'hard';
export type SequenceDifficulty = 'easy' | 'medium' | 'hard';
export type SequenceItemKind = 'number' | 'tile' | 'shape';
export type SequencePatternKind = 'AB' | 'ABC' | 'ABCD';
export type MarbleBagAnswerMode = 'marbles' | 'number';

export interface ArithmeticTaskSettings {
  type: 'arithmetic';
  difficulty: ArithmeticDifficulty;
  operations: ArithmeticOperation[];
  exampleCount: number;
  operandMin: number;
  operandMax: number;
  resultMin?: number;
  resultMax?: number;
  seed: number;
  exampleVariety?: ArithmeticExampleVariety;
}

export interface SequenceTaskSettings {
  type: 'sequence';
  difficulty: SequenceDifficulty;
  patternKind: SequencePatternKind;
  itemKinds: SequenceItemKind[];
  exampleCount: number;
  seed: number;
}

export interface MarbleBagTaskSettings {
  type: 'marbleBag';
  total: number;
  answerMode: MarbleBagAnswerMode;
  exampleCount: number;
  seed: number;
}

export interface ArithmeticExample {
  id: string;
  index: number;
  a: number;
  b: number;
  operation: ArithmeticOperation;
  expectedAnswer: number;
}

export interface SequenceItem {
  key: string;
  kind: SequenceItemKind;
  label: string;
}

export interface SequenceCell {
  id: string;
  row: number;
  col: number;
  expectedKey: string;
  given: boolean;
  answerKey?: string;
}

export interface SequenceExample {
  id: string;
  index: number;
  rows: number;
  cols: number;
  pattern: string[];
  choices: SequenceItem[];
  cells: SequenceCell[];
}

export interface MarbleBagExample {
  id: string;
  index: number;
  total: number;
  onTable: number;
  expectedInBag: number;
  answerMode: MarbleBagAnswerMode;
}

export interface EncodedArithmeticAssignment {
  v: 1;
  t: 'arithmetic';
  d: ArithmeticDifficulty;
  ops: ArithmeticOperation[];
  c: number;
  omin: number;
  omax: number;
  rmin?: number;
  rmax?: number;
  seed: number;
  /** u = uniqueEachInsert, k = keepCanvas */
  ev?: 'u' | 'k';
}

export interface EncodedSequenceAssignment {
  v: 1;
  t: 'sequence';
  d: SequenceDifficulty;
  p?: SequencePatternKind;
  kinds: SequenceItemKind[];
  c: number;
  seed: number;
}

/** Režimy domino úloh podle odkazovaných vzorů (Vividbooks minihru zde lokálně nenačítáme). */
export type DominoExerciseMode = 'missingAddition' | 'dominoSum' | 'partition';

export interface DominoTaskSettings {
  type: 'domino';
  mode: DominoExerciseMode;
  difficulty: ArithmeticDifficulty;
  exampleCount: number;
  seed: number;
}

export interface DominoExample {
  id: string;
  index: number;
  mode: DominoExerciseMode;
  /** null = vizuální „dírka“ v polovině domina */
  leftPips: number | null;
  rightPips: number | null;
  /** Celkový součet (readonly u prostředku/dolu podle typu úlohy) */
  targetSum: number;
  expectLeft: number;
  expectRight: number;
}

export interface EncodedDominoAssignment {
  v: 1;
  t: 'domino';
  m: DominoExerciseMode;
  d: ArithmeticDifficulty;
  c: number;
  seed: number;
}

export interface EncodedMarbleBagAssignment {
  v: 1;
  t: 'marbleBag';
  total: number;
  mode: MarbleBagAnswerMode;
  c: number;
  seed: number;
}

export type TaskAssignmentSettings = ArithmeticTaskSettings | SequenceTaskSettings | DominoTaskSettings | MarbleBagTaskSettings;
export type EncodedTaskAssignment =
  | EncodedArithmeticAssignment
  | EncodedSequenceAssignment
  | EncodedDominoAssignment
  | EncodedMarbleBagAssignment;

export const ARITHMETIC_DIFFICULTY_PRESETS: Record<
  ArithmeticDifficulty,
  Pick<ArithmeticTaskSettings, 'operandMin' | 'operandMax' | 'resultMin' | 'resultMax'>
> = {
  easy: { operandMin: 0, operandMax: 10, resultMin: 0, resultMax: 20 },
  medium: { operandMin: 0, operandMax: 50, resultMin: 0, resultMax: 100 },
  hard: { operandMin: 0, operandMax: 100, resultMin: -100, resultMax: 200 },
};

const SEQUENCE_DIFFICULTY_PRESETS: Record<SequenceDifficulty, { rows: number; cols: number }> = {
  easy: { rows: 1, cols: 10 },
  medium: { rows: 2, cols: 10 },
  hard: { rows: 3, cols: 12 },
};

const SEQUENCE_ITEMS: SequenceItem[] = [
  { key: 'num:1', kind: 'number', label: '1' },
  { key: 'num:2', kind: 'number', label: '2' },
  { key: 'num:3', kind: 'number', label: '3' },
  { key: 'num:4', kind: 'number', label: '4' },
  { key: 'tile:2', kind: 'tile', label: '2' },
  { key: 'tile:3', kind: 'tile', label: '3' },
  { key: 'tile:4', kind: 'tile', label: '4' },
  { key: 'shape:circle-yellow', kind: 'shape', label: 'Žluté kolečko' },
  { key: 'shape:square-purple', kind: 'shape', label: 'Fialový čtverec' },
  { key: 'shape:plus-red', kind: 'shape', label: 'Červený kříž' },
];

export function defaultArithmeticTaskSettings(): ArithmeticTaskSettings {
  return {
    type: 'arithmetic',
    difficulty: 'easy',
    operations: ['add'],
    exampleCount: 6,
    ...ARITHMETIC_DIFFICULTY_PRESETS.easy,
    seed: createTaskSeed(),
    exampleVariety: 'uniqueEachInsert',
  };
}

export function defaultSequenceTaskSettings(): SequenceTaskSettings {
  return {
    type: 'sequence',
    difficulty: 'easy',
    patternKind: 'AB',
    itemKinds: ['shape'],
    exampleCount: 4,
    seed: createTaskSeed(),
  };
}

export function defaultDominoTaskSettings(): DominoTaskSettings {
  return {
    type: 'domino',
    mode: 'missingAddition',
    difficulty: 'easy',
    exampleCount: 6,
    seed: createTaskSeed(),
  };
}

export function defaultMarbleBagTaskSettings(): MarbleBagTaskSettings {
  return {
    type: 'marbleBag',
    total: 10,
    answerMode: 'marbles',
    exampleCount: 6,
    seed: createTaskSeed(),
  };
}

/** Max. hodnota na jedné polovině domina podle stupně („double-n“ pocit). */
const DOMINO_MAX_PIP_BY_DIFFICULTY: Record<ArithmeticDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 9,
};

export function normalizeDominoTaskSettings(settings: DominoTaskSettings): DominoTaskSettings {
  const modes: DominoExerciseMode[] = ['missingAddition', 'dominoSum', 'partition'];
  const mode = modes.includes(settings.mode) ? settings.mode : 'missingAddition';
  const difficulty: ArithmeticDifficulty =
    settings.difficulty === 'medium' || settings.difficulty === 'hard' ? settings.difficulty : 'easy';
  return {
    type: 'domino',
    mode,
    difficulty,
    exampleCount: Math.min(14, Math.max(1, normalizeInt(settings.exampleCount, 6))),
    seed: normalizeInt(settings.seed, createTaskSeed()),
  };
}

export function createTaskSeed() {
  return Math.floor(Math.random() * 0x7fffffff);
}

function normalizeInt(value: number, fallback: number) {
  const rounded = Math.round(Number(value));
  return Number.isFinite(rounded) ? rounded : fallback;
}

export function normalizeArithmeticTaskSettings(settings: ArithmeticTaskSettings): ArithmeticTaskSettings {
  const operations = settings.operations.filter((op): op is ArithmeticOperation =>
    op === 'add' || op === 'subtract' || op === 'multiply',
  );
  let operandMin = normalizeInt(settings.operandMin, 0);
  let operandMax = normalizeInt(settings.operandMax, 10);
  if (operandMax < operandMin) [operandMin, operandMax] = [operandMax, operandMin];
  let resultMin =
    settings.resultMin === undefined ? undefined : normalizeInt(settings.resultMin, operandMin + operandMin);
  let resultMax =
    settings.resultMax === undefined ? undefined : normalizeInt(settings.resultMax, operandMax + operandMax);
  if (resultMin !== undefined && resultMax !== undefined && resultMax < resultMin) {
    [resultMin, resultMax] = [resultMax, resultMin];
  }

  const variety: ArithmeticExampleVariety =
    settings.exampleVariety === 'keepCanvas' ? 'keepCanvas' : 'uniqueEachInsert';

  return {
    type: 'arithmetic',
    difficulty: settings.difficulty,
    operations: operations.length ? operations : ['add'],
    exampleCount: Math.min(24, Math.max(1, normalizeInt(settings.exampleCount, 6))),
    operandMin,
    operandMax,
    resultMin,
    resultMax,
    seed: normalizeInt(settings.seed, createTaskSeed()),
    exampleVariety: variety,
  };
}

export function normalizeSequenceTaskSettings(settings: SequenceTaskSettings): SequenceTaskSettings {
  const itemKinds = settings.itemKinds.filter((kind): kind is SequenceItemKind =>
    kind === 'number' || kind === 'tile' || kind === 'shape',
  );
  const patternKind =
    settings.patternKind === 'ABC' || settings.patternKind === 'ABCD' || settings.patternKind === 'AB'
      ? settings.patternKind
      : 'AB';
  return {
    type: 'sequence',
    difficulty: settings.difficulty,
    patternKind,
    itemKinds: itemKinds.length ? itemKinds : ['shape'],
    exampleCount: Math.min(12, Math.max(1, normalizeInt(settings.exampleCount, 4))),
    seed: normalizeInt(settings.seed, createTaskSeed()),
  };
}

export function normalizeMarbleBagTaskSettings(settings: MarbleBagTaskSettings): MarbleBagTaskSettings {
  const total = Math.min(20, Math.max(2, normalizeInt(settings.total, 10)));
  return {
    type: 'marbleBag',
    total,
    answerMode: settings.answerMode === 'number' ? 'number' : 'marbles',
    exampleCount: Math.min(16, Math.max(1, normalizeInt(settings.exampleCount, 6))),
    seed: normalizeInt(settings.seed, createTaskSeed()),
  };
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rand: () => number, min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1));
}

export function arithmeticOperationSymbol(operation: ArithmeticOperation) {
  switch (operation) {
    case 'add':
      return '+';
    case 'subtract':
      return '−';
    case 'multiply':
      return '×';
  }
}

export function computeArithmeticExpectedAnswer(a: number, b: number, operation: ArithmeticOperation) {
  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
  }
}

export function generateArithmeticExamples(settings: ArithmeticTaskSettings): ArithmeticExample[] {
  const normalized = normalizeArithmeticTaskSettings(settings);
  const rand = mulberry32(normalized.seed);
  const examples: ArithmeticExample[] = [];
  let attempts = 0;

  while (examples.length < normalized.exampleCount && attempts < normalized.exampleCount * 200) {
    attempts += 1;
    const operation = normalized.operations[randomInt(rand, 0, normalized.operations.length - 1)];
    const a = randomInt(rand, normalized.operandMin, normalized.operandMax);
    const b = randomInt(rand, normalized.operandMin, normalized.operandMax);
    const expectedAnswer = computeArithmeticExpectedAnswer(a, b, operation);
    if (normalized.resultMin !== undefined && expectedAnswer < normalized.resultMin) continue;
    if (normalized.resultMax !== undefined && expectedAnswer > normalized.resultMax) continue;
    examples.push({
      id: `ex-${normalized.seed}-${examples.length + 1}`,
      index: examples.length + 1,
      a,
      b,
      operation,
      expectedAnswer,
    });
  }

  while (examples.length < normalized.exampleCount) {
    const operation = normalized.operations[examples.length % normalized.operations.length];
    const a = randomInt(rand, normalized.operandMin, normalized.operandMax);
    const b = randomInt(rand, normalized.operandMin, normalized.operandMax);
    examples.push({
      id: `ex-${normalized.seed}-${examples.length + 1}`,
      index: examples.length + 1,
      a,
      b,
      operation,
      expectedAnswer: computeArithmeticExpectedAnswer(a, b, operation),
    });
  }

  return examples;
}

/**
 * Příprava sady příkladů pro první vložení nebo náhradu na plátně.
 * – uniqueEachInsert: nový náhodný seed při každém vložení.
 * – keepCanvas: zachovat úlohy z plátna v pořadí zleva; při větším počtu doplnit náhodně.
 */
export function prepareArithmeticExamplesForBoard(
  settings: ArithmeticTaskSettings,
  previousOrderedExamples: ArithmeticExample[] | null,
): { examples: ArithmeticExample[]; settingsOut: ArithmeticTaskSettings } {
  const normalized = normalizeArithmeticTaskSettings(settings);

  if (
    normalized.exampleVariety === 'keepCanvas' &&
    previousOrderedExamples &&
    previousOrderedExamples.length > 0
  ) {
    const n = normalized.exampleCount;
    const kept: ArithmeticExample[] = [];
    const take = Math.min(n, previousOrderedExamples.length);
    for (let i = 0; i < take; i += 1) {
      const ex = previousOrderedExamples[i];
      kept.push({
        ...ex,
        index: i + 1,
        id: `ex-${normalized.seed}-${i + 1}`,
        expectedAnswer: computeArithmeticExpectedAnswer(ex.a, ex.b, ex.operation),
      });
    }
    while (kept.length < n) {
      const need = n - kept.length;
      const batch = generateArithmeticExamples({
        ...normalized,
        exampleCount: need,
        seed: createTaskSeed(),
      });
      const start = kept.length;
      batch.forEach((ex, j) => {
        if (kept.length >= n) return;
        kept.push({
          ...ex,
          index: start + j + 1,
          id: `ex-${normalized.seed}-${start + j + 1}`,
        });
      });
      if (batch.length === 0) break;
    }
    return { examples: kept.slice(0, n), settingsOut: normalized };
  }

  const seed = normalized.exampleVariety === 'uniqueEachInsert' ? createTaskSeed() : normalized.seed;
  const examples = generateArithmeticExamples({ ...normalized, seed });
  return { examples, settingsOut: { ...normalized, seed } };
}

export function evaluateDominoAnswer(example: DominoExample, values: number[]): boolean {
  if (example.mode === 'dominoSum') {
    return values.length === 1 && values[0] === example.expectLeft + example.expectRight;
  }
  return values.length === 2 && values[0] === example.expectLeft && values[1] === example.expectRight;
}

export function generateDominoExamples(settings: DominoTaskSettings): DominoExample[] {
  const normalized = normalizeDominoTaskSettings(settings);
  const rand = mulberry32(normalized.seed);
  const maxP = DOMINO_MAX_PIP_BY_DIFFICULTY[normalized.difficulty];
  const out: DominoExample[] = [];

  for (let k = 0; k < normalized.exampleCount; k += 1) {
    const index = k + 1;
    const id = `dom-${normalized.seed}-${index}`;

    if (normalized.mode === 'dominoSum') {
      const L = randomInt(rand, 1, maxP);
      const R = randomInt(rand, 1, maxP);
      out.push({
        id,
        index,
        mode: 'dominoSum',
        leftPips: L,
        rightPips: R,
        targetSum: L + R,
        expectLeft: L,
        expectRight: R,
      });
      continue;
    }

    if (normalized.mode === 'partition') {
      let row: DominoExample | null = null;
      for (let t = 0; t < 100 && !row; t += 1) {
        const target = randomInt(rand, Math.max(5, Math.min(8, maxP)), Math.min(maxP * 2, 18));
        const Lmin = Math.max(0, target - maxP);
        const Lmax = Math.min(maxP, target);
        if (Lmin > Lmax) continue;
        const L = randomInt(rand, Lmin, Lmax);
        const R = target - L;
        if (R < 0 || R > maxP) continue;
        row = {
          id,
          index,
          mode: 'partition',
          leftPips: null,
          rightPips: null,
          targetSum: target,
          expectLeft: L,
          expectRight: R,
        };
      }
      out.push(
        row ?? {
          id,
          index,
          mode: 'partition',
          leftPips: null,
          rightPips: null,
          targetSum: 6,
          expectLeft: 2,
          expectRight: 4,
        },
      );
      continue;
    }

    let row: DominoExample | null = null;
    for (let t = 0; t < 160 && !row; t += 1) {
      const hideLeft = rand() < 0.5;
      const knownShown = randomInt(rand, 1, maxP);
      const hiddenVal = randomInt(rand, 1, maxP);
      const targetSum = knownShown + hiddenVal;
      if (targetSum > maxP * 2) continue;

      row = hideLeft
        ? {
            id,
            index,
            mode: 'missingAddition',
            leftPips: null,
            rightPips: knownShown,
            targetSum,
            expectLeft: hiddenVal,
            expectRight: knownShown,
          }
        : {
            id,
            index,
            mode: 'missingAddition',
            leftPips: knownShown,
            rightPips: null,
            targetSum,
            expectLeft: knownShown,
            expectRight: hiddenVal,
          };
    }

    out.push(
      row ?? {
        id,
        index,
        mode: 'missingAddition',
        leftPips: 5,
        rightPips: null,
        targetSum: 7,
        expectLeft: 5,
        expectRight: 2,
      },
    );
  }

  return out;
}

function pickSequenceChoices(rand: () => number, kinds: SequenceItemKind[], count: number) {
  const pool = SEQUENCE_ITEMS.filter((item) => kinds.includes(item.kind));
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function generateSequenceExamples(settings: SequenceTaskSettings): SequenceExample[] {
  const normalized = normalizeSequenceTaskSettings(settings);
  const rand = mulberry32(normalized.seed);
  const preset = SEQUENCE_DIFFICULTY_PRESETS[normalized.difficulty];
  const examples: SequenceExample[] = [];

  for (let index = 0; index < normalized.exampleCount; index += 1) {
    const patternLength = normalized.patternKind.length;
    const choices = pickSequenceChoices(rand, normalized.itemKinds, patternLength);
    if (choices.length < 2) break;
    const pattern = choices.slice(0, patternLength).map((choice) => choice.key);
    const visibleCols = Math.min(patternLength + (normalized.difficulty === 'easy' ? 1 : 2), preset.cols);
    const cells: SequenceCell[] = [];

    for (let row = 0; row < preset.rows; row += 1) {
      for (let col = 0; col < preset.cols; col += 1) {
        const shiftedIndex = (col + row) % pattern.length;
        const expectedKey = pattern[shiftedIndex];
        const given = col < visibleCols || (col % pattern.length === 0 && col < visibleCols + pattern.length);
        cells.push({
          id: `seq-${normalized.seed}-${index + 1}-${row}-${col}`,
          row,
          col,
          expectedKey,
          given,
        });
      }
    }

    examples.push({
      id: `seq-${normalized.seed}-${index + 1}`,
      index: index + 1,
      rows: preset.rows,
      cols: preset.cols,
      pattern,
      choices,
      cells,
    });
  }

  return examples;
}

export function generateMarbleBagExamples(settings: MarbleBagTaskSettings): MarbleBagExample[] {
  const normalized = normalizeMarbleBagTaskSettings(settings);
  const rand = mulberry32(normalized.seed);
  const out: MarbleBagExample[] = [];
  let previousOnTable = -1;
  for (let i = 0; i < normalized.exampleCount; i += 1) {
    let onTable = randomInt(rand, 1, normalized.total - 1);
    if (normalized.total > 3 && onTable === previousOnTable) {
      onTable = (onTable % (normalized.total - 1)) + 1;
    }
    previousOnTable = onTable;
    out.push({
      id: `bag-${normalized.seed}-${i + 1}`,
      index: i + 1,
      total: normalized.total,
      onTable,
      expectedInBag: normalized.total - onTable,
      answerMode: normalized.answerMode,
    });
  }
  return out;
}

export function encodeAssignmentToUrlPayload(settings: TaskAssignmentSettings): string {
  let payload: EncodedTaskAssignment;
  if (settings.type === 'sequence') {
    const normalized = normalizeSequenceTaskSettings(settings);
    payload = {
      v: 1,
      t: 'sequence',
      d: normalized.difficulty,
      p: normalized.patternKind,
      kinds: normalized.itemKinds,
      c: normalized.exampleCount,
      seed: normalized.seed,
    };
  } else if (settings.type === 'domino') {
    const normalized = normalizeDominoTaskSettings(settings);
    payload = {
      v: 1,
      t: 'domino',
      m: normalized.mode,
      d: normalized.difficulty,
      c: normalized.exampleCount,
      seed: normalized.seed,
    };
  } else if (settings.type === 'marbleBag') {
    const normalized = normalizeMarbleBagTaskSettings(settings);
    payload = {
      v: 1,
      t: 'marbleBag',
      total: normalized.total,
      mode: normalized.answerMode,
      c: normalized.exampleCount,
      seed: normalized.seed,
    };
  } else {
    const normalized = normalizeArithmeticTaskSettings(settings);
    payload = {
      v: 1,
      t: 'arithmetic',
      d: normalized.difficulty,
      ops: normalized.operations,
      c: normalized.exampleCount,
      omin: normalized.operandMin,
      omax: normalized.operandMax,
      rmin: normalized.resultMin,
      rmax: normalized.resultMax,
      seed: normalized.seed,
      ev: normalized.exampleVariety === 'keepCanvas' ? 'k' : 'u',
    };
  }
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeAssignmentFromUrlPayload(payload: string): TaskAssignmentSettings | null {
  try {
    const decoded = JSON.parse(decodeURIComponent(atob(payload))) as Partial<EncodedTaskAssignment>;
    if (decoded.v !== 1) return null;
    if (decoded.t === 'sequence') {
      return normalizeSequenceTaskSettings({
        type: 'sequence',
        difficulty: decoded.d ?? 'easy',
        patternKind: decoded.p ?? 'AB',
        itemKinds: decoded.kinds ?? ['shape'],
        exampleCount: decoded.c ?? 4,
        seed: decoded.seed ?? createTaskSeed(),
      });
    }
    if (decoded.t === 'domino') {
      const modes: DominoExerciseMode[] = ['missingAddition', 'dominoSum', 'partition'];
      const m = decoded.m && modes.includes(decoded.m as DominoExerciseMode) ? (decoded.m as DominoExerciseMode) : 'missingAddition';
      const d = decoded.d === 'medium' || decoded.d === 'hard' ? decoded.d : 'easy';
      return normalizeDominoTaskSettings({
        type: 'domino',
        mode: m,
        difficulty: d as ArithmeticDifficulty,
        exampleCount: decoded.c ?? 6,
        seed: decoded.seed ?? createTaskSeed(),
      });
    }
    if (decoded.t === 'marbleBag') {
      return normalizeMarbleBagTaskSettings({
        type: 'marbleBag',
        total: decoded.total ?? 10,
        answerMode: decoded.mode === 'number' ? 'number' : 'marbles',
        exampleCount: decoded.c ?? 6,
        seed: decoded.seed ?? createTaskSeed(),
      });
    }
    if (decoded.t !== 'arithmetic') return null;
    return normalizeArithmeticTaskSettings({
      type: 'arithmetic',
      difficulty: decoded.d ?? 'easy',
      operations: decoded.ops ?? ['add'],
      exampleCount: decoded.c ?? 6,
      operandMin: decoded.omin ?? 0,
      operandMax: decoded.omax ?? 10,
      resultMin: decoded.rmin,
      resultMax: decoded.rmax,
      seed: decoded.seed ?? createTaskSeed(),
      exampleVariety: decoded.ev === 'k' ? 'keepCanvas' : 'uniqueEachInsert',
    });
  } catch {
    return null;
  }
}
