import React, { useState } from 'react';
import { Droplets, Dumbbell, Scale, Target } from 'lucide-react';

const habits = [
  { 
    icon: Droplets, 
    label: 'Eau', 
    current: 6, 
    target: 8, 
    unit: 'verres',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    progress: 'bg-blue-400'
  },
  { 
    icon: Dumbbell, 
    label: 'Sport', 
    current: 3, 
    target: 5, 
    unit: 'sessions',
    color: 'text-mint-600',
    bg: 'bg-mint-50',
    progress: 'bg-mint-400'
  },
  { 
    icon: Scale, 
    label: 'Poids', 
    current: 65, 
    target: 63, 
    unit: 'kg',
    color: 'text-peach-600',
    bg: 'bg-peach-50',
    progress: 'bg-peach-400'
  },
  { 
    icon: Target, 
    label: 'Discipline', 
    current: 85, 
    target: 100, 
    unit: '%',
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    progress: 'bg-primary-400'
  },
];

export default function HabitsTracker() {
  const [habits_state, setHabitsState] = useState(habits);

  const updateHabit = (index: number, increment: boolean) => {
    setHabitsState(prev => prev.map((habit, i) => {
      if (i === index) {
        const newCurrent = increment 
          ? Math.min(habit.current + 1, habit.target)
          : Math.max(habit.current - 1, 0);
        return { ...habit, current: newCurrent };
      }
      return habit;
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <h3 className="text-lg font-semibold text-neutral-800 mb-6">Suivi quotidien</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {habits_state.map((habit, index) => {
          const Icon = habit.icon;
          const progress = (habit.current / habit.target) * 100;
          
          return (
            <div key={index} className={`${habit.bg} rounded-xl p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${habit.color}`} />
                  <span className="font-medium text-neutral-800 text-sm">{habit.label}</span>
                </div>
                <span className="text-xs text-neutral-600">
                  {habit.current}/{habit.target} {habit.unit}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${habit.progress}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => updateHabit(index, false)}
                    className="flex-1 py-1 px-2 text-xs bg-white/50 rounded-md hover:bg-white/80 transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateHabit(index, true)}
                    className="flex-1 py-1 px-2 text-xs bg-white/50 rounded-md hover:bg-white/80 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}