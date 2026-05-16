/** Figurky jako ve hře Člověče nezlob se (WordProblemsGame / GamePath). */
const FIGURES = ['board-game-figure-1.svg', 'board-game-figure-2.svg'] as const;

export function numberLineBoardGameFigureUrl(figureIndex: number): string {
  const file = FIGURES[figureIndex <= 0 ? 0 : 1];
  return `${import.meta.env.BASE_URL}${file}`;
}
