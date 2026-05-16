import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Resizable } from 're-resizable';
import { 
    Bold, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Type, 
    LayoutTemplate,
    Minus,
    Plus
} from 'lucide-react';
import { SelectionFrame, getResizeHandleStyles } from './SelectionFrame';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

// --- CONFIGURATION ---
const FONTS = [
    { name: 'Fenomen Sans', value: 'Fenomen Sans', url: '' },
    { name: 'Inter', value: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap' },
    { name: 'Roboto Mono', value: 'Roboto Mono', url: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap' },
    { name: 'Playfair', value: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
    { name: 'Permanent', value: 'Permanent Marker', url: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap' },
    { name: 'Lobster', value: 'Lobster', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
    { name: 'Oswald', value: 'Oswald', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap' },
];

const SIZES = [
    { name: 'Small', value: 16, label: 'S' },
    { name: 'Medium', value: 24, label: 'M' },
    { name: 'Large', value: 48, label: 'L' },
    { name: 'Extra Large', value: 96, label: 'XL' },
    { name: 'Giant', value: 148, label: 'XXL' },
];

const COLORS = [
    { name: 'Dark', value: '#1e293b', text: '#ffffff' },
    { name: 'Gray', value: '#64748b', text: '#ffffff' },
    { name: 'Red', value: '#ef4444', text: '#ffffff' },
    { name: 'Orange', value: '#f97316', text: '#ffffff' },
    { name: 'Amber', value: '#f59e0b', text: '#000000' },
    { name: 'Green', value: '#22c55e', text: '#ffffff' },
    { name: 'Blue', value: '#3b82f6', text: '#ffffff' },
    { name: 'Purple', value: '#a855f7', text: '#ffffff' },
    { name: 'Pink', value: '#ec4899', text: '#ffffff' },
    { name: 'White', value: '#ffffff', text: '#000000' },
];

const ALIGNMENTS = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
];

interface TextElementProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
  onMultiDrag?: (dx: number, dy: number) => void;
  onMultiDragEnd?: () => void;
  selectedIds?: string[];
  scale: number;
  viewMode?: boolean;
}

// --- COMPONENTS ---

const Toolbar = ({ element, onChange, toggleMode, mode, isBold, setIsBold, isList, setIsList, textAlign, setTextAlign, fontFamily, setFontFamily, fontSize, setFontSize, color, setColor, linkUrl, setLinkUrl, scale }: any) => {
    return (
        <div 
            className="absolute z-[101] h-12 flex items-center gap-2 px-2 bg-[#1E1E1E] rounded-full shadow-2xl border border-gray-800"
            style={{
                left: '50%',
                transform: `translate(-50%, -${(70 / scale)}px) scale(${1/scale})`,
                transformOrigin: 'bottom center',
                width: 'max-content'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
             <div className="flex bg-black/40 rounded-lg p-0.5">
                <button 
                    onClick={() => toggleMode('text')}
                    className={cn("p-2 rounded-md transition-all", mode === 'text' ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white")}
                >
                    <Type className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => toggleMode('card')}
                    className={cn("p-2 rounded-md transition-all", mode === 'card' ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white")}
                >
                    <LayoutTemplate className="w-4 h-4" />
                </button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-gray-700" />

            <Popover>
                <PopoverTrigger asChild>
                    <button className="px-2 h-full text-gray-200 hover:bg-white/10 rounded flex items-center gap-1 text-sm font-medium min-w-[4rem] justify-center">
                        {FONTS.find(f => f.value === fontFamily)?.name || 'Font'}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 bg-[#2C2C2C] border-gray-700">
                    {FONTS.map(font => (
                        <button
                            key={font.value}
                            className="w-full text-left px-3 py-2 text-gray-200 hover:bg-blue-600 rounded text-sm"
                            style={{ fontFamily: font.value }}
                            onClick={() => { setFontFamily(font.value); onChange({ fontFamily: font.value }); }}
                        >
                            {font.name}
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 bg-gray-700" />

            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-10 h-full text-gray-200 hover:bg-white/10 rounded flex items-center justify-center text-sm font-medium">
                        {SIZES.find(s => s.value === fontSize)?.label || Math.round(fontSize)}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-16 p-1 bg-[#2C2C2C] border-gray-700">
                    {SIZES.map(s => (
                        <button
                            key={s.name}
                            className="w-full text-center py-2 text-gray-200 hover:bg-blue-600 rounded text-sm"
                            onClick={() => { setFontSize(s.value); onChange({ fontSize: s.value }); }}
                        >
                            {s.label}
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <button 
                onClick={() => { setIsBold(!isBold); onChange({ isBold: !isBold }); }}
                className={cn("p-2 rounded hover:bg-white/10 transition-colors", isBold ? "text-blue-400 bg-white/10" : "text-gray-400")}
            >
                <Bold className="w-4 h-4" />
            </button>

            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-2 rounded hover:bg-white/10 text-gray-400">
                        {React.createElement(ALIGNMENTS.find(a => a.value === textAlign)?.icon || AlignLeft, { className: "w-4 h-4" })}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1 flex gap-1 bg-[#2C2C2C] border-gray-700">
                    {ALIGNMENTS.map(a => (
                        <button
                            key={a.value}
                            className={cn("p-2 rounded hover:bg-blue-600 text-gray-200", textAlign === a.value && "bg-blue-600")}
                            onClick={() => { setTextAlign(a.value); onChange({ textAlign: a.value }); }}
                        >
                            <a.icon className="w-4 h-4" />
                        </button>
                    ))}
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 bg-gray-700" />

            <Popover>
                <PopoverTrigger asChild>
                    <button className="w-6 h-6 rounded-full border border-gray-500 mx-1" style={{ backgroundColor: color }} />
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-[#2C2C2C] border-gray-700">
                    <div className="grid grid-cols-5 gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.name}
                                className={cn(
                                    "w-8 h-8 rounded-full border transition-transform hover:scale-110",
                                    color === c.value ? "border-white scale-110" : "border-transparent"
                                )}
                                style={{ backgroundColor: c.value }}
                                onClick={() => { setColor(c.value); onChange({ color: c.value }); }}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export function TextElement({ element, isSelected, onSelect, onChange, onDragEnd, onDelete, onMultiDrag, onMultiDragEnd, selectedIds, scale, viewMode = false }: TextElementProps) {
    // --- STATE ---
    const [content, setContent] = useState(element.content || 'Add text');
    const [width, setWidth] = useState(element.width || 300);
    const [height, setHeight] = useState(element.height || 200);
    
    // Styling
    const [fontFamily, setFontFamily] = useState(element.fontFamily || 'Fenomen Sans');
    const [fontSize, setFontSize] = useState(element.fontSize || 24);
    const [textAlign, setTextAlign] = useState<any>(element.textAlign || 'left');
    const [color, setColor] = useState(element.color || '#1e293b');
    const [isBold, setIsBold] = useState(element.isBold || false);
    const [isList, setIsList] = useState(element.isList || false);
    
    // Mode & Layout
    const [mode, setMode] = useState<'text' | 'card'>(element.mode || 'text');
    const [linkUrl, setLinkUrl] = useState(element.linkUrl || '');

    // Editing State
    const [isEditing, setIsEditing] = useState(false);

    const x = useMotionValue(element.x);
    const y = useMotionValue(element.y);
    const isDragging = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---

    useEffect(() => {
        FONTS.forEach(font => {
            if (!document.querySelector(`link[href="${font.url}"]`)) {
                const link = document.createElement('link');
                link.href = font.url;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        });
    }, []);

    useEffect(() => {
        if (element.width) setWidth(element.width);
        if (element.height) setHeight(element.height);
        if (element.content !== undefined) setContent(element.content);
        if (element.fontFamily) setFontFamily(element.fontFamily);
        if (element.fontSize) setFontSize(element.fontSize);
        if (element.textAlign) setTextAlign(element.textAlign);
        if (element.color) setColor(element.color);
        if (element.isBold !== undefined) setIsBold(element.isBold);
        if (element.mode) setMode(element.mode);
        if (element.linkUrl !== undefined) setLinkUrl(element.linkUrl);
        if (element.isList !== undefined) setIsList(element.isList);
    }, [element]);

    useEffect(() => {
        if (!isDragging.current) {
            x.set(element.x);
            y.set(element.y);
        }
    }, [element.x, element.y, x, y]);

    // --- HANDLERS ---

    const handleDragEnd = () => {
        isDragging.current = false;
        onDragEnd(x.get(), y.get());
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        onChange({ content: val });
    };

    const toggleMode = (newMode: 'text' | 'card') => {
        setMode(newMode);
        if (newMode === 'card') {
            const newH = 200;
            const defaultFontSize = 24;
            setHeight(newH);
            setFontSize(defaultFontSize);
            onChange({ 
                mode: newMode, 
                height: newH, 
                fontSize: defaultFontSize 
            });
        } else {
            setColor('#1e293b'); 
            onChange({ mode: newMode, color: '#1e293b' });
        }
    };

    const getCardTextColor = () => {
        if (mode === 'text') return color;
        const c = COLORS.find(c => c.value === color);
        return c ? c.text : '#000000';
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (viewMode) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onChange({ content });
    };

    // --- CUSTOM RESIZE HANDLER FOR TEXT MODE ---
    const handleTextResize = (e: React.MouseEvent, corner: string) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!textRef.current) return;
        
        const rect = textRef.current.getBoundingClientRect();
        const startWidth = rect.width / scale;
        const startHeight = rect.height / scale;
        const startX = x.get();
        const startY = y.get();
        const startFontSize = fontSize;
        
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;

        // Determine which corner is the anchor (opposite corner stays fixed)
        let anchorX = startX;
        let anchorY = startY;

        if (corner === 'top-left') {
            anchorX = startX + startWidth;
            anchorY = startY + startHeight;
        } else if (corner === 'top-right') {
            anchorX = startX;
            anchorY = startY + startHeight;
        } else if (corner === 'bottom-left') {
            anchorX = startX + startWidth;
            anchorY = startY;
        } else if (corner === 'bottom-right') {
            anchorX = startX;
            anchorY = startY;
        }

        // Calculate initial distance from anchor to drag corner
        let initialDX = 0, initialDY = 0;
        if (corner === 'top-left') { initialDX = -startWidth; initialDY = -startHeight; }
        if (corner === 'top-right') { initialDX = startWidth; initialDY = -startHeight; }
        if (corner === 'bottom-left') { initialDX = -startWidth; initialDY = startHeight; }
        if (corner === 'bottom-right') { initialDX = startWidth; initialDY = startHeight; }
        
        const startDist = Math.sqrt(initialDX * initialDX + initialDY * initialDY);

        // Apply transform during drag for smooth scaling
        let currentScale = 1;

        const onMove = (ev: MouseEvent) => {
            const dx = (ev.clientX - startMouseX) / scale;
            const dy = (ev.clientY - startMouseY) / scale;
            
            const currentDX = initialDX + dx;
            const currentDY = initialDY + dy;
            const currentDist = Math.sqrt(currentDX * currentDX + currentDY * currentDY);
            
            currentScale = Math.max(0.2, currentDist / startDist);
            
            if (!textRef.current) return;
            
            // Apply scale transform with transform-origin at anchor
            const scaledWidth = startWidth * currentScale;
            const scaledHeight = startHeight * currentScale;
            
            // Calculate transform origin relative to element
            let originX = '0%', originY = '0%';
            if (corner === 'top-left') { originX = '100%'; originY = '100%'; }
            if (corner === 'top-right') { originX = '0%'; originY = '100%'; }
            if (corner === 'bottom-left') { originX = '100%'; originY = '0%'; }
            if (corner === 'bottom-right') { originX = '0%'; originY = '0%'; }
            
            textRef.current.style.transform = `scale(${currentScale})`;
            textRef.current.style.transformOrigin = `${originX} ${originY}`;
            
            // Update position to keep anchor fixed
            if (corner === 'top-left') {
                x.set(anchorX - scaledWidth);
                y.set(anchorY - scaledHeight);
            } else if (corner === 'top-right') {
                x.set(anchorX);
                y.set(anchorY - scaledHeight);
            } else if (corner === 'bottom-left') {
                x.set(anchorX - scaledWidth);
                y.set(anchorY);
            } else if (corner === 'bottom-right') {
                x.set(anchorX);
                y.set(anchorY);
            }
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            
            if (!textRef.current) return;
            
            // Remove transform and apply final fontSize
            textRef.current.style.transform = '';
            textRef.current.style.transformOrigin = '';
            
            const newFontSize = Math.max(8, Math.round(startFontSize * currentScale));
            setFontSize(newFontSize);
            
            // After fontSize is applied, recalculate final position
            requestAnimationFrame(() => {
                if (!textRef.current) return;
                
                const finalRect = textRef.current.getBoundingClientRect();
                const finalWidth = finalRect.width / scale;
                const finalHeight = finalRect.height / scale;
                
                let finalX = anchorX;
                let finalY = anchorY;
                
                if (corner === 'top-left') {
                    finalX = anchorX - finalWidth;
                    finalY = anchorY - finalHeight;
                } else if (corner === 'top-right') {
                    finalX = anchorX;
                    finalY = anchorY - finalHeight;
                } else if (corner === 'bottom-left') {
                    finalX = anchorX - finalWidth;
                    finalY = anchorY;
                } else if (corner === 'bottom-right') {
                    finalX = anchorX;
                    finalY = anchorY;
                }
                
                x.set(finalX);
                y.set(finalY);
                
                onChange({ 
                    fontSize: newFontSize,
                    x: finalX,
                    y: finalY
                });
            });
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };


    // --- RENDER ---

    // CARD MODE
    if (mode === 'card') {
        return (
            <motion.div
                style={{ x, y }}
                className={cn("absolute group", isSelected ? "z-[50]" : "z-[40]")}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={handleDoubleClick}
            >
                 {isSelected && !viewMode && !isEditing && (
                    <Toolbar 
                        element={element} onChange={onChange} toggleMode={toggleMode} mode={mode}
                        isBold={isBold} setIsBold={setIsBold} isList={isList} setIsList={setIsList}
                        textAlign={textAlign} setTextAlign={setTextAlign} fontFamily={fontFamily} setFontFamily={setFontFamily}
                        fontSize={fontSize} setFontSize={setFontSize} color={color} setColor={setColor}
                        linkUrl={linkUrl} setLinkUrl={setLinkUrl} scale={scale}
                    />
                 )}

                <Resizable
                    scale={scale}
                    size={{ width, height }}
                    onResizeStop={(e, dir, ref, d) => {
                        setWidth(width + d.width);
                        setHeight(height + d.height);
                        onChange({ width: width + d.width, height: height + d.height });
                    }}
                    className={cn(
                        "relative transition-all",
                        isSelected && !viewMode && "ring-2 ring-[#3B82F6]"
                    )}
                    enable={isSelected && !viewMode ? { 
                        top: true, right:true, bottom:true, left:true, 
                        topRight:true, bottomRight:true, bottomLeft:true, topLeft:true 
                    } : false}
                    handleStyles={getResizeHandleStyles(scale)}
                    minWidth={100}
                    minHeight={50}
                >
                    <SelectionFrame isSelected={isSelected} viewMode={viewMode} scale={scale} />
                    
                    <div 
                        className="w-full h-full relative rounded-xl shadow-lg overflow-hidden flex flex-col"
                        style={{ backgroundColor: color }}
                        onPointerDown={(e) => {
                            if (viewMode || isEditing) { if(isEditing) e.stopPropagation(); return; }
                            e.stopPropagation();
                            onSelect();
                            isDragging.current = true;
                            
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startNodeX = x.get();
                            const startNodeY = y.get();
                            const isMultiSelect = selectedIds && selectedIds.length > 1;
                            
                            const handlePointerMove = (ev: PointerEvent) => {
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
                                window.removeEventListener('pointermove', handlePointerMove);
                                window.removeEventListener('pointerup', handlePointerUp);
                                if (x.get() !== startNodeX || y.get() !== startNodeY) {
                                    if (isMultiSelect) {
                                        onMultiDragEnd && onMultiDragEnd();
                                    } else {
                                        handleDragEnd();
                                    }
                                }
                            };
                            window.addEventListener('pointermove', handlePointerMove);
                            window.addEventListener('pointerup', handlePointerUp);
                        }}
                    >
                        <div className="w-full flex-1 overflow-hidden relative">
                            {isEditing ? (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={handleContentChange}
                                onBlur={handleBlur}
                                autoFocus
                                className="w-full h-full bg-transparent resize-none outline-none border-none p-4 scrollbar-thin scrollbar-thumb-black/10 select-text"
                                style={{ fontSize: `${fontSize}px`, fontFamily, color: getCardTextColor(), fontWeight: isBold ? 'bold' : 'normal', textAlign, lineHeight: 1.4 }}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                            ) : (
                            <div className="w-full h-full p-4 whitespace-pre-wrap break-words cursor-default" style={{ fontSize: `${fontSize}px`, fontFamily, color: getCardTextColor(), fontWeight: isBold ? 'bold' : 'normal', textAlign, lineHeight: 1.4 }}>
                                {content || "Double click to edit"}
                            </div>
                            )}
                        </div>
                    </div>
                </Resizable>
            </motion.div>
        );
    }

    // TEXT MODE
    return (
        <motion.div
            style={{ x, y }}
            className={cn("absolute group", isSelected ? "z-[50]" : "z-[40]")}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
        >
            {isSelected && !viewMode && !isEditing && (
                 <Toolbar 
                    element={element} onChange={onChange} toggleMode={toggleMode} mode={mode}
                    isBold={isBold} setIsBold={setIsBold} isList={isList} setIsList={setIsList}
                    textAlign={textAlign} setTextAlign={setTextAlign} fontFamily={fontFamily} setFontFamily={setFontFamily}
                    fontSize={fontSize} setFontSize={setFontSize} color={color} setColor={setColor}
                    linkUrl={linkUrl} setLinkUrl={setLinkUrl} scale={scale}
                />
            )}

            <div 
                ref={textRef}
                className={cn(
                    "relative inline-block min-w-[50px]",
                    // Selection Underline
                    isSelected && !viewMode && !isEditing && "border-b-2 border-[#3B82F6]"
                )}
                onPointerDown={(e) => {
                    if (viewMode || isEditing) { if(isEditing) e.stopPropagation(); return; }
                    e.stopPropagation();
                    onSelect();
                    isDragging.current = true;
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startNodeX = x.get();
                    const startNodeY = y.get();
                    const isMultiSelect = selectedIds && selectedIds.length > 1;
                    
                    const handlePointerMove = (ev: PointerEvent) => {
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
                        window.removeEventListener('pointermove', handlePointerMove);
                        window.removeEventListener('pointerup', handlePointerUp);
                        if (x.get() !== startNodeX || y.get() !== startNodeY) {
                            if (isMultiSelect) {
                                onMultiDragEnd && onMultiDragEnd();
                            } else {
                                handleDragEnd();
                            }
                        }
                    };
                    window.addEventListener('pointermove', handlePointerMove);
                    window.addEventListener('pointerup', handlePointerUp);
                }}
            >
                {/* HANDLES FOR TEXT MODE */}
                {isSelected && !viewMode && !isEditing && (
                    <>
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                            // Calculate size based on scale to maintain constant visual size
                            const visualSize = 12; // px
                            const size = visualSize / scale;
                            const offset = -size / 2;
                            const borderW = 1.5 / scale;

                            return (
                                <div 
                                    key={pos}
                                    className={cn(
                                        "absolute bg-white border-[#3B82F6] rounded-full z-[60]",
                                        pos === 'top-left' && "cursor-nwse-resize",
                                        pos === 'top-right' && "cursor-nesw-resize",
                                        pos === 'bottom-left' && "cursor-nesw-resize",
                                        pos === 'bottom-right' && "cursor-nwse-resize",
                                    )}
                                    style={{
                                        width: size,
                                        height: size,
                                        borderWidth: borderW,
                                        top: pos.includes('top') ? offset : undefined,
                                        bottom: pos.includes('bottom') ? offset : undefined,
                                        left: pos.includes('left') ? offset : undefined,
                                        right: pos.includes('right') ? offset : undefined,
                                    }}
                                    onMouseDown={(e) => handleTextResize(e, pos)}
                                />
                            );
                        })}
                    </>
                )}

                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onBlur={handleBlur}
                        autoFocus
                        // Auto-expand height
                        onInput={(e: any) => {
                             e.target.style.height = 'auto';
                             e.target.style.height = e.target.scrollHeight + 'px';
                             e.target.style.width = 'auto';
                             e.target.style.width = e.target.scrollWidth + 'px';
                        }}
                        className="bg-transparent resize-none outline-none border-none p-0 m-0 overflow-hidden select-text whitespace-pre"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            color: color,
                            fontWeight: isBold ? 'bold' : 'normal',
                            textAlign: textAlign,
                            lineHeight: 1.4,
                            width: 'auto', // Allow it to grow
                            minWidth: '50px'
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div
                        className="whitespace-pre p-0 m-0 cursor-default"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            color: color,
                            fontWeight: isBold ? 'bold' : 'normal',
                            textAlign: textAlign,
                            lineHeight: 1.4,
                        }}
                    >
                        {content || (viewMode ? "" : "Double click to edit")}
                    </div>
                )}
            </div>
        </motion.div>
    );
}