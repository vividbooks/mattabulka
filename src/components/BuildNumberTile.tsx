interface BuildNumberTileProps {
  value: number;
  scale?: number;
  variant?: 'stacked' | 'flat';
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

export function BuildNumberTile({ value, scale = 1, variant = 'stacked' }: BuildNumberTileProps) {
  const colors = LEGO_COLORS[value] ?? LEGO_COLORS[1];
  if (variant === 'flat') {
    const cellWidth = 44;
    const height = 44;
    const circleSize = 22;

    return (
      <div className="build-number-flat-tile-frame" style={{ width: cellWidth * value * scale, height: height * scale }}>
        <div
          className="build-number-flat-tile"
          style={{
            width: cellWidth * value,
            height,
            backgroundColor: colors.light,
            borderColor: colors.dark,
            transform: `scale(${scale})`,
            transformOrigin: 'left top',
          }}
        >
          {Array.from({ length: value }).map((_, index) => (
            <span
              key={index}
              style={{
                width: circleSize,
                height: circleSize,
                backgroundColor: colors.lightCircle,
                borderColor: colors.dark,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const blockWidth = 60;
  const blockTopHeight = 40;
  const blockBottomHeight = 30;
  const circleSize = 40;
  const circleGap = 10;
  const circleOffset = 37;
  const totalHeight = blockBottomHeight + blockTopHeight + circleSize + circleGap - circleOffset;

  return (
    <div className="build-number-tile" style={{ width: blockWidth * value * scale, height: totalHeight * scale }}>
      <div className="build-number-tile-cells" style={{ transform: `scale(${scale})`, transformOrigin: 'left top' }}>
        {Array.from({ length: value }).map((_, index) => (
          <div
            className="build-number-tile-cell"
            key={index}
            style={{
              width: blockWidth,
              height: totalHeight,
            }}
          >
            <div
              style={{
                width: blockWidth,
                height: blockBottomHeight,
                backgroundColor: colors.dark,
                position: 'absolute',
                bottom: 0,
                left: 0,
              }}
            />
            <div
              style={{
                width: blockWidth,
                height: blockTopHeight,
                backgroundColor: colors.light,
                position: 'absolute',
                bottom: blockBottomHeight,
                left: 0,
              }}
            />
            <div
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: '50%',
                backgroundColor: colors.darkCircle,
                position: 'absolute',
                bottom: blockBottomHeight + blockTopHeight - circleOffset,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
            <div
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: '50%',
                backgroundColor: colors.lightCircle,
                position: 'absolute',
                bottom: blockBottomHeight + blockTopHeight - circleOffset + circleGap,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
