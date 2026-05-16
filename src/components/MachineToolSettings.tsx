export type NumberLineSettingsDraft = {
  start: number;
  end: number;
  accentColor: string;
  tickFill: string;
};

export type BeadCounterSettingsDraft = {
  beadCount: 10 | 20;
  useTextures: boolean;
  dualStripe: boolean;
  solidColor: string;
  colorA: string;
  colorB: string;
  /** Barvy obrázkového vzoru: položky 1–5 a 6–10 (náhled = CSS filtr nad SVG ikonami). */
  textureColorA: string;
  textureColorB: string;
  showGroupCounts: boolean;
  showTotalSum: boolean;
};

export function numberLineToDraft(line: {
  start: number;
  end: number;
  accentColor?: string;
  tickFill?: string;
}): NumberLineSettingsDraft {
  return {
    start: line.start,
    end: line.end,
    accentColor: line.accentColor ?? '#1e1b4b',
    tickFill: line.tickFill ?? '#ffffff',
  };
}

export function beadCounterToDraft(counter: {
  variant?: 'ten' | 'twenty';
  beads: Array<{ color: string; imageUrl?: string }>;
  showGroupCounts?: boolean;
  showTotalSum?: boolean;
}): BeadCounterSettingsDraft {
  const hasTex = counter.beads.some((b) => b.imageUrl);
  const uniqColors = [...new Set(counter.beads.map((b) => b.color))];
  const texturedBeads = counter.beads.filter((b) => b.imageUrl);
  const yellowBead = texturedBeads.find((b) => /yellow/i.test(b.imageUrl ?? ''));
  const blueBead = texturedBeads.find((b) => /blue/i.test(b.imageUrl ?? ''));
  return {
    beadCount: counter.variant === 'twenty' || counter.beads.length > 12 ? 20 : 10,
    useTextures: hasTex,
    solidColor: counter.beads[0]?.color ?? '#f6c34b',
    dualStripe: !hasTex && uniqColors.length > 1,
    colorA: uniqColors[0] ?? '#f6c34b',
    colorB: uniqColors[1] ?? '#2368d9',
    textureColorA: yellowBead?.color ?? '#f6c34b',
    textureColorB: blueBead?.color ?? '#2368d9',
    showGroupCounts: counter.showGroupCounts ?? false,
    showTotalSum: counter.showTotalSum ?? false,
  };
}
