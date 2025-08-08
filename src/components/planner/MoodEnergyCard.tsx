import React from 'react';
import { Battery } from 'lucide-react';
import { useJournal } from '../../hooks/useJournal';

interface MoodEnergyCardProps {
  selectedDate: string;
  currentEntry: any;
  compact?: boolean;
}

const moods = [
  { emoji: '😊', label: 'Joyeux' },
  { emoji: '😌', label: 'Paisible' },
  { emoji: '😴', label: 'Fatigué' },
  { emoji: '🤔', label: 'Pensif' },
  { emoji: '😤', label: 'Déterminé' },
  { emoji: '😔', label: 'Mélancolique' },
  { emoji: '🤗', label: 'Reconnaissant' },
  { emoji: '😰', label: 'Stressé' },
  { emoji: '🥳', label: 'Enthousiaste' },
  { emoji: '😐', label: 'Neutre' }
];

const energyLevels = [
  { value: 1, label: 'Très faible', color: 'text-red-500', bg: 'bg-red-50' },
  { value: 2, label: 'Faible', color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 3, label: 'Moyenne', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { value: 4, label: 'Bonne', color: 'text-green-500', bg: 'bg-green-50' },
  { value: 5, label: 'Excellente', color: 'text-emerald-500', bg: 'bg-emerald-50' }
];

export default function MoodEnergyCard({ selectedDate, currentEntry, compact = false }: MoodEnergyCardProps) {
  const { updateMood, updateEntry } = useJournal();
  
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 6 && currentHour < 12;

  const handleMoodUpdate = async (mood: string) => {
    const timeOfDay = isMorning ? 'morning' : 'evening';
    const level = currentEntry?.[`mood_${timeOfDay}_level` as keyof typeof currentEntry] as number || 3;
    await updateMood(selectedDate, timeOfDay, mood, level);
  };

  const handleEnergyUpdate = async (level: number) => {
    await updateEntry(selectedDate, { efficiency_rating: level });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <h2 className={`${compact ? 'text-md' : 'text-lg'} font-semibold text-neutral-800 mb-4`}>
        Comment te sens-tu ?
      </h2>
      
      <div className={`space-y-${compact ? '4' : '6'}`}>
        {/* Mood */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Humeur</h3>
          <div className="flex flex-wrap gap-2">
            {moods.slice(0, compact ? 6 : 10).map(mood => (
              <button
                key={mood.emoji}
                onClick={() => handleMoodUpdate(mood.emoji)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  (isMorning ? currentEntry?.mood_morning : currentEntry?.mood_evening) === mood.emoji
                    ? 'bg-primary-100 scale-110 shadow-md'
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
                title={mood.label}
              >
                <span className={compact ? 'text-base' : 'text-lg'}>{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Énergie */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Niveau d'énergie</h3>
          <div className={`grid grid-cols-${compact ? '5' : '1'} gap-${compact ? '1' : '2'}`}>
            {energyLevels.map(level => (
              <button
                key={level.value}
                onClick={() => handleEnergyUpdate(level.value)}
                className={`${compact ? 'p-2' : 'p-2'} rounded-lg text-left transition-all duration-200 ${
                  currentEntry?.efficiency_rating === level.value
                    ? `${level.bg} ${level.color} border-2 border-current`
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <div className={`flex items-center ${compact ? 'justify-center' : 'gap-2'}`}>
                  <Battery className={`w-3 h-3 ${level.color}`} />
                  {!compact && <span className="text-sm font-medium">{level.label}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}