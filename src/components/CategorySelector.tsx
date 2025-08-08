import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save, Shield } from 'lucide-react';
import { useCategories, Category } from '../hooks/useCategories';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'general' | 'task' | 'goal' | 'event';
  label?: string;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

const colors = [
  { key: 'neutral', label: 'Neutre', class: 'bg-neutral-500' },
  { key: 'primary', label: 'Primaire', class: 'bg-primary-500' },
  { key: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { key: 'green', label: 'Vert', class: 'bg-green-500' },
  { key: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { key: 'red', label: 'Rouge', class: 'bg-red-500' },
  { key: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { key: 'pink', label: 'Rose', class: 'bg-pink-500' },
  { key: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { key: 'mint', label: 'Menthe', class: 'bg-mint-500' },
  { key: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { key: 'peach', label: 'Pêche', class: 'bg-peach-500' }
];

const commonIcons = ['📝', '💻', '💪', '🧠', '❤️', '📚', '🏠', '💼', '🎨', '🎵', '🍎', '✈️', '📱', '🔧', '💡', '🎯', '🚀', '🔄', '📋', '💰'];

export default function CategorySelector({ 
  value, 
  onChange, 
  type = 'general', 
  label = 'Catégorie',
  placeholder = 'Sélectionner une catégorie',
  allowCustom = true,
  className = ''
}: CategorySelectorProps) {
  const { 
    categories, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    canModifyCategory,
    canDeleteCategory
  } = useCategories(type);
  
  const [showManager, setShowManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📝',
    color: 'neutral'
  });

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      await createCategory(newCategory.name.trim(), newCategory.icon, newCategory.color, type);
      setNewCategory({ name: '', icon: '📝', color: 'neutral' });
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color
      });
      setEditingCategory(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.is_protected) {
      alert('Cette catégorie ne peut pas être supprimée car elle sert de fallback pour les autres éléments.');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Tous les éléments utilisant cette catégorie seront automatiquement basculés vers "Autre".`)) return;
    
    try {
      await deleteCategory(category.id);
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
    }
  };

  const selectedCategory = categories.find(cat => cat.name === value);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
        {allowCustom && (
          <button
            type="button"
            onClick={() => setShowManager(!showManager)}
            className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
          >
            Gérer les catégories
          </button>
        )}
      </div>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="">{placeholder}</option>
        {categories.map(category => (
          <option key={category.id} value={category.name}>
            {category.icon} {category.name} {category.is_protected ? '🔒' : ''}
          </option>
        ))}
      </select>

      {/* Gestionnaire de catégories */}
      {showManager && allowCustom && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-xl space-y-4">
          <h4 className="text-sm font-medium text-neutral-700">Gérer les catégories</h4>
          
          {/* Créer nouvelle catégorie */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de la catégorie"
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              />
              
              <div className="flex gap-1 overflow-x-auto">
                {commonIcons.slice(0, 6).map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                    className={`p-2 rounded border-2 transition-all duration-200 ${
                      newCategory.icon === icon
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-1 overflow-x-auto">
                {colors.slice(0, 6).map(color => (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => setNewCategory(prev => ({ ...prev, color: color.key }))}
                    className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                      newCategory.color === color.key
                        ? 'border-neutral-800 scale-110'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className={`w-full h-full rounded ${color.class}`}></div>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategory.name.trim()}
              className="flex items-center gap-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 text-sm"
            >
              <Plus className="w-3 h-3" />
              Créer
            </button>
          </div>

          {/* Liste de toutes les catégories */}
          <div className="space-y-2">
            <p className="text-xs text-neutral-600">Toutes les catégories :</p>
            {categories.map(category => (
              <div key={category.id} className={`flex items-center justify-between p-2 rounded-lg ${
                category.is_protected ? 'bg-amber-50 border border-amber-200' : 'bg-white'
              }`}>
                {editingCategory?.id === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="flex-1 px-2 py-1 border border-neutral-200 rounded text-sm"
                    />
                    <button
                      onClick={handleUpdateCategory}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1 text-neutral-500 hover:bg-neutral-50 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.icon} {category.name}</span>
                      {category.is_protected && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Shield className="w-3 h-3" />
                          <span>Protégée</span>
                        </div>
                      )}
                      {category.is_default && !category.is_protected && (
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {canModifyCategory(category) && (
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="p-1 text-neutral-500 hover:bg-neutral-50 rounded transition-colors"
                          title="Modifier la catégorie"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      {canDeleteCategory(category) && (
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer la catégorie"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {category.is_protected && (
                        <div className="p-1 text-amber-500" title="Catégorie protégée - ne peut pas être modifiée ou supprimée">
                          <Shield className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Information sur le système */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-sm font-medium text-blue-800 mb-1">ℹ️ Information</h5>
            <p className="text-xs text-blue-700">
              • Vous pouvez modifier et supprimer toutes les catégories sauf "Autre" 🔒<br/>
              • "Autre" sert de fallback automatique quand une catégorie est supprimée<br/>
              • Toutes les tâches, objectifs et événements utilisant une catégorie supprimée basculeront automatiquement vers "Autre"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}