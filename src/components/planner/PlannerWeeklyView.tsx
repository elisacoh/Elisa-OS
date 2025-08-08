import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, CheckCircle2, Circle, RotateCcw, Edit3, MoreHorizontal } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useEvents } from '../../hooks/useEvents';
import NewTaskModal from '../NewTaskModal';
import NewEventModal from '../NewEventModal';
import EditTaskModal from '../EditTaskModal';

interface PlannerWeeklyViewProps {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
}

const weekDays = [
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche' },
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi' },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi' },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi' },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi' },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi' },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi' }
];

export default function PlannerWeeklyView({ selectedWeek, onWeekChange }: PlannerWeeklyViewProps) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTaskForDay, setNewTaskForDay] = useState<string | null>(null);
  const [newEventForDay, setNewEventForDay] = useState<string | null>(null);
  const [showTaskActions, setShowTaskActions] = useState<string | null>(null);

  const { tasks, createTask, updateTask, toggleTaskStatus, getTasksForDate, isRecurringInstanceCompletedToday } = useTasks();
  const { events, createEvent, getEventsForRange } = useEvents();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    onWeekChange(newWeek);
  };

  const getWeekDates = (weekStart: Date) => {
    const dates = [];
    const start = new Date(weekStart);
    // Ensure we start on Sunday
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  const weekEvents = getEventsForRange(weekStartStr, weekEndStr);

  const formatTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTaskTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const moveTaskToDay = async (taskId: string, newDate: string) => {
    await updateTask(taskId, { date_planned: newDate });
  };

  const handleNewTask = async (taskData: any) => {
    const targetDate = newTaskForDay || new Date().toISOString().split('T')[0];
    await createTask({ ...taskData, date_planned: targetDate });
    setNewTaskForDay(null);
  };

  const handleNewEvent = async (eventData: any) => {
    await createEvent(eventData);
    setNewEventForDay(null);
  };

  const handleEditTask = async (taskData: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header hebdomadaire */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            
            <div className="text-center">
              <h1 className="text-lg md:text-2xl font-bold text-neutral-800 font-display">
                Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h1>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <input
              type="week"
              value={`${selectedWeek.getFullYear()}-W${Math.ceil((selectedWeek.getTime() - new Date(selectedWeek.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`}
              onChange={(e) => {
                const [year, week] = e.target.value.split('-W');
                const firstDay = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                onWeekChange(firstDay);
              }}
              className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Vue en colonnes - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          
          // Utiliser la nouvelle fonction pour obtenir toutes les tâches du jour
          const dayTasks = getTasksForDate(dateStr);
          
          const dayEvents = weekEvents.filter(event => {
            const eventDate = new Date(event.start_date_time).toISOString().split('T')[0];
            return eventDate === dateStr;
          });
          
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          
          return (
            <div
              key={dateStr}
              className={`bg-white rounded-2xl p-3 md:p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${
                isToday ? 'border-primary-200 bg-primary-50/30' : 'border-neutral-100'
              }`}
            >
              {/* Header du jour */}
              <div className="text-center mb-4">
                <div className={`text-sm font-medium ${isToday ? 'text-primary-600' : 'text-neutral-600'}`}>
                  {weekDays[index].label}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-primary-800' : 'text-neutral-800'}`}>
                  {date.getDate()}
                </div>
                {isToday && (
                  <div className="text-xs text-primary-600 font-medium">Aujourd'hui</div>
                )}
              </div>

              {/* Mood du jour */}
              <div className="mb-4">
                <div className="text-center">
                  <span className="text-2xl">😊</span>
                </div>
              </div>

              {/* Tâches du jour */}
              <div className="space-y-2 mb-4">
                {/* Tâches régulières */}
                {dayTasks.regular.map(task => (
                  <div
                    key={task.id}
                    className="group relative p-2 rounded-lg border-l-4 cursor-move bg-blue-50 border-blue-400"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: task.id }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleTaskStatus(task.id, false, dateStr)}>
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-neutral-300 hover:text-blue-500 transition-colors" />
                        )}
                      </button>
                      <span className={`text-xs font-medium flex-1 ${
                        task.status === 'done' ? 'line-through opacity-60' : ''
                      }`}>
                        {task.title}
                      </span>
                      
                      {/* Task actions */}
                      <button
                        onClick={() => setShowTaskActions(showTaskActions === `${task.id}-${dateStr}` ? null : `${task.id}-${dateStr}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all duration-200"
                      >
                        <MoreHorizontal className="w-3 h-3 text-neutral-500" />
                      </button>
                    </div>
                    
                    {task.time_planned && (
                      <div className="text-xs text-neutral-500 mt-1">
                        {formatTaskTime(task.time_planned)}
                      </div>
                    )}

                    {/* Task actions dropdown */}
                    {showTaskActions === `${task.id}-${dateStr}` && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-24">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskActions(null);
                          }}
                          className="w-full text-left px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-1"
                        >
                          <Edit3 className="w-2 h-2" />
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tâches récurrentes */}
                {dayTasks.recurring.map(task => {
                  const isRecurringCompleted = isRecurringInstanceCompletedToday(task.id, dateStr);
                  
                  return (
                    <div
                      key={`${task.id}-recurring`}
                      className="group relative p-2 rounded-lg border-l-4 bg-mint-50 border-mint-400"
                    >
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleTaskStatus(task.id, true, dateStr)}>
                          {isRecurringCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-neutral-300 hover:text-mint-500 transition-colors" />
                          )}
                        </button>
                        <span className={`text-xs font-medium flex-1 ${
                          isRecurringCompleted ? 'line-through opacity-60' : ''
                        }`}>
                          {task.title}
                        </span>
                        <RotateCcw className="w-3 h-3 text-mint-500" />
                        {isRecurringCompleted && (
                          <span className="text-xs text-green-600">✓</span>
                        )}

                        {/* Task actions */}
                        <button
                          onClick={() => setShowTaskActions(showTaskActions === `${task.id}-recurring-${dateStr}` ? null : `${task.id}-recurring-${dateStr}`)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all duration-200"
                        >
                          <MoreHorizontal className="w-3 h-3 text-neutral-500" />
                        </button>
                      </div>
                      
                      {task.time_planned && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {formatTaskTime(task.time_planned)}
                        </div>
                      )}

                      {/* Task actions dropdown */}
                      {showTaskActions === `${task.id}-recurring-${dateStr}` && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-24">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskActions(null);
                            }}
                            className="w-full text-left px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-1"
                          >
                            <Edit3 className="w-2 h-2" />
                            Modifier
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Événements du jour */}
              <div className="space-y-2 mb-4">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-2 bg-green-50 rounded-lg border-l-4 border-green-400"
                  >
                    <div className="text-xs font-medium">{event.title}</div>
                    <div className="text-xs text-neutral-500">
                      {formatTime(event.start_date_time)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone de drop */}
              <div
                className="border-2 border-dashed border-neutral-200 rounded-lg p-2 text-center text-xs text-neutral-400 hover:border-primary-300 hover:text-primary-600 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.type === 'task') {
                    moveTaskToDay(data.id, dateStr);
                  }
                }}
              >
                Glisser ici
              </div>

              {/* Actions du jour */}
              <div className="flex gap-1 mt-3">
                <button
                  onClick={() => {
                    setNewTaskForDay(dateStr);
                    setShowNewTaskModal(true);
                  }}
                  className="flex-1 p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                  title="Créer une tâche"
                >
                  <Plus className="w-3 h-3 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    setNewEventForDay(dateStr);
                    setShowNewEventModal(true);
                  }}
                  className="flex-1 p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Créer un événement"
                >
                  <Calendar className="w-3 h-3 mx-auto" />
                </button>
              </div>

              {/* Notes facultatives - Masquées sur mobile */}
              <div className="mt-3 hidden md:block">
                <textarea
                  placeholder="Notes..."
                  rows={2}
                  className="w-full text-xs px-2 py-1 border border-neutral-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Click outside to close dropdowns */}
      {showTaskActions && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowTaskActions(null)}
        />
      )}

      {/* Modals pour la vue hebdomadaire */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => {
          setShowNewTaskModal(false);
          setNewTaskForDay(null);
        }}
        onSave={handleNewTask}
      />

      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => {
          setShowNewEventModal(false);
          setNewEventForDay(null);
        }}
        onSave={handleNewEvent}
        defaultDate={newEventForDay || undefined}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
        />
      )}
    </div>
  );
}