import React from 'react';
import { ArrowLeft, Menu, MoreHorizontal, Plus, Share2 } from 'lucide-react';

export function TopBar() {
  return (
    <div className="fixed top-4 left-0 w-full px-4 z-20 flex justify-between items-center pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <button className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 text-[#4E5871]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="bg-white pl-2 pr-4 py-1.5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="bg-[#4E5871] w-10 h-10 rounded-lg flex items-center justify-center text-white">
            {/* Simple pencil icon placeholder */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Kreslicí tabule</span>
            <span className="text-sm font-semibold text-gray-900">Nová nástěnka</span>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto">
        <button className="bg-[#DEE4F1] hover:bg-[#d1d9e8] text-[#4E5871] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Přidat orientační bod
        </button>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex bg-[#DEE4F1] rounded-lg p-1 items-center">
           <div className="px-3 text-[#4E5871] text-lg font-bold cursor-pointer select-none">-</div>
           <div className="w-3 h-3 bg-[#4E5871] rounded-full mx-2"></div>
           <div className="px-3 text-[#4E5871] text-lg font-bold cursor-pointer select-none">+</div>
        </div>

        <button className="bg-[#DEE4F1] p-2.5 rounded-lg hover:bg-[#d1d9e8] text-[#4E5871]">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
             <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
             <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="bg-[#DEE4F1] p-2.5 rounded-lg hover:bg-[#d1d9e8] text-[#4E5871]">
          <Menu className="w-5 h-5" />
        </button>
        <button className="bg-[#DEE4F1] p-2.5 rounded-lg hover:bg-[#d1d9e8] text-[#4E5871]">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="bg-[#DEE4F1] p-2.5 rounded-lg hover:bg-[#d1d9e8] text-[#4E5871]">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
