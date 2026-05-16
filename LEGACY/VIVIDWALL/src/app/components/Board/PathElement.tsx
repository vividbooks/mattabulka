import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SelectionFrame } from './SelectionFrame';

interface PathElementProps {
  element: any;
  isSelected: boolean;
  showToolbar?: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onDelete: () => void;
  onMultiDrag?: (dx: number, dy: number) => void;
  onMultiDragEnd?: () => void;
  selectedIds?: string[];
  isInteractive: boolean;
  scale: number;
}

// Colors for toolbar
const COLORS = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7', '#64748B', '#FFFFFF'];
const SIZES = [
  { value: 2, label: 'Thin' },
  { value: 4, label: 'Normal' },
  { value: 8, label: 'Thick' },
  { value: 16, label: 'Heavy' },
  { value: 24, label: 'Massive' }
];

export function PathElement({ 
  element, 
  isSelected, 
  showToolbar = true,
  onSelect, 
  onChange, 
  onDelete,
  onMultiDrag,
  onMultiDragEnd,
  selectedIds,
  isInteractive, 
  scale 
}: PathElementProps) {
  const points = element.points || [];
  const [rotation, setRotation] = useState(element.rotation || 0);
  
  // Calculate bounding box
  const bounds = useMemo(() => {
    if (points.length === 0) return { x: 0, y: 0, w: 100, h: 100 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach((p: any) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    
    const padding = 20;
    return {
      x: minX - padding,
      y: minY - padding,
      w: maxX - minX + padding * 2,
      h: maxY - minY + padding * 2,
      minX, minY, maxX, maxY // Store actual content bounds for ratio calcs
    };
  }, [points]);

  // SVG path data - relative to bounds.x/y
  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p: any, i: number) => {
      const x = p.x - bounds.x;
      const y = p.y - bounds.y;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [points, bounds]);

  // Motion values for position
  const x = useMotionValue(bounds.x);
  const y = useMotionValue(bounds.y);

  // Sync motion values when bounds change and rotation
  useEffect(() => {
    x.set(bounds.x);
    y.set(bounds.y);
  }, [bounds.x, bounds.y, x, y]);
  
  useEffect(() => {
    if (element.rotation !== undefined) setRotation(element.rotation);
  }, [element.rotation]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive) {
      e.stopPropagation(); // Always stop if not interactive
      return;
    }
    
    if (!isSelected) {
      // If not selected, let onClick handle selection, but stop propagation
      e.stopPropagation();
      return;
    }
    
    // If selected and interactive, handle dragging
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = x.get();
    const startY = y.get();
    const isMultiSelect = selectedIds && selectedIds.length > 1;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startMouseX) / scale;
      const dy = (moveEvent.clientY - startMouseY) / scale;
      
      if (isMultiSelect) {
        // In multi-select, just call onMultiDrag - Canvas will handle all elements
        onMultiDrag && onMultiDrag(dx, dy);
      } else {
        // Single element drag - update position visually
        x.set(startX + dx);
        y.set(startY + dy);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      const currentX = x.get();
      const currentY = y.get();
      
      const dx = currentX - startX;
      const dy = currentY - startY;

      if (dx !== 0 || dy !== 0) {
        if (isMultiSelect) {
          // Multi-select - onMultiDragEnd will save all elements
          onMultiDragEnd && onMultiDragEnd();
        } else {
          // Single element - update points and save
          const newPoints = points.map((p: any) => ({
            x: p.x + dx,
            y: p.y + dy
          }));
          onChange({ points: newPoints });
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // --- RESIZE LOGIC ---
  const handleResizeStart = (e: React.PointerEvent, direction: string) => {
    e.stopPropagation();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    
    const startBounds = { ...bounds };
    const startPoints = [...points];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startMouseX) / scale;
      const dy = (moveEvent.clientY - startMouseY) / scale;

      let newX = startBounds.x;
      let newY = startBounds.y;
      let newW = startBounds.w;
      let newH = startBounds.h;

      if (direction.includes('w')) { newX += dx; newW -= dx; }
      if (direction.includes('e')) { newW += dx; }
      if (direction.includes('n')) { newY += dy; newH -= dy; }
      if (direction.includes('s')) { newH += dy; }

      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;

      const newPoints = startPoints.map((p: any) => {
          const relX = (p.x - startBounds.x) / startBounds.w;
          const relY = (p.y - startBounds.y) / startBounds.h;
          return {
              x: newX + (relX * newW),
              y: newY + (relY * newH)
          };
      });

      onChange({ points: newPoints });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const handlePointerMove = (ev: MouseEvent) => {
      // Get the shape container
      const shapeRect = (e.target as HTMLElement).closest('div[style*="rotate"]')?.getBoundingClientRect();
      if (!shapeRect) return;
      
      const centerScreenX = shapeRect.left + shapeRect.width / 2;
      const centerScreenY = shapeRect.top + shapeRect.height / 2;
      
      const dx = ev.clientX - centerScreenX;
      const dy = ev.clientY - centerScreenY;
      
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      setRotation(angle);
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      
      onChange({ rotation });
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
  };

  // Helper for hitboxes matches re-resizable logic
  const getHitboxStyle = (pos: string) => {
       const s = 30 / scale;
       const o = -15 / scale;
       const style: any = { position: 'absolute', zIndex: 300, touchAction: 'none' };
       
       if (pos === 'nw') { style.top = o; style.left = o; style.width = s; style.height = s; style.cursor = 'nwse-resize'; }
       if (pos === 'ne') { style.top = o; style.right = o; style.width = s; style.height = s; style.cursor = 'nesw-resize'; }
       if (pos === 'sw') { style.bottom = o; style.left = o; style.width = s; style.height = s; style.cursor = 'nesw-resize'; }
       if (pos === 'se') { style.bottom = o; style.right = o; style.width = s; style.height = s; style.cursor = 'nwse-resize'; }
       
       if (pos === 'n') { style.top = -7; style.left = 0; style.right = 0; style.height = 15; style.cursor = 'ns-resize'; }
       if (pos === 's') { style.bottom = -7; style.left = 0; style.right = 0; style.height = 15; style.cursor = 'ns-resize'; }
       if (pos === 'w') { style.left = -7; style.top = 0; style.bottom = 0; style.width = 15; style.cursor = 'ew-resize'; }
       if (pos === 'e') { style.right = -7; style.top = 0; style.bottom = 0; style.width = 15; style.cursor = 'ew-resize'; }
       
       return style;
  };

  return (
    <>
      {/* TOOLBAR */}
      {isSelected && showToolbar && (
        <motion.div
          style={{ 
            x, 
            y, 
            zIndex: 9999,
            pointerEvents: 'none', 
            position: 'absolute'
          }}
        >
          <div 
            style={{ 
              transform: `scale(${1/scale})`, 
              transformOrigin: 'bottom left',
              position: 'absolute',
              top: -60 / scale,
              left: 0,
              pointerEvents: 'auto'
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-2 bg-gray-900 rounded-lg shadow-2xl border-2 border-blue-500">
              {/* Colors */}
              <div className="flex gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => onChange({ color })}
                  />
                ))}
              </div>
              
              <div className="w-px h-6 bg-gray-600" />
              
              {/* Size Dropdown */}
              <Select 
                value={String(element.strokeWidth || 4)} 
                onValueChange={(v) => onChange({ strokeWidth: parseInt(v) })}
              >
                <SelectTrigger className="h-8 w-[100px] bg-gray-800 border-gray-700 text-white text-xs focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {SIZES.map(size => (
                        <SelectItem key={size.value} value={String(size.value)} className="focus:bg-gray-700 focus:text-white text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 bg-current rounded-full" style={{ height: Math.max(2, size.value / 2) }} />
                                {size.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <div className="w-px h-6 bg-gray-600" />
              
              {/* Delete */}
              <button
                className="w-8 h-8 rounded bg-red-600 hover:bg-red-500 text-white flex items-center justify-center"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* BOUNDING BOX + LINE */}
      <motion.div
        style={{
          x,
          y,
          width: bounds.w,
          height: bounds.h,
          zIndex: isSelected ? 100 : 10,
          position: 'absolute',
          touchAction: 'none',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
        onPointerDown={handlePointerDown}
      >
        <div className={cn("absolute inset-0 pointer-events-none", isSelected && "ring-2 ring-[#3B82F6]")} />

        {/* Rotate handle */}
        {isSelected && isInteractive && (
          <div
            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing z-[65]"
            style={{
              top: -40 / scale,
              left: '50%',
              transform: `translateX(-50%) rotate(-${rotation}deg)`,
            }}
            onMouseDown={handleRotate}
          >
            <div 
              className="w-8 h-8 flex items-center justify-center"
              style={{
                transform: `scale(${1/scale})`,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#3B82F6]">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${bounds.w} ${bounds.h}`}
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          {/* Arrow marker definition */}
          {element.isArrow && (
            <defs>
              <marker
                id={`arrow-${element.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L0,10 L10,5 z"
                  fill={element.color || '#000000'}
                />
              </marker>
            </defs>
          )}
          
          <path
            d={pathData}
            stroke="transparent"
            strokeWidth={Math.max(20, element.strokeWidth * 2)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              pointerEvents: isInteractive ? 'stroke' : 'none',
              cursor: isInteractive ? (isSelected ? 'grab' : 'pointer') : 'default'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          />
          <path
            d={pathData}
            stroke={element.color || '#000000'}
            strokeWidth={element.strokeWidth || 4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
            markerEnd={element.isArrow ? `url(#arrow-${element.id})` : undefined}
          />
        </svg>

        {/* RESIZE HANDLES */}
        {isSelected && isInteractive && (
          <>
            <SelectionFrame isSelected={true} scale={scale} />

            {/* Hitboxes */}
            <div style={getHitboxStyle('nw')} onPointerDown={(e) => handleResizeStart(e, 'nw')} />
            <div style={getHitboxStyle('ne')} onPointerDown={(e) => handleResizeStart(e, 'ne')} />
            <div style={getHitboxStyle('sw')} onPointerDown={(e) => handleResizeStart(e, 'sw')} />
            <div style={getHitboxStyle('se')} onPointerDown={(e) => handleResizeStart(e, 'se')} />
            
            {scale > 0.6 && (
                <>
                    <div style={getHitboxStyle('n')} onPointerDown={(e) => handleResizeStart(e, 'n')} />
                    <div style={getHitboxStyle('s')} onPointerDown={(e) => handleResizeStart(e, 's')} />
                    <div style={getHitboxStyle('w')} onPointerDown={(e) => handleResizeStart(e, 'w')} />
                    <div style={getHitboxStyle('e')} onPointerDown={(e) => handleResizeStart(e, 'e')} />
                </>
            )}
          </>
        )}
      </motion.div>
    </>
  );
}