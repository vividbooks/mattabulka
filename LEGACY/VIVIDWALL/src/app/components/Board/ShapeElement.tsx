import React, { useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { cn } from '../../lib/utils';
import { Palette, RotateCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SelectionFrame } from './SelectionFrame';

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Black', value: '#1f2937' },
  { name: 'White', value: '#ffffff' },
];

interface ShapeElementProps {
  element: any;
  isSelected: boolean;
  showToolbar?: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  onChange?: (updates: any) => void;
  onMultiDrag?: (dx: number, dy: number) => void;
  onMultiDragEnd?: () => void;
  selectedIds?: string[];
  scale: number;
  viewMode?: boolean;
}

export function ShapeElement({ 
  element, 
  isSelected, 
  showToolbar = true,
  onSelect, 
  onDragEnd, 
  onResize,
  onChange,
  onMultiDrag,
  onMultiDragEnd,
  selectedIds,
  scale,
  viewMode = false 
}: ShapeElementProps) {
  const x = useMotionValue(element.x);
  const y = useMotionValue(element.y);

  const [currentWidth, setCurrentWidth] = React.useState(element.width || 100);
  const [currentHeight, setCurrentHeight] = React.useState(element.height || 100);
  const [color, setColor] = React.useState(element.color || '#3b82f6');
  const [rotation, setRotation] = React.useState(element.rotation || 0);
  
  const isDragging = useRef(false);
  const resizeWidthRef = useRef(element.width || 100);
  const resizeHeightRef = useRef(element.height || 100);

  const width = currentWidth;
  const height = currentHeight;
  const shape = element.shape || 'circle';
  const isLineType = shape === 'line' || shape === 'arrow';

  React.useEffect(() => {
    if (element.color) setColor(element.color);
    if (element.width) {
        setCurrentWidth(element.width);
        resizeWidthRef.current = element.width;
    }
    if (element.height) {
        setCurrentHeight(element.height);
        resizeHeightRef.current = element.height;
    }
    if (element.rotation !== undefined) setRotation(element.rotation);
  }, [element.color, element.width, element.height, element.rotation]);

  const handlePointerDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Always stop propagation to prevent selection box
    
    if (viewMode) return;
    onSelect();
    isDragging.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = x.get();
    const startNodeY = y.get();
    const isMultiSelect = selectedIds && selectedIds.length > 1;

    const handlePointerMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      
      if (isMultiSelect) {
        onMultiDrag && onMultiDrag(dx, dy);
      } else {
        x.set(startNodeX + dx);
        y.set(startNodeY + dy);
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      if (x.get() !== startNodeX || y.get() !== startNodeY) {
        if (isMultiSelect) {
          onMultiDragEnd && onMultiDragEnd();
        } else {
          onDragEnd(x.get(), y.get());
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  // --- BOX RESIZE LOGIC (Refined for corners + sides) ---
  const handleBoxResize = (e: React.MouseEvent, handlePos: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    const startX = x.get();
    const startY = y.get();
    const rotationRad = (rotation * Math.PI) / 180;

    const cx = startX + startWidth / 2;
    const cy = startY + startHeight / 2;

    // Determine Anchor point (opposite to handle)
    // Local coords relative to center
    let anchorLocalX = 0;
    let anchorLocalY = 0;

    // For side handles, the anchor is the opposite side center
    // For corner handles, the anchor is the opposite corner
    if (handlePos === 'top-left')     { anchorLocalX = startWidth/2;  anchorLocalY = startHeight/2; }
    else if (handlePos === 'top-right')    { anchorLocalX = -startWidth/2; anchorLocalY = startHeight/2; }
    else if (handlePos === 'bottom-left')  { anchorLocalX = startWidth/2;  anchorLocalY = -startHeight/2; }
    else if (handlePos === 'bottom-right') { anchorLocalX = -startWidth/2; anchorLocalY = -startHeight/2; }
    else if (handlePos === 'top')          { anchorLocalX = 0;             anchorLocalY = startHeight/2; }
    else if (handlePos === 'bottom')       { anchorLocalX = 0;             anchorLocalY = -startHeight/2; }
    else if (handlePos === 'left')         { anchorLocalX = startWidth/2;  anchorLocalY = 0; }
    else if (handlePos === 'right')        { anchorLocalX = -startWidth/2; anchorLocalY = 0; }

    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    
    // Calculate World Anchor Position
    const anchorX = cx + (anchorLocalX * cos - anchorLocalY * sin);
    const anchorY = cy + (anchorLocalX * sin + anchorLocalY * cos);

    // Calculate World Handle Start Position (center of the handle being dragged)
    const handleLocalX = -anchorLocalX; // Actually simplified logic only works for corners fully.
    
    // More precise handle start calculation based on handlePos
    let startHandleLocalX = 0;
    let startHandleLocalY = 0;
    if (handlePos === 'top-left')     { startHandleLocalX = -startWidth/2; startHandleLocalY = -startHeight/2; }
    else if (handlePos === 'top-right')    { startHandleLocalX = startWidth/2;  startHandleLocalY = -startHeight/2; }
    else if (handlePos === 'bottom-left')  { startHandleLocalX = -startWidth/2; startHandleLocalY = startHeight/2; }
    else if (handlePos === 'bottom-right') { startHandleLocalX = startWidth/2;  startHandleLocalY = startHeight/2; }
    else if (handlePos === 'top')          { startHandleLocalX = 0;             startHandleLocalY = -startHeight/2; }
    else if (handlePos === 'bottom')       { startHandleLocalX = 0;             startHandleLocalY = startHeight/2; }
    else if (handlePos === 'left')         { startHandleLocalX = -startWidth/2; startHandleLocalY = 0; }
    else if (handlePos === 'right')        { startHandleLocalX = startWidth/2;  startHandleLocalY = 0; }

    const startHandleX = cx + (startHandleLocalX * cos - startHandleLocalY * sin);
    const startHandleY = cy + (startHandleLocalX * sin + startHandleLocalY * cos);

    const handlePointerMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startMouseX) / scale;
      const dy = (ev.clientY - startMouseY) / scale;
      
      const mouseX = startHandleX + dx;
      const mouseY = startHandleY + dy;
      
      // Vector from Anchor to Mouse
      const vx = mouseX - anchorX;
      const vy = mouseY - anchorY;
      
      // Project vector onto shape's local axes
      // Local X axis: (cos, sin)
      // Local Y axis: (-sin, cos)
      const projX = vx * cos + vy * sin;
      const projY = vx * (-sin) + vy * cos;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on projection
      if (handlePos === 'top-left')     { newWidth = -projX; newHeight = -projY; }
      else if (handlePos === 'top-right')    { newWidth = projX;  newHeight = -projY; }
      else if (handlePos === 'bottom-left')  { newWidth = -projX; newHeight = projY; }
      else if (handlePos === 'bottom-right') { newWidth = projX;  newHeight = projY; }
      else if (handlePos === 'top')          { newHeight = -projY; }
      else if (handlePos === 'bottom')       { newHeight = projY; }
      else if (handlePos === 'left')         { newWidth = -projX; }
      else if (handlePos === 'right')        { newWidth = projX; }

      newWidth = Math.max(20, newWidth);
      newHeight = Math.max(20, newHeight);

      // Determine new Center
      // The new center is defined by the Anchor + Half New Dimensions (rotated)
      // We need to know where the center is relative to the anchor in LOCAL space
      let centerOffsetX = 0;
      let centerOffsetY = 0;

      if (handlePos === 'top-left')     { centerOffsetX = -newWidth/2; centerOffsetY = -newHeight/2; }
      else if (handlePos === 'top-right')    { centerOffsetX = newWidth/2;  centerOffsetY = -newHeight/2; }
      else if (handlePos === 'bottom-left')  { centerOffsetX = -newWidth/2; centerOffsetY = newHeight/2; }
      else if (handlePos === 'bottom-right') { centerOffsetX = newWidth/2;  centerOffsetY = newHeight/2; }
      else if (handlePos === 'top')          { centerOffsetX = 0;           centerOffsetY = -newHeight/2; }
      else if (handlePos === 'bottom')       { centerOffsetX = 0;           centerOffsetY = newHeight/2; }
      else if (handlePos === 'left')         { centerOffsetX = -newWidth/2; centerOffsetY = 0; }
      else if (handlePos === 'right')        { centerOffsetX = newWidth/2;  centerOffsetY = 0; }
      
      // Adjust Anchor offset for side handles (since anchor was center-of-edge)
      // If we resize 'top', anchor was 'bottom-center'.
      // Local Center relative to Anchor(BottomCenter) is (0, -newHeight/2). Correct.
      // If we resize 'right', anchor was 'left-center'.
      // Local Center relative to Anchor(LeftCenter) is (newWidth/2, 0). Correct.
      
      const worldCenterOffsetX = centerOffsetX * cos - centerOffsetY * sin;
      const worldCenterOffsetY = centerOffsetX * sin + centerOffsetY * cos;
      
      const newCx = anchorX + worldCenterOffsetX;
      const newCy = anchorY + worldCenterOffsetY;
      
      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
      x.set(newCx - newWidth / 2);
      y.set(newCy - newHeight / 2);
      
      resizeWidthRef.current = newWidth;
      resizeHeightRef.current = newHeight;
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      
      const finalWidth = resizeWidthRef.current;
      const finalHeight = resizeHeightRef.current;
      const finalX = x.get();
      const finalY = y.get();
      
      if (onChange) {
        onChange({ x: finalX, y: finalY, width: finalWidth, height: finalHeight, rotation });
      } else {
        if (onResize) onResize(finalWidth, finalHeight);
        onDragEnd(finalX, finalY);
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  const handleBoxRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shapeElement = (e.currentTarget as HTMLElement).closest('.group');
    if (!shapeElement) return;
    const shapeRect = shapeElement.getBoundingClientRect();
    
    const centerScreenX = shapeRect.left + shapeRect.width / 2;
    const centerScreenY = shapeRect.top + shapeRect.height / 2;
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startAngle = Math.atan2(startMouseY - centerScreenY, startMouseX - centerScreenX) * (180 / Math.PI);
    
    const originalRotation = rotation;
    let currentRotation = rotation;
    
    const handlePointerMove = (ev: MouseEvent) => {
      const mouseScreenX = ev.clientX;
      const mouseScreenY = ev.clientY;
      const currentAngle = Math.atan2(mouseScreenY - centerScreenY, mouseScreenX - centerScreenX) * (180 / Math.PI);
      const delta = currentAngle - startAngle;
      currentRotation = originalRotation + delta;
      setRotation(currentRotation);
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      if (onChange) onChange({ rotation: currentRotation });
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  const handleLinePointMove = (e: React.MouseEvent, pointType: 'start' | 'end') => {
      e.stopPropagation();
      e.preventDefault();

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      
      const startX = x.get();
      const startY = y.get();
      const w = width;
      const h = height;
      const rot = rotation;

      const cx = startX + w / 2;
      const cy = startY + h / 2;
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const halfW = w / 2;
      const startWX = cx - halfW * cos;
      const startWY = cy - halfW * sin;
      const endWX = cx + halfW * cos;
      const endWY = cy + halfW * sin;

      const pivotX = pointType === 'start' ? endWX : startWX;
      const pivotY = pointType === 'start' ? endWY : startWY;
      const moverOrigX = pointType === 'start' ? startWX : endWX;
      const moverOrigY = pointType === 'start' ? startWY : endWY;

      let currRot = rot;
      let currW = w;

      const handlePointerMove = (ev: MouseEvent) => {
          const dx = (ev.clientX - startMouseX) / scale;
          const dy = (ev.clientY - startMouseY) / scale;

          const newMoverX = moverOrigX + dx;
          const newMoverY = moverOrigY + dy;

          let vx, vy;
          if (pointType === 'start') {
              vx = pivotX - newMoverX;
              vy = pivotY - newMoverY;
          } else {
              vx = newMoverX - pivotX;
              vy = newMoverY - pivotY;
          }

          const newLen = Math.sqrt(vx*vx + vy*vy);
          const safeLen = Math.max(1, newLen);

          const newRad = Math.atan2(vy, vx);
          const newDeg = newRad * (180 / Math.PI);

          const newCx = (pivotX + newMoverX) / 2;
          const newCy = (pivotY + newMoverY) / 2;

          const newX = newCx - safeLen / 2;
          const newY = newCy - h / 2;

          setCurrentWidth(safeLen);
          setRotation(newDeg);
          x.set(newX);
          y.set(newY);
          
          currW = safeLen;
          currRot = newDeg;
      };

      const handlePointerUp = () => {
          window.removeEventListener('mousemove', handlePointerMove);
          window.removeEventListener('mouseup', handlePointerUp);
          if (onChange) {
              onChange({
                  x: x.get(),
                  y: y.get(),
                  width: currW,
                  height: h,
                  rotation: currRot
              });
          }
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
  };

  const darkenColor = (hex: string, amount: number = 0.3) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const strokeColor = color === '#ffffff' ? '#d1d5db' : darkenColor(color, 0.3);
  const strokeWidth = 2;
  const selectedStroke = isSelected && !viewMode ? '#3B82F6' : strokeColor;
  const selectedStrokeWidth = isSelected && !viewMode ? 3 : strokeWidth;

  const renderColorPicker = () => (
    <div 
      className="absolute z-[101] h-12 flex items-center gap-2 px-3 bg-[#1E1E1E] rounded-full shadow-2xl border border-gray-800"
      style={{
        left: '50%',
        transform: `translate(-50%, -${(70 / scale)}px) scale(${1/scale})`,
        transformOrigin: 'bottom center',
        width: 'max-content'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
            <Palette className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" onMouseDown={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map(c => (
              <button
                key={c.value}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all border-2",
                  color === c.value ? "border-[#3B82F6] scale-110 shadow-md" : "border-gray-200 hover:scale-105"
                )}
                style={{ backgroundColor: c.value }}
                onClick={() => {
                  setColor(c.value);
                  if (onChange) onChange({ color: c.value });
                }}
                title={c.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <motion.div
      style={{ x, y }}
      className={cn(
        "absolute cursor-pointer group",
        isSelected ? "z-[50]" : "z-[40]"
      )}
      onMouseDown={handlePointerDown}
    >
      {isSelected && !viewMode && showToolbar && renderColorPicker()}

      <div 
        className="relative pointer-events-auto"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
      >
        {isLineType ? (
            <div className="w-full h-full relative">
                 <svg width={width} height={height} className="w-full h-full overflow-visible">
                    <defs>
                        <marker
                            id={`arrowhead-${element.id}`}
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill={selectedStroke} />
                        </marker>
                    </defs>
                    <line
                        x1={0}
                        y1={height / 2}
                        x2={width}
                        y2={height / 2}
                        stroke={selectedStroke}
                        strokeWidth={selectedStrokeWidth}
                        markerEnd={shape === 'arrow' ? `url(#arrowhead-${element.id})` : undefined}
                    />
                </svg>

                {isSelected && !viewMode && (
                    <>
                        <div 
                            className="absolute w-4 h-4 bg-white border-2 border-[#3B82F6] rounded-full cursor-move z-[60]"
                            style={{
                                width: 14/scale,
                                height: 14/scale,
                                borderWidth: 2/scale,
                                top: '50%',
                                left: 0,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: `0 0 0 ${1/scale}px rgba(0,0,0,0.1)`
                            }}
                            onMouseDown={(e) => handleLinePointMove(e, 'start')}
                        />
                        <div 
                            className="absolute w-4 h-4 bg-white border-2 border-[#3B82F6] rounded-full cursor-move z-[60]"
                            style={{
                                width: 14/scale,
                                height: 14/scale,
                                borderWidth: 2/scale,
                                top: '50%',
                                left: width,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: `0 0 0 ${1/scale}px rgba(0,0,0,0.1)`
                            }}
                            onMouseDown={(e) => handleLinePointMove(e, 'end')}
                        />
                    </>
                )}
            </div>
        ) : (
            <>
                <div 
                  className={cn(
                    "absolute inset-0 pointer-events-none rounded-lg",
                    isSelected && !viewMode ? "border border-[#3B82F6]" : ""
                  )}
                  style={{ borderWidth: isSelected && !viewMode ? `${2/scale}px` : '0px' }}
                />

                <div className="pointer-events-auto w-full h-full">
                   {renderShapeInternal(shape, width, height, color, selectedStroke, selectedStrokeWidth)}
                </div>

                {isSelected && !viewMode && (
                   <>
                        {/* Visual Selection Frame (Handles) */}
                        <SelectionFrame isSelected={true} scale={scale} />

                        {/* Rotate Handle */}
                        <div
                            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing z-[102]"
                            style={{
                            top: '50%',
                            left: -40 / scale,
                            transform: `translateY(-50%) rotate(-${rotation}deg)`,
                            transformOrigin: 'center center'
                            }}
                            onMouseDown={handleBoxRotate}
                        >
                            <div 
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                                style={{ transform: `scale(${1/scale})` }}
                            >
                                <RotateCw className="w-4 h-4 text-[#3B82F6]" />
                            </div>
                        </div>

                        {/* Invisible Interactive Corner Handles */}
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                            const size = 30 / scale; // Larger touch target
                            const offset = -size / 2;
                            return (
                                <div 
                                key={pos}
                                className={cn(
                                    "absolute z-[105] pointer-events-auto opacity-0",
                                    pos === 'top-left' && "cursor-nwse-resize",
                                    pos === 'top-right' && "cursor-nesw-resize",
                                    pos === 'bottom-left' && "cursor-nesw-resize",
                                    pos === 'bottom-right' && "cursor-nwse-resize",
                                )}
                                style={{
                                    width: size,
                                    height: size,
                                    top: pos.includes('top') ? offset : undefined,
                                    bottom: pos.includes('bottom') ? offset : undefined,
                                    left: pos.includes('left') ? offset : undefined,
                                    right: pos.includes('right') ? offset : undefined,
                                }}
                                onMouseDown={(e) => handleBoxResize(e, pos)}
                                />
                            );
                        })}

                        {/* Invisible Interactive Side Handles */}
                        {['top', 'right', 'bottom', 'left'].map(pos => {
                            const isVertical = pos === 'left' || pos === 'right';
                            const w = isVertical ? 20/scale : 40/scale; // Larger target
                            const h = isVertical ? 40/scale : 20/scale; // Larger target
                            
                            return (
                                <div
                                key={pos}
                                className={cn(
                                    "absolute z-[105] pointer-events-auto opacity-0",
                                    isVertical ? "cursor-ew-resize" : "cursor-ns-resize"
                                )}
                                style={{
                                    width: w,
                                    height: h,
                                    top: pos === 'top' ? -h/2 : pos === 'bottom' ? undefined : '50%',
                                    bottom: pos === 'bottom' ? -h/2 : undefined,
                                    left: pos === 'left' ? -w/2 : pos === 'right' ? undefined : '50%',
                                    right: pos === 'right' ? -w/2 : undefined,
                                    transform: isVertical ? 'translateY(-50%)' : 'translateX(-50%)',
                                }}
                                onMouseDown={(e) => handleBoxResize(e, pos)}
                                />
                            );
                        })}
                   </>
                )}
            </>
        )}
      </div>
    </motion.div>
  );
}

function renderShapeInternal(shape: string, width: number, height: number, color: string, stroke: string, strokeWidth: number) {
    switch (shape) {
      case 'circle':
        const cx = width / 2;
        const cy = height / 2;
        const p = strokeWidth / 2;
        const rx = Math.max(0, width / 2 - p);
        const ry = Math.max(0, height / 2 - p);
        return (
          <svg width={width} height={height} className="w-full h-full">
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'square':
      case 'rectangle':
        const rectP = strokeWidth / 2;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <rect x={rectP} y={rectP} width={Math.max(0, width - 2 * rectP)} height={Math.max(0, height - 2 * rectP)} fill={color} stroke={stroke} strokeWidth={strokeWidth} rx={8} />
          </svg>
        );
      case 'triangle':
      case 'hexagon':
      case 'star':
      case 'diamond':
      case 'octagon':
      case 'pentagon':
        let points: number[][] = [];
        if (shape === 'triangle') points = [[0.5, 0], [1, 1], [0, 1]];
        else if (shape === 'hexagon') points = [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]];
        else if (shape === 'diamond') points = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
        else if (shape === 'pentagon') points = [[0.5, 0], [1, 0.38], [0.82, 1], [0.18, 1], [0, 0.38]];
        else if (shape === 'octagon') points = [[0.293, 0], [0.707, 0], [1, 0.293], [1, 0.707], [0.707, 1], [0.293, 1], [0, 0.707], [0, 0.293]];
        else if (shape === 'star') points = [[0.5, 0], [0.618, 0.35], [0.98, 0.35], [0.68, 0.57], [0.79, 0.91], [0.5, 0.72], [0.21, 0.91], [0.32, 0.57], [0.02, 0.35], [0.382, 0.35]];

        const polyP = strokeWidth / 2;
        const pointsStr = points.map(([nx, ny]) => {
            const px = polyP + nx * (width - 2 * polyP);
            const py = polyP + ny * (height - 2 * polyP);
            return `${px},${py}`;
        }).join(' ');

        return (
          <svg width={width} height={height} className="w-full h-full">
            <polygon points={pointsStr} fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </svg>
        );
      case 'heart':
        const heartP = strokeWidth / 2;
        const availW = width - 2 * heartP;
        const availH = height - 2 * heartP;
        const scaleX = (v: number) => heartP + v * availW;
        const scaleY = (v: number) => heartP + v * availH;
        const d = `
            M ${scaleX(0.5)} ${scaleY(0.85)}
            C ${scaleX(0.5)} ${scaleY(0.85)} ${scaleX(0.15)} ${scaleY(0.60)} ${scaleX(0.15)} ${scaleY(0.40)}
            C ${scaleX(0.15)} ${scaleY(0.25)} ${scaleX(0.25)} ${scaleY(0.15)} ${scaleX(0.35)} ${scaleY(0.15)}
            C ${scaleX(0.42)} ${scaleY(0.15)} ${scaleX(0.48)} ${scaleY(0.20)} ${scaleX(0.50)} ${scaleY(0.25)}
            C ${scaleX(0.52)} ${scaleY(0.20)} ${scaleX(0.58)} ${scaleY(0.15)} ${scaleX(0.65)} ${scaleY(0.15)}
            C ${scaleX(0.75)} ${scaleY(0.15)} ${scaleX(0.85)} ${scaleY(0.25)} ${scaleX(0.85)} ${scaleY(0.40)}
            C ${scaleX(0.85)} ${scaleY(0.60)} ${scaleX(0.50)} ${scaleY(0.85)} ${scaleX(0.50)} ${scaleY(0.85)}
            Z
        `;
        return (
          <svg width={width} height={height} className="w-full h-full">
            <path d={d} fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </svg>
        );
      default: return null;
    }
}