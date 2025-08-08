import React from 'react';
import { Plus, Calendar, BookOpen, Heart, Target, Zap } from 'lucide-react';

const quickActions = [
  { icon: Plus, label: 'Nouvelle tâche', color: 'text-primary-600', bg: 'bg-primary-50', enabled: true, view: 'tasks' },
  { icon: Calendar, label: 'Planner', color: 'text-mint-600', bg: 'bg-mint-50', enabled: true, view: 'planner' },
  { icon: BookOpen, label: 'Journal', color: 'text-peach-600', bg: 'bg-peach-50', enabled: true, view: 'journal' },
  { icon: Heart, label: 'Corps', color: 'text-rose-600', bg: 'bg-rose-50', enabled: false, view: 'body' },
  { icon: Target, label: 'Objectifs', color: 'text-yellow-600', bg: 'bg-yellow-50', enabled: true, view: 'goals' },
  { icon: Zap, label: 'Mental', color: 'text-purple-600', bg: 'bg-purple-50', enabled: false, view: 'mind' },
];

interface QuickAccessProps {
  onViewChange?: (view: string) => void;
}

export default function QuickAccess({ onViewChange }: QuickAccessProps) {
  const handleActionClick = (action: typeof quickActions[0]) => {
    if (!action.enabled) return;
    
    if (onViewChange) {
      onViewChange(action.view);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Accès rapide</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              disabled={!action.enabled}
              className={`${action.bg} p-4 rounded-xl transition-all duration-200 group ${
                action.enabled 
                  ? 'hover:scale-105 hover:shadow-md cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed blur-sm'
              }`}
            >
              <Icon className={`w-6 h-6 ${action.color} mx-auto mb-2 ${
                action.enabled ? 'group-hover:scale-110 transition-transform' : ''
              }`} />
              <span className="text-xs font-medium text-neutral-700 block">{action.label}</span>
              {!action.enabled && (
                <div className="text-xs text-neutral-500 mt-1">Bientôt</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}