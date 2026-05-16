import React from 'react';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Import generic images for tools if you don't have the specific assets
// Since I don't have the asset URLs from the Figma import handy right here (they were in the prompt but I should verify), 
// I will use text placeholders or generic icons for now, or better yet, use Lucide icons which look clean.

import { 
  Type, 
  BookOpen, 
  MonitorPlay, 
  QrCode, 
  Timer, 
  Globe, 
  Calculator,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  MessageSquare,
  Image,
  FileText,
  MapPin,
  Youtube,
  Box,
  LayoutGrid
} from 'lucide-react';

interface BottomPanelProps {
  tab: 'tools' | 'background';
  onClose: () => void;
  onSwitchTab: (tab: 'tools' | 'background') => void;
  onAddWidget: (type: string, label?: string) => void;
}

export function BottomPanel({ tab, onClose, onSwitchTab, onAddWidget }: BottomPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-[400px] bg-white shadow-[0px_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl z-30 flex flex-col transition-transform duration-300">
      {/* Handle / Drag indicator */}
      <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => onSwitchTab('tools')}
          className={cn(
            "text-lg font-medium px-4 py-2 rounded-lg transition-colors",
            tab === 'tools' ? "bg-gray-100 text-[#4E5871]" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Nástroje
        </button>
        <button 
          onClick={() => onSwitchTab('background')}
          className={cn(
            "text-lg font-medium px-4 py-2 rounded-lg transition-colors",
            tab === 'background' ? "bg-gray-100 text-[#4E5871]" : "text-gray-400 hover:text-gray-600"
          )}
        >
          Pozadí
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'tools' ? <ToolsContent onAdd={onAddWidget} /> : <BackgroundContent />}
      </div>
    </div>
  );
}

function ToolsContent({ onAdd }: { onAdd: (type: string, label: string) => void }) {
  const tools = [
    { icon: Type, label: 'Textové pole', type: 'text' },
    { icon: BookOpen, label: 'Vividbooks', type: 'vividbooks' },
    { icon: MonitorPlay, label: 'Vividboard', type: 'vividboard' },
    { icon: MonitorPlay, label: 'Animace Vividbooks', type: 'animation' },
    { icon: QrCode, label: 'QR kód', type: 'qr' },
    { icon: Timer, label: 'Stopky', type: 'timer' },
    { icon: Globe, label: 'Webový obsah', type: 'web' },
    { icon: Calculator, label: 'Matematický zápis', type: 'math' },
  ];

  const interactions = [
    { icon: MessageSquare, label: 'Můj názor', type: 'poll' },
    { icon: ThumbsUp, label: 'Souhlasím', type: 'vote-up' },
    { icon: ThumbsDown, label: 'Nesouhlasím', type: 'vote-down' },
    { icon: Lightbulb, label: 'Mám nápad', type: 'idea' },
  ];

  const integrations = [
    { icon: Image, label: 'Canva', color: 'bg-purple-100 text-purple-600', type: 'canva' },
    { icon: FileText, label: 'Google slides', color: 'bg-yellow-100 text-yellow-600', type: 'gslides' },
    { icon: FileText, label: 'Google sheets', color: 'bg-green-100 text-green-600', type: 'gsheets' },
    { icon: FileText, label: 'Google docs', color: 'bg-blue-100 text-blue-600', type: 'gdocs' },
    { icon: Youtube, label: 'Youtube', color: 'bg-red-100 text-red-600', type: 'youtube' },
    { icon: Calculator, label: 'Geogebra', color: 'bg-indigo-100 text-indigo-600', type: 'geogebra' },
    { icon: Box, label: 'Polypad', color: 'bg-blue-50 text-blue-500', type: 'polypad' },
    { icon: MapPin, label: 'Google maps', color: 'bg-green-50 text-green-500', type: 'gmaps' },
  ];

  return (
    <div className="space-y-8">
      {/* Main Tools */}
      <div className="grid grid-cols-8 gap-4">
        {tools.map((t, i) => (
          <div key={i} onClick={() => onAdd(t.type, t.label)} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-20 h-20 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
              <t.icon className="w-8 h-8" />
            </div>
            <span className="text-xs text-center text-gray-600 font-medium">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Interactions */}
      <div className="grid grid-cols-8 gap-4">
        {interactions.map((t, i) => (
          <div key={i} onClick={() => onAdd(t.type, t.label)} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-20 h-20 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all">
              <t.icon className="w-8 h-8" />
            </div>
            <span className="text-xs text-center text-gray-600 font-medium">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Integrations */}
      <div className="grid grid-cols-8 gap-4">
        {integrations.map((t, i) => (
          <div key={i} onClick={() => onAdd(t.type, t.label)} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className={cn("w-20 h-20 border border-gray-200 rounded-xl flex items-center justify-center transition-all group-hover:scale-105", t.color || "text-gray-600")}>
              <t.icon className="w-8 h-8" />
            </div>
            <span className="text-xs text-center text-gray-600 font-medium">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackgroundContent() {
  const backgrounds = [
    { label: 'Prázdné', type: 'empty' },
    { label: 'Čtverečky malé', type: 'grid-sm' },
    { label: 'Čtverečky velké', type: 'grid-lg' },
    { label: 'Linky velké', type: 'lines-lg' },
    { label: 'Linky malé', type: 'lines-sm' },
    { label: 'Sloupce velké', type: 'cols-lg' },
    { label: 'Sloupce malé', type: 'cols-sm' },
    { label: 'Tečky malé', type: 'dots' },
  ];

  return (
    <div className="grid grid-cols-8 gap-4">
      {backgrounds.map((bg, i) => (
        <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="w-24 h-24 border border-gray-200 rounded-xl overflow-hidden group-hover:border-blue-500 transition-all bg-white relative">
             {/* Background Preview Patterns */}
             {bg.type === 'empty' && <div className="w-full h-full bg-white" />}
             {bg.type === 'grid-sm' && <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-50" />}
             {bg.type === 'dots' && <div className="w-full h-full" style={{backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '10px 10px'}} />}
             {(bg.type === 'lines-lg' || bg.type === 'lines-sm') && (
               <div className="w-full h-full flex flex-col justify-around py-2">
                 {[1,2,3,4].map(k => <div key={k} className="w-full h-px bg-blue-100" />)}
               </div>
             )}
             {(bg.type === 'cols-lg' || bg.type === 'cols-sm') && (
               <div className="w-full h-full flex justify-around px-2">
                 {[1,2,3].map(k => <div key={k} className="h-full w-px bg-blue-100" />)}
               </div>
             )}
          </div>
          <span className="text-xs text-center text-gray-600 font-medium">{bg.label}</span>
        </div>
      ))}
    </div>
  );
}
