import { PITLIK_ZLUTY_SVG } from '../lib/countingGameMarbleAssets';

/**
 * Žlutý pytlíček v úloze „Zjisti“ — stejný soubor jako Vividbooks CountingGame (`pitlik_zluty.svg`).
 * Při přetahování kuličky nad cíl se grafika zčerná (CSS filter), bez překryvného obdélníku.
 */
export function MarbleBagYellowTaskSvg({
  x,
  y,
  width,
  height,
  dropTarget,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  dropTarget: boolean;
}) {
  return (
    <g pointerEvents="none" aria-hidden>
      <image
        href={PITLIK_ZLUTY_SVG}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={dropTarget ? { filter: 'brightness(0)' } : undefined}
      />
    </g>
  );
}
