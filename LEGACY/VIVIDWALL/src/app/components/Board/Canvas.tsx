import React, { useRef, useState, useEffect } from 'react';
import { Motion, motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { saveElement, deleteElement } from '../../utils/api';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { Cursor } from './Cursor';
import { StickyNote } from './StickyNote';
import { Waypoint } from './Waypoint';
import { WebEmbed } from './WebEmbed';
import { Timer } from './Timer';
import { TextElement } from './TextElement';
import { PathElement } from './PathElement';
import { ZoomControls } from './ZoomControls';
import { ShapeElement } from './ShapeElement';
import { ShapeMenu } from './ShapeMenu';
import Group13852 from '../../imports/Group13852';

interface CanvasProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  elements: {id: string, type: string, x: number, y: number, content?: string, points?: any[], color?: string, strokeWidth?: number, opacity?: number, label?: string, fromId?: string, toId?: string, authorName?: string}[];
  setElements: React.Dispatch<React.SetStateAction<any[]>>;
  scale: number;
  setScale: (scale: number) => void;
  userName: string;
  brushSettings: { color: string, size: number, type: string };
  others: Record<string, any>;
  updateMyPosition: (x: number, y: number) => void;
  broadcastAction: (id: string | null, data: any) => void;
  pan: { x: number, y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
  addToHistory: () => void;
}

export function Canvas({ activeTool, setActiveTool, elements, setElements, scale, setScale, userName, brushSettings, others, updateMyPosition, broadcastAction, pan, setPan, addToHistory }: CanvasProps) {
  const constraintsRef = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Selection box state for rectangular drag selection
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Shape settings
  const [selectedShape, setSelectedShape] = useState('circle');
  const [selectedShapeColor, setSelectedShapeColor] = useState('#3b82f6');

  // Arrow/Line drawing state (two-phase: click -> move -> click)
  const [arrowDraft, setArrowDraft] = useState<{ startX: number, startY: number, currentX: number, currentY: number, shape: string, color: string } | null>(null);

  // Pan state moved to parent
  const [connectionDraft, setConnectionDraft] = useState<{ sourceId: string, startX: number, startY: number, currentX: number, currentY: number, direction: string } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [hoveredConnector, setHoveredConnector] = useState<{ id: string, direction: string } | null>(null);
  const [labelLayer, setLabelLayer] = useState<HTMLElement | null>(null); // Layer for waypoint labels

  const isInteractive = activeTool === 'select';

  useEffect(() => {
    const handleElementUpdate = (e: any) => {
      const { id, x, y, type, points, color, strokeWidth, opacity, label, scale, width, height, savedPan, savedScale, content, fromId, toId, authorName, url } = e.detail;
      
      if (type === 'clear') {
        setElements([]);
      } else if (type === 'delete') {
        setElements(prev => {
          const deletedElement = prev.find(el => el.id === id);
          const remaining = prev.filter(el => el.id !== id);
          
          // If deleted element was a waypoint, renumber remaining waypoints
          if (deletedElement?.type === 'waypoint') {
            const waypoints = remaining.filter(el => el.type === 'waypoint');
            const others = remaining.filter(el => el.type !== 'waypoint');
            
            waypoints.sort((a, b) => (parseInt(a.label) || 0) - (parseInt(b.label) || 0));
            
            const updatedWaypoints = waypoints.map((wp, index) => ({
              ...wp,
              label: String(index + 1)
            }));
            
            return [...others, ...updatedWaypoints];
          }
          
          return remaining;
        });
      } else if (type === 'path-create') {
        setElements(prev => [...prev, { id, type: 'path', x: 0, y: 0, points, color, strokeWidth, opacity }]);
      } else if (type === 'create-waypoint') {
        setElements(prev => [...prev, { id, type: 'waypoint', x, y, label, scale, width, height, savedPan, savedScale }]);
      } else if (type === 'create-web') {
        setElements(prev => [...prev, { id, type: 'web', x, y, width, height, url }]);
      } else if (type === 'create-timer') {
        setElements(prev => [...prev, { id, type: 'timer', x, y, width, height, totalTime, timeLeft, isRunning }]);
      } else if (type === 'create-sticky') {
        setElements(prev => [...prev, { id, type: 'sticky', x, y, content, color, authorName }]);
      } else if (type === 'create-text') {
        setElements(prev => [...prev, { id, type: 'text', x, y, content, color, fontSize, fontFamily, isBold, isList, textAlign, mode, isExpanded, linkUrl }]);
      } else if (type === 'create-connection') {
        setElements(prev => [...prev, { id, type: 'connection', fromId, toId }]);
      } else {
        setElements(prev => prev.map(el => el.id === id ? { ...el, x, y, content, color, authorName, url, width, height } : el));
      }
    };

    window.addEventListener('element-update', handleElementUpdate);
    return () => window.removeEventListener('element-update', handleElementUpdate);
  }, [setElements]);

  // Prevent default browser gestures
  useEffect(() => {
    const preventGestures = (e: Event) => {
      e.preventDefault();
    };

    const preventContextMenu = (e: Event) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT' && 
          (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // Prevent pinch-zoom on touch devices
    document.addEventListener('gesturestart', preventGestures, { passive: false });
    document.addEventListener('gesturechange', preventGestures, { passive: false });
    document.addEventListener('gestureend', preventGestures, { passive: false });
    
    // Prevent context menu (long press on touch devices)
    document.addEventListener('contextmenu', preventContextMenu, { passive: false });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGestures);
      document.removeEventListener('gesturechange', preventGestures);
      document.removeEventListener('gestureend', preventGestures);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - pan.x) / scale;
      const worldY = (mouseY - pan.y) / scale;

      // High sensitivity zoom
      const zoomFactor = 1 - e.deltaY * 0.01; 
      const newScale = Math.min(Math.max(0.02, scale * zoomFactor), 1.4);

      const newPanX = mouseX - worldX * newScale;
      const newPanY = mouseY - worldY * newScale;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    } else {
      // High sensitivity pan
      setPan(p => ({ x: p.x - e.deltaX * 1.8, y: p.y - e.deltaY * 1.8 }));
    }
  };

  const getMouseWorldPos = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;
    return { worldX, worldY, mouseX, mouseY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Deselect if clicking background
    // We rely on elements calling stopPropagation(). If the event reaches here, it's a background click.
    if (!activeTool || activeTool === 'select' || activeTool === 'hand') {
        setSelectedId(null);
        setSelectedIds([]);
    }

    if (activeTool === 'hand' || e.button === 1) {
      setIsPanning(true);
    } else if (activeTool === 'select') {
        // Only start rectangular selection if clicking directly on the canvas background
        // Elements call stopPropagation(), so if we're here and target is the canvas div, it's safe
        const target = e.target as HTMLElement;
        const isCanvasBackground = target.classList.contains('canvas-background') || 
                                   target.tagName === 'svg' ||
                                   target === e.currentTarget;
        
        if (isCanvasBackground) {
            const { worldX, worldY } = getMouseWorldPos(e);
            setSelectionBox({ startX: worldX, startY: worldY, endX: worldX, endY: worldY });
        }
    } else if (activeTool === 'brush') {
      setIsDrawing(true);
      const { worldX, worldY } = getMouseWorldPos(e);
      setCurrentPath([{ x: worldX, y: worldY }]);
    } else if (activeTool === 'sticky') {
        // Add sticky on click
        const { worldX, worldY } = getMouseWorldPos(e);
        const id = crypto.randomUUID();
        const newSticky = {
            id,
            type: 'sticky',
            x: worldX - 200, // Center based on 400 width
            y: worldY - 200,
            width: 400,
            height: 400,
            content: '',
            color: '#ffb7b2',
            authorName: userName,
            fontSize: 48,
            isBold: false,
            showAuthor: true,
            url: ''
        };
        
        addToHistory();
        setElements(prev => [...prev, newSticky]);
        broadcastAction(id, { ...newSticky, type: 'create-sticky' });
        saveElement(newSticky).catch(console.error);
        
        // Switch back to select tool
        setActiveTool('select');
    } else if (activeTool === 'text') {
        // Add text on click
        const { worldX, worldY } = getMouseWorldPos(e);
        const id = crypto.randomUUID();
        const newText = {
            id,
            type: 'text',
            x: worldX, 
            y: worldY,
            width: 300,
            height: 60,
            content: 'Type something...',
            color: '#1e293b',
            fontFamily: 'Fenomen Sans',
            fontSize: 24,
            isBold: false,
            isList: false,
            textAlign: 'left',
            mode: 'text',
            isExpanded: true,
            linkUrl: ''
        };
        
        addToHistory();
        setElements(prev => [...prev, newText]);
        broadcastAction(id, { ...newText, type: 'create-text' });
        saveElement(newText).catch(console.error);
        
        // Switch back to select tool and select the new text
        setActiveTool('select');
        setSelectedId(id);
    } else if (activeTool === 'shape') {
        // Check if it's an arrow or line (two-phase drawing)
        if (selectedShape === 'arrow' || selectedShape === 'line') {
            const { worldX, worldY } = getMouseWorldPos(e);
            setArrowDraft({
                startX: worldX,
                startY: worldY,
                currentX: worldX,
                currentY: worldY,
                shape: selectedShape,
                color: selectedShapeColor
            });
        } else {
            // Standard shape - single click
            const { worldX, worldY } = getMouseWorldPos(e);
            const id = crypto.randomUUID();
            const newShape = {
                id,
                type: 'shape',
                x: worldX, 
                y: worldY,
                width: 100,
                height: 100,
                shape: selectedShape,
                color: selectedShapeColor,
                rotation: 0,
                authorName: userName,
                isBold: false,
                showAuthor: true,
                url: ''
            };
            
            addToHistory();
            setElements(prev => [...prev, newShape]);
            broadcastAction(id, { ...newShape, type: 'create-shape' });
            saveElement(newShape).catch(console.error);
            
            // Switch back to select tool and select the new shape
            setActiveTool('select');
            setSelectedId(id);
        }
    } else if (activeTool === 'arrow') {
        // Add arrow on click
        const { worldX, worldY } = getMouseWorldPos(e);
        setArrowDraft({
            startX: worldX,
            startY: worldY,
            currentX: worldX,
            currentY: worldY,
            shape: 'arrow',
            color: brushSettings.color
        });
    }
  };

  const handleConnectorStart = (e: React.PointerEvent, sourceId: string, direction: string) => {
     // We cannot use getMouseWorldPos(e) directly here because e.currentTarget 
     // refers to the small button inside StickyNote, not the main Canvas container.
     // We must calculate position relative to the main container (constraintsRef).
     
     const container = constraintsRef.current as HTMLDivElement | null;
     if (!container) return;

     const rect = container.getBoundingClientRect();
     const mouseX = e.clientX - rect.left;
     const mouseY = e.clientY - rect.top;
     
     const worldX = (mouseX - pan.x) / scale;
     const worldY = (mouseY - pan.y) / scale;

     setConnectionDraft({
         sourceId,
         startX: worldX,
         startY: worldY,
         currentX: worldX,
         currentY: worldY,
         direction
     });
  };

  const handleMouseUp = () => {
    if (connectionDraft) {
        // Check distance
        const dx = connectionDraft.currentX - connectionDraft.startX;
        const dy = connectionDraft.currentY - connectionDraft.startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 10) {
             // Click -> Create adjacent
             handleConnectSticky(connectionDraft.sourceId, connectionDraft.direction as any);
        } else {
             // Drag -> Connect if target found OR create new at drop location
             if (hoveredElementId && hoveredElementId !== connectionDraft.sourceId) {
                 // Connect to existing
                 addToHistory();
                 const newConnection = {
                    id: crypto.randomUUID(),
                    type: 'connection',
                    fromId: connectionDraft.sourceId,
                    toId: hoveredElementId
                 };
                 setElements(prev => [...prev, newConnection]);
                 broadcastAction(newConnection.id, { ...newConnection, type: 'create-connection' });
                 saveElement(newConnection);
             } else if (!hoveredElementId) {
                 // Create NEW note at drop location
                 addToHistory();
                 
                 // Calculate center offset to drop the note centered on mouse
                 const noteWidth = 400;
                 const noteHeight = 400;
                 const newX = connectionDraft.currentX - (noteWidth / 2);
                 const newY = connectionDraft.currentY - (noteHeight / 2);

                 const sourceElement = elements.find(e => e.id === connectionDraft.sourceId);
                 const newColor = sourceElement?.color || '#ffb7b2';

                 const newId = crypto.randomUUID();
                 const newSticky = {
                    id: newId,
                    type: 'sticky',
                    x: newX,
                    y: newY,
                    width: noteWidth,
                    height: noteHeight,
                    content: '',
                    color: newColor,
                    authorName: userName,
                    fontSize: 48,
                    isBold: false,
                    showAuthor: true,
                    url: ''
                 };

                 const newConnection = {
                    id: crypto.randomUUID(),
                    type: 'connection',
                    fromId: connectionDraft.sourceId,
                    toId: newId
                 };

                 setElements(prev => [...prev, newSticky, newConnection]);
                 // Select the new note so user can type immediately
                 setSelectedId(newId);

                 broadcastAction(newId, { ...newSticky, type: 'create-sticky' });
                 broadcastAction(newConnection.id, { ...newConnection, type: 'create-connection' });
                 
                 saveElement(newSticky);
                 saveElement(newConnection);
             }
        }
        setConnectionDraft(null);
    }

    if (isDrawing) {
      if (currentPath.length > 1) {
        addToHistory(); 
        const id = crypto.randomUUID();
        const opacity = brushSettings.type === 'highlighter' ? 0.3 : (brushSettings.type === 'marker' ? 0.5 : 1);
        
        const newElement = {
          id,
          type: 'path',
          x: 0, 
          y: 0,
          points: currentPath,
          color: brushSettings.color,
          strokeWidth: brushSettings.size,
          opacity
        };

        setElements(prev => [...prev, newElement]);
        broadcastAction(id, { 
          type: 'path-create', 
          points: currentPath, 
          color: brushSettings.color, 
          strokeWidth: brushSettings.size, 
          opacity 
        });
        saveElement(newElement).catch(console.error);
      }
      setIsDrawing(false);
      setCurrentPath([]);
    }
    if (arrowDraft) {
        // Check distance
        const dx = arrowDraft.currentX - arrowDraft.startX;
        const dy = arrowDraft.currentY - arrowDraft.startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 10) {
            // Draw arrow/line
            addToHistory();
            const id = crypto.randomUUID();
            const newElement = {
                id,
                type: 'path',
                x: 0,
                y: 0,
                points: [
                    { x: arrowDraft.startX, y: arrowDraft.startY },
                    { x: arrowDraft.currentX, y: arrowDraft.currentY }
                ],
                color: arrowDraft.color,
                strokeWidth: 3,
                opacity: 1,
                rotation: 0,
                isArrow: arrowDraft.shape === 'arrow' // Mark as arrow to add arrowhead
            };
            
            setElements(prev => [...prev, newElement]);
            broadcastAction(id, { 
                type: 'path-create', 
                points: newElement.points, 
                color: arrowDraft.color, 
                strokeWidth: 3, 
                opacity: 1,
                isArrow: arrowDraft.shape === 'arrow'
            });
            saveElement(newElement).catch(console.error);
            
            // Switch back to select tool
            setActiveTool('select');
            setSelectedId(id);
        }
        setArrowDraft(null);
    }
    if (selectionBox) {
        // End rectangular selection
        const minX = Math.min(selectionBox.startX, selectionBox.endX);
        const maxX = Math.max(selectionBox.startX, selectionBox.endX);
        const minY = Math.min(selectionBox.startY, selectionBox.endY);
        const maxY = Math.max(selectionBox.startY, selectionBox.endY);
        
        // Find elements within selection box
        const selected = elements.filter(el => {
            // Skip connections and waypoints
            if (el.type === 'connection' || el.type === 'waypoint') return false;
            
            // For path elements (drawings, arrows, lines)
            if (el.type === 'path' && el.points && el.points.length > 0) {
                // Check if ANY point is inside the selection box
                return el.points.some((point: any) => 
                    point.x >= minX && point.x <= maxX && 
                    point.y >= minY && point.y <= maxY
                );
            }
            
            // For other elements (sticky notes, shapes, text, etc.)
            // Check if element's bounding box intersects with selection box
            const elWidth = el.width || 400;
            const elHeight = el.height || 400;
            const elLeft = el.x;
            const elRight = el.x + elWidth;
            const elTop = el.y;
            const elBottom = el.y + elHeight;
            
            // Check if rectangles overlap (not just center!)
            const overlapsX = elLeft <= maxX && elRight >= minX;
            const overlapsY = elTop <= maxY && elBottom >= minY;
            
            return overlapsX && overlapsY;
        });
        
        // Set selected IDs for multi-select
        const selectedIdsList = selected.map(el => el.id);
        setSelectedIds(selectedIdsList);
        
        if (selected.length > 0) {
            console.log('Selected elements:', selected.length, selectedIdsList);
            // Set first element as primary selection, but keep all in selectedIds
            setSelectedId(selected[0].id);
        } else {
            // Clear selection if nothing selected
            setSelectedId(null);
        }
        
        setSelectionBox(null);
    }
    setIsPanning(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const { worldX, worldY } = getMouseWorldPos(e);
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
    if (isDrawing) {
      setCurrentPath(prev => [...prev, { x: worldX, worldY }]);
    }
    if (connectionDraft) {
      setConnectionDraft(prev => prev ? { ...prev, currentX: worldX, currentY: worldY } : null);
    }
    if (arrowDraft) {
      setArrowDraft(prev => prev ? { ...prev, currentX: worldX, currentY: worldY } : null);
    }
    if (selectionBox) {
        setSelectionBox(prev => prev ? { ...prev, endX: worldX, endY: worldY } : null);
    }
    updateMyPosition(worldX, worldY);
  };

  const handleDeleteWaypoint = async (id: string) => {
    addToHistory(); 
    setElements(prev => {
      const remaining = prev.filter(el => el.id !== id);
      const waypoints = remaining.filter(el => el.type === 'waypoint');
      const others = remaining.filter(el => el.type !== 'waypoint');
      waypoints.sort((a, b) => (parseInt(a.label) || 0) - (parseInt(b.label) || 0));
      const updatedWaypoints = waypoints.map((wp, index) => ({
        ...wp,
        label: String(index + 1)
      }));
      return [...others, ...updatedWaypoints];
    });

    const remaining = elements.filter(el => el.id !== id);
    const waypoints = remaining.filter(el => el.type === 'waypoint');
    waypoints.sort((a, b) => (parseInt(a.label) || 0) - (parseInt(b.label) || 0));
    
    const updates: Promise<any>[] = [];
    broadcastAction(id, { type: 'delete' });
    updates.push(deleteElement(id));

    waypoints.forEach((wp, index) => {
      const newLabel = String(index + 1);
      if (wp.label !== newLabel) {
        broadcastAction(wp.id, { label: newLabel });
        updates.push(saveElement({ ...wp, label: newLabel }));
      }
    });
    try { await Promise.all(updates); } catch (err) { console.error(err); }
  };

  const handleDeleteElement = (id: string) => {
      const element = elements.find(el => el.id === id);
      if (!element) return;

      if (element.type === 'waypoint') {
          handleDeleteWaypoint(id);
      } else {
          addToHistory();
          setElements(prev => prev.filter(el => el.id !== id));
          broadcastAction(id, { type: 'delete' });
          deleteElement(id).catch(console.error);
      }
      if (selectedId === id) {
          setSelectedId(null);
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
          return;
        }
        handleDeleteElement(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements]);

  const handleUpdateWaypoint = async (id: string, updates: any) => {
    addToHistory(); 
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    broadcastAction(id, updates);
    const element = elements.find(e => e.id === id);
    if (element) {
      saveElement({ ...element, ...updates }).catch(console.error);
    }
  };

  // --- Container Logic ---
  const handleWaypointDragEnd = (waypointId: string, newX: number, newY: number) => {
      addToHistory();
      
      // Find old state
      const oldWaypoint = elements.find(e => e.id === waypointId);
      if (!oldWaypoint) return;

      const dx = newX - oldWaypoint.x;
      const dy = newY - oldWaypoint.y;
      
      if (dx === 0 && dy === 0) return;

      const updates: Promise<any>[] = [];
      const updatedElements = elements.map(el => {
          // Update Waypoint itself
          if (el.id === waypointId) {
              const updated = { ...el, x: newX, y: newY };
              broadcastAction(el.id, { x: newX, y: newY });
              updates.push(saveElement(updated));
              return updated;
          }

          // Check containment for other elements
          // Connection lines are skipped (they follow nodes automatically)
          if (el.type === 'connection') return el;
          if (el.type === 'waypoint') return el; // Nested waypoints? Maybe skip for now.

          // Calculate center of element
          let cx = el.x;
          let cy = el.y;
          
          if (el.type === 'sticky') {
              const w = el.width || 240;
              const h = el.height || 240;
              cx += w / 2;
              cy += h / 2;
          } else if (el.type === 'path') {
              // Rough bounding box for paths would be better, but for now use first point or just skip
              // Paths have points array relative to x,y (which is usually 0,0 for paths)
              // Actually paths are usually x=0,y=0 and points are absolute world coords in this app
              if (el.points && el.points.length > 0) {
                  cx = el.points[0].x;
                  cy = el.points[0].y;
              }
          }

          // Check if center was inside OLD waypoint bounds
          const wpX = oldWaypoint.x;
          const wpY = oldWaypoint.y;
          const wpW = oldWaypoint.width || 300;
          const wpH = oldWaypoint.height || 300;

          if (cx >= wpX && cx <= wpX + wpW && cy >= wpY && cy <= wpY + wpH) {
              // It's inside! Move it.
              const movedX = el.x + dx;
              const movedY = el.y + dy;
              
              // Update element paths if it's a path
              if (el.type === 'path') {
                  const movedPoints = el.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
                  const updated = { ...el, points: movedPoints };
                  broadcastAction(el.id, { type: 'path-move', points: movedPoints }); // Special type or just full update
                  // Actually standard update handles it if we send full object or points
                  broadcastAction(el.id, { points: movedPoints });
                  updates.push(saveElement(updated));
                  return updated;
              } else {
                  const updated = { ...el, x: movedX, y: movedY };
                  broadcastAction(el.id, { x: movedX, y: movedY });
                  updates.push(saveElement(updated));
                  return updated;
              }
          }
          
          return el;
      });

      setElements(updatedElements);
      Promise.all(updates).catch(console.error);
  };

  const handleConnectSticky = (sourceId: string, direction: 'top' | 'right' | 'bottom' | 'left') => {
      addToHistory();
      const source = elements.find(e => e.id === sourceId);
      if (!source) return;
      
      const offset = 460; // 400 width + 60 gap
      let newX = source.x;
      let newY = source.y;
      
      if (direction === 'right') newX += offset;
      if (direction === 'left') newX -= offset;
      if (direction === 'bottom') newY += offset;
      if (direction === 'top') newY -= offset;
      
      const newId = crypto.randomUUID();
      const newSticky = {
          id: newId,
          type: 'sticky',
          x: newX,
          y: newY,
          content: '',
          color: source.color,
          authorName: userName,
          fontSize: 48
      };
      
      const newConnection = {
          id: crypto.randomUUID(),
          type: 'connection',
          fromId: sourceId,
          toId: newId
      };
      
      setElements(prev => [...prev, newSticky, newConnection]);
      setSelectedId(newId); // Select the new note
      
      broadcastAction(newId, { ...newSticky, type: 'create-sticky' });
      broadcastAction(newConnection.id, { ...newConnection, type: 'create-connection' });
      
      saveElement(newSticky);
      saveElement(newConnection);
  };
  
  const handleUpdateSticky = (id: string, updates: any) => {
      // We don't addToHistory on every keystroke, so we trust the parent or use debounce.
      // Actually StickyNote calls onChange.
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
      broadcastAction(id, updates);
      const element = elements.find(e => e.id === id);
      if (element) {
          // Debounce save?
          saveElement({ ...element, ...updates }).catch(console.error);
      }
  };

  const handleUpdateText = (id: string, updates: any) => {
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
      broadcastAction(id, updates);
      const element = elements.find(e => e.id === id);
      if (element) {
          saveElement({ ...element, ...updates }).catch(console.error);
      }
  };

  const handleUpdateWeb = (id: string, updates: any) => {
    addToHistory();
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    broadcastAction(id, updates);
    const element = elements.find(e => e.id === id);
    if (element) {
      saveElement({ ...element, ...updates }).catch(console.error);
    }
  };

  const handleUpdateTimer = (id: string, updates: any) => {
    // Timer updates happen frequently (every second), so we might want to be careful with history
    // But for start/stop/resize/move, we definitely want history.
    // The Timer component manages ticking internally for display, but calls onChange for start/stop.
    // Let's assume major state changes call this.
    if (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.isRunning !== undefined || updates.totalTime !== undefined) {
         addToHistory();
    }
    
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    broadcastAction(id, updates);
    const element = elements.find(e => e.id === id);
    if (element) {
      saveElement({ ...element, ...updates }).catch(console.error);
    }
  };

  const handleUpdatePath = (id: string, updates: any) => {
    addToHistory();
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    broadcastAction(id, updates);
    const element = elements.find(e => e.id === id);
    if (element) {
      saveElement({ ...element, ...updates }).catch(console.error);
    }
  };

  const handleZoomFromControl = (newScale: number) => {
    const viewportX = window.innerWidth / 2;
    const viewportY = window.innerHeight / 2;

    const worldX = (viewportX - pan.x) / scale;
    const worldY = (viewportY - pan.y) / scale;

    const newPanX = viewportX - worldX * newScale;
    const newPanY = viewportY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const getSvgPath = (points: {x: number, y: number}[]) => {
    if (!points || points.length === 0) return '';
    const d = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return d;
  };

  return (
    <div 
      className={cn(
        "canvas-background w-full h-full overflow-hidden bg-[#F9FAFB]",
        activeTool === 'hand' ? (isPanning ? "cursor-grabbing" : "cursor-grab") : 
        activeTool === 'brush' ? "cursor-crosshair" : 
        activeTool === 'sticky' ? "cursor-copy" : 
        activeTool === 'text' ? "cursor-text" : "cursor-default"
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      ref={constraintsRef}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(#4E5871 ${scale}px, transparent ${scale}px)`,
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      <motion.div
        className="w-full h-full origin-top-left relative"
        style={{
          x: pan.x,
          y: pan.y,
          scale: scale
        }}
      >
        {/* Top Layer for Waypoint Labels (Z-50) - Always on top */}
        <div ref={setLabelLayer} className="absolute inset-0 pointer-events-none z-[50]" />

        {/* Waypoints - Rendered FIRST to be at the bottom */}
        {elements.filter(el => el.type === 'waypoint').map(el => (
          <Waypoint 
            key={el.id} 
            element={el} 
            isSelected={selectedId === el.id}
            onSelect={() => setSelectedId(el.id)}
            onDelete={() => handleDeleteWaypoint(el.id)}
            onChange={(updates) => handleUpdateWaypoint(el.id, updates)}
            onDragEnd={(x, y) => handleWaypointDragEnd(el.id, x, y)}
            scale={scale}
            labelLayer={labelLayer}
            isInteractive={isInteractive}
          />
        ))}

        {/* Web Content - Rendered after Waypoints, before Stickies */}
        {elements.filter(el => el.type === 'web').map(el => (
          <WebEmbed
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onSelect={() => setSelectedId(el.id)}
            onDelete={() => handleDeleteElement(el.id)}
            onChange={(updates) => handleUpdateWeb(el.id, updates)}
            onDragEnd={(x, y) => {
                addToHistory();
                broadcastAction(el.id, { x, y });
                const updated = { ...el, x, y };
                saveElement(updated).catch(console.error);
                setElements(prev => prev.map(item => item.id === el.id ? updated : item));
            }}
            scale={scale}
          />
        ))}

        {/* Timers */}
        {elements.filter(el => el.type === 'timer').map(el => (
          <Timer
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onSelect={() => setSelectedId(el.id)}
            onDelete={() => handleDeleteElement(el.id)}
            onChange={(updates) => handleUpdateTimer(el.id, updates)}
            onDragEnd={(x, y) => {
                addToHistory();
                broadcastAction(el.id, { x, y });
                const updated = { ...el, x, y };
                saveElement(updated).catch(console.error);
                setElements(prev => prev.map(item => item.id === el.id ? updated : item));
            }}
            scale={scale}
          />
        ))}

        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 2 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              opacity="1"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              opacity="1"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
            </marker>
          </defs>
          
          {/* Connections */}
          {elements.filter(el => el.type === 'connection').map(conn => {
             const from = elements.find(e => e.id === conn.fromId);
             const to = elements.find(e => e.id === conn.toId);
             if (!from || !to) return null;
             return (
                <ConnectionLine 
                    key={conn.id} 
                    from={from} 
                    to={to} 
                    isSelected={selectedId === conn.id}
                    onSelect={() => setSelectedId(conn.id)}
                />
             );
          })}

          {isDrawing && currentPath.length > 0 && (
            <path
              d={getSvgPath(currentPath)}
              stroke={brushSettings.color}
              strokeWidth={brushSettings.size}
              strokeOpacity={brushSettings.type === 'highlighter' ? 0.3 : (brushSettings.type === 'marker' ? 0.5 : 1)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Draft Connection Line */}
          {connectionDraft && (
             <path 
                d={getElbowPath(
                    { x: connectionDraft.startX, y: connectionDraft.startY },
                    { x: connectionDraft.currentX, y: connectionDraft.currentY }
                )}
                stroke="#64748B" 
                strokeWidth="3" 
                fill="none"
                markerEnd="url(#arrowhead)"
                className="pointer-events-none opacity-60"
             />
          )}
          {/* Draft Arrow Line */}
          {arrowDraft && (() => {
             const dx = arrowDraft.currentX - arrowDraft.startX;
             const dy = arrowDraft.currentY - arrowDraft.startY;
             const length = Math.sqrt(dx * dx + dy * dy);
             const angle = Math.atan2(dy, dx);
             
             // Arrow head size
             const arrowSize = 15;
             
             return (
               <g className="pointer-events-none">
                 {/* Main line */}
                 <line 
                   x1={arrowDraft.startX}
                   y1={arrowDraft.startY}
                   x2={arrowDraft.currentX}
                   y2={arrowDraft.currentY}
                   stroke={arrowDraft.color} 
                   strokeWidth={3} 
                   opacity={0.6}
                 />
                 {/* Arrow head */}
                 {length > 20 && (
                   <polygon
                     points={`0,-${arrowSize/2} ${arrowSize},0 0,${arrowSize/2}`}
                     fill={arrowDraft.color}
                     opacity={0.6}
                     transform={`translate(${arrowDraft.currentX}, ${arrowDraft.currentY}) rotate(${angle * 180 / Math.PI})`}
                   />
                 )}
               </g>
             );
          })()}
          {/* Selection Box Visualization */}
          {selectionBox && (() => {
            const minX = Math.min(selectionBox.startX, selectionBox.endX);
            const maxX = Math.max(selectionBox.startX, selectionBox.endX);
            const minY = Math.min(selectionBox.startY, selectionBox.endY);
            const maxY = Math.max(selectionBox.startY, selectionBox.endY);
            const width = maxX - minX;
            const height = maxY - minY;
            
            return (
              <rect
                x={minX}
                y={minY}
                width={width}
                height={height}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5,5"
                className="pointer-events-none"
              />
            );
          })()}
        </svg>

        {/* Ghost Sticky Note (Dragging or Hovering Connector) */}
        {(() => {
           let ghostX = 0;
           let ghostY = 0;
           let showGhost = false;
           let ghostColor = '#e2e2e2'; // Default gray

           if (connectionDraft) {
              // Dragging -> Follow mouse
              showGhost = true;
              const source = elements.find(e => e.id === connectionDraft.sourceId);
              if (source) ghostColor = source.color;
              
              // Center on mouse cursor
              ghostX = connectionDraft.currentX - 200; // 400/2
              ghostY = connectionDraft.currentY - 200;
           } else if (hoveredConnector) {
              // Hovering -> Show adjacent
              showGhost = true;
              const source = elements.find(e => e.id === hoveredConnector.id);
              if (source) {
                 ghostColor = source.color;
                 const offset = 460; // 400 width + 60 gap
                 ghostX = source.x;
                 ghostY = source.y;
                 const dir = hoveredConnector.direction;
                 
                 if (dir === 'right') ghostX += offset;
                 if (dir === 'left') ghostX -= offset;
                 if (dir === 'bottom') ghostY += offset;
                 if (dir === 'top') ghostY -= offset;
              }
           }

           if (!showGhost) return null;

           return (
              <div
                style={{
                    position: 'absolute',
                    left: ghostX,
                    top: ghostY,
                    width: 400,
                    height: 400,
                    backgroundColor: ghostColor,
                    opacity: 0.4,
                    borderRadius: '16px', // Default rounded look
                    border: '2px dashed #64748B',
                    pointerEvents: 'none',
                    zIndex: 5 // Below regular stickies
                }}
              />
           );
        })()}
        
        {/* Paths - Rendered in HTML layer for interactivity */}
        {elements.filter(el => el.type === 'path').map(el => (
            <PathElement
              key={el.id}
              element={el}
              isSelected={selectedId === el.id || selectedIds.includes(el.id)}
              showToolbar={selectedId === el.id && selectedIds.length <= 1}
              onSelect={() => setSelectedId(el.id)}
              onChange={(updates) => handleUpdatePath(el.id, updates)}
              onDelete={() => handleDeleteElement(el.id)}
              onMultiDrag={(dx, dy) => {
                  const updatedElements = elements.map(item => {
                      if (selectedIds.includes(item.id) || item.id === selectedId) {
                          if (item.type === 'path') {
                              const movedPoints = item.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) || [];
                              return { ...item, points: movedPoints };
                          } else {
                              return { ...item, x: item.x + dx, y: item.y + dy };
                          }
                      }
                      return item;
                  });
                  setElements(updatedElements);
              }}
              onMultiDragEnd={() => {
                  addToHistory();
                  const selectedElements = elements.filter(el => selectedIds.includes(el.id) || el.id === selectedId);
                  selectedElements.forEach(elem => {
                      broadcastAction(elem.id, elem.type === 'path' ? { points: elem.points } : { x: elem.x, y: elem.y });
                      saveElement(elem).catch(console.error);
                  });
              }}
              selectedIds={selectedIds}
              isInteractive={isInteractive}
              scale={scale}
            />
        ))}

        {/* Sticky Notes */}
        {elements.filter(el => el.type === 'sticky').map(el => (
            <StickyNote 
                key={el.id}
                element={el}
                isSelected={selectedId === el.id || selectedIds.includes(el.id)}
                onSelect={() => setSelectedId(el.id)}
                onChange={(updates) => handleUpdateSticky(el.id, updates)}
                onConnect={(e, dir) => handleConnectorStart(e, el.id, dir)}
                onHover={(id) => setHoveredElementId(id)}
                onConnectorHover={(id, dir) => setHoveredConnector(dir ? { id, direction: dir } : null)}
                onDragEnd={(x, y) => {
                    addToHistory();
                    broadcastAction(el.id, { x, y });
                    const updated = { ...el, x, y };
                    saveElement(updated).catch(console.error);
                    setElements(prev => prev.map(item => item.id === el.id ? updated : item));
                }}
                onMultiDrag={(dx, dy) => {
                    // Move all selected elements during drag
                    const updatedElements = elements.map(item => {
                        if (selectedIds.includes(item.id) || item.id === selectedId) {
                            if (item.type === 'path') {
                                const movedPoints = item.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) || [];
                                return { ...item, points: movedPoints };
                            } else {
                                return { ...item, x: item.x + dx, y: item.y + dy };
                            }
                        }
                        return item;
                    });
                    setElements(updatedElements);
                }}
                onMultiDragEnd={() => {
                    addToHistory();
                    const selectedElements = elements.filter(el => selectedIds.includes(el.id) || el.id === selectedId);
                    selectedElements.forEach(elem => {
                        broadcastAction(elem.id, elem.type === 'path' ? { points: elem.points } : { x: elem.x, y: elem.y });
                        saveElement(elem).catch(console.error);
                    });
                }}
                selectedIds={selectedIds}
                onDelete={() => handleDeleteElement(el.id)}
                scale={scale}
                isInteractive={isInteractive}
            />
        ))}

        {/* Text Elements */}
        {elements.filter(el => el.type === 'text').map(el => (
            <TextElement 
                key={el.id}
                element={el}
                isSelected={selectedId === el.id || selectedIds.includes(el.id)}
                onSelect={() => setSelectedId(el.id)}
                onChange={(updates) => handleUpdateText(el.id, updates)}
                onDragEnd={(x, y) => {
                    addToHistory();
                    broadcastAction(el.id, { x, y });
                    const updated = { ...el, x, y };
                    saveElement(updated).catch(console.error);
                    setElements(prev => prev.map(item => item.id === el.id ? updated : item));
                }}
                onMultiDrag={(dx, dy) => {
                    const updatedElements = elements.map(item => {
                        if (selectedIds.includes(item.id) || item.id === selectedId) {
                            if (item.type === 'path') {
                                const movedPoints = item.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) || [];
                                return { ...item, points: movedPoints };
                            } else {
                                return { ...item, x: item.x + dx, y: item.y + dy };
                            }
                        }
                        return item;
                    });
                    setElements(updatedElements);
                }}
                onMultiDragEnd={() => {
                    addToHistory();
                    const selectedElements = elements.filter(el => selectedIds.includes(el.id) || el.id === selectedId);
                    selectedElements.forEach(elem => {
                        broadcastAction(elem.id, elem.type === 'path' ? { points: elem.points } : { x: elem.x, y: elem.y });
                        saveElement(elem).catch(console.error);
                    });
                }}
                selectedIds={selectedIds}
                onDelete={() => handleDeleteElement(el.id)}
                scale={scale}
            />
        ))}

        {/* Shape Elements */}
        {elements.filter(el => el.type === 'shape').map(el => (
            <ShapeElement 
                key={el.id}
                element={el}
                isSelected={selectedId === el.id || selectedIds.includes(el.id)}
                showToolbar={selectedId === el.id && selectedIds.length <= 1}
                onSelect={() => setSelectedId(el.id)}
                onDragEnd={(x, y) => {
                    addToHistory();
                    const updated = { ...el, x, y };
                    broadcastAction(el.id, updated);
                    saveElement(updated).catch(console.error);
                    setElements(prev => prev.map(item => item.id === el.id ? updated : item));
                }}
                onResize={(width, height) => {
                    const updated = { ...el, width, height };
                    broadcastAction(el.id, updated);
                    saveElement(updated).catch(console.error);
                    setElements(prev => prev.map(item => item.id === el.id ? updated : item));
                }}
                onChange={(updates) => {
                    const updated = { ...el, ...updates };
                    broadcastAction(el.id, updated);
                    saveElement(updated).catch(console.error);
                    setElements(prev => prev.map(item => item.id === el.id ? updated : item));
                }}
                onMultiDrag={(dx, dy) => {
                    const updatedElements = elements.map(item => {
                        if (selectedIds.includes(item.id) || item.id === selectedId) {
                            if (item.type === 'path') {
                                const movedPoints = item.points?.map((p: any) => ({ x: p.x + dx, y: p.y + dy })) || [];
                                return { ...item, points: movedPoints };
                            } else {
                                return { ...item, x: item.x + dx, y: item.y + dy };
                            }
                        }
                        return item;
                    });
                    setElements(updatedElements);
                }}
                onMultiDragEnd={() => {
                    addToHistory();
                    const selectedElements = elements.filter(el => selectedIds.includes(el.id) || el.id === selectedId);
                    selectedElements.forEach(elem => {
                        broadcastAction(elem.id, elem.type === 'path' ? { points: elem.points } : { x: elem.x, y: elem.y });
                        saveElement(elem).catch(console.error);
                    });
                }}
                selectedIds={selectedIds}
                scale={scale}
            />
        ))}

        {/* Other Elements */}
        {elements.filter(el => 
          el.type !== 'path' && 
          el.type !== 'waypoint' && 
          el.type !== 'sticky' && 
          el.type !== 'connection' && 
          el.type !== 'web' && 
          el.type !== 'timer' && 
          el.type !== 'text' && 
          el.type !== 'shape'
        ).map(el => (
          <DraggableElement 
            key={el.id} 
            element={el} 
            activeTool={activeTool} 
            onDrag={(x, y) => broadcastAction(el.id, { x, y })}
            onDragEnd={(x, y) => {
               addToHistory();
               broadcastAction(el.id, { x, y });
               const updatedElement = { ...el, x, y };
               saveElement(updatedElement).catch(console.error);
               setElements(prev => prev.map(item => item.id === el.id ? updatedElement : item));
            }}
          />
        ))}
        
        {/* Remote Cursors */}
        {Object.entries(others).map(([id, cursor]) => (
          <Cursor 
            key={id}
            x={cursor.x}
            y={cursor.y}
            color={cursor.color}
            label={cursor.name}
          />
        ))}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
           <div className="w-[600px] h-[400px]">
             <Group13852 />
           </div>
        </div>

      </motion.div>

      {/* Shape Menu - Shows when shape tool is active */}
      {activeTool === 'shape' && (
        <ShapeMenu 
          selectedShape={selectedShape}
          selectedColor={selectedShapeColor}
          onShapeSelect={setSelectedShape}
          onColorSelect={setSelectedShapeColor}
        />
      )}

      {/* Zoom Controls - Fixed to bottom right */}
      <ZoomControls scale={scale} setScale={handleZoomFromControl} />
    </div>
  );
}

// Helper for Elbow Path
function getElbowPath(start: {x: number, y: number}, end: {x: number, y: number}) {
  const midX = (start.x + end.x) / 2;
  const radius = 20;
  
  // If points are too close, just straight line
  if (Math.abs(start.x - end.x) < radius * 2 || Math.abs(start.y - end.y) < radius * 2) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // We want: Start -> Horizontal -> Vertical -> Horizontal -> End
  // Wait, simple elbow is usually Start -> Horz to Mid -> Vert to EndY -> Horz to EndX
  // Let's do: Start -> MidX,StartY -> MidX,EndY -> EndX,EndY
  
  // 1. Start
  let d = `M ${start.x} ${start.y}`;
  
  // 2. Line to first corner start
  // Corner 1 is at (midX, startY)
  // We stop 'radius' before it
  const dir1 = midX > start.x ? 1 : -1;
  d += ` L ${midX - radius * dir1} ${start.y}`;
  
  // 3. Curve 1
  // Q controlPoint endpoint
  // Control: (midX, startY)
  // End: (midX, startY + radius * dir2)
  const dir2 = end.y > start.y ? 1 : -1;
  d += ` Q ${midX} ${start.y} ${midX} ${start.y + radius * dir2}`;
  
  // 4. Line to second corner
  // End is at (midX, endY)
  d += ` L ${midX} ${end.y - radius * dir2}`;
  
  // 5. Curve 2
  // Control: (midX, endY)
  // End: (midX + radius * dir3, endY)
  const dir3 = end.x > midX ? 1 : -1;
  d += ` Q ${midX} ${end.y} ${midX + radius * dir3} ${end.y}`;
  
  // 6. Line to end
  d += ` L ${end.x} ${end.y}`;
  
  return d;
}

// Helper to check if a point is inside a polygon
function isPointInPolygon(point: {x: number, y: number}, polygon: {x: number, y: number}[]) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
                          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

interface DraggableElementProps {
    element: any;
    activeTool: string;
    onDrag: (x: number, y: number) => void;
    onDragEnd: (x: number, y: number) => void;
}

function DraggableElement({ element, activeTool, onDrag, onDragEnd }: DraggableElementProps) {
    // Basic draggable implementation for images/files if added later
    const x = useMotionValue(element.x);
    const y = useMotionValue(element.y);
    
    useEffect(() => {
        x.set(element.x);
        y.set(element.y);
    }, [element.x, element.y]);

    return (
        <motion.div
            style={{ x, y }}
            drag
            dragMomentum={false}
            onDrag={(e, info) => {
                onDrag(info.point.x, info.point.y);
            }}
            onDragEnd={(e, info) => {
                onDragEnd(x.get(), y.get());
            }}
            className="absolute"
        >
            {/* Render content based on type */}
            <div className="w-32 h-32 bg-gray-200 border border-gray-400 flex items-center justify-center">
                Unknown
            </div>
        </motion.div>
    );
}

function ConnectionLine({ from, to, isSelected, onSelect }: { from: any, to: any, isSelected: boolean, onSelect: () => void }) {
    const startX = from.x + (from.width || 400) / 2;
    const startY = from.y + (from.height || 400) / 2;
    const endX = to.x + (to.width || 400) / 2;
    const endY = to.y + (to.height || 400) / 2;

    const path = getElbowPath({ x: startX, y: startY }, { x: endX, y: endY });

    return (
        <g onClick={(e) => { e.stopPropagation(); onSelect(); }} className="cursor-pointer group pointer-events-auto">
            {/* Invisible wide path for easier clicking */}
            <path d={path} stroke="transparent" strokeWidth="20" fill="none" />
            {/* Visible path */}
            <path 
                d={path} 
                stroke={isSelected ? "#3B82F6" : "#64748B"} 
                strokeWidth={isSelected ? 3 : 2} 
                fill="none"
                markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                className="transition-colors duration-200"
            />
        </g>
    );
}