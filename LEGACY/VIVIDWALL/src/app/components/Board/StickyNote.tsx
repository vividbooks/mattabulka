import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Bold, Italic, Link as LinkIcon, List, User, Strikethrough, ExternalLink, Square, Circle, Diamond, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Resizable } from 're-resizable';
import { SelectionFrame, getResizeHandleStyles } from './SelectionFrame';
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface StickyNoteProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onConnect: (e: React.PointerEvent, direction: 'top' | 'right' | 'bottom' | 'left') => void;
  onHover: (id: string | null) => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
  onConnectorHover?: (id: string, direction: string | null) => void;
  onMultiDrag?: (dx: number, dy: number) => void;
  onMultiDragEnd?: () => void;
  selectedIds?: string[];
  scale: number;
  isInteractive?: boolean;
}

const COLORS = [
  { name: 'Pink', value: '#ffb7b2' },
  { name: 'Yellow', value: '#fff475' },
  { name: 'Green', value: '#ccff90' },
  { name: 'Blue', value: '#a7ffeb' },
  { name: 'Purple', value: '#d7aefb' },
  { name: 'Orange', value: '#fdcfe8' },
  { name: 'Gray', value: '#e2e2e2' }, 
];

const FONT_SIZES = [
    { label: 'Small', value: '28' },
    { label: 'Medium', value: '36' },
    { label: 'Large', value: '48' },
    { label: 'Huge', value: '72' },
];

const SHAPES = [
    { id: 'square', label: 'Square', icon: Square, radius: '0px' },
    { id: 'rounded', label: 'Rounded', icon: Square, radius: '12px' },
    { id: 'circle', label: 'Circle', icon: Circle, radius: '50%' },
];

