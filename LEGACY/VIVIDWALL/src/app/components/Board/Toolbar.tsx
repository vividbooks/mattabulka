import React from 'react';
import { MousePointer2, Hand, Square, StickyNote, type LucideIcon, PenTool, Trash2, Type } from 'lucide-react';
import { cn } from '../../lib/utils';
import Group17706 from '../../imports/Group17706';

interface ToolbarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  onOpenPanel: (panel: string) => void;
  onClear: () => void;
}

export function Toolbar({ activeTool, setActiveTool, onOpenPanel, onClear }: ToolbarProps) {
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg px-3 py-6 flex flex-col items-center gap-4 z-50 border border-gray-100">
      <ToolButton 
        active={activeTool === 'select'} 
        onClick={() => setActiveTool('select')}
        icon={MousePointer2}
        label="Vybrat"
      />
      <ToolButton 
        active={activeTool === 'hand'} 
        onClick={() => setActiveTool('hand')}
        icon={Hand}
        label="Posun"
      />
      <div className="w-8 h-px bg-gray-200 my-1" />
      <button
        onClick={() => onOpenPanel('tools')}
        className="p-3 rounded-xl hover:bg-gray-100 transition-all group relative w-12 h-12 flex items-center justify-center"
      >
        <div className="w-6 h-6 relative">
            <Group17706 />
        </div>
        <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Nástroje
        </span>
      </button>
      <div className="w-8 h-px bg-gray-200 my-1" />
      <ToolButton 
        active={activeTool === 'brush'} 
        onClick={() => setActiveTool('brush')}
        icon={PenTool}
        label="Kreslit"
      />
      <ToolButton 
        active={activeTool === 'sticky'} 
        onClick={() => {
          setActiveTool('sticky');
          // onOpenPanel('sticky'); 
        }}
        icon={StickyNote}
        label="Poznámka"
      />
      <ToolButton 
        active={activeTool === 'text'} 
        onClick={() => setActiveTool('text')}
        icon={Type}
        label="Text"
      />
      <ToolButton 
        active={activeTool === 'shape'} 
        onClick={() => setActiveTool('shape')}
        icon={Square}
        label="Tvar"
      />
      
      <div className="w-8 h-px bg-gray-200 my-1" />
      
      <button
        onClick={() => {
          if (window.confirm('Opravdu chcete smazat celou nástěnku? Tato akce je nevratná.')) {
            onClear();
          }
        }}
        className="p-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors group relative"
        title="Vymazat vše"
      >
        <Trash2 className="w-6 h-6" />
        <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Vymazat vše
        </span>
      </button>
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

function ToolButton({ active, onClick, icon: Icon, label }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all group relative",
        active 
          ? "bg-[#4E5871] text-white shadow-md scale-105" 
          : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </span>
    </button>
  );
}