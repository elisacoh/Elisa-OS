import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, MapPin, Link as LinkIcon, Clock, Edit3, MoreHorizontal } from 'lucide-react';
import EditTaskModal from '../EditTaskModal';
import NewEventModal from '../NewEventModal';

interface TimelineViewProps {
  tasks: any[];
  events: any[];
  selectedDate: string;
  isToday: boolean;
  onToggleTask: (taskId: string, isRecurring?: boolean, targetDate?: string) => void;
  onUpdateTask?: (taskId: string, updates: any) => void;
  onUpdateEvent?: (eventId: string, updates: any) => void;
  isRecurringInstanceCompleted: (taskId: string) => boolean;
  expanded?: boolean;
  height?: string;
}

export default function TimelineView({ 
  tasks, 
  events, 
  selectedDate, 
  isToday, 
  onToggleTask,
  onUpdateTask,
  onUpdateEvent,
  isRecurringInstanceCompleted,
  expanded = false,
  height = "400px"
}: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showTaskActions, setShowTaskActions] = useState<string | null>(null);
  const [showEventActions, setShowEventActions] = useState<string | null>(null);

  // Generate timeline hours (6h to 23h)
  const timelineHours = Array.from({ length: 18 }, (_, i) => i + 6);

  const getItemsForHour = (hour: number) => {
    const items: Array<{ type: 'task' | 'event'; data: any; isRecurring?: boolean }> = [];
    
    // Add tasks for this hour
    tasks.forEach(task => {
      if (task.time_planned) {
        const taskHour = parseInt(task.time_planned.split(':')[0]);
        if (taskHour === hour) {
          // Déterminer si c'est une tâche récurrente affichée pour cette date
          const isRecurring = task.is_recurring && (!task.date_planned || task.date_planned !== selectedDate);
          items.push({ type: 'task', data: task, isRecurring });
        }
      }
    });

    // Add events for this hour
    events.forEach(event => {
      const eventHour = new Date(event.start_date_time).getHours();
      if (eventHour === hour) {
        items.push({ type: 'event', data: event });
      }
    });

    return items;
  };

  const formatTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTaskTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const handleEditTask = async (taskData: any) => {
    if (onUpdateTask && editingTask) {
      await onUpdateTask(editingTask.id, taskData);
      setEditingTask(null);
    }
  };

  const handleEditEvent = async (eventData: any) => {
    if (onUpdateEvent && editingEvent) {
      await onUpdateEvent(editingEvent.id, eventData);
      setEditingEvent(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: height }}>
        {timelineHours.map(hour => {
          const items = getItemsForHour(hour);
          const isCurrentHour = isToday && new Date().getHours() === hour;
          
          return (
            <div key={hour} className={`flex gap-3 ${isCurrentHour ? 'bg-primary-50 -mx-4 px-4 py-2 rounded-lg border-l-4 border-primary-400' : ''}`}>
              <div className={`w-16 text-sm font-medium flex-shrink-0 ${isCurrentHour ? 'text-primary-600' : 'text-neutral-500'}`}>
                {hour.toString().padStart(2, '0')}:00
                {isCurrentHour && (
                  <div className="text-xs text-primary-500 font-normal">Now</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                {items.length === 0 ? (
                  <div className="text-neutral-400 text-sm italic py-1">Libre</div>
                ) : (
                  items.map((item, index) => {
                    const isRecurringCompleted = item.isRecurring && isRecurringInstanceCompleted(item.data.id);
                    const itemKey = `${item.data.id}-${item.type}-${index}`;
                    
                    return (
                      <div key={itemKey} className={`group relative p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm ${
                        item.type === 'task' 
                          ? item.isRecurring 
                            ? 'bg-mint-50 border-mint-400' 
                            : 'bg-blue-50 border-blue-400'
                          : 'bg-green-50 border-green-400'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {item.type === 'task' ? (
                              <button 
                                onClick={() => onToggleTask(item.data.id, item.isRecurring, selectedDate)}
                                className="mt-0.5"
                              >
                                {item.data.status === 'done' || isRecurringCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-neutral-300 hover:text-blue-500 transition-colors" />
                                )}
                              </button>
                            ) : (
                              <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${
                                  item.data.status === 'done' || isRecurringCompleted ? 'line-through opacity-60' : ''
                                }`}>
                                  {item.data.title}
                                </span>
                                {item.isRecurring && (
                                  <span className="px-2 py-0.5 text-xs bg-mint-100 text-mint-600 rounded-full">
                                    Récurrent
                                  </span>
                                )}
                                {isRecurringCompleted && (
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded-full">
                                    ✓ Fait
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {item.type === 'task' && item.data.time_planned && 
                                      formatTaskTime(item.data.time_planned)
                                    }
                                    {item.type === 'event' && formatTime(item.data.start_date_time)}
                                  </span>
                                </div>
                                
                                {item.type === 'task' && item.data.duration_estimate && (
                                  <span>⏱️ {formatDuration(item.data.duration_estimate)}</span>
                                )}
                                
                                {item.type === 'event' && item.data.duration && (
                                  <span>⏱️ {formatDuration(item.data.duration)}</span>
                                )}
                                
                                {item.type === 'event' && item.data.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-20">{item.data.location}</span>
                                  </div>
                                )}

                                {item.type === 'event' && item.data.link && (
                                  <div className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    <span className="text-blue-600">Lien</span>
                                  </div>
                                )}
                              </div>

                              {/* Description pour les événements */}
                              {item.type === 'event' && item.data.description && (
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                  {item.data.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions menu */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (item.type === 'task') {
                                  setShowTaskActions(showTaskActions === itemKey ? null : itemKey);
                                  setShowEventActions(null);
                                } else {
                                  setShowEventActions(showEventActions === itemKey ? null : itemKey);
                                  setShowTaskActions(null);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all duration-200"
                            >
                              <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                            </button>

                            {/* Task actions dropdown */}
                            {item.type === 'task' && showTaskActions === itemKey && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-32">
                                <button
                                  onClick={() => {
                                    setEditingTask(item.data);
                                    setShowTaskActions(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Modifier
                                </button>
                              </div>
                            )}

                            {/* Event actions dropdown */}
                            {item.type === 'event' && showEventActions === itemKey && (
                              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-32">
                                <button
                                  onClick={() => {
                                    setEditingEvent(item.data);
                                    setShowEventActions(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Modifier
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Résumé compact */}
      <div className="border-t border-neutral-200 pt-3">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>{tasks.length + events.length} éléments</span>
          <span>
            {tasks.filter(t => t.time_planned).length} tâches avec heure • {events.length} événements
          </span>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showTaskActions || showEventActions) && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowTaskActions(null);
            setShowEventActions(null);
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <NewEventModal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleEditEvent}
          existingEvent={editingEvent}
        />
      )}
    </div>
  );
}