export function StickyNote({ element, isSelected, onSelect, onChange, onConnect, onHover, onDragEnd, onDelete, onConnectorHover, onMultiDrag, onMultiDragEnd, selectedIds, scale, isInteractive = true }: StickyNoteProps) {
  const [content, setContent] = useState(element.content || '');
  const [color, setColor] = useState(element.color || '#ffb7b2');
  const [width, setWidth] = useState(element.width || 400);
  const [height, setHeight] = useState(element.height || 400);
  const [fontSize, setFontSize] = useState(element.fontSize || 48);
  const [isBold, setIsBold] = useState(element.isBold || false);
  const [showAuthor, setShowAuthor] = useState(element.showAuthor !== false);
  const [url, setUrl] = useState(element.url || '');
  const [shape, setShape] = useState(element.shape || 'rounded');
  const [isEditing, setIsEditing] = useState(false);
  
  const x = useMotionValue(element.x);
  const y = useMotionValue(element.y);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setContent(element.content || '');
    setColor(element.color || '#ffb7b2');
    setWidth(element.width || 400);
    setHeight(element.height || 400);
    setFontSize(element.fontSize || 48);
    setIsBold(element.isBold || false);
    setShowAuthor(element.showAuthor !== false);
    setUrl(element.url || '');
    setShape(element.shape || 'rounded');
  }, [element]);

  useEffect(() => {
    x.set(element.x);
    y.set(element.y);
  }, [element.x, element.y, x, y]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange({ content: newContent });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onChange({ color: newColor });
  };

  const handleShapeChange = (newShape: string) => {
    setShape(newShape);
    onChange({ shape: newShape });
  };
  
  const handleResizeStart = () => {
     resizeStartPos.current = { x: x.get(), y: y.get() };
  };

  const handleResize = (e: any, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
    if (ref) {
        setWidth(ref.offsetWidth);
        setHeight(ref.offsetHeight);
        
        if (direction.includes('Left')) {
             x.set(resizeStartPos.current.x - d.width);
        }
        if (direction.includes('Top')) {
             y.set(resizeStartPos.current.y - d.height);
        }
    }
  };

  const handleResizeStop = (e: any, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;
    
    setWidth(newWidth);
    setHeight(newHeight);
    
    let newX = resizeStartPos.current.x;
    let newY = resizeStartPos.current.y;

    if (direction.includes('Left')) {
         newX -= d.width;
    }
    if (direction.includes('Top')) {
         newY -= d.height;
    }

    x.set(newX);
    y.set(newY);
    
    onChange({ 
        width: newWidth, 
        height: newHeight,
        x: newX,
        y: newY
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    onSelect();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = x.get();
    const startNodeY = y.get();
    
    // Check if this is multi-select drag
    const isMultiSelect = selectedIds && selectedIds.length > 1;
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      if (isMultiSelect) {
        // In multi-select, onMultiDrag will update all elements including this one
        onMultiDrag && onMultiDrag(dx, dy);
      } else {
        // Single element drag - update only this element
        x.set(startNodeX + dx);
        y.set(startNodeY + dy);
      }
    };
    
    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      const currentX = x.get();
      const currentY = y.get();
      if (currentX !== startNodeX || currentY !== startNodeY) {
          if (isMultiSelect) {
            onMultiDragEnd && onMultiDragEnd();
          } else {
            onDragEnd(currentX, currentY);
          }
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentShape = SHAPES.find(s => s.id === shape) || SHAPES[0];
  const ShapeIcon = currentShape.icon;
  const borderRadius = shape === 'circle' ? '50%' : (shape === 'rounded' ? '32px' : '0px');

  // Old handle definitions removed

  return (
    <>
      {isSelected && (
        <div 
            className="absolute z-50 flex items-center gap-1 p-1 bg-[#2C2C2C] rounded-lg shadow-xl"
            style={{
                left: x.get(),
                top: y.get() - (50 / scale), 
                transform: `scale(${1/scale})`,
                transformOrigin: 'bottom left'
            }}
            onMouseDown={(e) => e.stopPropagation()} 
        >
            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-white">
                        <ShapeIcon className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 bg-[#2C2C2C] border-gray-700 w-auto">
                    <div className="flex gap-2">
                        {SHAPES.map(s => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    className={cn(
                                        "w-8 h-8 rounded flex items-center justify-center border border-transparent hover:bg-gray-700 text-white",
                                        shape === s.id && "bg-gray-700 border-gray-500"
                                    )}
                                    onClick={() => handleShapeChange(s.id)}
                                    title={s.label}
                                >
                                    <Icon className={cn("w-5 h-5", s.id === 'rounded' && "rounded-md")} />
                                </button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
            <div className="w-px h-4 bg-gray-600 mx-1" />
            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 bg-[#2C2C2C] border-gray-700 w-auto">
                    <div className="flex gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.name}
                                className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c.value }}
                                onClick={() => handleColorChange(c.value)}
                                title={c.name}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
            <div className="w-px h-4 bg-gray-600 mx-1" />
            <Select value={String(fontSize)} onValueChange={(v) => {
                const val = parseInt(v);
                setFontSize(val);
                onChange({ fontSize: val });
            }}>
                <SelectTrigger className="h-8 w-[90px] bg-transparent border-none text-white focus:ring-0">
                    <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2C2C] border-gray-700 text-white">
                    {FONT_SIZES.map(size => (
                        <SelectItem key={size.value} value={size.value} className="focus:bg-gray-700 focus:text-white">{size.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="w-px h-4 bg-gray-600 mx-1" />
             <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 text-white hover:bg-gray-700", isBold && "bg-gray-700 text-blue-400")}
                onClick={() => {
                    const newVal = !isBold;
                    setIsBold(newVal);
                    onChange({ isBold: newVal });
                }}
             >
                <Bold className="w-4 h-4" />
            </Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 text-white hover:bg-gray-700", url && "text-blue-400")}
                    >
                        <LinkIcon className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-3 bg-[#2C2C2C] border-gray-700 w-64">
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Link URL</Label>
                        <Input 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)}
                            onBlur={() => onChange({ url })}
                            placeholder="https://..." 
                            className="bg-gray-800 border-gray-600 text-white h-8 text-sm"
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <div className="w-px h-4 bg-gray-600 mx-1" />
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 text-white hover:bg-gray-700", showAuthor && "bg-gray-700 text-blue-400")}
                onClick={() => {
                    const newVal = !showAuthor;
                    setShowAuthor(newVal);
                    onChange({ showAuthor: newVal });
                }}
                title="Show Author Name"
            >
                <User className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-gray-600 mx-1" />
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-red-500/20 hover:text-red-400"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                title="Delete Note"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      )}

      <motion.div
        style={{ x, y }}
        className={cn(
          "absolute group overflow-visible",
          isSelected ? "z-20" : "z-10",
          !isInteractive && "pointer-events-none"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Resizable
            size={{ width, height }}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            minWidth={150}
            minHeight={150}
            enable={isSelected && isInteractive ? { 
                top:true, right:true, bottom:true, left:true, 
                topRight:true, bottomRight:true, bottomLeft:true, topLeft:true 
            } : false}
            handleStyles={getResizeHandleStyles(scale)}
            className={cn(
                "shadow-sm transition-shadow relative hover:shadow-md overflow-visible",
                isSelected && "ring-2 ring-[#3B82F6]"
            )}
            style={{ 
                backgroundColor: color,
                borderRadius: borderRadius,
                transform: 'none' 
            }}
        >
            <SelectionFrame isSelected={isSelected} scale={scale} />

            {isSelected && (
               <>
                  <div
                     className="absolute flex items-center justify-center z-40 group/connector"
                     style={{
                        top: -36 / scale,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 24 / scale,
                        height: 24 / scale
                     }}
                     onPointerDown={(e) => { e.stopPropagation(); onConnect(e, 'top'); }}
                     onMouseEnter={() => onConnectorHover && onConnectorHover(element.id, 'top')}
                     onMouseLeave={() => onConnectorHover && onConnectorHover(element.id, null)}
                  >
                       <div className="w-full h-full bg-white border border-blue-500 rounded-full shadow-sm flex items-center justify-center hover:bg-blue-500 hover:border-transparent transition-colors">
                          <Plus className="text-blue-500 group-hover/connector:text-white" style={{ width: 16 / scale, height: 16 / scale }} strokeWidth={3} />
                       </div>
                  </div>
                  <div
                     className="absolute flex items-center justify-center z-40 group/connector"
                     style={{
                        right: -36 / scale,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24 / scale,
                        height: 24 / scale
                     }}
                     onPointerDown={(e) => { e.stopPropagation(); onConnect(e, 'right'); }}
                     onMouseEnter={() => onConnectorHover && onConnectorHover(element.id, 'right')}
                     onMouseLeave={() => onConnectorHover && onConnectorHover(element.id, null)}
                  >
                       <div className="w-full h-full bg-white border border-blue-500 rounded-full shadow-sm flex items-center justify-center hover:bg-blue-500 hover:border-transparent transition-colors">
                          <Plus className="text-blue-500 group-hover/connector:text-white" style={{ width: 16 / scale, height: 16 / scale }} strokeWidth={3} />
                       </div>
                  </div>
                  <div
                     className="absolute flex items-center justify-center z-40 group/connector"
                     style={{
                        bottom: -36 / scale,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 24 / scale,
                        height: 24 / scale
                     }}
                     onPointerDown={(e) => { e.stopPropagation(); onConnect(e, 'bottom'); }}
                     onMouseEnter={() => onConnectorHover && onConnectorHover(element.id, 'bottom')}
                     onMouseLeave={() => onConnectorHover && onConnectorHover(element.id, null)}
                  >
                       <div className="w-full h-full bg-white border border-blue-500 rounded-full shadow-sm flex items-center justify-center hover:bg-blue-500 hover:border-transparent transition-colors">
                          <Plus className="text-blue-500 group-hover/connector:text-white" style={{ width: 16 / scale, height: 16 / scale }} strokeWidth={3} />
                       </div>
                  </div>
                  <div
                     className="absolute flex items-center justify-center z-40 group/connector"
                     style={{
                        left: -36 / scale,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24 / scale,
                        height: 24 / scale
                     }}
                     onPointerDown={(e) => { e.stopPropagation(); onConnect(e, 'left'); }}
                     onMouseEnter={() => onConnectorHover && onConnectorHover(element.id, 'left')}
                     onMouseLeave={() => onConnectorHover && onConnectorHover(element.id, null)}
                  >
                       <div className="w-full h-full bg-white border border-blue-500 rounded-full shadow-sm flex items-center justify-center hover:bg-blue-500 hover:border-transparent transition-colors">
                          <Plus className="text-blue-500 group-hover/connector:text-white" style={{ width: 16 / scale, height: 16 / scale }} strokeWidth={3} />
                       </div>
                  </div>
               </>
            )}

            <div 
                className="w-full h-full p-6 flex flex-col relative overflow-hidden"
                onMouseEnter={() => onHover && onHover(element.id)}
                onMouseLeave={() => onHover && onHover(null)}
                onPointerDown={handlePointerDown}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                style={{
                    cursor: isEditing ? 'text' : (isSelected ? 'grab' : 'pointer')
                }}
            >
                 {url && (
                     <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="absolute top-2 right-2 p-1 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-gray-800 z-20"
                        title="Open Link"
                        onMouseDown={e => e.stopPropagation()}
                     >
                         <ExternalLink className="w-4 h-4" />
                     </a>
                 )}
                 
                 {isEditing ? (
                     <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Type anything..."
                        autoFocus
                        onBlur={() => setIsEditing(false)}
                        className="w-full h-full bg-transparent resize-none outline-none font-medium text-gray-800 placeholder:text-gray-800/40"
                        style={{
                            fontFamily: "'Fenomen Sans', sans-serif",
                            fontSize: `${fontSize}px`,
                            fontWeight: isBold ? 'bold' : 'normal',
                            textAlign: 'center'
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                     />
                 ) : (
                     <div 
                        className="w-full h-full font-medium text-gray-800 whitespace-pre-wrap break-words flex flex-col justify-center items-center"
                        style={{
                            fontFamily: "'Fenomen Sans', sans-serif",
                            fontSize: `${fontSize}px`,
                            fontWeight: isBold ? 'bold' : 'normal',
                            textAlign: 'center',
                            minHeight: '1em' 
                        }}
                     >
                        {content || <span className="text-gray-800/40 italic">Double click to edit</span>}
                     </div>
                 )}
                 
                 {showAuthor && (
                     <div className={cn(
                        "absolute bottom-4 text-sm font-medium text-gray-600 opacity-60 pointer-events-none select-none flex items-center gap-1",
                        shape === 'circle' ? "left-1/2 -translate-x-1/2" : "left-6"
                     )}>
                        <User className="w-3 h-3" />
                        {element.authorName || 'Anonymous'}
                     </div>
                 )}
            </div>
        </Resizable>
      </motion.div>
    </>
  );
}