import React, { useState } from 'react';
import { X, Calendar, Clock, Battery, Target, RotateCcw, Briefcase, Home, Zap } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import CategorySelector from './CategorySelector';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  defaultDate?: string;
}

const contexts = [
  { key: 'pro', label: 'Professionnel', icon: Briefcase },
  { key: 'perso', label: 'Personnel', icon: Home },
  { key: 'hybride', label: 'Hybride', icon: Zap }
];

const priorities = [
  { key: 'low', label: 'Basse', color: 'text-green-600' },
  { key: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
  { key: 'high', label: 'Haute', color: 'text-red-600' }
];

const energyLevels = [
  { key: 'low', label: 'Faible', icon: '🔋' },
  { key: 'medium', label: 'Moyenne', icon: '🔋🔋' },
  { key: 'high', label: 'Élevée', icon: '🔋🔋🔋' }
];

const recurrenceOptions = [
  { key: '', label: 'Aucune' },
  { key: 'daily', label: 'Quotidienne' },
  { key: 'weekly', label: 'Hebdomadaire' },
  { key: 'monthly', label: 'Mensuelle' },
  { key: 'yearly', label: 'Annuelle' },
  { key: 'custom', label: 'Personnalisée (sélectionner les jours)' }
];

const weekDays = [
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi' },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi' },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi' },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi' },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi' },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi' },
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche' }
];

export default function NewTaskModal({ isOpen, onClose, onSave, defaultDate }: NewTaskModalProps) {
  const { goals } = useGoals();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    context: 'perso' as const,
    priority: 'medium' as const,
    datePlanned: defaultDate || '',
    timePlanned: '',
    durationEstimate: '',
    energyLevel: '' as const,
    goalLinked: '',
    isRecurring: false,
    recurrenceRule: '',
    selectedDays: [] as string[]
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'planning' | 'advanced'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category || 'Autre',
      context: formData.context,
      priority: formData.priority,
      status: 'todo' as const,
      date_planned: formData.datePlanned || null,
      time_planned: formData.timePlanned || null,
      duration_estimate: formData.durationEstimate ? parseInt(formData.durationEstimate) : null,
      energy_level: formData.energyLevel || null,
      reschedule_count: 0,
      is_auto_rescheduled: false,
      goal_linked: formData.goalLinked || null,
      is_recurring: formData.isRecurring,
      recurrence_rule: formData.isRecurring ? formData.recurrenceRule : null,
      recurrence_days: formData.isRecurring && formData.recurrenceRule === 'custom' 
        ? formData.selectedDays 
        : null
    };

    try {
      await onSave(taskData);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      context: 'perso',
      priority: 'medium',
      datePlanned: defaultDate || '',
      timePlanned: '',
      durationEstimate: '',
      energyLevel: '',
      goalLinked: '',
      isRecurring: false,
      recurrenceRule: '',
      selectedDays: []
    });
    setActiveTab('basic');
    onClose();
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData(prev => ({ ...prev, datePlanned: date.toISOString().split('T')[0] }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-200">
          <h2 className="text-lg md:text-xl font-semibold text-neutral-800">Nouvelle tâche</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 overflow-x-auto">
          {[
            { key: 'basic', label: 'Essentiel', icon: '📝' },
            { key: 'planning', label: 'Planning', icon: '📅' },
            { key: 'advanced', label: 'Avancé', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-3 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                  : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Onglet Essentiel */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Titre de la tâche *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Finaliser la présentation client"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Détails supplémentaires..."
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CategorySelector
                    value={formData.category}
                    onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    type="general"
                    label="Catégorie"
                    placeholder="Sélectionner une catégorie"
                  />

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Contexte
                    </label>
                    <select
                      value={formData.context}
                      onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {contexts.map(ctx => (
                        <option key={ctx.key} value={ctx.key}>
                          {ctx.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priorité
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {priorities.map(priority => (
                      <button
                        key={priority.key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: priority.key as any }))}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.priority === priority.key
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className={`font-medium ${priority.color}`}>{priority.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Planification */}
            {activeTab === 'planning' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date prévue
                  </label>
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={formData.datePlanned}
                      onChange={(e) => setFormData(prev => ({ ...prev, datePlanned: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className="px-3 py-1 text-xs bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        Aujourd'hui
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className="px-3 py-1 text-xs bg-mint-100 text-mint-600 rounded-lg hover:bg-mint-200 transition-colors"
                      >
                        Demain
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(7)}
                        className="px-3 py-1 text-xs bg-peach-100 text-peach-600 rounded-lg hover:bg-peach-200 transition-colors"
                      >
                        Dans 1 semaine
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Heure prévue
                    </label>
                    <input
                      type="time"
                      value={formData.timePlanned}
                      onChange={(e) => setFormData(prev => ({ ...prev, timePlanned: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Durée estimée (min)
                    </label>
                    <input
                      type="number"
                      value={formData.durationEstimate}
                      onChange={(e) => setFormData(prev => ({ ...prev, durationEstimate: e.target.value }))}
                      placeholder="Ex: 60"
                      min="5"
                      step="5"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Niveau d'énergie requis
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, energyLevel: '' }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        formData.energyLevel === ''
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-sm">Non défini</span>
                    </button>
                    {energyLevels.map(energy => (
                      <button
                        key={energy.key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, energyLevel: energy.key as any }))}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.energyLevel === energy.key
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{energy.icon}</div>
                          <div className="text-xs">{energy.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Avancé */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Objectif lié
                  </label>
                  <select
                    value={formData.goalLinked}
                    onChange={(e) => setFormData(prev => ({ ...prev, goalLinked: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Aucun objectif lié</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} ({goal.timeline})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Connectez cette tâche à un objectif existant pour suivre votre progression
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        isRecurring: e.target.checked,
                        recurrenceRule: e.target.checked ? prev.recurrenceRule : '',
                        selectedDays: e.target.checked ? prev.selectedDays : []
                      }))}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-neutral-700">
                      Tâche récurrente
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Fréquence de récurrence
                        </label>
                        <select
                          value={formData.recurrenceRule}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            recurrenceRule: e.target.value,
                            selectedDays: e.target.value === 'custom' ? prev.selectedDays : []
                          }))}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {recurrenceOptions.slice(1).map(option => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.recurrenceRule === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Sélectionner les jours
                          </label>
                          <div className="grid grid-cols-7 gap-2">
                            {weekDays.map(day => (
                              <button
                                key={day.key}
                                type="button"
                                onClick={() => toggleDay(day.key)}
                                className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                                  formData.selectedDays.includes(day.key)
                                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                                }`}
                              >
                                <div className="text-xs font-medium">{day.label}</div>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">
                            {formData.selectedDays.length > 0 
                              ? `Sélectionné: ${formData.selectedDays.map(d => weekDays.find(wd => wd.key === d)?.fullLabel).join(', ')}`
                              : 'Aucun jour sélectionné'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">💡 Conseils</h4>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li>• Utilisez des titres clairs et actionables</li>
                    <li>• Estimez la durée pour mieux planifier votre journée</li>
                    <li>• Le niveau d'énergie vous aide à choisir le bon moment</li>
                    <li>• Liez vos tâches aux objectifs pour rester motivée</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 border-t border-neutral-200 bg-neutral-50 gap-3 md:gap-0">
            <button
              type="button"
              onClick={handleClose}
              className="w-full md:w-auto px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors order-2 md:order-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 md:order-2"
            >
              <span>Créer la tâche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}