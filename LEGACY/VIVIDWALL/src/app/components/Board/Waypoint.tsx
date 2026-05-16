import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue } from 'framer-motion';
import { Trash2, Lock, Unlock, Image as ImageIcon, Palette, Grid3X3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Resizable } from 're-resizable';
import { SelectionFrame, getResizeHandleStyles } from './SelectionFrame';
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface WaypointProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
  scale: number;
  labelLayer: HTMLElement | null;
  isInteractive?: boolean;
}

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Gray', value: '#64748b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
];

const PATTERNS = [
  { name: 'None', value: 'none', preview: 'bg-white' },
  { name: 'Dots', value: 'radial-gradient(#cbd5e1 1px, transparent 1px)', size: '20px 20px' },
  { name: 'Grid', value: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', size: '20px 20px' },
  { name: 'Diagonal', value: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 10px, #ffffff 10px, #ffffff 20px)', size: 'auto' },
];

const IMAGES = [
  'https://images.unsplash.com/photo-1634900003938-aba5f17f3da7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Geometric
  'https://images.unsplash.com/photo-1762503203733-162c9cf16a6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Gradient
  'https://images.unsplash.com/photo-1558051815-0f18e64e6280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Cork board
  'https://images.unsplash.com/photo-1685377106726-4dc54c96fe89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // New York
  'https://images.unsplash.com/photo-1763392199003-27cee33bae31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Wood
  'https://images.unsplash.com/photo-1736979110931-ac9c6fa82dbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Paper
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Soft abstract
  'https://images.unsplash.com/photo-1656524698811-8827220e66e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Brick
  'https://images.unsplash.com/photo-1759210358942-79b6fff8f2ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Blueprint
  'https://images.unsplash.com/photo-1689950372187-206e9fa82686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Sky
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Liquid
  'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // White Marble
  'https://images.unsplash.com/photo-1644690627229-15d952217736?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Concrete
  'https://images.unsplash.com/photo-1615799998603-7c6270a45196?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Linen
  'https://images.unsplash.com/photo-1648743779757-d1a4789790d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Terrazzo
  'https://images.unsplash.com/photo-1750327324610-433b26d1b13d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Pastel Watercolor
  'https://images.unsplash.com/photo-1761847246291-4404b4569d5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Dark Slate
  'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Crumpled Paper
  'https://images.unsplash.com/photo-1653945645604-c3f0cb10caf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Hexagon
  'https://images.unsplash.com/photo-1722811722309-d4c8c09156cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // Grainy Gradient
  'https://images.unsplash.com/photo-1623770482029-002ba64cf790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', // White Wood
];

const BACKGROUND_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Cream', value: '#fffbeb' }, // amber-50
  { name: 'Mint', value: '#f0fdf4' }, // green-50
  { name: 'Azure', value: '#eff6ff' }, // blue-50
  { name: 'Lavender', value: '#faf5ff' }, // purple-50
  { name: 'Rose', value: '#fff1f2' }, // rose-50
  { name: 'Mist', value: '#f3f4f6' }, // gray-100
  { name: 'Slate', value: '#cbd5e1' }, // slate-300
  { name: 'Dark', value: '#1e293b' }, // slate-800
];

export function Waypoint({ element, isSelected, onSelect, onChange, onDragEnd, onDelete, scale, labelLayer, isInteractive = true }: WaypointProps) {
  const [width, setWidth] = useState(element.width || 300);
  const [height, setHeight] = useState(element.height || 300);
  const [name, setName] = useState(element.name || '');
  const [color, setColor] = useState(element.color || '#6366f1');
  const [isLocked, setIsLocked] = useState(element.locked || false);
  
  // Background state
  const [bgType, setBgType] = useState<'color' | 'pattern' | 'image'>(element.bgType || 'color');
  const [bgValue, setBgValue] = useState(element.bgValue || '#ffffff');

  const x = useMotionValue(element.x);
  const y = useMotionValue(element.y);

  const dragStartValues = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    setWidth(element.width || 300);
    setHeight(element.height || 300);
    setName(element.name || '');
    setColor(element.color || '#6366f1');
    setIsLocked(element.locked || false);
    setBgType(element.bgType || 'color');
    setBgValue(element.bgValue || '#ffffff');
  }, [element]);

  useEffect(() => {
    x.set(element.x);
    y.set(element.y);
  }, [element.x, element.y, x, y]);

  const handleResizeStart = () => {
    dragStartValues.current = {
        x: x.get(),
        y: y.get(),
        width: width,
        height: height
    };
  };

  const handleResize = (e: any, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
    const newWidth = dragStartValues.current.width + d.width;
    const newHeight = dragStartValues.current.height + d.height;
    
    setWidth(newWidth);
    setHeight(newHeight);

    if (direction.includes('left')) {
        x.set(dragStartValues.current.x - d.width);
    }
    if (direction.includes('top')) {
        y.set(dragStartValues.current.y - d.height);
    }
  };

  const handleResizeStop = (e: any, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
    const finalWidth = dragStartValues.current.width + d.width;
    const finalHeight = dragStartValues.current.height + d.height;
    
    let finalX = dragStartValues.current.x;
    let finalY = dragStartValues.current.y;
    
    if (direction.includes('left')) finalX -= d.width;
    if (direction.includes('top')) finalY -= d.height;

    setWidth(finalWidth);
    setHeight(finalHeight);
    x.set(finalX);
    y.set(finalY);

    onChange({ width: finalWidth, height: finalHeight, x: finalX, y: finalY });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();

    if (isLocked) return;
    
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = x.get();
    const startNodeY = y.get();
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      x.set(startNodeX + dx);
      y.set(startNodeY + dy);
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      const currentX = x.get();
      const currentY = y.get();
      if (currentX !== startNodeX || currentY !== startNodeY) {
          onDragEnd(currentX, currentY);
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Robust name saving
  const handleNameBlur = () => {
    if (name !== element.name) {
      onChange({ name });
    }
  };

  const activeColor = COLORS.find(c => c.value === color) || COLORS[0];

  // Calculate background style
  const getBackgroundStyle = () => {
    if (bgType === 'image') {
      return {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f8fafc'
      };
    }
    if (bgType === 'pattern') {
      if (bgValue === 'none') return { backgroundColor: '#ffffff' };
      const pattern = PATTERNS.find(p => p.value === bgValue);
      return {
        backgroundImage: bgValue,
        backgroundSize: pattern?.size || 'auto',
        backgroundColor: '#ffffff'
      };
    }
    // Color
    return { backgroundColor: bgValue };
  };

  // Handle Styles for larger hit area
  // const handleSize = 30 / scale;
  // const handleOffset = -handleSize / 2;
  // const commonHandleStyle = { width: handleSize, height: handleSize };

  return (
    <>
      {/* Toolbar */}
      {isSelected && (
        <div 
            className="absolute z-[101] flex items-center gap-1 p-1 bg-[#2C2C2C] rounded-lg shadow-xl"
            style={{
                left: x.get(),
                top: y.get() - (50 / scale), 
                transform: `scale(${1/scale})`,
                transformOrigin: 'bottom left'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Appearance Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center shrink-0 group">
                        <Palette className="w-4 h-4 text-white group-hover:text-blue-400 transition-colors" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 bg-[#2C2C2C] border-gray-700 w-72">
                    <Tabs defaultValue="theme" className="w-full">
                      <TabsList className="w-full bg-gray-800 rounded-none border-b border-gray-700">
                        <TabsTrigger value="theme" className="flex-1 text-xs text-gray-400 data-[state=active]:text-black">Barva</TabsTrigger>
                        <TabsTrigger value="bg" className="flex-1 text-xs text-gray-400 data-[state=active]:text-black">Pozadí</TabsTrigger>
                      </TabsList>
                      
                      {/* THEME TAB (Border & Label Color) */}
                      <TabsContent value="theme" className="p-3 space-y-3">
                         <div className="grid grid-cols-4 gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    className={cn(
                                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                                      color === c.value ? "border-white scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => {
                                        setColor(c.value);
                                        onChange({ color: c.value });
                                    }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 text-center pt-1">Changes border & label color</p>
                      </TabsContent>

                      {/* BACKGROUND TAB */}
                      <TabsContent value="bg" className="p-3 space-y-4">
                         <div className="space-y-2">
                             <label className="text-xs text-gray-400 font-medium">Solid Color</label>
                             <div className="grid grid-cols-5 gap-2">
                                {BACKGROUND_COLORS.map(bg => (
                                   <button
                                      key={bg.name}
                                      className={cn(
                                          "w-8 h-8 rounded-full border border-gray-600 flex-shrink-0 transition-transform hover:scale-110",
                                          bgType==='color' && bgValue===bg.value && "ring-2 ring-blue-500 border-transparent scale-110"
                                      )}
                                      style={{ backgroundColor: bg.value }}
                                      onClick={() => { 
                                          setBgType('color'); 
                                          setBgValue(bg.value); 
                                          onChange({ bgType: 'color', bgValue: bg.value }); 
                                      }}
                                      title={bg.name}
                                   />
                                ))}
                             </div>
                         </div>

                         <div className="space-y-2">
                             <label className="text-xs text-gray-400 font-medium">Pattern</label>
                             <div className="flex gap-2">
                                {PATTERNS.map(p => (
                                    <button
                                        key={p.name}
                                        className={cn(
                                            "w-8 h-8 rounded border border-gray-600 bg-white flex-shrink-0 overflow-hidden",
                                            bgType==='pattern' && bgValue===p.value && "ring-2 ring-blue-500"
                                        )}
                                        style={{ backgroundImage: p.value !== 'none' ? p.value : undefined, backgroundSize: p.size }}
                                        onClick={() => {
                                            setBgType('pattern');
                                            setBgValue(p.value);
                                            onChange({ bgType: 'pattern', bgValue: p.value });
                                        }}
                                        title={p.name}
                                    />
                                ))}
                             </div>
                         </div>

                         <div className="space-y-2">
                             <label className="text-xs text-gray-400 font-medium">Image</label>
                             <div className="grid grid-cols-3 gap-2">
                                {IMAGES.map((img, i) => (
                                    <button
                                        key={i}
                                        className={cn(
                                            "aspect-video rounded border border-gray-600 bg-gray-800 flex-shrink-0 overflow-hidden hover:opacity-90",
                                            bgType==='image' && bgValue===img && "ring-2 ring-blue-500"
                                        )}
                                        style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                                        onClick={() => {
                                            setBgType('image');
                                            setBgValue(img);
                                            onChange({ bgType: 'image', bgValue: img });
                                        }}
                                    />
                                ))}
                             </div>
                         </div>
                      </TabsContent>
                    </Tabs>
                </PopoverContent>
            </Popover>

            <div className="w-px h-4 bg-gray-600 mx-1" />

            {/* Rename Input */}
            <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur(); // Trigger blur to save
                  }
                }}
                placeholder="Název plátna" 
                className="bg-transparent border-none text-white h-8 text-sm w-32 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-gray-500"
            />

            <div className="w-px h-4 bg-gray-600 mx-1" />

            {/* Lock */}
             <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "h-8 w-8 text-white shrink-0",
                    isLocked ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20" : "hover:bg-gray-700"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    const newState = !isLocked;
                    setIsLocked(newState);
                    onChange({ locked: newState });
                }}
                title={isLocked ? "Unlock" : "Lock"}
            >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            {/* Delete */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-red-500/20 hover:text-red-400 shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      )}

      {/* PORTALLED Label */}
      {labelLayer && createPortal(
        <motion.div
            style={{ x, y }}
            className="absolute top-0 left-0 pointer-events-none" 
        >
             <div 
                className={cn(
                    "absolute pointer-events-auto",
                    !isLocked ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                    !isInteractive && "pointer-events-none"
                )}
                onPointerDown={handlePointerDown}
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                style={{
                    top: 0,
                    left: 0,
                    transform: `translate(${12 / scale}px, ${12 / scale}px) scale(${1 / scale})`,
                    transformOrigin: 'top left',
                }}
            >
                 <div 
                    className="text-white text-sm font-bold px-4 py-1 rounded-full shadow-sm flex items-center gap-2 transition-colors"
                    style={{ backgroundColor: activeColor.value }}
                >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    {element.label}
                    {name && (
                        <span className="font-normal opacity-90 border-l border-white/30 pl-2 ml-1">
                            {name}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>,
        labelLayer
      )}

      {/* Background / Resizable Container */}
      <motion.div
        style={{ x, y }}
        className={cn(
          "absolute group",
          isSelected ? "z-[1]" : "z-0",
          !isInteractive && "pointer-events-none"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Resizable
            scale={scale}
            size={{ width, height }}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            minWidth={100}
            minHeight={100}
            enable={isSelected && !isLocked ? { 
                top:true, right:true, bottom:true, left:true, 
                topRight:true, bottomRight:true, bottomLeft:true, topLeft:true 
            } : false} 
            handleStyles={getResizeHandleStyles(scale)}
            className={cn(
                "relative transition-all",
                isSelected && !isLocked && "ring-2 ring-[#3B82F6]"
            )}
            style={{
                border: `3px solid ${activeColor.value}`, // Use theme color for border
                borderRadius: '24px',
                ...getBackgroundStyle(), // Apply custom background
                boxShadow: `0 8px 30px -4px ${activeColor.value}33`, 
                opacity: isLocked ? 0.8 : 1,
                cursor: isLocked ? 'default' : 'move'
            }}
        >
             <SelectionFrame isSelected={isSelected && !isLocked} scale={scale} />

            <div 
                className={cn(
                    "w-full h-full",
                    isSelected && !isLocked ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                )}
                onPointerDown={(e) => {
                    if (isSelected) {
                        handlePointerDown(e);
                    }
                }}
            />
        </Resizable>
      </motion.div>
    </>
  );
}
