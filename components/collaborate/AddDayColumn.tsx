'use client';

import { Plus } from 'lucide-react';

interface AddDayColumnProps {
  onAddDay: () => void;
}

export default function AddDayColumn({ onAddDay }: AddDayColumnProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <button
        onClick={onAddDay}
        className="w-full h-full min-h-[200px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <span className="text-sm font-medium text-gray-500 group-hover:text-emerald-600 transition-colors">
          Add Day
        </span>
      </button>
    </div>
  );
}
