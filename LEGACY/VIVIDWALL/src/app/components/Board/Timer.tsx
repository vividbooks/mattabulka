import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { RotateCcw, Triangle, Palette, LayoutTemplate, Clock, Activity, PieChart, BarChartHorizontal } from 'lucide-react';
import { Resizable } from 're-resizable';
import { SelectionFrame, getResizeHandleStyles } from './SelectionFrame';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";

// --- THEMES & VARIANTS ---

const TIMER_THEMES = [
    { name: 'Slate', bg: '#565E76', text: '#ffffff', accent: '#FACC15', secondary: '#A855F7', buttonBg: '#F1F5F9', buttonText: '#0F172A' },
    { name: 'Midnight', bg: '#0f172a', text: '#e2e8f0', accent: '#38bdf8', secondary: '#0ea5e9', buttonBg: '#1e293b', buttonText: '#38bdf8' },
    { name: 'Forest', bg: '#064e3b', text: '#ecfdf5', accent: '#34d399', secondary: '#10b981', buttonBg: '#065f46', buttonText: '#34d399' },
    { name: 'Crimson', bg: '#881337', text: '#fff1f2', accent: '#fb7185', secondary: '#f43f5e', buttonBg: '#9f1239', buttonText: '#fb7185' },
    { name: 'Cream', bg: '#fffbeb', text: '#78350f', accent: '#f59e0b', secondary: '#d97706', buttonBg: '#fef3c7', buttonText: '#92400e' },
    { name: 'Lavender', bg: '#581c87', text: '#f3e8ff', accent: '#d8b4fe', secondary: '#a855f7', buttonBg: '#6b21a8', buttonText: '#d8b4fe' },
];

const TIMER_VARIANTS = [
    { name: 'Pie', value: 'pie', icon: PieChart },
    { name: 'Digital', value: 'digital', icon: Clock },
    { name: 'Bar', value: 'bar', icon: BarChartHorizontal },
    { name: 'Fluid', value: 'fluid', icon: Activity },
];

interface TimerProps {
  element: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: any) => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
  scale: number;
  viewMode?: boolean;
}

// Reusing handle styles removed in favor of SelectionFrame

const DigitControl = ({ 
    value, 
    onUp, 
    onDown, 
    isSeparator = false,
    themeColor
}: { 
    value: string, 
    onUp?: (e: React.MouseEvent) => void, 
    onDown?: (e: React.MouseEvent) => void,
    isSeparator?: boolean,
    themeColor: string
}) => {
    if (isSeparator) {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-4 pb-4">
                <span className="text-7xl font-bold mb-2" style={{ color: themeColor }}>:</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1">
            {/* Up Triangle */}
            <button 
                onClick={onUp}
                className="p-2 opacity-50 hover:opacity-100 transition-opacity active:scale-90"
                style={{ color: 'inherit' }} // Inherit text color from parent
            >
                <Triangle className="w-4 h-4 fill-current" />
            </button>

            {/* Digit */}
            <div className="w-16 h-24 flex items-center justify-center">
                <span className="text-7xl font-bold tracking-tighter" style={{ color: themeColor }}>
                    {value}
                </span>
            </div>

            {/* Down Triangle (Rotated) */}
            <button 
                onClick={onDown}
                className="p-2 opacity-50 hover:opacity-100 transition-opacity active:scale-90"
                style={{ color: 'inherit' }}
            >
                <Triangle className="w-4 h-4 fill-current rotate-180" />
            </button>
        </div>
    );
};

