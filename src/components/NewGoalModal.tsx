import React, { useState } from 'react';
import { X, Calendar, Target, Briefcase, Home, Zap, Plus, Trash2 } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import CategorySelector from './CategorySelector';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: any) => void;
}

const contexts = [
  { key: 'pro', label: 'Professionnel', icon: Briefcase },
  { key: 'perso', label: 'Personnel', icon: Home },
  { key: 'hybride', label: 'Hybride', icon: Zap }
];

const timelines = [
  { key: 'life', label: 'Vision de vie', color: 'text-purple-600' },
  { key: 'yearly', label: 'Annuel', color: 'text-primary-600' },
  { key: 'quarterly', label: 'Trimestriel', color: 'text-blue-600' },
  { key: 'monthly', label: 'Mensuel', color: 'text-mint-600' },
  { key: 'weekly', label: 'Hebdomadaire', color: 'text-peach-600' },
  { key: 'daily', label: 'Quotidien', color: 'text-rose-600' }
];

export default function NewGoalModal({ isOpen, onClose, onSave }: NewGoalModalProps) {
  const { goals } = useGoals();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    context: 'perso' as const,
    timeline: 'monthly' as const,
    deadline: '',
    linkedTo: '',
    progress: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const goalData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category || 'Vision',
      context: formData.context,
      timeline: formData.timeline,
      status: 'todo' as const,
      deadline: formData.deadline || null,
      progress: formData.progress / 100,
      linked_to: formData.linkedTo || null
    };

    try {
      await onSave(goalData);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de l\'objectif:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      context: 'perso',
      timeline: 'monthly',
      deadline: '',
      linkedTo: '',
      progress: 0
    });
    onClose();
  };

  const setQuickDeadline = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData(prev => ({ ...prev, deadline: date.toISOString().split('T')[0] }));
  };

  // Filtrer les objectifs pour les parents possibles (éviter les boucles)
  const possibleParents = goals.filter(goal => 
    goal.timeline !== 'daily' && // Les objectifs quotidiens ne peuvent pas être parents
    goal.id !== formData.linkedTo // Éviter l'auto-référence
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">Nouvel objectif</h2>
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
                  Titre de l'objectif *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Perdre 5kg ce trimestre"
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
                  placeholder="Détails sur cet objectif..."
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Catégorie avec sélecteur centralisé */}
            <CategorySelector
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              type="general"
              label="Catégorie"
              placeholder="Sélectionner une catégorie"
            />

            {/* Contexte et Timeline */}
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Échéance
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {timelines.map(timeline => (
                    <option key={timeline.key} value={timeline.key}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date limite */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Date limite (optionnelle)
              </label>
              <div className="space-y-3">
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(7)}
                    className="px-3 py-1 text-xs bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    Dans 1 semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(30)}
                    className="px-3 py-1 text-xs bg-mint-100 text-mint-600 rounded-lg hover:bg-mint-200 transition-colors"
                  >
                    Dans 1 mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(90)}
                    className="px-3 py-1 text-xs bg-peach-100 text-peach-600 rounded-lg hover:bg-peach-200 transition-colors"
                  >
                    Dans 3 mois
                  </button>
                </div>
              </div>
            </div>

            {/* Objectif parent */}
            {possibleParents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Lié à un objectif parent (optionnel)
                </label>
                <select
                  value={formData.linkedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedTo: e.target.value }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Aucun objectif parent</option>
                  {possibleParents.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} ({timelines.find(t => t.key === goal.timeline)?.label})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  Connectez cet objectif à un objectif plus large
                </p>
              </div>
            )}

            {/* Progression initiale */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Progression initiale
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>0%</span>
                  <span className="font-medium text-primary-600">{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">💡 Conseils</h4>
              <ul className="text-xs text-neutral-600 space-y-1">
                <li>• Formulez des objectifs SMART (Spécifiques, Mesurables, Atteignables)</li>
                <li>• Liez vos objectifs quotidiens/hebdomadaires à des objectifs plus larges</li>
                <li>• Utilisez les catégories pour organiser vos différents domaines de vie</li>
                <li>• Définissez des dates limites réalistes pour maintenir la motivation</li>
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
              disabled={!formData.title.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Target className="w-4 h-4" />
              <span>Créer l'objectif</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}