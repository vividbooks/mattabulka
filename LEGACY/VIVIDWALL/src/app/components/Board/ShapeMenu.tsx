import React from 'react';
import { Circle, Square, Triangle, Hexagon, Star, Heart, Diamond, Octagon, Pentagon, ArrowRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShapeMenuProps {
  selectedShape: string;
  selectedColor: string;
  onShapeSelect: (shape: string) => void;
  onColorSelect: (color: string) => void;
}

const SHAPES = [
  { name: 'circle', icon: Circle, label: 'Kruh' },
  { name: 'square', icon: Square, label: 'Čtverec' },
  { name: 'triangle', icon: Triangle, label: 'Trojúhelník' },
  { name: 'hexagon', icon: Hexagon, label: 'Šestiúhelník' },
  { name: 'star', icon: Star, label: 'Hvězda' },
  { name: 'heart', icon: Heart, label: 'Srdce' },
  { name: 'diamond', icon: Diamond, label: 'Kosočtverec' },
  { name: 'octagon', icon: Octagon, label: 'Osmiúhelník' },
  { name: 'pentagon', icon: Pentagon, label: 'Pětiúhelník' },
  { name: 'arrow', icon: ArrowRight, label: 'Šipka' },
  { name: 'line', icon: Minus, label: 'Čára' },
];

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Black', value: '#1f2937' },
  { name: 'White', value: '#ffffff' },
];

export function ShapeMenu({ selectedShape, selectedColor, onShapeSelect, onColorSelect }: ShapeMenuProps) {
  return (
    <div 
      className="absolute left-24 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg p-4 z-50 border border-gray-100"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tvar</h3>
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.name}
              onClick={() => onShapeSelect(shape.name)}
              className={cn(
                "p-3 rounded-lg transition-all relative group",
                selectedShape === shape.name
                  ? "bg-[#4E5871] text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title={shape.label}
            >
              <shape.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Barva</h3>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorSelect(color.value)}
              className={cn(
                "w-8 h-8 rounded-lg transition-all border-2",
                selectedColor === color.value
                  ? "border-[#4E5871] scale-110 shadow-md"
                  : "border-gray-200 hover:scale-105"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}