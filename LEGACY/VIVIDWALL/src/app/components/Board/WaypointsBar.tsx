import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Waypoint {
  id: string;
  type: 'waypoint';
  label: string;
  x: number;
  y: number;
  scale: number;
}

interface WaypointsBarProps {
  waypoints: Waypoint[];
  onAdd: () => void;
  onNavigate: (waypoint: Waypoint) => void;
}

export function WaypointsBar({ waypoints, onAdd, onNavigate }: WaypointsBarProps) {
  // Sort waypoints by label (assuming numeric)
  const sorted = [...waypoints].sort((a, b) => parseInt(a.label) - parseInt(b.label));

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 bg-white/90 backdrop-blur p-2 px-4 rounded-full shadow-sm border border-gray-200">
      <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Plátna:</span>
      
      <div className="flex items-center gap-2">
        {sorted.map((wp) => (
          <button
            key={wp.id}
            onClick={() => onNavigate(wp)}
            className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold hover:bg-indigo-200 hover:scale-110 transition-all"
            title={`Přejít na plátno ${wp.label}`}
          >
            {wp.label}
          </button>
        ))}
      </div>
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <button
        onClick={onAdd}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Přidat plátno</span>
      </button>
    </div>
  );
}
