import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Menu, PanelLeftClose } from 'lucide-react';
import { Button } from './ui/button';
import { PathElement } from './Board/PathElement';
import { StickyNote } from './Board/StickyNote';
import { WebEmbed } from './Board/WebEmbed';
import { Timer } from './Board/Timer';
import { Waypoint } from './Board/Waypoint';
import { TextElement } from './Board/TextElement';
import { cn } from '../lib/utils';

interface PresentationModeProps {
  elements: any[];
  onClose: () => void;
}

export function PresentationMode({ elements, onClose }: PresentationModeProps) {
  const waypoints = useMemo(() => {
    return elements
      .filter(el => el.type === 'waypoint')
      .sort((a, b) => (parseInt(a.label) || 0) - (parseInt(b.label) || 0));
  }, [elements]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    // Set initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        setCurrentIndex(prev => Math.min(prev + 1, waypoints.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waypoints.length, onClose]);

  const currentWaypoint = waypoints[currentIndex];

  if (!currentWaypoint) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Žádná plátna k prezentaci</h2>
            <p className="text-gray-500 mb-4">Vytvořte na nástěnce plátno (Waypoint) pro spuštění prezentace.</p>
            <Button onClick={onClose}>Zavřít</Button>
        </div>
      </div>
    );
  }

  // Constants
  const SIDEBAR_WIDTH = 280;
  const ARROW_MARGIN = 12; // Margin from edge (or sidebar) to arrow
  const ARROW_SIZE = 60;
  const ARROW_BUFFER = 12; // Buffer between arrow and content
  
  const SIDE_PADDING_BASE = ARROW_MARGIN + ARROW_SIZE + ARROW_BUFFER; // 84px
  
  const TOP_PADDING = 80; // Space for top bar
  const BOTTOM_PADDING = 40; // Space for bottom

  // Layout calculations
  const contentLeftOffset = isOutlineOpen ? SIDEBAR_WIDTH : 0;
  const availableWidth = windowSize.width - contentLeftOffset;
  
  // Target size for canvas
  const targetW = Math.max(0, availableWidth - (SIDE_PADDING_BASE * 2));
  const targetH = Math.max(0, windowSize.height - (TOP_PADDING + BOTTOM_PADDING));

  const wpW = currentWaypoint.width || 300;
  const wpH = currentWaypoint.height || 300;

  let scale = 1;
  if (windowSize.width > 0 && windowSize.height > 0) {
      const scaleX = targetW / wpW;
      const scaleY = targetH / wpH;
      scale = Math.min(scaleX, scaleY);
  }

  // Filter elements inside the current waypoint using Intersection Logic (Bounding Box)
  const elementsOnSlide = elements.filter(el => {
    if (el.type === 'waypoint') return false; 
    if (el.type === 'connection') return true; 
    
    const wpLeft = currentWaypoint.x;
    const wpRight = currentWaypoint.x + wpW;
    const wpTop = currentWaypoint.y;
    const wpBottom = currentWaypoint.y + wpH;

    let elLeft = 0;
    let elRight = 0;
    let elTop = 0;
    let elBottom = 0;

    if (el.type === 'path' && el.points && el.points.length > 0) {
        const xs = el.points.map((p: any) => p.x);
        const ys = el.points.map((p: any) => p.y);
        elLeft = Math.min(...xs);
        elRight = Math.max(...xs);
        elTop = Math.min(...ys);
        elBottom = Math.max(...ys);
    } else {
        // Sticky or Web
        // Use correct defaults matching component definitions
        let w = 0;
        let h = 0;
        
        if (el.type === 'sticky') {
            w = el.width || 400;
            h = el.height || 400;
        } else if (el.type === 'web') {
            w = el.width || 500;
            h = el.height || 400;
        } else if (el.type === 'timer') {
            w = el.width || 320;
            h = el.height || 320;
        } else if (el.type === 'text') {
            w = el.width || 300;
            h = el.height || 100;
        }
        
        elLeft = el.x;
        elRight = el.x + w;
        elTop = el.y;
        elBottom = el.y + h;
    }

    // Check Intersection: max(L1, L2) < min(R1, R2) && max(T1, T2) < min(B1, B2)
    const overlapX = Math.max(elLeft, wpLeft) < Math.min(elRight, wpRight);
    const overlapY = Math.max(elTop, wpTop) < Math.min(elBottom, wpBottom);

    return overlapX && overlapY;
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F0F2F5] overflow-hidden font-sans">
      
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ x: isOutlineOpen ? 0 : -SIDEBAR_WIDTH }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 bg-[#F0F2F5] z-40 flex flex-col border-r border-black/5"
        style={{ width: SIDEBAR_WIDTH }}
      >
         <div className="mt-32 px-6 flex-1 overflow-y-auto scrollbar-hide">
             <div className="space-y-2 pb-10">
                 {waypoints.map((wp, idx) => (
                     <button
                        key={wp.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                            "w-full text-left py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center",
                            currentIndex === idx 
                                ? "bg-white shadow-sm text-slate-900" 
                                : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                        )}
                     >
                         <span className={cn("mr-2 transition-opacity", currentIndex === idx ? "opacity-100 font-bold" : "opacity-50")}>{idx + 1}.</span>
                         <span className={cn(currentIndex === idx && "font-bold")}>{wp.name || `Plátno ${idx + 1}`}</span>
                     </button>
                 ))}
             </div>
         </div>
      </motion.div>

      {/* Top Controls (X and Toggle) */}
      <motion.div 
        className="absolute top-0 p-4 z-[60] flex flex-col gap-4 items-center pointer-events-none"
        animate={{ 
            left: isOutlineOpen ? SIDEBAR_WIDTH - 80 : 0 // 80px offset from sidebar right edge to align buttons inside
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
          {/* Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-slate-700 shadow-sm pointer-events-auto"
          >
              <X className="w-5 h-5" />
          </Button>
          
          {/* Toggle Sidebar Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            className={cn(
                "rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-slate-700 shadow-sm pointer-events-auto transition-all duration-300",
                isOutlineOpen ? "h-10 w-10" : "h-14 w-14"
            )}
          >
              {isOutlineOpen ? <PanelLeftClose className="w-5 h-5" /> : <Menu className="w-6 h-6" />}
          </Button>
      </motion.div>

      {/* Top Bar (Progress) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-center z-50 pointer-events-none">
          {/* Progress Bar */}
          <div className="flex gap-1 pointer-events-auto bg-white/50 p-1 rounded-full backdrop-blur-sm mt-1">
             {waypoints.map((_, idx) => (
                 <button 
                    key={idx}
                    className={cn(
                        "h-1.5 rounded-full transition-all",
                        idx === currentIndex ? "w-8 bg-blue-600" : "w-4 bg-gray-300 hover:bg-gray-400"
                    )}
                    onClick={() => setCurrentIndex(idx)}
                 />
             ))}
          </div>
      </div>

      {/* Main Content Area - Shifts when sidebar is open */}
      <motion.div 
        className="absolute top-0 bottom-0 right-0 overflow-hidden"
        animate={{ 
            left: isOutlineOpen ? SIDEBAR_WIDTH : 0,
            width: isOutlineOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
          {/* Navigation Arrows */}
          {/* Left Arrow */}
          {currentIndex > 0 && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 z-50 group"
                style={{ left: `${ARROW_MARGIN}px` }}
              >
                   <motion.button
                      initial={{ height: 60, width: 60 }}
                      whileHover={{ height: 160, width: 60 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[#6366F1] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4F46E5] transition-colors"
                      onClick={() => setCurrentIndex(prev => prev - 1)}
                   >
                       <ArrowLeft className="w-8 h-8" />
                   </motion.button>
              </div>
          )}
          
          {/* Right Arrow */}
          {currentIndex < waypoints.length - 1 && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 z-50 group"
                style={{ right: `${ARROW_MARGIN}px` }}
              >
                   <motion.button
                      initial={{ height: 60, width: 60 }}
                      whileHover={{ height: 160, width: 60 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[#6366F1] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#4F46E5] transition-colors"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                   >
                       <ArrowRight className="w-8 h-8" />
                   </motion.button>
              </div>
          )}

          {/* Slide Content */}
          <div
            key={currentWaypoint.id}
            style={{
                width: wpW,
                height: wpH,
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${scale})`,
                borderRadius: '24px',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Render Waypoint Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <Waypoint 
                    element={{...currentWaypoint, x: 0, y: 0, locked: true}} 
                    isSelected={false}
                    isInteractive={false}
                    onSelect={() => {}}
                    onChange={() => {}}
                    onDelete={() => {}}
                    onDragEnd={() => {}}
                    scale={scale}
                    labelLayer={null}
                />
            </div>

            {/* Render Content */}
            <div className="absolute inset-0 top-0 left-0 w-full h-full">
                {elementsOnSlide.map(el => {
                    const relativeElement = {
                        ...el,
                        x: el.x - currentWaypoint.x,
                        y: el.y - currentWaypoint.y
                    };

                    if (el.type === 'path' && el.points) {
                        relativeElement.points = el.points.map((p: any) => ({
                            x: p.x - currentWaypoint.x,
                            y: p.y - currentWaypoint.y
                        }));
                        
                         return (
                            <PathElement 
                                key={el.id}
                                element={relativeElement}
                                isSelected={false}
                                isInteractive={false}
                                onSelect={() => {}}
                                onChange={() => {}}
                                onDelete={() => {}}
                                scale={scale}
                            />
                        );
                    }
                    
                    if (el.type === 'sticky') {
                        return (
                            <StickyNote 
                                key={el.id}
                                element={relativeElement}
                                isSelected={false}
                                isInteractive={false}
                                onSelect={() => {}}
                                onChange={() => {}}
                                onDelete={() => {}}
                                onConnect={() => {}}
                                onHover={() => {}}
                                onDragEnd={() => {}}
                                scale={scale}
                            />
                        );
                    }

                    if (el.type === 'web') {
                        return (
                            <WebEmbed 
                                key={el.id}
                                element={relativeElement}
                                isSelected={false}
                                onSelect={() => {}}
                                onChange={() => {}}
                                onDelete={() => {}}
                                onDragEnd={() => {}}
                                scale={scale}
                                viewMode={true}
                            />
                        );
                    }

                    if (el.type === 'timer') {
                        return (
                            <Timer 
                                key={el.id}
                                element={relativeElement}
                                isSelected={false}
                                onSelect={() => {}}
                                onChange={() => {}}
                                onDelete={() => {}}
                                onDragEnd={() => {}}
                                scale={scale}
                                viewMode={true}
                            />
                        );
                    }

                    if (el.type === 'text') {
                        return (
                            <TextElement 
                                key={el.id}
                                element={relativeElement}
                                isSelected={false}
                                onSelect={() => {}}
                                onChange={() => {}}
                                onDelete={() => {}}
                                onDragEnd={() => {}}
                                scale={scale}
                                viewMode={true}
                            />
                        );
                    }

                    return null;
                })}
            </div>
          </div>
      </motion.div>
    </div>
  );
}