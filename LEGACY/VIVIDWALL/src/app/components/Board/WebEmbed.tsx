import React, { useState, useEffect, useRef } from 'react';
import { Resizable } from 're-resizable';
import { SelectionFrame, getResizeHandleStyles } from './SelectionFrame';
import { motion, useMotionValue } from 'framer-motion';
import { Globe, GripHorizontal, Trash2, ExternalLink, Settings, Save, RotateCcw, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface WebEmbedProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
  scale: number;
  viewMode?: boolean;
}

export function WebEmbed({ element, isSelected, onSelect, onChange, onDragEnd, onDelete, scale, viewMode = false }: WebEmbedProps) {
  const [width, setWidth] = useState(element.width || 500);
  const [height, setHeight] = useState(element.height || 400);
  const [url, setUrl] = useState(element.url || '');
  const [tempUrl, setTempUrl] = useState(element.url || '');
  const [isEditing, setIsEditing] = useState(!element.url);
  const [behavior, setBehavior] = useState<'static' | 'dynamic'>(element.behavior || 'dynamic');
  const [showSettings, setShowSettings] = useState(false);

  const x = useMotionValue(element.x);
  const y = useMotionValue(element.y);
  const isDragging = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWidth(element.width || 500);
    setHeight(element.height || 400);
    
    const startupBehavior = element.behavior || 'dynamic';
    setBehavior(startupBehavior);
    
    let targetUrl = '';
    if (startupBehavior === 'static' && element.staticUrl) {
        targetUrl = element.staticUrl;
    } else {
        targetUrl = element.url || '';
    }
    
    if (!url) {
        setUrl(targetUrl);
        setTempUrl(targetUrl);
    }

    if (!targetUrl) setIsEditing(true);
  }, [element]);

  useEffect(() => {
    if (!isDragging.current) {
        x.set(element.x);
        y.set(element.y);
    }
  }, [element.x, element.y, x, y]);

  // Close menu when clicking outside
  useEffect(() => {
    if (showSettings) {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettings]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    let finalUrl = tempUrl;
    if (finalUrl && !finalUrl.startsWith('http')) {
        finalUrl = 'https://' + finalUrl;
    }
    
    setUrl(finalUrl);
    
    const updates: any = { url: finalUrl };
    if (behavior === 'static' && !element.staticUrl) {
        updates.staticUrl = finalUrl;
    }
    
    onChange(updates);
    setIsEditing(false);
  };

  const handleBehaviorChange = (newBehavior: 'static' | 'dynamic') => {
      setBehavior(newBehavior);
      const updates: any = { behavior: newBehavior };
      
      if (newBehavior === 'static') {
          if (!element.staticUrl) {
              updates.staticUrl = url;
          }
      }
      onChange(updates);
      // Don't close menu immediately so user sees selection change
  };

  const handleResetToDefault = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (element.staticUrl) {
          setUrl(element.staticUrl);
          setTempUrl(element.staticUrl);
      }
  };

  const handleSetCurrentAsDefault = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange({ staticUrl: url });
  };

  const dragStartValues = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleResizeStart = () => {
    dragStartValues.current = { x: x.get(), y: y.get(), width, height };
  };

  const handleResize = (e: any, direction: string, ref: HTMLElement, d: { width: number, height: number }) => {
    const newWidth = dragStartValues.current.width + d.width;
    const newHeight = dragStartValues.current.height + d.height;
    setWidth(newWidth);
    setHeight(newHeight);

    if (direction.includes('left')) x.set(dragStartValues.current.x - d.width);
    if (direction.includes('top')) y.set(dragStartValues.current.y - d.height);
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
    e.stopPropagation();
    onSelect();
    
    if (isEditing) return;

    isDragging.current = true;

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
      isDragging.current = false;
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

  return (
    <>
      {/* Toolbar */}
      {isSelected && (
        <motion.div 
            style={{ x, y }}
            className="absolute z-[101] pointer-events-none"
        >
            <div
                className="relative flex items-center gap-1 p-1 bg-[#2C2C2C] rounded-lg shadow-xl pointer-events-auto origin-bottom-left"
                style={{
                    transform: `scale(${1/scale}) translateY(-100%) translateY(-8px)`, 
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 px-2">
                     <Globe className="w-4 h-4 text-gray-400" />
                     <Input 
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="bg-transparent border-none text-white h-8 text-sm w-48 placeholder:text-gray-500 focus-visible:ring-0"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                     />
                     <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={handleSubmit}>
                        Načíst
                     </Button>
                </div>

                {behavior === 'static' && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:bg-gray-700 hover:text-white shrink-0"
                        onClick={handleResetToDefault}
                        title="Resetovat na výchozí stránku"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                )}

                <div className="w-px h-4 bg-gray-600 mx-1" />
                
                {/* Custom Settings Dropdown */}
                <div className="relative" ref={menuRef}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "h-8 w-8 text-gray-400 hover:bg-gray-700 hover:text-white shrink-0",
                            showSettings && "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                        title="Možnosti zobrazení"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings className="w-4 h-4" />
                    </Button>

                    {/* Manual Dropdown Content */}
                    {showSettings && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#2C2C2C] border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[9999]">
                             <div className="p-2 space-y-1">
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Chování při načtení
                                </div>
                                
                                <button
                                    onClick={() => handleBehaviorChange('dynamic')}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-2 rounded-md text-left text-sm transition-colors",
                                        behavior === 'dynamic' ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-700 text-gray-300"
                                    )}
                                >
                                    <div className={cn("mt-0.5", behavior === 'dynamic' ? "opacity-100" : "opacity-0")}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Pamatovat historii</div>
                                        <div className="text-[10px] opacity-70 leading-tight mt-1">Otevře poslední navštívenou stránku</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleBehaviorChange('static')}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-2 rounded-md text-left text-sm transition-colors",
                                        behavior === 'static' ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-700 text-gray-300"
                                    )}
                                >
                                    <div className={cn("mt-0.5", behavior === 'static' ? "opacity-100" : "opacity-0")}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Vždy výchozí stránka</div>
                                        <div className="text-[10px] opacity-70 leading-tight mt-1">Otevře vždy nastavenou domovskou stránku</div>
                                    </div>
                                </button>

                                {behavior === 'static' && (
                                    <>
                                        <div className="w-full h-px bg-gray-700 my-1" />
                                        <button
                                            onClick={handleSetCurrentAsDefault}
                                            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Nastavit aktuální jako výchozí
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={cn(
                        "w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center shrink-0 text-gray-400 hover:text-white",
                        !url && "opacity-50 pointer-events-none"
                    )}
                    title="Otevřít v novém okně"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>

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
        </motion.div>
      )}

    <motion.div
      style={{ x, y }}
      className={cn(
        "absolute group",
        isSelected ? "z-[10]" : "z-0"
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Resizable
        scale={scale}
        size={{ width, height }}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        minWidth={300}
        minHeight={200}
        handleStyles={getResizeHandleStyles(scale)}
        className="relative"
        enable={isSelected && !viewMode ? undefined : false}
      >
        {/* Inner Container to hold content with overflow-hidden, while handles are outside */}
        <div className={cn(
             "w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 transition-shadow",
             isSelected && "ring-2 ring-[#3B82F6] shadow-xl"
        )}>
            {!viewMode && (
            <div 
                className={cn(
                    "h-14 bg-[#F8FAFC] border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 cursor-grab active:cursor-grabbing group/header",
                    isSelected ? "bg-blue-50/50" : "hover:bg-gray-100"
                )}
                onPointerDown={handlePointerDown}
            >
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate flex-1 select-none">
                    {url ? new URL(url).hostname : 'Webový obsah'}
                </span>
                <GripHorizontal className="w-5 h-5 text-gray-300" />
            </div>
            )}

            {/* Content Area */}
            <div className="flex-1 bg-gray-100 relative w-full h-full overflow-hidden">
                {url ? (
                    <>
                        <iframe 
                            src={url} 
                            className="w-full h-full border-0 bg-white"
                            style={{ pointerEvents: isSelected || viewMode ? 'auto' : 'none' }}
                            title="Web Content"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                         {!isSelected && !viewMode && (
                             <div 
                                 className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing bg-transparent"
                                 onPointerDown={handlePointerDown}
                             />
                         )}
                    </>
                ) : (
                    <div 
                        className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center cursor-pointer"
                        onPointerDown={handlePointerDown}
                    >
                        <Globe className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-500">Zadejte URL adresu</p>
                        <p className="text-sm text-gray-400 mt-1">Webová stránka se zobrazí zde</p>
                    </div>
                )}
            </div>
        </div>

        <SelectionFrame isSelected={isSelected} viewMode={viewMode} scale={scale} />

      </Resizable>
    </motion.div>
    </>
  );
}