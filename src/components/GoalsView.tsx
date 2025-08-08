import React, { useState, useEffect } from 'react';
import { Target, Star, Calendar, Clock, Sun, Eye, Plus, ChevronRight, CheckCircle2, Circle, Edit3, Trash2, Link, BarChart3 } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { useTasks } from '../hooks/useTasks';
import NewGoalModal from './NewGoalModal';

const timelines = [
  { 
    key: 'life', 
    label: 'Vision de vie', 
    icon: Eye, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    description: 'Votre vision à long terme'
  },
  { 
    key: 'yearly', 
    label: 'Objectifs annuels', 
    icon: Star, 
    color: 'text-primary-600', 
    bg: 'bg-primary-50', 
    border: 'border-primary-200',
    description: 'Les grandes étapes de cette année'
  },
  { 
    key: 'quarterly', 
    label: 'Objectifs trimestriels', 
    icon: Calendar, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    description: 'Focus du trimestre'
  },
  { 
    key: 'monthly', 
    label: 'Objectifs mensuels', 
    icon: Calendar, 
    color: 'text-mint-600', 
    bg: 'bg-mint-50', 
    border: 'border-mint-200',
    description: 'Focus du mois en cours'
  },
  { 
    key: 'weekly', 
    label: 'Objectifs hebdomadaires', 
    icon: Clock, 
    color: 'text-peach-600', 
    bg: 'bg-peach-50', 
    border: 'border-peach-200',
    description: 'Priorités de la semaine'
  },
  { 
    key: 'daily', 
    label: 'Objectifs du jour', 
    icon: Sun, 
    color: 'text-rose-600', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200',
    description: 'Actions d\'aujourd\'hui'
  }
];

const contexts = [
  { key: 'pro', label: 'Professionnel', color: 'text-blue-600' },
  { key: 'perso', label: 'Personnel', color: 'text-mint-600' },
  { key: 'hybride', label: 'Hybride', color: 'text-purple-600' }
];

const statuses = [
  { key: 'todo', label: 'À faire', color: 'text-neutral-600', bg: 'bg-neutral-50' },
  { key: 'in_progress', label: 'En cours', color: 'text-primary-600', bg: 'bg-primary-50' },
  { key: 'done', label: 'Terminé', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'abandoned', label: 'Abandonné', color: 'text-red-600', bg: 'bg-red-50' }
];

