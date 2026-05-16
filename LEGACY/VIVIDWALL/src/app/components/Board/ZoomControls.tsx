import React from 'react';

interface ZoomControlsProps {
  scale: number;
  setScale: (scale: number) => void;
}

export function ZoomControls({ scale, setScale }: ZoomControlsProps) {
  // Convert scale to percentage (0% - 140%)
  const percentage = Math.round(scale * 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    
    // Magnetic snap to 70%
    if (val > 65 && val < 75) {
        setScale(0.7);
    } else {
        // Ensure we don't hit exactly 0 to avoid math issues
        setScale(Math.max(0.02, val / 100));
    }
  };

  return (
    <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white/90 backdrop-blur shadow-sm border border-gray-200 px-4 py-2.5 rounded-full z-[50]">
      
      <div className="relative w-32 h-4 flex items-center">
        {/* Custom Track */}
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full overflow-hidden" />
        
        {/* Center Tick Mark (at 70%, which is exactly 50% of 0-140 range) */}
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-400 rounded-full transform -translate-x-1/2" />

        {/* Input */}
        <input
          type="range"
          min="0"
          max="140"
          value={percentage}
          onChange={handleSliderChange}
          className="w-full absolute inset-0 appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3B82F6] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent"
        />
      </div>

      <span className="text-sm font-medium text-gray-700 w-10 text-right font-mono select-none">
        {percentage}%
      </span>
    </div>
  );
}