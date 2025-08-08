import React from 'react';
import { BookOpen, ArrowRight, Heart, Lightbulb } from 'lucide-react';
import { useJournal } from '../hooks/useJournal';

interface JournalPreviewCardProps {
  onViewChange: (view: string) => void;
}

export default function JournalPreviewCard({ onViewChange }: JournalPreviewCardProps) {
  const { entries, currentEntry } = useJournal();
  
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  
  // Dernières entrées (3 derniers jours avec contenu)
  const recentEntries = entries
    .filter(entry => entry.segments.length > 0 || entry.insight || entry.day_rating)
    .slice(0, 3);

  const todayMood = currentEntry?.mood_morning || currentEntry?.mood_evening;
  const todayRating = currentEntry?.day_rating;
  
  // Moyenne des notes des 7 derniers jours
  const last7Days = entries.slice(0, 7);
  const avgRating = last7Days.length > 0 
    ? Math.round(last7Days.reduce((sum, entry) => sum + (entry.day_rating || 0), 0) / last7Days.filter(e => e.day_rating).length)
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Journal</h3>
          <p className="text-sm text-neutral-600">
            {entries.length} entrée{entries.length > 1 ? 's' : ''} • Moyenne: {avgRating}/10
          </p>
        </div>
        <BookOpen className="w-5 h-5 text-primary-500" />
      </div>

      {/* État du jour */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-rose-50 rounded-lg">
          <div className="flex items-center gap-3">
            {todayMood && (
              <span className="text-2xl">{todayMood}</span>
            )}
            <div>
              <div className="text-sm font-medium text-neutral-800">
                {formatDate(today)}
              </div>
              {todayRating && (
                <div className="text-xs text-neutral-600">
                  Note: {todayRating}/10
                </div>
              )}
            </div>
          </div>
          {!todayMood && !todayRating && (
            <div className="text-xs text-neutral-500 italic">
              {isEvening ? 'Bilan du soir ?' : 'Comment ça va ?'}
            </div>
          )}
        </div>
      </div>

      {/* Dernières réflexions */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Dernières réflexions
        </h4>
        
        {recentEntries.length === 0 ? (
          <div className="text-center py-3 text-neutral-500">
            <p className="text-sm">Aucune réflexion récente</p>
          </div>
        ) : (
          recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-600">
                  {formatDate(entry.date)}
                </span>
                {entry.day_rating && (
                  <span className="text-xs font-medium text-primary-600">
                    {entry.day_rating}/10
                  </span>
                )}
              </div>
              
              {entry.insight && (
                <p className="text-sm text-neutral-700 line-clamp-2 mb-2">
                  {entry.insight}
                </p>
              )}
              
              {entry.segments.length > 0 && (
                <p className="text-xs text-neutral-600 line-clamp-1">
                  {entry.segments[entry.segments.length - 1].note}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {entries.filter(e => e.day_rating && e.day_rating >= 7).length}
          </div>
          <div className="text-xs text-green-700">Bonnes journées</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-rose-600">
            {entries.filter(e => e.proud_of && e.proud_of.length > 0).length}
          </div>
          <div className="text-xs text-rose-700">Avec fiertés</div>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onViewChange('journal')}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
      >
        <span>{isEvening ? 'Bilan du soir' : 'Ouvrir le journal'}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}