export default function GoalsView() {
  const { goals, loading, error, createGoal, updateGoal, deleteGoal, getLinkedTasks } = useGoals();
  const { tasks } = useTasks();
  const [selectedTimeline, setSelectedTimeline] = useState<string>('all');
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [linkedTasksData, setLinkedTasksData] = useState<Record<string, any[]>>({});

  // Charger les tâches liées pour chaque objectif
  useEffect(() => {
    const loadLinkedTasks = async () => {
      const tasksData: Record<string, any[]> = {};
      
      for (const goal of goals) {
        const linkedTasks = await getLinkedTasks(goal.id);
        tasksData[goal.id] = linkedTasks;
      }
      
      setLinkedTasksData(tasksData);
    };

    if (goals.length > 0) {
      loadLinkedTasks();
    }
  }, [goals, getLinkedTasks]);

  const handleNewGoal = async (goalData: any) => {
    try {
      await createGoal(goalData);
      console.log('Objectif créé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de l\'objectif:', error);
    }
  };

  const toggleGoalStatus = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newStatus = goal.status === 'done' ? 'todo' : 'done';
    const newProgress = newStatus === 'done' ? 1.0 : goal.progress;
    
    await updateGoal(goalId, { 
      status: newStatus,
      progress: newProgress
    });
  };

  const getGoalsByTimeline = (timeline: string) => {
    if (timeline === 'all') return goals;
    return goals.filter(goal => goal.timeline === timeline);
  };

  const getChildGoals = (parentId: string) => {
    return goals.filter(goal => goal.linked_to === parentId);
  };

  const getTimelineInfo = (timelineKey: string) => {
    return timelines.find(t => t.key === timelineKey) || timelines[0];
  };

  const getStatusInfo = (statusKey: string) => {
    return statuses.find(s => s.key === statusKey) || statuses[0];
  };

  const calculateProgressFromTasks = (goalId: string) => {
    const linkedTasks = linkedTasksData[goalId] || [];
    if (linkedTasks.length === 0) return 0;

    const completedTasks = linkedTasks.filter(task => task.status === 'done').length;
    return Math.round((completedTasks / linkedTasks.length) * 100);
  };

  const filteredGoals = selectedTimeline === 'all' 
    ? goals 
    : goals.filter(goal => goal.timeline === selectedTimeline);

  const renderGoalCard = (goal: any, level: number = 0) => {
    const timelineInfo = getTimelineInfo(goal.timeline);
    const statusInfo = getStatusInfo(goal.status);
    const contextInfo = contexts.find(c => c.key === goal.context);
    const childGoals = getChildGoals(goal.id);
    const linkedTasks = linkedTasksData[goal.id] || [];
    const taskProgress = calculateProgressFromTasks(goal.id);
    const displayProgress = Math.round(goal.progress * 100);
    
    return (
      <div key={goal.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-200 group ${level > 0 ? 'border-l-4' : ''}`}
             style={level > 0 ? { borderLeftColor: timelineInfo.color.replace('text-', '#') } : {}}>
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleGoalStatus(goal.id)}
              className="mt-1 flex-shrink-0"
            >
              {goal.status === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : goal.status === 'in_progress' ? (
                <Circle className="w-5 h-5 text-primary-500 fill-current" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-300 hover:text-primary-500 transition-colors" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-medium text-neutral-800 mb-1 ${goal.status === 'done' ? 'line-through opacity-60' : ''}`}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-sm text-neutral-600 mb-2">{goal.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${timelineInfo.bg} ${timelineInfo.color}`}>
                      {timelineInfo.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {contextInfo && (
                      <span className={`${contextInfo.color}`}>
                        {contextInfo.label}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                    title="Modifier l'objectif"
                  >
                    <Edit3 className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                    title="Supprimer l'objectif"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Progression */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Progression</span>
                  <span className={`font-semibold ${timelineInfo.color}`}>
                    {displayProgress}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${timelineInfo.color.replace('text-', 'bg-')}`}
                    style={{ width: `${displayProgress}%` }}
                  ></div>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <div className="flex items-center gap-4">
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        📅 {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    
                    {linkedTasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {linkedTasks.filter(t => t.status === 'done').length}/{linkedTasks.length} tâches
                      </span>
                    )}
                    
                    {childGoals.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ChevronRight className="w-4 h-4" />
                        {childGoals.length} sous-objectif{childGoals.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tâches liées */}
                {linkedTasks.length > 0 && (
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-neutral-700 mb-2 flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      Tâches liées ({linkedTasks.length})
                    </h4>
                    <div className="space-y-1">
                      {linkedTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-xs">
                          {task.status === 'done' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-neutral-300" />
                          )}
                          <span className={task.status === 'done' ? 'line-through text-neutral-500' : 'text-neutral-700'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {linkedTasks.length > 3 && (
                        <p className="text-xs text-neutral-500 mt-1">
                          +{linkedTasks.length - 3} autres tâches
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sous-objectifs */}
        {showHierarchy && childGoals.length > 0 && (
          <div className="mt-4 space-y-4">
            {childGoals.map(childGoal => renderGoalCard(childGoal, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderHierarchicalView = () => {
    const topLevelGoals = goals.filter(goal => !goal.linked_to);
    return (
      <div className="space-y-6">
        {topLevelGoals.map(goal => renderGoalCard(goal))}
      </div>
    );
  };

  const renderTimelineView = () => {
    return (
      <div className="space-y-4">
        {filteredGoals.map(goal => renderGoalCard(goal))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 font-display">Mes Objectifs</h1>
          <p className="text-neutral-600 mt-1">Connectez chaque action à votre vision</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              showHierarchy ? 'bg-primary-100 text-primary-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Target className="w-4 h-4" />
            Vue hiérarchique
          </button>
          <button 
            onClick={() => setShowNewGoalModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nouvel objectif
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {timelines.map((timeline) => {
          const timelineGoals = getGoalsByTimeline(timeline.key);
          const completedGoals = timelineGoals.filter(g => g.status === 'done').length;
          const avgProgress = timelineGoals.length > 0 
            ? Math.round(timelineGoals.reduce((sum, g) => sum + (g.progress * 100), 0) / timelineGoals.length)
            : 0;
          const Icon = timeline.icon;
          
          return (
            <button
              key={timeline.key}
              onClick={() => setSelectedTimeline(selectedTimeline === timeline.key ? 'all' : timeline.key)}
              className={`p-4 rounded-xl transition-all duration-200 border ${
                selectedTimeline === timeline.key 
                  ? `${timeline.bg} ${timeline.color} ${timeline.border} shadow-lg` 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="text-center space-y-2">
                <Icon className={`w-5 h-5 mx-auto ${selectedTimeline === timeline.key ? timeline.color : 'text-neutral-400'}`} />
                <div className="text-lg font-semibold">{avgProgress}%</div>
                <div className="text-xs leading-tight">{timeline.label}</div>
                <div className="text-xs text-neutral-500">{completedGoals}/{timelineGoals.length}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vue principale */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
          <div className="text-neutral-400 mb-4">
            <Target className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-neutral-600 mb-2">Aucun objectif créé</h3>
          <p className="text-neutral-500 mb-4">
            Commencez par définir vos premiers objectifs pour structurer votre vision !
          </p>
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="bg-gradient-to-r from-primary-500 to-rose-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Créer mon premier objectif
          </button>
        </div>
      ) : (
        showHierarchy && selectedTimeline === 'all' ? renderHierarchicalView() : renderTimelineView()
      )}

      {/* Modal nouvel objectif */}
      <NewGoalModal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onSave={handleNewGoal}
      />
    </div>
  );
}