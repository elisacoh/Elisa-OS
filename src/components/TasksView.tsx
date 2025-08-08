import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Clock, Battery, Briefcase, Home, Zap, Calendar, ChevronRight, Circle, CheckCircle2, AlertCircle, RotateCcw, Target, Edit3, Link, ExternalLink } from 'lucide-react';
import NewTaskModal from './NewTaskModal';
import EditTaskModal from './EditTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useGoals } from '../hooks/useGoals';

const categories = [
  { key: 'dev', label: 'Développement', color: 'text-blue-600', bg: 'bg-blue-50', icon: '💻' },
  { key: 'formations', label: 'Formations', color: 'text-purple-600', bg: 'bg-purple-50', icon: '📚' },
  { key: 'corps', label: 'Corps', color: 'text-mint-600', bg: 'bg-mint-50', icon: '💪' },
  { key: 'mental', label: 'Mental', color: 'text-primary-600', bg: 'bg-primary-50', icon: '🧠' },
  { key: 'vision', label: 'Vision', color: 'text-rose-600', bg: 'bg-rose-50', icon: '🎯' },
  { key: 'admin', label: 'Administratif', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '📋' },
  { key: 'reset', label: 'Reset', color: 'text-peach-600', bg: 'bg-peach-50', icon: '🔄' },
  { key: 'autre', label: 'Autre', color: 'text-neutral-600', bg: 'bg-neutral-50', icon: '📝' }
];

const contexts = [
  { key: 'pro', label: 'Professionnel', icon: Briefcase, color: 'text-blue-600' },
  { key: 'perso', label: 'Personnel', icon: Home, color: 'text-mint-600' },
  { key: 'hybride', label: 'Hybride', icon: Zap, color: 'text-purple-600' }
];

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

