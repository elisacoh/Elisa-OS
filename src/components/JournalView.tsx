import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Archive, Plus, Heart, Target, Lightbulb, TrendingUp, Calendar, Clock, Sun, Moon, Edit3, Save, X } from 'lucide-react';
import { useJournal, JournalSegment } from '../hooks/useJournal';
import { useGoals } from '../hooks/useGoals';
import { useTasks } from '../hooks/useTasks';

const moods = [
  { emoji: '😊', label: 'Joyeux' },
  { emoji: '😌', label: 'Paisible' },
  { emoji: '😴', label: 'Fatigué' },
  { emoji: '🤔', label: 'Pensif' },
  { emoji: '😤', label: 'Déterminé' },
  { emoji: '😔', label: 'Mélancolique' },
  { emoji: '🤗', label: 'Reconnaissant' },
  { emoji: '😰', label: 'Stressé' },
  { emoji: '🥳', label: 'Enthousiaste' },
  { emoji: '😐', label: 'Neutre' }
];

const dayTags = [
  { key: 'productive', label: 'Productive', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'off', label: 'Off', color: 'text-gray-600', bg: 'bg-gray-50' },
  { key: 'chaotique', label: 'Chaotique', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'fluide', label: 'Fluide', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'révélateur', label: 'Révélateur', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'épuisante', label: 'Épuisante', color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'inspirante', label: 'Inspirante', color: 'text-primary-600', bg: 'bg-primary-50' }
];

