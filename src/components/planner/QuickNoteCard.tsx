import React, { useState } from 'react';
import { useJournal } from '../../hooks/useJournal';

interface QuickNoteCardProps {
  selectedDate: string;
  compact?: boolean;
}

export default function QuickNoteCard({ selectedDate, compact = false }: QuickNoteCardProps) {
  const [quickNote, setQuickNote] = useState('');
  const { addSegment } = useJournal();

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    
    await addSegment(selectedDate, {
      timeOfDay: 'afternoon',
      note: quickNote.trim()
    });
    setQuickNote('');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <h3 className={`${compact ? 'text-md' : 'text-lg'} font-semibold text-neutral-800 mb-4`}>
        Note rapide
      </h3>
      <div className="space-y-3">
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="Une idée, un ressenti..."
          rows={compact ? 2 : 3}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <button
          onClick={handleQuickNote}
          disabled={!quickNote.trim()}
          className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}