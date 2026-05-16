import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BRUSH_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'White', value: '#FFFFFF' },
];

export const BRUSH_SIZES = [
  { name: 'Thin', value: 8 },
  { name: 'Medium', value: 16 },
  { name: 'Thick', value: 24 },
  { name: 'Extra Thick', value: 36 },
];

export const BRUSH_TYPES = [
  { name: 'Pen', value: 'pen', opacity: 1 },
  { name: 'Marker', value: 'marker', opacity: 0.5 },
  { name: 'Highlighter', value: 'highlighter', opacity: 0.3 },
];

interface BrushMenuProps {
  settings: {
    color: string;
    size: number;
    type: string;
  };
  onChange: (settings: any) => void;
}

export function BrushMenu({ settings, onChange }: BrushMenuProps) {
  const updateSetting = (key: string, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 flex flex-col gap-4 min-w-[280px] animate-in fade-in slide-in-from-bottom-4 z-40">
      
      {/* Brush Type */}
      <div className="flex p-1 bg-gray-100 rounded-lg">
        {BRUSH_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateSetting('type', type.value)}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
              settings.type === type.value 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex flex-wrap gap-2 justify-center">
        {BRUSH_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => updateSetting('color', color.value)}
            className={cn(
              "w-8 h-8 rounded-full border border-gray-200 relative transition-transform hover:scale-110",
              settings.color === color.value && "ring-2 ring-offset-2 ring-[#4E5871]"
            )}
            style={{ backgroundColor: color.value }}
          >
            {settings.color === color.value && color.value === '#FFFFFF' && (
               <Check className="w-4 h-4 text-black absolute inset-0 m-auto" />
            )}
            {settings.color === color.value && color.value !== '#FFFFFF' && (
               <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
            )}
          </button>
        ))}
      </div>

      {/* Size Slider/Selection */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs text-gray-400 font-medium">Size</span>
        <div className="flex-1 flex items-center justify-between gap-2">
          {BRUSH_SIZES.map((size) => (
             <button
                key={size.value}
                onClick={() => updateSetting('size', size.value)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100",
                  settings.size === size.value ? "bg-gray-100 ring-1 ring-gray-300" : ""
                )}
             >
               <div 
                 className="rounded-full bg-black" 
                 style={{ 
                   width: Math.min(24, size.value * 0.8), 
                   height: Math.min(24, size.value * 0.8),
                   opacity: settings.type === 'highlighter' ? 0.3 : (settings.type === 'marker' ? 0.5 : 1) 
                 }} 
               />
             </button>
          ))}
        </div>
      </div>

    </div>
  );
}