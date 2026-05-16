import React from 'react';
import { svgPaths } from '../Icons/FigmaIcons';

interface CursorProps {
  x: number;
  y: number;
  color: string;
  label?: string;
}

export function Cursor({ x, y, color, label }: CursorProps) {
  return (
    <div 
      className="absolute pointer-events-none transition-transform duration-75 ease-linear z-50"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        className="drop-shadow-md"
        style={{ fill: color }}
      >
        <path d={svgPaths.cursor} />
      </svg>
      
      {label && (
        <div 
          className="absolute left-4 top-4 px-2 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
