import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Link as LinkIcon, Target } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import CategorySelector from './CategorySelector';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  defaultDate?: string;
  existingEvent?: any; // Pour l'édition
}

const contexts = [
  { key: 'pro', label: 'Professionnel' },
  { key: 'perso', label: 'Personnel' },
  { key: 'hybride', label: 'Hybride' }
];

export default function NewEventModal({ isOpen, onClose, onSave, defaultDate, existingEvent }: NewEventModalProps) {
  const { goals } = useGoals();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: defaultDate || new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    duration: '',
    category: '',
    context: 'perso' as const,
    goalLinked: '',
    location: '',
    link: '',
    isRecurring: false,
    recurrenceRule: ''
  });

  // Initialize form with existing event data for editing
  useEffect(() => {
    if (existingEvent) {
      const startDateTime = new Date(existingEvent.start_date_time);
      const endDateTime = existingEvent.end_date_time ? new Date(existingEvent.end_date_time) : null;
      
      setFormData({
        title: existingEvent.title || '',
        description: existingEvent.description || '',
        startDate: startDateTime.toISOString().split('T')[0],
        startTime: startDateTime.toTimeString().slice(0, 5),
        endTime: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '',
        duration: existingEvent.duration?.toString() || '',
        category: existingEvent.category || '',
        context: existingEvent.context || 'perso',
        goalLinked: existingEvent.goal_linked || '',
        location: existingEvent.location || '',
        link: existingEvent.link || '',
        isRecurring: existingEvent.is_recurring || false,
        recurrenceRule: existingEvent.recurrence_rule || ''
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        startDate: defaultDate || new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        duration: '',
        category: '',
        context: 'perso',
        goalLinked: '',
        location: '',
        link: '',
        isRecurring: false,
        recurrenceRule: ''
      });
    }
  }, [existingEvent, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.startDate || !formData.startTime) return;

    // Construct start datetime
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    
    // Construct end datetime if provided
    let endDateTime = null;
    if (formData.endTime) {
      endDateTime = new Date(`${formData.startDate}T${formData.endTime}`).toISOString();
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      duration: formData.duration ? parseInt(formData.duration) : null,
      category: formData.category || 'Autre',
      context: formData.context,
      goal_linked: formData.goalLinked || null,
      location: formData.location.trim() || null,
      link: formData.link.trim() || null,
      is_recurring: formData.isRecurring,
      recurrence_rule: formData.isRecurring ? formData.recurrenceRule : null
    };

    try {
      await onSave(eventData);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: defaultDate || new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      duration: '',
      category: '',
      context: 'perso',
      goalLinked: '',
      location: '',
      link: '',
      isRecurring: false,
      recurrenceRule: ''
    });
    onClose();
  };

  const setQuickTime = (time: string) => {
    setFormData(prev => ({ ...prev, startTime: time }));
  };

  if (!isOpen) return null;

  const isEditing = !!existingEvent;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">
            {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Séance de sport, Réunion équipe..."
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
            </div>

            {/* Date et heure */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <div className="flex gap-1 mt-2">
                    {['09:00', '14:00', '18:00'].map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setQuickTime(time)}
                        className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200 transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {!formData.endTime && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Durée estimée (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Ex: 60"
                    min="5"
                    step="5"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Catégorie et contexte */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Lieu et lien */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Lieu
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Salle de sport, Bureau..."
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Lien
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="Ex: https://zoom.us/..."
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Objectif lié */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Objectif lié (optionnel)
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
            </div>

            {/* Récurrence */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isRecurring: e.target.checked,
                    recurrenceRule: e.target.checked ? prev.recurrenceRule : ''
                  }))}
                  className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-neutral-700">
                  Événement récurrent
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Fréquence
                  </label>
                  <select
                    value={formData.recurrenceRule}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceRule: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="FREQ=DAILY">Quotidien</option>
                    <option value="FREQ=WEEKLY">Hebdomadaire</option>
                    <option value="FREQ=MONTHLY">Mensuel</option>
                  </select>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">💡 Conseils</h4>
              <ul className="text-xs text-neutral-600 space-y-1">
                <li>• Ajoutez un lieu pour les événements physiques</li>
                <li>• Utilisez le lien pour les réunions en ligne</li>
                <li>• Liez à un objectif pour suivre votre progression</li>
                <li>• La récurrence est utile pour les habitudes régulières</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.startDate || !formData.startTime}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              <span>{isEditing ? 'Modifier' : 'Créer'} l'événement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}