export function Timer({ element, isSelected, onSelect, onChange, onDragEnd, onDelete, scale, viewMode = false }: TimerProps) {
  // State initialization
  const [width, setWidth] = useState(element.width || 360);
  const [height, setHeight] = useState(element.height || 360);
  
  // Time state (in seconds)
  const [totalTime, setTotalTime] = useState(element.totalTime || 300);
  const [timeLeft, setTimeLeft] = useState(element.timeLeft ?? 300);
  const [isRunning, setIsRunning] = useState(element.isRunning || false);

  // Appearance State
  const [themeName, setThemeName] = useState(element.themeName || 'Slate');
  const [variant, setVariant] = useState(element.variant || 'pie');

  const theme = TIMER_THEMES.find(t => t.name === themeName) || TIMER_THEMES[0];

  const x = useMotionValue(element.x);
  const y = useMotionValue(element.y);
  const isDragging = useRef(false);
  const intervalRef = useRef<number | null>(null);

  // Sync with props
  useEffect(() => {
    setWidth(element.width || 360);
    setHeight(element.height || 360);
    setThemeName(element.themeName || 'Slate');
    setVariant(element.variant || 'pie');
    
    if (element.totalTime !== undefined) setTotalTime(element.totalTime);
    if (element.isRunning !== undefined) setIsRunning(element.isRunning);
    if (!isRunning && element.timeLeft !== undefined) {
        setTimeLeft(element.timeLeft);
    }
  }, [element]);

  // Timer Logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            setIsRunning(false);
            onChange({ isRunning: false, timeLeft: 0 });
            
            // FIREWORKS
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function() {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(interval);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Position Sync
  useEffect(() => {
    if (!isDragging.current) {
      x.set(element.x);
      y.set(element.y);
    }
  }, [element.x, element.y, x, y]);

  const handleDragEnd = () => {
      isDragging.current = false;
      onDragEnd(x.get(), y.get());
  };

  const toggleTimer = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newState = !isRunning;
      setIsRunning(newState);
      if (newState && timeLeft <= 0) {
          setTimeLeft(totalTime);
      }
      onChange({ isRunning: newState, timeLeft });
  };

  const resetTimer = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRunning(false);
      setTimeLeft(totalTime);
      onChange({ isRunning: false, timeLeft: totalTime });
  };

  // Digit Adjustment Logic
  const adjustDigit = (unit: 'm10' | 'm1' | 's10' | 's1', direction: 1 | -1) => {
      const m = Math.floor(totalTime / 60);
      const s = totalTime % 60;
      
      let m10 = Math.floor(m / 10);
      let m1 = m % 10;
      let s10 = Math.floor(s / 10);
      let s1 = s % 10;

      if (unit === 'm10') m10 = (m10 + direction + 10) % 10; // Limit to 0-9 (or 0-5 reasonable max)
      if (unit === 'm1') m1 = (m1 + direction + 10) % 10;
      if (unit === 's10') s10 = (s10 + direction + 6) % 6; // Seconds tens only 0-5
      if (unit === 's1') s1 = (s1 + direction + 10) % 10;

      const newM = m10 * 10 + m1;
      const newS = s10 * 10 + s1;
      const newTotal = newM * 60 + newS;

      setTotalTime(newTotal);
      setTimeLeft(newTotal);
      onChange({ totalTime: newTotal, timeLeft: newTotal });
  };

  // Formatting
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const m10 = Math.floor(m / 10);
  const m1 = m % 10;
  const s10 = Math.floor(s / 10);
  const s1 = s % 10;
  
  const formattedM = String(m).padStart(2, '0');
  const formattedS = String(s).padStart(2, '0');

  // --- VISUALIZATION HELPERS ---

  const getProgressColor = () => {
      const pct = timeLeft / (totalTime || 1);
      // If not using default Slate theme, stick to theme accent
      if (themeName !== 'Slate') return theme.accent;

      // Default behavior
      if (pct > 0.4) return theme.secondary; // Purple
      if (pct > 0.2) return theme.accent; // Yellow
      if (pct > 0.1) return '#FB923C'; // Orange
      return '#EF4444'; // Red
  };

  // Pie Path
  const getPiePath = (percentage: number) => {
      const r = 50; 
      const cx = 50;
      const cy = 50;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (percentage * 2 * Math.PI);
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      
      if (percentage >= 0.9999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
      if (percentage <= 0.0001) return `M ${cx} ${cy} Z`;

      return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const progress = timeLeft / (totalTime || 1);

  return (
    <motion.div
      style={{ x, y }}
      className={cn(
        "absolute group",
        isSelected ? "z-[10]" : "z-0"
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
        {/* TOOLBAR (Only when selected) */}
        {isSelected && (
            <div 
                className="absolute z-[101] flex items-center gap-1 p-1 bg-[#2C2C2C] rounded-lg shadow-xl"
                style={{
                    left: 0,
                    top: -50 / scale, 
                    transform: `scale(${1/scale})`,
                    transformOrigin: 'bottom left'
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
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
                                <TabsTrigger value="variant" className="flex-1 text-xs text-gray-400 data-[state=active]:text-black">Vzhled</TabsTrigger>
                            </TabsList>
                            
                            {/* THEMES */}
                            <TabsContent value="theme" className="p-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {TIMER_THEMES.map(t => (
                                        <button
                                            key={t.name}
                                            className={cn(
                                                "h-12 rounded-md border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105",
                                                themeName === t.name ? "border-white" : "border-transparent opacity-80 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: t.bg }}
                                            onClick={() => {
                                                setThemeName(t.name);
                                                onChange({ themeName: t.name });
                                            }}
                                        >
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                                            <span className="text-[10px] font-medium" style={{ color: t.text }}>{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* VARIANTS */}
                            <TabsContent value="variant" className="p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {TIMER_VARIANTS.map(v => (
                                        <button
                                            key={v.name}
                                            className={cn(
                                                "h-16 rounded-md border border-gray-600 bg-gray-800 flex flex-col items-center justify-center gap-2 transition-all hover:bg-gray-700",
                                                variant === v.value && "ring-2 ring-blue-500 border-transparent bg-gray-700"
                                            )}
                                            onClick={() => {
                                                setVariant(v.value);
                                                onChange({ variant: v.value });
                                            }}
                                        >
                                            <v.icon className="w-5 h-5 text-white" />
                                            <span className="text-xs text-gray-300">{v.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </PopoverContent>
                </Popover>

                <div className="w-px h-4 bg-gray-600 mx-1" />

                {/* Delete */}
                <button 
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-red-500/20 text-white hover:text-red-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                    <RotateCcw className="w-4 h-4 rotate-45" />
                </button>
            </div>
        )}

      <Resizable
        scale={scale}
        size={{ width, height }}
        onResizeStop={(e, dir, ref, d) => {
            setWidth(width + d.width);
            setHeight(height + d.height);
            onChange({ width: width + d.width, height: height + d.height });
        }}
        className={cn("relative", isSelected && !viewMode && "ring-2 ring-[#3B82F6]")}
        style={{ borderRadius: '32px' }}
        enable={isSelected && !viewMode ? { 
            top:true, right:true, bottom:true, left:true, 
            topRight:true, bottomRight:true, bottomLeft:true, topLeft:true 
        } : false}
        handleStyles={getResizeHandleStyles(scale)}
      >
         {/* Handles */}
         <SelectionFrame isSelected={isSelected} viewMode={viewMode} scale={scale} />

        <div 
            className="w-full h-full rounded-[32px] shadow-xl flex flex-col items-center relative overflow-hidden select-none transition-colors duration-300"
            style={{ 
                backgroundColor: theme.bg,
                color: theme.text,
                fontFamily: "'Fenomen Sans', sans-serif" 
            }}
            onPointerDown={(e) => {
                if (viewMode) return;
                if (isSelected) { // Only drag if selected
                    e.stopPropagation();
                    // onSelect(); // Already selected
                    isDragging.current = true;
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startNodeX = x.get();
                    const startNodeY = y.get();
                    const handlePointerMove = (ev: PointerEvent) => {
                        const dx = (ev.clientX - startX) / scale;
                        const dy = (ev.clientY - startY) / scale;
                        x.set(startNodeX + dx);
                        y.set(startNodeY + dy);
                    };
                    const handlePointerUp = () => {
                        isDragging.current = false;
                        window.removeEventListener('pointermove', handlePointerMove);
                        window.removeEventListener('pointerup', handlePointerUp);
                        if (x.get() !== startNodeX || y.get() !== startNodeY) {
                            handleDragEnd();
                        }
                    };
                    window.addEventListener('pointermove', handlePointerMove);
                    window.addEventListener('pointerup', handlePointerUp);
                } else {
                    // If not selected, let click pass to parent which handles selection? 
                    // Actually in Figma approach, clicking component selects it.
                    // So we should probably stop propagation and select.
                     e.stopPropagation();
                     onSelect();
                }
            }}
        >
            {/* Reset Controls */}
            {(isRunning || timeLeft !== totalTime) && (
                <button 
                   className="absolute top-4 right-4 z-20 flex items-center justify-center w-16 h-16 rounded-full shadow-xl hover:scale-105 hover:brightness-110 transition-all"
                   style={{ 
                       backgroundColor: theme.buttonBg, 
                       color: theme.buttonText 
                   }}
                   onClick={resetTimer}
                   title="Resetovat časovač"
                >
                    <RotateCcw className="w-8 h-8" />
                </button>
            )}

            {/* Layout Container */}
            <div className="flex flex-col items-center w-full h-full p-6">
                
                {/* Button */}
                <div className="mb-4 z-20">
                    <button
                        onClick={toggleTimer}
                        className="px-8 py-3 rounded-xl font-medium text-lg shadow-lg transition-all active:scale-95 min-w-[140px]"
                        style={{ 
                            backgroundColor: theme.buttonBg, 
                            color: theme.buttonText 
                        }}
                    >
                        {isRunning ? 'Pozastavit' : 'Spustit'}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex items-center justify-center w-full relative">
                    
                    {(!isRunning && timeLeft === totalTime) ? (
                        /* SETUP MODE */
                        <div className="flex items-center justify-center gap-2 pb-4">
                            <DigitControl 
                                value={String(m10)} 
                                themeColor={theme.accent}
                                onUp={(e) => { e?.stopPropagation(); adjustDigit('m10', 1); }} 
                                onDown={(e) => { e?.stopPropagation(); adjustDigit('m10', -1); }} 
                            />
                            <DigitControl 
                                value={String(m1)} 
                                themeColor={theme.accent}
                                onUp={(e) => { e?.stopPropagation(); adjustDigit('m1', 1); }} 
                                onDown={(e) => { e?.stopPropagation(); adjustDigit('m1', -1); }} 
                            />
                            
                            <DigitControl value=":" isSeparator themeColor={theme.accent} />

                            <DigitControl 
                                value={String(s10)} 
                                themeColor={theme.accent}
                                onUp={(e) => { e?.stopPropagation(); adjustDigit('s10', 1); }} 
                                onDown={(e) => { e?.stopPropagation(); adjustDigit('s10', -1); }} 
                            />
                            <DigitControl 
                                value={String(s1)} 
                                themeColor={theme.accent}
                                onUp={(e) => { e?.stopPropagation(); adjustDigit('s1', 1); }} 
                                onDown={(e) => { e?.stopPropagation(); adjustDigit('s1', -1); }} 
                            />
                        </div>
                    ) : (
                        /* RUNNING MODE - VARIANTS */
                        <>
                            {variant === 'pie' && (
                                <div className="relative w-full h-full flex items-center justify-center max-h-[240px] max-w-[240px]">
                                     <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible transform -rotate-90">
                                        <circle cx="50" cy="50" r="50" fill={getProgressColor()} className="opacity-20 transition-colors duration-300" /> 
                                        <path 
                                            d={getPiePath(progress)} 
                                            fill={getProgressColor()} 
                                            className="transition-colors duration-300"
                                        />
                                     </svg>
                                     <div className="absolute inset-0 flex items-center justify-center z-10">
                                         <span className="text-6xl font-bold tracking-wider drop-shadow-md" style={{ color: theme.text }}>
                                             {formattedM}:{formattedS}
                                         </span>
                                     </div>
                                </div>
                            )}

                            {variant === 'bar' && (
                                <div className="w-full max-w-[280px] flex flex-col items-center gap-4">
                                    <span className="text-7xl font-bold tracking-tight tabular-nums" style={{ color: theme.text }}>
                                        {formattedM}:{formattedS}
                                    </span>
                                    <div className="w-full h-6 bg-black/20 rounded-full overflow-hidden relative">
                                        <motion.div 
                                            className="h-full absolute top-0 left-0"
                                            initial={false}
                                            animate={{ width: `${progress * 100}%` }}
                                            transition={{ ease: "linear", duration: 1 }}
                                            style={{ backgroundColor: getProgressColor() }}
                                        />
                                    </div>
                                </div>
                            )}

                            {variant === 'digital' && (
                                <div className="flex flex-col items-center">
                                    <div className="px-6 py-4 rounded-xl border-4 border-white/10 bg-black/20 backdrop-blur-sm">
                                        <span 
                                            className="text-8xl font-bold tracking-widest tabular-nums font-mono drop-shadow-2xl" 
                                            style={{ color: getProgressColor(), textShadow: `0 0 20px ${getProgressColor()}66` }}
                                        >
                                            {formattedM}:{formattedS}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {variant === 'fluid' && (
                                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                                    {/* Background fill based on progress */}
                                    <div 
                                        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-linear opacity-50"
                                        style={{ 
                                            height: `${progress * 100}%`, 
                                            backgroundColor: getProgressColor(),
                                        }}
                                    />
                                    <span className="relative z-10 text-7xl font-bold tracking-wider" style={{ color: theme.text }}>
                                         {formattedM}:{formattedS}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
      </Resizable>
    </motion.div>
  );
}