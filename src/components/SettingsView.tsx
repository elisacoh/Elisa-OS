import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Tag, Save, X, Plus, Trash2, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useCategories } from '../hooks/useCategories';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export default function SettingsView() {
  const { user, signOut } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory, canDeleteCategory, canModifyCategory } = useCategories();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // Security state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Categories state
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '🎯',
    color: 'primary'
  });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const colors = [
    { key: 'primary', label: 'Primaire', class: 'bg-primary-500' },
    { key: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { key: 'green', label: 'Vert', class: 'bg-green-500' },
    { key: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
    { key: 'red', label: 'Rouge', class: 'bg-red-500' },
    { key: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { key: 'pink', label: 'Rose', class: 'bg-pink-500' },
    { key: 'indigo', label: 'Indigo', class: 'bg-indigo-500' }
  ];

  const commonIcons = ['🎯', '💻', '💪', '🧠', '❤️', '📚', '🏠', '💼', '🎨', '🎵', '🍎', '✈️', '📱', '🔧', '💡'];

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        // For now, we'll use the auth user data
        // In a real app, you might have a separate profiles table
        setProfile({
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          created_at: user.created_at
        });
        
        setProfileForm({
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          email: user.email || ''
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profileForm.email,
        data: {
          first_name: profileForm.firstName,
          last_name: profileForm.lastName
        }
      });

      if (error) throw error;
      
      showMessage('success', 'Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (securityForm.newPassword.length < 6) {
      showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: securityForm.newPassword
      });

      if (error) throw error;
      
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showMessage('success', 'Mot de passe mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      showMessage('error', 'Le nom de la catégorie est requis');
      return;
    }
    
    setLoading(true);
    try {
      await createCategory(newCategory.name.trim(), newCategory.icon, newCategory.color);
      setNewCategory({ name: '', icon: '🎯', color: 'primary' });
      showMessage('success', 'Catégorie créée avec succès !');
    } catch (error) {
      console.error('Error creating category:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: any) => {
    setLoading(true);
    try {
      await updateCategory(categoryId, updates);
      setEditingCategory(null);
      showMessage('success', 'Catégorie mise à jour avec succès !');
    } catch (error) {
      console.error('Error updating category:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    
    if (!canDeleteCategory(category!)) {
      showMessage('error', 'Cette catégorie ne peut pas être supprimée car elle sert de fallback.');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les éléments utilisant cette catégorie seront automatiquement transférés vers "Autre".')) return;
    
    setLoading(true);
    try {
      await deleteCategory(categoryId);
      showMessage('success', 'Catégorie supprimée avec succès !');
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('error', error instanceof Error ? error.message : 'Erreur lors de la suppression de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
    
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showMessage('error', 'Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 font-display">Paramètres</h1>
          <p className="text-neutral-600 mt-1">Gérez votre profil et vos préférences</p>
        </div>
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Onglets */}
      <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl">
        {[
          { key: 'profile', label: 'Profil', icon: User },
          { key: 'categories', label: 'Catégories', icon: Tag },
          { key: 'security', label: 'Sécurité', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-primary-600 shadow-sm font-medium'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100">
        {/* Onglet Profil */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">Informations personnelles</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Votre nom de famille"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {profile && (
                <div className="bg-neutral-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Informations du compte</h3>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p><strong>ID:</strong> {profile.id}</p>
                    <p><strong>Membre depuis:</strong> {new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglet Catégories */}
        {activeTab === 'categories' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">Gestion des catégories</h2>
            
            {/* Créer une nouvelle catégorie */}
            <div className="bg-neutral-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Créer une nouvelle catégorie</h3>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Fitness, Lecture..."
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Icône
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {commonIcons.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                          className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                            newCategory.icon === icon
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Couleur
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map(color => (
                        <button
                          key={color.key}
                          type="button"
                          onClick={() => setNewCategory(prev => ({ ...prev, color: color.key }))}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            newCategory.color === color.key
                              ? 'border-neutral-800 scale-110'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className={`w-full h-4 rounded ${color.class}`}></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !newCategory.name.trim()}
                    className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Créer la catégorie
                  </button>
                </div>
              </form>
            </div>
            
            {/* Liste des catégories existantes */}
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Catégories existantes</h3>
              
              {categories.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Tag className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p>Aucune catégorie trouvée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        category.is_protected ? 'border-orange-200 bg-orange-50' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h4 className="font-medium text-neutral-800">{category.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className="capitalize">{category.color}</span>
                            {category.is_protected && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                                Protégée
                              </span>
                            )}
                            {category.is_default && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                Système
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {canModifyCategory(category) ? (
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-neutral-300" title="Non modifiable">
                            <Edit3 className="w-4 h-4" />
                          </div>
                        )}
                        
                        {canDeleteCategory(category) ? (
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-neutral-300" title="Non supprimable">
                            <Trash2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal d'édition */}
            {editingCategory && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-800">Modifier la catégorie</h3>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-neutral-500" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Icône
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {commonIcons.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setEditingCategory(prev => ({ ...prev, icon }))}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                              editingCategory.icon === icon
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <span className="text-lg">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Couleur
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colors.map(color => (
                          <button
                            key={color.key}
                            type="button"
                            onClick={() => setEditingCategory(prev => ({ ...prev, color: color.key }))}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              editingCategory.color === color.key
                                ? 'border-neutral-800 scale-110'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className={`w-full h-4 rounded ${color.class}`}></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleUpdateCategory(editingCategory.id, {
                        name: editingCategory.name,
                        icon: editingCategory.icon,
                        color: editingCategory.color
                      })}
                      disabled={loading}
                      className="flex items-center gap-2 bg-primary-500 text-white px-6 py-2 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-6">Sécurité du compte</h2>
            
            {/* Changer le mot de passe */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Changer le mot de passe</h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Nouveau mot de passe"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirmer le mot de passe"
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">Exigences du mot de passe</h4>
                  <ul className="text-xs text-neutral-600 space-y-1">
                    <li>• Au moins 6 caractères</li>
                    <li>• Recommandé: mélange de lettres, chiffres et symboles</li>
                  </ul>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !securityForm.newPassword || securityForm.newPassword !== securityForm.confirmPassword}
                  className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </div>
            
            {/* Zone de danger */}
            <div className="border-t border-neutral-200 pt-8">
              <h3 className="text-lg font-medium text-red-600 mb-4">Zone de danger</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h4 className="text-md font-medium text-red-800 mb-2">Déconnexion</h4>
                <p className="text-sm text-red-700 mb-4">
                  Vous déconnecter de votre compte sur cet appareil.
                </p>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}