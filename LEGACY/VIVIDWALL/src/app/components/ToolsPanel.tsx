import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

// Icon components based on Figma imports
const TimerIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#4E5871]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </svg>
);

const WebContentIcon = () => (
  <svg viewBox="0 0 54 54" className="w-10 h-10 text-[#4E5871]" fill="none">
    <path d="M26.6338 53.2676C11.9647 53.2676 0 41.3029 0 26.6338C0 19.2993 2.90923 12.4564 8.19501 7.41649C9.09646 6.55601 10.5306 6.55601 11.432 7.49844C12.2925 8.39989 12.2925 9.83401 11.3501 10.7355C6.96576 14.9559 4.54823 20.6105 4.54823 26.6748C4.54823 38.8444 14.4642 48.7603 26.6338 48.7603C38.8034 48.7603 48.7193 38.8444 48.7193 26.6748C48.7193 15.2837 40.0326 5.85943 28.9284 4.71213V12.3335C28.9284 13.6037 27.904 14.6281 26.6338 14.6281C25.3636 14.6281 24.3392 13.6037 24.3392 12.3335V0H26.6338C41.3029 0 53.2676 11.9647 53.2676 26.6338C53.2676 41.3029 41.3029 53.2676 26.6338 53.2676Z" fill="currentColor" />
    <path d="M30.0431 22.3757C31.928 24.0967 32.0919 27.0059 30.3709 28.8908C28.65 30.7756 25.7407 30.9395 23.8559 29.2186C22.4218 27.9074 16.1936 18.647 13.2843 14.3037C12.8746 13.689 13.5302 12.9925 14.1858 13.3203C18.816 15.7788 28.65 21.1055 30.0841 22.3757H30.0431Z" fill="currentColor" />
  </svg>
);

// Placeholder icons for other tools to match the grid
const PlaceholderIcon = ({ label }: { label: string }) => (
  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 font-bold">
    {label.substring(0, 2).toUpperCase()}
  </div>
);

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const TOOLS: ToolItem[] = [
  { id: 'text', label: 'Textové pole', icon: <PlaceholderIcon label="Tx" />, disabled: true },
  { id: 'vividbooks', label: 'Vividbooks', icon: <PlaceholderIcon label="VB" />, disabled: true },
  { id: 'vividboard', label: 'Vividboard', icon: <PlaceholderIcon label="Vd" />, disabled: true },
  { id: 'animation', label: 'Animace Vividbooks', icon: <PlaceholderIcon label="An" />, disabled: true },
  { id: 'qr', label: 'QR kód', icon: <PlaceholderIcon label="QR" />, disabled: true },
  { id: 'stopwatch', label: 'Stopky', icon: <TimerIcon />, disabled: false },
  { id: 'embed', label: 'Webový obsah', icon: <WebContentIcon />, disabled: false },
  { id: 'math', label: 'Matematický zápis', icon: <PlaceholderIcon label="Ma" />, disabled: true },
];

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export function ToolsPanel({ isOpen, onClose, onSelectTool }: ToolsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - transparent but blocks clicks on canvas behind the panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/5"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-24 top-6 bottom-6 w-[400px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-semibold text-[#4E5871]">Nástroje</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                        if (!tool.disabled) {
                            onSelectTool(tool.id);
                            onClose();
                        }
                    }}
                    disabled={tool.disabled}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-transparent transition-all",
                      tool.disabled 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-[#F0F2F5] hover:border-gray-200 cursor-pointer hover:shadow-sm active:scale-95"
                    )}
                  >
                    <div className={cn(
                        "p-2 rounded-lg",
                        tool.disabled ? "bg-gray-50" : "bg-white shadow-sm border border-gray-100"
                    )}>
                        {tool.icon}
                    </div>
                    <span className="text-xs text-center font-medium text-gray-600">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}