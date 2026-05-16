import React from 'react';

// -----------------------------------------------------------------------------
// Reusing handle styles (Visual only)
// -----------------------------------------------------------------------------

const CornerHandle = ({ style, scale }: { style: React.CSSProperties, scale: number }) => {
    const isZoomedIn = scale > 1.2;
    
    // Větší touch target když jsem blízko (24px), jinak 20px standard
    const baseSize = isZoomedIn ? 24 : 20; 
    
    // FIXNÍ vizuální tloušťka 2px
    const borderSize = 2;

    return (
        <div 
            className="absolute bg-white border-[#3B82F6] rounded-full z-[101] pointer-events-none"
            style={{ 
                width: baseSize / scale, 
                height: baseSize / scale, 
                borderWidth: `${borderSize / scale}px`,
                boxSizing: 'border-box',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                ...style
            }}
        />
    );
};

const SideHandle = ({ style, vertical, scale }: { style: React.CSSProperties, vertical?: boolean, scale: number }) => {
    const isZoomedIn = scale > 1.2;

    const baseShort = isZoomedIn ? 14 : 12;
    const baseLong = isZoomedIn ? 42 : 38;
    
    // Stejná fixní tloušťka jako u rohů
    const borderSize = 2;

    return (
        <div 
            className="absolute bg-white border-[#3B82F6] rounded-full z-[101] pointer-events-none"
            style={{ 
                width: (vertical ? baseShort : baseLong) / scale, 
                height: (vertical ? baseLong : baseShort) / scale, 
                borderWidth: `${borderSize / scale}px`,
                boxSizing: 'border-box',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                ...style
            }}
        />
    );
};

// -----------------------------------------------------------------------------
// Main Selection Component
// -----------------------------------------------------------------------------

interface SelectionFrameProps {
    isSelected: boolean;
    viewMode?: boolean;
    scale: number;
    /** 
     * If true, only corner handles are shown (good for aspect ratio locked items) 
     * Default: false
     */
    cornersOnly?: boolean;
    /**
     * Custom offset adjustment if needed
     */
    offsetAdjust?: number;
}

export function SelectionFrame({ isSelected, viewMode, scale, cornersOnly = false, offsetAdjust = 0 }: SelectionFrameProps) {
    if (!isSelected || viewMode) return null;

    const cornerOffset = (-10 + offsetAdjust) / scale;
    const sideOffset = (-5 + offsetAdjust) / scale;

    return (
        <>
            {/* Corner Handles */}
            <CornerHandle style={{ top: cornerOffset, left: cornerOffset }} scale={scale} />
            <CornerHandle style={{ top: cornerOffset, right: cornerOffset }} scale={scale} />
            <CornerHandle style={{ bottom: cornerOffset, left: cornerOffset }} scale={scale} />
            <CornerHandle style={{ bottom: cornerOffset, right: cornerOffset }} scale={scale} />

            {/* Side Handles - Hide when zoomed out (scale <= 0.6) */}
            {!cornersOnly && scale > 0.6 && (
                <>
                    <SideHandle style={{ top: sideOffset, left: '50%', transform: 'translateX(-50%)' }} scale={scale} />
                    <SideHandle style={{ bottom: sideOffset, left: '50%', transform: 'translateX(-50%)' }} scale={scale} />
                    <SideHandle style={{ left: sideOffset, top: '50%', transform: 'translateY(-50%)' }} vertical scale={scale} />
                    <SideHandle style={{ right: sideOffset, top: '50%', transform: 'translateY(-50%)' }} vertical scale={scale} />
                </>
            )}
        </>
    );
}

/**
 * Helper constant for handle styles in re-resizable
 * This makes the actual clickable areas larger than the visual handles
 */
export const getResizeHandleStyles = (scale: number) => {
    const size = 30 / scale;
    const offset = -15 / scale;
    
    return {
        topLeft: { width: size, height: size, left: offset, top: offset, zIndex: 100, cursor: 'nwse-resize' },
        topRight: { width: size, height: size, right: offset, top: offset, zIndex: 100, cursor: 'nesw-resize' },
        bottomLeft: { width: size, height: size, left: offset, bottom: offset, zIndex: 100, cursor: 'nesw-resize' },
        bottomRight: { width: size, height: size, right: offset, bottom: offset, zIndex: 100, cursor: 'nwse-resize' },
        // Sides
        top: { height: size/2, top: offset/2, cursor: 'ns-resize', zIndex: 99 },
        bottom: { height: size/2, bottom: offset/2, cursor: 'ns-resize', zIndex: 99 },
        left: { width: size/2, left: offset/2, cursor: 'ew-resize', zIndex: 99 },
        right: { width: size/2, right: offset/2, cursor: 'ew-resize', zIndex: 99 },
    };
};