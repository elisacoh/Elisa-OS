import React from 'react';
import { Target, ArrowRight, TrendingUp } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';

interface GoalsProgressCardProps {
  onViewChange: (view: string) => void;
}

export default function GoalsProgressCard({ onViewChange }: GoalsProgressCardProps) {
  const { goals } = useGoals();
  
  // Objectifs actifs par timeline
  const activeGoals = goals.filter(goal => goal.status !== 'done' && goal.status !== 'abandoned');
  
  const goalsByTimeline = {
    daily: activeGoals.filter(g => g.timeline === 'daily'),
    weekly: activeGoals.filter(g => g.timeline === 'weekly'),
    monthly: activeGoals.filter(g => g.timeline === 'monthly'),
    quarterly: activeGoals.filter(g => g.timeline === 'quarterly'),
    yearly: activeGoals.filter(g => g.timeline === 'yearly')
  };

  // Objectifs prioritaires (avec deadline proche ou en cours)
  const priorityGoals = activeGoals
    .filter(goal => {
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0; // Deadline dans les 7 prochains jours
      }
      return goal.status === 'in_progress';
    })
    .sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return (b.progress || 0) - (a.progress || 0);
    })
    .slice(0, 3);

  const totalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length * 100)
    : 0;

  const completedGoals = goals.filter(g => g.status === 'done').length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800">Objectifs</h3>
          <p className="text-sm text-neutral-600">
            {activeGoals.length} actifs • {completedGoals} terminés
          </p>
        </div>
        <Target className="w-5 h-5 text-primary-500" />
      </div>

      {/* Progression globale */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Progression moyenne</span>
          <span className="text-lg font-bold text-primary-600">{totalProgress}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-rose-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Objectifs prioritaires */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          Prioritaires
        </h4>
        
        {priorityGoals.length === 0 ? (
          <div className="text-center py-3 text-neutral-500">
            <p className="text-sm">Aucun objectif urgent</p>
          </div>
        ) : (
          priorityGoals.map((goal) => (
            <div
              key={goal.id}
              className="p-3 bg-primary-50 rounded-lg border border-primary-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-800 truncate">
                  {goal.title}
                </span>
                <span className="text-xs text-primary-600 font-medium">
                  {Math.round((goal.progress || 0) * 100)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span className="capitalize">{goal.timeline}</span>
                {goal.deadline && (
                  <span>
                    {new Date(goal.deadline).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                )}
              </div>
              
              <div className="w-full bg-white rounded-full h-1 mt-2">
                <div 
                  className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(goal.progress || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Répartition par timeline */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-rose-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-rose-600">{goalsByTimeline.daily.length}</div>
          <div className="text-xs text-rose-700">Quotidiens</div>
        </div>
        <div className="bg-mint-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-mint-600">{goalsByTimeline.weekly.length}</div>
          <div className="text-xs text-mint-700">Hebdo</div>
        </div>
        <div className="bg-primary-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-primary-600">{goalsByTimeline.monthly.length}</div>
          <div className="text-xs text-primary-700">Mensuels</div>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onViewChange('goals')}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg transition-colors"
      >
        <span>Gérer mes objectifs</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}