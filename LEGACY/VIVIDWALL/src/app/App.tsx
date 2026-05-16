import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Board/Toolbar';
import { Canvas } from './components/Board/Canvas';
import { WaypointsBar } from './components/Board/WaypointsBar';
import { Button } from './components/ui/button';
import { Undo2, Redo2, Trash2, Play } from 'lucide-react';
import { PresentationMode } from './components/PresentationMode';
import { ToolsPanel } from './components/ToolsPanel';

import { NameDialog } from './components/Board/NameDialog';
import { BrushMenu } from './components/Board/BrushMenu';
import { fetchElements, clearElements, saveElement } from './utils/api';
import { useMultiplayer } from './hooks/useMultiplayer';

export default function App() {
  const [activeTool, setActiveTool] = useState('select');
  const [scale, setScale] = useState(0.7);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [userName, setUserName] = useState('');
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    size: 8,
    type: 'pen'
  });
  
  const [elements, setElements] = useState<{id: string, type: string, x: number, y: number, content?: string, points?: any[], color?: string, strokeWidth?: number, opacity?: number, label?: string, url?: string, width?: number, height?: number}[]>([]);

  // History State
  const [past, setPast] = useState<any[][]>([]);
  const [future, setFuture] = useState<any[][]>([]);
  
  // Presentation Mode State
  const [isPresenting, setIsPresenting] = useState(false);
  
  // Tools Panel State
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  
  // Initialize multiplayer here to share access
  const { others, updateMyPosition, broadcastAction } = useMultiplayer(userName);

  // Prevent browser zoom and gestures globally
  useEffect(() => {
    // Set viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Prevent all wheel events with Ctrl/Cmd from zooming browser
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Prevent keyboard zoom (Ctrl/Cmd + Plus/Minus/0)
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', preventBrowserZoom, { passive: false });
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
    };
  }, []);

  useEffect(() => {
    fetchElements().then(data => {
      if (Array.isArray(data)) {
        setElements(data);
      }
    }).catch(err => console.error('Failed to load elements:', err));
  }, []);

  const addToHistory = () => {
    setPast(prev => [...prev, elements]);
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture(prev => [elements, ...prev]);
    setElements(previous);
    setPast(newPast);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast(prev => [...prev, elements]);
    setElements(next);
    setFuture(newFuture);
  };

  const handleClear = async () => {
    if (!window.confirm('Opravdu chcete smazat celou nástěnku? Tato akce je nevratná.')) {
      return;
    }
    addToHistory();
    try {
      await clearElements();
      setElements([]);
      broadcastAction(null, { type: 'clear' });
    } catch (err) {
      console.error('Failed to clear board:', err);
      alert('Nepodařilo se vymazat nástěnku.');
    }
  };

  const handleAddWaypoint = async () => {
    addToHistory();
    const waypointsCount = elements.filter(e => e.type === 'waypoint').length;
    
    // Calculate world bounds for the visual frame (80% of viewport)
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    
    // 10% margin on each side
    const marginX = viewportW * 0.1;
    const marginY = viewportH * 0.1;

    const worldX = (-pan.x + marginX) / scale;
    const worldY = (-pan.y + marginY) / scale;
    const worldW = (viewportW * 0.8) / scale;
    const worldH = (viewportH * 0.8) / scale;

    const newWaypoint = {
      id: crypto.randomUUID(),
      type: 'waypoint',
      label: (waypointsCount + 1).toString(),
      x: worldX, // For rendering on canvas
      y: worldY, // For rendering on canvas
      width: worldW,
      height: worldH,
      savedPan: pan, // For navigation restoration
      savedScale: scale, // For navigation restoration
      color: '#6366f1' // Indigo-500
    };

    setElements(prev => [...prev, newWaypoint]);
    broadcastAction(newWaypoint.id, { ...newWaypoint, type: 'create-waypoint' }); 
    await saveElement(newWaypoint);
  };

  const handleSelectTool = (toolId: string) => {
    if (toolId === 'embed') {
        addToHistory();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        // Center in viewport
        const worldX = (-pan.x + (viewportW / 2) - 600) / scale; // Center (width 1200)
        const worldY = (-pan.y + (viewportH / 2) - 400) / scale; // Center (height 800)

        const newElement = {
            id: crypto.randomUUID(),
            type: 'web',
            x: worldX,
            y: worldY,
            width: 1200,
            height: 800,
            url: '',
        };
        
        setElements(prev => [...prev, newElement]);
        broadcastAction(newElement.id, { ...newElement, type: 'create-web' });
        saveElement(newElement);
        
    } else if (toolId === 'stopwatch') {
        addToHistory();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        const worldX = (-pan.x + (viewportW / 2) - 160) / scale; // Center 320w
        const worldY = (-pan.y + (viewportH / 2) - 160) / scale; // Center 320h

        const newElement = {
            id: crypto.randomUUID(),
            type: 'timer',
            x: worldX,
            y: worldY,
            width: 320,
            height: 320,
            totalTime: 300, // 5 mins default
            timeLeft: 300,
            isRunning: false,
            authorName: userName,
        };
        
        setElements(prev => [...prev, newElement]);
        broadcastAction(newElement.id, { ...newElement, type: 'create-timer' });
        saveElement(newElement);
        
        setActiveTool('select');
    }
  };

  const handleNavigate = (wp: any) => {
    // Calculate target scale to fit waypoint within 80% of viewport
    // We clamp the scale between 0.1 and 5 to avoid extreme zooms
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Default size if missing (backwards compatibility)
    const w = wp.width || 300;
    const h = wp.height || 300;

    const scaleX = (viewportW * 0.8) / w;
    const scaleY = (viewportH * 0.8) / h;
    
    // Use the smaller scale to ensure the whole element fits
    let targetScale = Math.min(scaleX, scaleY);
    targetScale = Math.min(Math.max(0.1, targetScale), 5);

    // Calculate Pan to position the waypoint's Top-Left at 10% of the screen
    // Formula: ScreenPos = WorldPos * Scale + Pan
    // Pan = ScreenPos - (WorldPos * Scale)
    const targetScreenX = viewportW * 0.1; // 10% margin left
    const targetScreenY = viewportH * 0.1; // 10% margin top

    const newPanX = targetScreenX - (wp.x * targetScale);
    const newPanY = targetScreenY - (wp.y * targetScale);

    setScale(targetScale);
    setPan({ x: newPanX, y: newPanY });
  };

  return (
    <div className="w-full h-screen bg-[#F5F5F5] relative overflow-hidden font-sans">
      {!userName && <NameDialog onSubmit={setUserName} />}
      
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white shadow-sm gap-2 h-10 px-4"
            onClick={() => setIsPresenting(true)}
          >
              <Play className="w-4 h-4 fill-current" />
              Prezentovat
          </Button>

          <div className="flex gap-1 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200 h-10 items-center">
             <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0} title="Zpět" className="h-7 w-7">
               <Undo2 className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} title="Vpřed" className="h-7 w-7">
               <Redo2 className="h-4 w-4" />
             </Button>
             <div className="w-px h-4 bg-gray-200 mx-1" />
             <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" title="Vymazat vše">
               <Trash2 className="h-4 w-4" />
             </Button>
          </div>
      </div>

      {isPresenting && (
        <PresentationMode 
            elements={elements} 
            onClose={() => setIsPresenting(false)} 
        />
      )}
      
      <WaypointsBar 
        waypoints={elements.filter(e => e.type === 'waypoint') as any[]} 
        onAdd={handleAddWaypoint}
        onNavigate={handleNavigate}
      />
      
      <ToolsPanel 
        isOpen={isToolsPanelOpen} 
        onClose={() => setIsToolsPanelOpen(false)}
        onSelectTool={handleSelectTool}
      />

      <Canvas 
        activeTool={activeTool}
        setActiveTool={setActiveTool} 
        elements={elements} 
        setElements={setElements}
        scale={scale}
        setScale={setScale}
        pan={pan}
        setPan={setPan}
        userName={userName}
        brushSettings={brushSettings}
        others={others}
        updateMyPosition={updateMyPosition}
        broadcastAction={broadcastAction}
        addToHistory={addToHistory}
      />
      
      {activeTool === 'brush' && (
        <BrushMenu settings={brushSettings} onChange={setBrushSettings} />
      )}
      
      <Toolbar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        onOpenPanel={(panel) => {
            if (panel === 'tools') {
                setIsToolsPanelOpen(true);
            }
        }} 
        onClear={handleClear}
      />
    </div>
  );
}