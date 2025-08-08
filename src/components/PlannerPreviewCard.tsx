import React from 'react';
import { Calendar, Clock, ArrowRight, MapPin } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useTasks } from '../hooks/useTasks';

interface PlannerPreviewCardProps {
  onViewChange: (view: string) => void;
}

export default function PlannerPreviewCard({ onViewChange }: PlannerPreviewCardProps) {
  const { events, getEventsForDate } = useEvents();
  const { getTasksForDate } = useTasks();
  
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = getEventsForDate(today);
  const todayTasks = getTasksForDate(today);
  
  // Prochains événements (aujourd'hui + demain)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowEvents = getEventsForDate(tomorrowStr);
  
  const upcomingEvents = [...todayEvents, ...tomorrowEvents]
    .sort((a, b) => new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime())
    .slice(0, 3);

  const formatTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  };

  const totalItemsToday = todayEvents.length + todayTasks.all.length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Planning</h3>
          <p className="text-sm text-neutral-600">
            {totalItemsToday} élément{totalItemsToday > 1 ? 's' : ''} aujourd'hui
          </p>
        </div>
        <Calendar className="w-5 h-5 text-primary-500" />
      </div>

      {/* Prochains événements */}
      <div className="space-y-3 mb-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm">Aucun événement prévu</p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{event.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(event.start_date_time)}</span>
                  </div>
                  <span>{formatDate(event.start_date_time)}</span>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-20">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-primary-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-primary-600">{todayEvents.length}</div>
          <div className="text-xs text-primary-700">Événements</div>
        </div>
        <div className="bg-mint-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-mint-600">{todayTasks.all.length}</div>
          <div className="text-xs text-mint-700">Tâches</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewChange('planner')}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
        >
          <span>Ouvrir le planner</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}