export default function JournalView() {
  const { currentEntry, loading, error, setCurrentEntryForDate, updateEntry, addSegment, updateMood, searchEntries } = useJournal();
  const { goals } = useGoals();
  const { tasks } = useTasks();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    minRating: '',
    dayTag: '',
    mood: ''
  });
  
  // États pour l'édition
  const [editingSegment, setEditingSegment] = useState<{ timeOfDay: 'morning' | 'afternoon' | 'evening'; text: string } | null>(null);
  const [newSegmentText, setNewSegmentText] = useState('');
  const [editingGoals, setEditingGoals] = useState(false);
  const [selectedGoalsToday, setSelectedGoalsToday] = useState<string[]>([]);
  const [editingReflection, setEditingReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({
    proudOf: [] as string[],
    wantToImprove: [] as string[],
    insight: '',
    efficiencyRating: 3,
    dayRating: 7,
    dayTag: '',
    isAtPeace: false
  });

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  const isMorning = currentHour >= 6 && currentHour < 12;

  // Charger l'entrée pour la date sélectionnée
  useEffect(() => {
    setCurrentEntryForDate(selectedDate);
  }, [selectedDate, setCurrentEntryForDate]);

  // Synchroniser les données avec l'entrée actuelle
  useEffect(() => {
    if (currentEntry) {
      setSelectedGoalsToday(currentEntry.goals_today || []);
      setReflectionData({
        proudOf: currentEntry.proud_of || [],
        wantToImprove: currentEntry.want_to_improve || [],
        insight: currentEntry.insight || '',
        efficiencyRating: currentEntry.efficiency_rating || 3,
        dayRating: currentEntry.day_rating || 7,
        dayTag: currentEntry.day_tag || '',
        isAtPeace: currentEntry.is_at_peace || false
      });
    }
  }, [currentEntry]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleMoodUpdate = async (timeOfDay: 'morning' | 'evening', mood: string, level: number) => {
    try {
      await updateMood(selectedDate, timeOfDay, mood, level);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mood:', error);
    }
  };

  const handleAddSegment = async (timeOfDay: 'morning' | 'afternoon' | 'evening') => {
    if (!newSegmentText.trim()) return;
    
    try {
      await addSegment(selectedDate, {
        timeOfDay,
        note: newSegmentText.trim()
      });
      setNewSegmentText('');
      setEditingSegment(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du segment:', error);
    }
  };

  const handleUpdateGoals = async () => {
    try {
      await updateEntry(selectedDate, { goals_today: selectedGoalsToday });
      setEditingGoals(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des objectifs:', error);
    }
  };

  const handleUpdateReflection = async () => {
    try {
      await updateEntry(selectedDate, {
        proud_of: reflectionData.proudOf,
        want_to_improve: reflectionData.wantToImprove,
        insight: reflectionData.insight,
        efficiency_rating: reflectionData.efficiencyRating,
        day_rating: reflectionData.dayRating,
        day_tag: reflectionData.dayTag || null,
        is_at_peace: reflectionData.isAtPeace
      });
      setEditingReflection(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réflexion:', error);
    }
  };

  const addReflectionItem = (type: 'proudOf' | 'wantToImprove', item: string) => {
    if (!item.trim()) return;
    setReflectionData(prev => ({
      ...prev,
      [type]: [...prev[type], item.trim()]
    }));
  };

  const removeReflectionItem = (type: 'proudOf' | 'wantToImprove', index: number) => {
    setReflectionData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getSegmentsByTimeOfDay = (timeOfDay: 'morning' | 'afternoon' | 'evening') => {
    return currentEntry?.segments?.filter(s => s.timeOfDay === timeOfDay) || [];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement du journal...</p>
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

  if (showHistory) {
    return (
      <div className="space-y-6">
        {/* Header historique */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 font-display">Historique du Journal</h1>
            <p className="text-neutral-600 mt-1">Explorez vos réflexions passées</p>
          </div>
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-2 bg-white text-neutral-600 px-4 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>

        {/* Filtres de recherche */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Mots-clés..."
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Note minimale</label>
              <select
                value={searchFilters.minRating}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minRating: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Toutes</option>
                {[8, 7, 6, 5].map(rating => (
                  <option key={rating} value={rating}>{rating}+ / 10</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">État de la journée</label>
              <select
                value={searchFilters.dayTag}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dayTag: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                {dayTags.map(tag => (
                  <option key={tag.key} value={tag.key}>{tag.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Mood</label>
              <select
                value={searchFilters.mood}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, mood: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                {moods.map(mood => (
                  <option key={mood.emoji} value={mood.emoji}>{mood.emoji} {mood.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Résultats de recherche */}
        <div className="space-y-4">
          {searchEntries(searchFilters).map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  {formatDate(entry.date)}
                </h3>
                <div className="flex items-center gap-2">
                  {entry.day_rating && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                      {entry.day_rating}/10
                    </span>
                  )}
                  {entry.day_tag && (
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      dayTags.find(t => t.key === entry.day_tag)?.bg
                    } ${dayTags.find(t => t.key === entry.day_tag)?.color}`}>
                      {dayTags.find(t => t.key === entry.day_tag)?.label}
                    </span>
                  )}
                </div>
              </div>
              
              {entry.segments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">Réflexions</h4>
                  <div className="space-y-2">
                    {entry.segments.slice(0, 2).map((segment, index) => (
                      <p key={index} className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                        {segment.note}
                      </p>
                    ))}
                    {entry.segments.length > 2 && (
                      <p className="text-xs text-neutral-500">+{entry.segments.length - 2} autres réflexions</p>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setSelectedDate(entry.date);
                  setShowHistory(false);
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
              >
                Voir cette journée →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-neutral-800 font-display">
                {formatDate(selectedDate)}
              </h1>
              {isToday && (
                <span className="text-sm text-primary-600 font-medium">Aujourd'hui</span>
              )}
            </div>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 bg-neutral-100 text-neutral-600 px-4 py-2 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              <Archive className="w-4 h-4" />
              Historique
            </button>
            
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="flex items-center gap-2 bg-primary-100 text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-200 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc Matin */}
          {(isMorning || currentEntry?.mood_morning || currentEntry?.segments?.some(s => s.timeOfDay === 'morning')) && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Matin</h2>
              </div>
              
              {/* Mood du matin */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Comment te sens-tu ce matin ?</h3>
                <div className="flex flex-wrap gap-2">
                  {moods.map(mood => (
                    <button
                      key={mood.emoji}
                      onClick={() => handleMoodUpdate('morning', mood.emoji, currentEntry?.mood_morning_level || 3)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentEntry?.mood_morning === mood.emoji
                          ? 'bg-yellow-200 scale-110 shadow-md'
                          : 'bg-white hover:bg-yellow-100'
                      }`}
                      title={mood.label}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
                
                {currentEntry?.mood_morning && (
                  <div className="mt-3">
                    <label className="block text-xs text-neutral-600 mb-1">Intensité</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={currentEntry.mood_morning_level || 3}
                      onChange={(e) => handleMoodUpdate('morning', currentEntry.mood_morning!, Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>Faible</span>
                      <span>Intense</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Segments du matin */}
              <div className="space-y-3">
                {getSegmentsByTimeOfDay('morning').map((segment, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <p className="text-neutral-700">{segment.note}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(segment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                
                {editingSegment?.timeOfDay === 'morning' ? (
                  <div className="bg-white rounded-lg p-3 space-y-3">
                    <textarea
                      value={newSegmentText}
                      onChange={(e) => setNewSegmentText(e.target.value)}
                      placeholder="Quelle est ton intention pour aujourd'hui ?"
                      rows={3}
                      className="w-full border border-neutral-200 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddSegment('morning')}
                        className="flex items-center gap-1 bg-primary-500 text-white px-3 py-1 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                      >
                        <Save className="w-3 h-3" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingSegment(null)}
                        className="flex items-center gap-1 bg-neutral-200 text-neutral-600 px-3 py-1 rounded-lg hover:bg-neutral-300 transition-colors text-sm"
                      >
                        <X className="w-3 h-3" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSegment({ timeOfDay: 'morning', text: '' })}
                    className="w-full p-3 border-2 border-dashed border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une réflexion matinale
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bloc Objectifs du jour */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Objectifs du jour</h2>
              </div>
              <button
                onClick={() => setEditingGoals(!editingGoals)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            {editingGoals ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {goals.filter(g => g.timeline === 'daily' || g.timeline === 'weekly').map(goal => (
                    <label key={goal.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedGoalsToday.includes(goal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoalsToday(prev => [...prev, goal.id]);
                          } else {
                            setSelectedGoalsToday(prev => prev.filter(id => id !== goal.id));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-neutral-700">{goal.title}</span>
                      <span className="text-xs text-neutral-500">({goal.timeline})</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateGoals}
                    className="flex items-center gap-1 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingGoals(false)}
                    className="flex items-center gap-1 bg-neutral-200 text-neutral-600 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedGoalsToday.length === 0 ? (
                  <p className="text-neutral-500 italic">Aucun objectif sélectionné pour aujourd'hui</p>
                ) : (
                  selectedGoalsToday.map(goalId => {
                    const goal = goals.find(g => g.id === goalId);
                    if (!goal) return null;
                    
                    return (
                      <div key={goalId} className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                        <div className="w-4 h-4 border-2 border-primary-300 rounded"></div>
                        <span className="text-neutral-700">{goal.title}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Bloc Soir */}
          {(isEvening || currentEntry?.mood_evening || currentEntry?.segments?.some(s => s.timeOfDay === 'evening')) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Soir</h2>
              </div>
              
              {/* Mood du soir */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Comment s'est passée ta journée ?</h3>
                <div className="flex flex-wrap gap-2">
                  {moods.map(mood => (
                    <button
                      key={mood.emoji}
                      onClick={() => handleMoodUpdate('evening', mood.emoji, currentEntry?.mood_evening_level || 3)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentEntry?.mood_evening === mood.emoji
                          ? 'bg-indigo-200 scale-110 shadow-md'
                          : 'bg-white hover:bg-indigo-100'
                      }`}
                      title={mood.label}
                    >
                      <span className="text-lg">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
                
                {currentEntry?.mood_evening && (
                  <div className="mt-3">
                    <label className="block text-xs text-neutral-600 mb-1">Intensité</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={currentEntry.mood_evening_level || 3}
                      onChange={(e) => handleMoodUpdate('evening', currentEntry.mood_evening!, Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>Faible</span>
                      <span>Intense</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Segments du soir */}
              <div className="space-y-3">
                {getSegmentsByTimeOfDay('evening').map((segment, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <p className="text-neutral-700">{segment.note}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(segment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                
                {editingSegment?.timeOfDay === 'evening' ? (
                  <div className="bg-white rounded-lg p-3 space-y-3">
                    <textarea
                      value={newSegmentText}
                      onChange={(e) => setNewSegmentText(e.target.value)}
                      placeholder="Décharge mentale, réflexions sur la journée..."
                      rows={3}
                      className="w-full border border-neutral-200 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddSegment('evening')}
                        className="flex items-center gap-1 bg-primary-500 text-white px-3 py-1 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                      >
                        <Save className="w-3 h-3" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingSegment(null)}
                        className="flex items-center gap-1 bg-neutral-200 text-neutral-600 px-3 py-1 rounded-lg hover:bg-neutral-300 transition-colors text-sm"
                      >
                        <X className="w-3 h-3" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSegment({ timeOfDay: 'evening', text: '' })}
                    className="w-full p-3 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une réflexion du soir
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Résumé de la journée */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-neutral-800">Résumé</h3>
              </div>
              <button
                onClick={() => setEditingReflection(!editingReflection)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            {editingReflection ? (
              <div className="space-y-4">
                {/* Note de la journée */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Note de la journée: {reflectionData.dayRating}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reflectionData.dayRating}
                    onChange={(e) => setReflectionData(prev => ({ ...prev, dayRating: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                {/* Efficacité */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Efficacité: {reflectionData.efficiencyRating}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reflectionData.efficiencyRating}
                    onChange={(e) => setReflectionData(prev => ({ ...prev, efficiencyRating: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                {/* Tag de la journée */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">État de la journée</label>
                  <select
                    value={reflectionData.dayTag}
                    onChange={(e) => setReflectionData(prev => ({ ...prev, dayTag: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    {dayTags.map(tag => (
                      <option key={tag.key} value={tag.key}>{tag.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Insight */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Insight ou leçon</label>
                  <textarea
                    value={reflectionData.insight}
                    onChange={(e) => setReflectionData(prev => ({ ...prev, insight: e.target.value }))}
                    placeholder="Une réalisation, une leçon apprise..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <button
                  onClick={handleUpdateReflection}
                  className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentEntry?.day_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Note de la journée</span>
                    <span className="font-semibold text-primary-600">{currentEntry.day_rating}/10</span>
                  </div>
                )}
                
                {currentEntry?.efficiency_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Efficacité</span>
                    <span className="font-semibold text-mint-600">{currentEntry.efficiency_rating}/5</span>
                  </div>
                )}
                
                {currentEntry?.day_tag && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">État</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dayTags.find(t => t.key === currentEntry.day_tag)?.bg
                    } ${dayTags.find(t => t.key === currentEntry.day_tag)?.color}`}>
                      {dayTags.find(t => t.key === currentEntry.day_tag)?.label}
                    </span>
                  </div>
                )}
                
                {currentEntry?.insight && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Insight
                    </h4>
                    <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                      {currentEntry.insight}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fiertés et améliorations */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Réflexions
            </h3>
            
            <div className="space-y-4">
              {/* Fiertés */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">De quoi suis-je fière ?</h4>
                <div className="space-y-2">
                  {reflectionData.proudOf.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                      <span className="text-sm text-green-700 flex-1">{item}</span>
                      {editingReflection && (
                        <button
                          onClick={() => removeReflectionItem('proudOf', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {editingReflection && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter une fierté..."
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addReflectionItem('proudOf', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Améliorations */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Ce que j'aimerais améliorer</h4>
                <div className="space-y-2">
                  {reflectionData.wantToImprove.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                      <span className="text-sm text-orange-700 flex-1">{item}</span>
                      {editingReflection && (
                        <button
                          onClick={() => removeReflectionItem('wantToImprove', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {editingReflection && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter une amélioration..."
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addReflectionItem('wantToImprove', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accès rapide */}
          <div className="bg-gradient-to-br from-primary-50 to-rose-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Accès rapide</h3>
            <div className="space-y-2">
              <button
                onClick={() => setEditingSegment({ timeOfDay: 'afternoon', text: '' })}
                className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">Note rapide</span>
              </button>
              
              <button
                onClick={() => setEditingReflection(true)}
                className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-neutral-50 transition-colors text-left"
              >
                <TrendingUp className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-700">Évaluer la journée</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}