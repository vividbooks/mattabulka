import React, { useState } from 'react';

interface NameDialogProps {
  onSubmit: (name: string) => void;
}

export function NameDialog({ onSubmit }: NameDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-[#4E5871] mb-2 text-center">Vítejte ve VIVID Wall</h2>
        <p className="text-gray-500 mb-6 text-center">Zadejte prosím své jméno pro připojení k nástěnce</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vaše jméno..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4E5871] focus:ring-2 focus:ring-[#4E5871]/20 outline-none transition-all text-lg"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-[#4E5871] text-white font-bold py-3 rounded-xl hover:bg-[#3A4256] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Vstoupit
          </button>
        </form>
      </div>
    </div>
  );
}
