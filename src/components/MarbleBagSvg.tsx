import { kulickaSvgUrlForHex } from '../lib/countingGameMarbleAssets';

export type MarbleBagItemView = {
  id: string;
  kind: 'marble' | 'number';
  label?: string;
  color?: string;
};

export type MarbleBagViewModel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: MarbleBagItemView[];
  accentColor?: string;
};

const BAG_URL =
  'https://jjpiguuubvmiobmixwgh.supabase.co/storage/v1/object/public/Admin%20math/pitlik_zelena.svg';

function bagItemLayout(index: number, count: number, width: number, height: number) {
  const cols = Math.min(5, Math.max(1, count));
  const gap = 22;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const rowCount = Math.ceil(count / cols);
  const startX = width / 2 - ((Math.min(cols, count - row * cols) - 1) * gap) / 2;
  const startY = height * 0.62 - ((rowCount - 1) * gap) / 2;
  return {
    x: startX + col * gap,
    y: startY + row * gap,
  };
}

function BagItem({ item, index, count, width, height }: {
  item: MarbleBagItemView;
  index: number;
  count: number;
  width: number;
  height: number;
}) {
  const p = bagItemLayout(index, count, width, height);
  const color = item.color ?? '#f6d64f';
  if (item.kind === 'number') {
    return (
      <g transform={`translate(${p.x} ${p.y})`} pointerEvents="none">
        <circle r={15} fill="#fffdf4" stroke="#1e1b4b" strokeWidth={2} />
        <text
          y={5}
          fill="#1e1b4b"
          fontSize={17}
          fontWeight={900}
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >
          {item.label}
        </text>
      </g>
    );
  }
  const mr = 12;
  const d = 2 * (mr + 1.1);
  return (
    <image
      href={kulickaSvgUrlForHex(color)}
      x={p.x - d / 2}
      y={p.y - d / 2}
      width={d}
      height={d}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
    />
  );
}

export function MarbleBagSvg({ bag }: { bag: MarbleBagViewModel; selected?: boolean }) {
  const accent = bag.accentColor ?? '#1e1b4b';
  const count = bag.items.length;

  return (
    <g transform={`translate(${bag.x} ${bag.y})`} className="marble-bag-root">
      <defs>
        <filter id="marble-bag-shadow" x="-18%" y="-18%" width="136%" height="136%">
          <feDropShadow dx={0} dy={5} stdDeviation={5} floodColor="#1e1b4b" floodOpacity={0.16} />
        </filter>
        <filter id="marble-bag-item-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx={0} dy={2} stdDeviation={1.5} floodColor="#1e1b4b" floodOpacity={0.18} />
        </filter>
      </defs>
      <image
        href={BAG_URL}
        x={bag.width * 0.18}
        y={bag.height * 0.1}
        width={bag.width * 0.64}
        height={bag.height * 0.78}
        preserveAspectRatio="xMidYMid meet"
        filter="url(#marble-bag-shadow)"
      />
      <g className="marble-bag-items">
        {bag.items.slice(-12).map((item, index, visibleItems) => (
          <BagItem
            key={item.id}
            item={item}
            index={index}
            count={visibleItems.length}
            width={bag.width}
            height={bag.height}
          />
        ))}
      </g>
      {count === 0 ? (
        <text
          x={bag.width / 2}
          y={bag.height - 18}
          fill="rgba(30, 27, 75, 0.58)"
          fontSize={14}
          fontWeight={800}
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >
          přetáhni kuličky nebo čísla
        </text>
      ) : (
        <text
          x={bag.width - 18}
          y={26}
          fill={accent}
          fontSize={16}
          fontWeight={900}
          textAnchor="end"
          style={{ userSelect: 'none' }}
        >
          {count}
        </text>
      )}
    </g>
  );
}
