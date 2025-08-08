import React from 'react';

interface DayStatsCardProps {
  completedTasks: number;
  totalTasks: number;
  completedGoals: number;
  totalGoals: number;
  selectedDate: string;
  compact?: boolean;
}

export default function DayStatsCard({ 
  completedTasks, 
  totalTasks, 
  completedGoals, 
  totalGoals, 
  selectedDate,
  compact = false
}: DayStatsCardProps) {
  const taskCompletionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Tâches</span>
          <span className={`${compact ? 'text-md' : 'text-lg'} font-bold text-primary-600`}>
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${taskCompletionRatio * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Objectifs</span>
          <span className={`${compact ? 'text-md' : 'text-lg'} font-bold text-green-600`}>
            {completedGoals}/{totalGoals}
          </span>
        </div>
      </div>

      <button
        onClick={() => window.location.href = `/journal?date=${selectedDate}`}
        className={`w-full bg-gradient-to-r from-primary-500 to-rose-500 text-white ${compact ? 'py-2' : 'py-3'} rounded-lg hover:shadow-lg transition-all duration-200`}
      >
        Journal du soir
      </button>
    </div>
  );
}