export default function TasksView() {
  const { tasks, loading, error, createTask, updateTask, toggleTaskStatus, getTasksForDate, isRecurringInstanceCompletedToday } = useTasks();
  const { goals } = useGoals();
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    context: 'all',
    priority: 'all',
    energyLevel: 'all',
    status: 'active', // active, done, all
    goalLinked: 'all' // Nouveau filtre pour les objectifs
  });

  const today = new Date().toISOString().split('T')[0];
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);

  const getTasksByTimeframe = (timeframe: 'today' | 'week' | 'month' | 'all') => {
    if (timeframe === 'all') {
      return tasks;
    }
    
    if (timeframe === 'today') {
      const todayTasks = getTasksForDate(today);
      return todayTasks.all;
    }
    
    // Pour week et month, on filtre les tâches régulières + on ajoute les récurrentes qui matchent
    const regularTasks = tasks.filter(task => {
      if (!task.date_planned) return false;
      const taskDate = new Date(task.date_planned);
      
      switch (timeframe) {
        case 'week':
          return taskDate >= weekStart && taskDate <= weekEnd;
        case 'month':
          const taskMonth = taskDate.getMonth();
          const taskYear = taskDate.getFullYear();
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          return taskMonth === currentMonth && taskYear === currentYear;
        default:
          return false;
      }
    });

    return regularTasks;
  };

  const applyFilters = (taskList: any[]) => {
    return taskList.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category !== 'all' && task.category !== filters.category) return false;
      if (filters.context !== 'all' && task.context !== filters.context) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.energyLevel !== 'all' && task.energy_level !== filters.energyLevel) return false;
      if (filters.goalLinked !== 'all' && task.goal_linked !== filters.goalLinked) return false;
      if (filters.status === 'active' && (task.status === 'done' || task.status === 'cancelled')) return false;
      if (filters.status === 'done' && task.status !== 'done') return false;
      return true;
    });
  };

  const handleNewTask = async (taskData: any) => {
    try {
      await createTask(taskData);
      console.log('Tâche créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error);
    }
  };

  const handleEditTask = async (taskData: any) => {
    try {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
      console.log('Tâche modifiée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error);
    }
  };

  const getFilteredTasks = () => {
    const timeframeTasks = getTasksByTimeframe(activeTab);
    return applyFilters(timeframeTasks);
  };

  const getCategoryInfo = (categoryKey: string) => {
    return categories.find(cat => cat.key === categoryKey) || categories[categories.length - 1];
  };

  const getPriorityInfo = (priorityKey: string) => {
    return priorities.find(p => p.key === priorityKey) || priorities[0];
  };

  const getEnergyInfo = (energyKey: string) => {
    return energyLevels.find(e => e.key === energyKey) || energyLevels[0];
  };

  const getLinkedGoal = (goalId: string) => {
    return goals.find(goal => goal.id === goalId);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getTabCounts = () => {
    return {
      today: getTasksForDate(today).all.filter(t => {
        // Pour les tâches récurrentes dans "aujourd'hui", vérifier si elles ont été complétées
        if (t.is_recurring && !t.date_planned) {
          return !isRecurringInstanceCompletedToday(t.id, today);
        }
        return t.status !== 'done' && t.status !== 'cancelled';
      }).length,
      week: getTasksByTimeframe('week').filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
      month: getTasksByTimeframe('month').filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
      all: tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length
    };
  };

  const tabCounts = getTabCounts();
  const filteredTasks = getFilteredTasks();

  // Séparer les tâches régulières et récurrentes pour l'affichage "aujourd'hui"
  const regularTasks = activeTab === 'today' 
    ? filteredTasks.filter(task => task.date_planned === today)
    : filteredTasks.filter(task => !task.is_recurring || activeTab === 'all');
  
  const recurringTasks = activeTab === 'today' 
    ? filteredTasks.filter(task => 
        task.is_recurring && (!task.date_planned || task.date_planned !== today)
      )
    : activeTab === 'all' 
      ? filteredTasks.filter(task => task.is_recurring)
      : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-700 underline"
        >
          Recharger la page
        </button>
      </div>
    );
  }

  const renderTaskCard = (task: any, isRecurring = false) => {
    const categoryInfo = getCategoryInfo(task.category);
    const priorityInfo = getPriorityInfo(task.priority);
    const energyInfo = task.energy_level ? getEnergyInfo(task.energy_level) : null;
    const contextInfo = contexts.find(c => c.key === task.context);
    const linkedGoal = task.goal_linked ? getLinkedGoal(task.goal_linked) : null;
    
    // Pour les tâches récurrentes dans "aujourd'hui", vérifier si elles ont été complétées
    const isRecurringCompleted = isRecurring && isRecurringInstanceCompletedToday(task.id, today);
    
    return (
      <div
        key={`${task.id}-${isRecurring ? 'recurring' : 'regular'}`}
        className={`bg-white rounded-2xl p-4 md:p-6 shadow-sm border transition-all duration-200 hover:shadow-md group ${
          task.status === 'done' || isRecurringCompleted ? 'border-green-200 bg-green-50/30' : 
          task.status === 'in_progress' ? 'border-primary-200 bg-primary-50/30' :
          isRecurring ? 'border-mint-200 bg-mint-50/20' :
          'border-neutral-100'
        }`}
      >
        <div className="flex items-start gap-3 md:gap-4">
          <button
            onClick={() => toggleTaskStatus(task.id, isRecurring, today)}
            className="mt-1 flex-shrink-0"
          >
            {task.status === 'done' || isRecurringCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : task.status === 'in_progress' ? (
              <Circle className="w-5 h-5 text-primary-500 fill-current" />
            ) : (
              <Circle className="w-5 h-5 text-neutral-300 hover:text-primary-500 transition-colors" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-medium text-neutral-800 ${task.status === 'done' || isRecurringCompleted ? 'line-through opacity-60' : ''}`}>
                    {task.title}
                  </h3>
                  {isRecurring && (
                    <span className="px-2 py-1 text-xs bg-mint-100 text-mint-600 rounded-full">
                      Récurrent
                    </span>
                  )}
                  {isRecurringCompleted && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                      ✓ Fait aujourd'hui
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-neutral-600 mt-1">{task.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingTask(task)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded transition-all duration-200"
                  title="Modifier la tâche"
                >
                  <Edit3 className="w-4 h-4 text-neutral-500" />
                </button>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.bg} ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              </div>
            </div>

            {/* Objectif lié */}
            {linkedGoal && (
              <div className="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-center gap-2 text-sm">
                  <Link className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700 font-medium">Contribue à :</span>
                  <span className="text-primary-800">{linkedGoal.title}</span>
                  <button 
                    className="ml-auto p-1 hover:bg-primary-100 rounded transition-colors"
                    title="Voir l'objectif"
                  >
                    <ExternalLink className="w-3 h-3 text-primary-600" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-neutral-500">
              {task.date_planned && !isRecurring && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(task.date_planned).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              
              {task.time_planned && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(task.time_planned)}</span>
                </div>
              )}
              
              {task.duration_estimate && (
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{formatDuration(task.duration_estimate)}</span>
                </div>
              )}
              
              {energyInfo && (
                <div className="flex items-center gap-1">
                  <span>{energyInfo.icon}</span>
                  <span className={energyInfo.color}>{energyInfo.label}</span>
                </div>
              )}
              
              {contextInfo && (
                <div className="flex items-center gap-1">
                  <contextInfo.icon className={`w-4 h-4 ${contextInfo.color}`} />
                  <span>{contextInfo.label}</span>
                </div>
              )}
              
              {task.reschedule_count > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reporté {task.reschedule_count}x</span>
                </div>
              )}
              
              {task.is_recurring && !isRecurring && (
                <div className="flex items-center gap-1 text-mint-600">
                  <RotateCcw className="w-4 h-4" />
                  <span>Récurrent ({task.recurrence_rule})</span>
                </div>
              )}
            </div>
            
            {task.is_auto_rescheduled && (
              <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                <span>Automatiquement reporté par le système</span>
              </div>
            )}
            
            <div className="mt-2 text-xs text-neutral-400">
              Créée le {new Date(task.created_at).toLocaleDateString('fr-FR')} à {new Date(task.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 font-display">Mes Tâches</h1>
          <p className="text-neutral-600 mt-1">
            Organisez intelligemment selon votre énergie et vos priorités
            {tasks.length > 0 && (
              <span className="ml-2 text-primary-600 font-medium">
                ({tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              showFilters ? 'bg-primary-100 text-primary-600' : 'bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-neutral-100 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Contexte</label>
              <select
                value={filters.context}
                onChange={(e) => setFilters(prev => ({ ...prev, context: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                {contexts.map(ctx => (
                  <option key={ctx.key} value={ctx.key}>{ctx.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Priorité</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                {priorities.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Énergie</label>
              <select
                value={filters.energyLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, energyLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tous niveaux</option>
                {energyLevels.map(e => (
                  <option key={e.key} value={e.key}>{e.icon} {e.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="active">Actives</option>
                <option value="done">Terminées</option>
                <option value="all">Toutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Onglets temporels */}
      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto">
        {[
          { key: 'today', label: 'Aujourd\'hui', count: tabCounts.today },
          { key: 'week', label: 'Cette semaine', count: tabCounts.week },
          { key: 'month', label: 'Ce mois', count: tabCounts.month },
          { key: 'all', label: 'Toutes', count: tabCounts.all }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-primary-600 shadow-sm font-medium'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            <span className="text-sm md:text-base">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des tâches */}
      <div className="space-y-4 md:space-y-6">
        {/* Tâches régulières */}
        {regularTasks.length === 0 && recurringTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
            <div className="text-neutral-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-600 mb-2">
              {tasks.length === 0 ? 'Aucune tâche créée' : 'Aucune tâche trouvée'}
            </h3>
            <p className="text-neutral-500 px-4">
              {tasks.length === 0 ? (
                <>Créez votre première tâche pour commencer à organiser votre journée !</>
              ) : (
                <>
                  {activeTab === 'today' && 'Aucune tâche planifiée pour aujourd\'hui'}
                  {activeTab === 'week' && 'Aucune tâche planifiée cette semaine'}
                  {activeTab === 'month' && 'Aucune tâche planifiée ce mois'}
                  {activeTab === 'all' && 'Aucune tâche ne correspond aux filtres sélectionnés'}
                </>
              )}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="mt-4 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Créer ma première tâche
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tâches planifiées */}
            {regularTasks.length > 0 && (
              <div className="space-y-4">
                {(activeTab === 'today' || activeTab === 'all') && (
                  <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    {activeTab === 'today' ? 'Tâches planifiées' : 'Tâches'} ({regularTasks.length})
                  </h3>
                )}
                {regularTasks
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    if (a.priority !== b.priority) {
                      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
                    }
                    if (a.time_planned && b.time_planned) {
                      return a.time_planned.localeCompare(b.time_planned);
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((task) => renderTaskCard(task, false))
                }
              </div>
            )}

            {/* Tâches récurrentes */}
            {recurringTasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-mint-500" />
                  Tâches récurrentes ({recurringTasks.length})
                </h3>
                {recurringTasks
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    if (a.priority !== b.priority) {
                      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
                    }
                    if (a.time_planned && b.time_planned) {
                      return a.time_planned.localeCompare(b.time_planned);
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((task) => renderTaskCard(task, true))
                }
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nouvelle tâche */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSave={handleNewTask}
      />

      {/* Modal modification tâche */}
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