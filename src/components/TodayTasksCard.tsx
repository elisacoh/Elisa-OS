import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, ArrowRight, Clock, Battery, RotateCcw } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import NewTaskModal from './NewTaskModal';

interface TodayTasksCardProps {
  onViewChange: (view: string) => void;
}

export default function TodayTasksCard({ onViewChange }: TodayTasksCardProps) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const { tasks, createTask, toggleTaskStatus, getTasksForDate, isRecurringInstanceCompletedToday } = useTasks();
  
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = getTasksForDate(today);
  
  // Limiter à 4 tâches pour le dashboard
  const displayTasks = [...todayTasks.regular, ...todayTasks.recurring].slice(0, 4);
  
  const completedCount = todayTasks.regular.filter(t => t.status === 'done').length +
    todayTasks.recurring.filter(t => isRecurringInstanceCompletedToday(t.id, today)).length;
  
  const totalCount = todayTasks.all.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleNewTask = async (taskData: any) => {
    await createTask({ ...taskData, date_planned: today });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getEnergyIcon = (level?: string) => {
    switch (level) {
      case 'low': return '🔋';
      case 'medium': return '🔋🔋';
      case 'high': return '🔋🔋🔋';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Tâches d'aujourd'hui</h3>
          <p className="text-sm text-neutral-600">
            {completedCount}/{totalCount} terminées ({completionPercentage}%)
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
          title="Nouvelle tâche"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-rose-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-3 mb-4">
        {displayTasks.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            <p className="text-sm">Aucune tâche planifiée</p>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1"
            >
              Créer votre première tâche
            </button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const isRecurring = task.is_recurring && (!task.date_planned || task.date_planned !== today);
            const isCompleted = isRecurring 
              ? isRecurringInstanceCompletedToday(task.id, today)
              : task.status === 'done';

            return (
              <div
                key={`${task.id}-${isRecurring ? 'recurring' : 'regular'}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  isRecurring ? 'bg-mint-50 border border-mint-200' : 'bg-neutral-50 border border-neutral-200'
                }`}
              >
                <button
                  onClick={() => toggleTaskStatus(task.id, isRecurring, today)}
                  className="flex-shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 hover:text-primary-500 transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${
                      isCompleted ? 'line-through opacity-60' : ''
                    }`}>
                      {task.title}
                    </span>
                    {isRecurring && (
                      <RotateCcw className="w-3 h-3 text-mint-500 flex-shrink-0" />
                    )}
                    {isCompleted && isRecurring && (
                      <span className="text-xs text-green-600 flex-shrink-0">✓</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                    {task.time_planned && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(task.time_planned)}</span>
                      </div>
                    )}
                    {task.energy_level && (
                      <span>{getEnergyIcon(task.energy_level)}</span>
                    )}
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {task.priority === 'high' ? 'H' : task.priority === 'medium' ? 'M' : 'L'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewChange('tasks')}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          <span>Voir toutes</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => onViewChange('planner')}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
        >
          <span>Planner</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Modal nouvelle tâche */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSave={handleNewTask}
        defaultDate={today}
      />
    </div>
  );
}