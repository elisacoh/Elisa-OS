import React from 'react';
import { CheckCircle2, Circle, RotateCcw, ArrowDown, Clock, Battery } from 'lucide-react';

interface TaskListViewProps {
  regularTasks: any[];
  recurringTasks: any[];
  selectedDate: string;
  onToggleTask: (taskId: string, isRecurring?: boolean, targetDate?: string) => void;
  onPostponeTask: (taskId: string) => void;
  isRecurringInstanceCompleted: (taskId: string) => boolean;
  compact?: boolean;
  showHeader?: boolean;
}

const priorities = [
  { key: 'low', label: 'Basse', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'medium', label: 'Moyenne', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'high', label: 'Haute', color: 'text-red-600', bg: 'bg-red-50' }
];

const energyLevels = [
  { key: 'low', label: 'Faible', icon: '🔋', color: 'text-green-500' },
  { key: 'medium', label: 'Moyenne', icon: '🔋🔋', color: 'text-yellow-500' },
  { key: 'high', label: 'Élevée', icon: '🔋🔋🔋', color: 'text-red-500' }
];

export default function TaskListView({ 
  regularTasks, 
  recurringTasks, 
  selectedDate,
  onToggleTask, 
  onPostponeTask,
  isRecurringInstanceCompleted,
  compact = false,
  showHeader = true
}: TaskListViewProps) {
  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getPriorityInfo = (priorityKey: string) => {
    return priorities.find(p => p.key === priorityKey) || priorities[1];
  };

  const getEnergyInfo = (energyKey: string) => {
    return energyLevels.find(e => e.key === energyKey);
  };

  const renderTaskSection = (tasks: any[], title: string, isRecurring = false) => {
    if (tasks.length === 0) return null;

    // Separate completed and pending tasks
    const completedTasks = tasks.filter(task => 
      isRecurring 
        ? isRecurringInstanceCompleted(task.id)
        : task.status === 'done'
    );
    const pendingTasks = tasks.filter(task => 
      isRecurring 
        ? !isRecurringInstanceCompleted(task.id)
        : task.status !== 'done'
    );

    // Sort pending tasks by time, then by priority
    const sortedPendingTasks = pendingTasks.sort((a, b) => {
      // First sort by time if both have time
      if (a.time_planned && b.time_planned) {
        return a.time_planned.localeCompare(b.time_planned);
      }
      // Tasks with time come first
      if (a.time_planned && !b.time_planned) return -1;
      if (!a.time_planned && b.time_planned) return 1;
      
      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });

    return (
      <div className="space-y-2">
        {showHeader && (
          <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-neutral-700 flex items-center gap-2`}>
            {isRecurring && <RotateCcw className="w-3 h-3 text-mint-500" />}
            {title} ({pendingTasks.length + completedTasks.length})
          </h4>
        )}
        
        {/* Pending tasks first */}
        {sortedPendingTasks.map(task => {
          const priorityInfo = getPriorityInfo(task.priority);
          const energyInfo = task.energy_level ? getEnergyInfo(task.energy_level) : null;
          
          return (
            <div key={`${task.id}-pending`} className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
              isRecurring ? 'bg-mint-50 border border-mint-200' : 'bg-neutral-50 border border-neutral-200'
            }`}>
              <button 
                onClick={() => onToggleTask(task.id, isRecurring, selectedDate)}
                className="mt-0.5"
              >
                <Circle className="w-3 h-3 text-neutral-300 hover:text-primary-500 transition-colors" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-medium truncate`}>
                    {task.title}
                  </h4>
                  {isRecurring && (
                    <span className="px-1 py-0.5 text-xs bg-mint-100 text-mint-600 rounded flex-shrink-0">
                      R
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  {task.time_planned && (
                    <div className="flex items-center gap-1 px-1 py-0.5 bg-blue-100 text-blue-600 rounded">
                      <Clock className="w-2 h-2" />
                      <span>{formatTime(task.time_planned)}</span>
                    </div>
                  )}
                  
                  <span className={`px-1 py-0.5 rounded text-xs ${priorityInfo.bg} ${priorityInfo.color}`}>
                    {priorityInfo.key.charAt(0).toUpperCase()}
                  </span>
                  
                  {energyInfo && (
                    <span className={`text-xs ${energyInfo.color}`}>
                      {energyInfo.icon}
                    </span>
                  )}
                </div>
              </div>
              
              {!isRecurring && !compact && (
                <button
                  onClick={() => onPostponeTask(task.id)}
                  className="text-xs text-orange-600 hover:text-orange-700 px-1 py-0.5 bg-orange-50 rounded transition-colors flex-shrink-0"
                  title="Reporter"
                >
                  →
                </button>
              )}
            </div>
          );
        })}

        {/* Separator if there are completed tasks */}
        {completedTasks.length > 0 && pendingTasks.length > 0 && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <ArrowDown className="w-2 h-2 text-neutral-400" />
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>
        )}

        {/* Completed tasks at the bottom */}
        {completedTasks.map(task => {
          return (
            <div key={`${task.id}-completed`} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg opacity-75 border border-green-200">
              <button 
                onClick={() => onToggleTask(task.id, isRecurring, selectedDate)}
                className="mt-0.5"
              >
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-medium line-through opacity-60 truncate`}>
                    {task.title}
                  </h4>
                  {isRecurring && (
                    <span className="px-1 py-0.5 text-xs bg-green-100 text-green-600 rounded flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                
                {task.time_planned && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="w-2 h-2" />
                    <span>{formatTime(task.time_planned)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTaskSection(regularTasks, 'Planifiées', false)}
      {renderTaskSection(recurringTasks, 'Récurrentes', true)}
      
      {regularTasks.length === 0 && recurringTasks.length === 0 && (
        <div className="text-center py-4 text-neutral-500">
          <p className={compact ? 'text-xs' : 'text-sm'}>Aucune tâche</p>
        </div>
      )}
    </div>
  );
}