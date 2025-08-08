import React, { useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface UserMenuProps {
  onSettingsClick?: () => void;
}

export default function UserMenu({ onSettingsClick }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  if (!user) return null;

  const displayName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'Utilisateur';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gradient-to-br from-mint-300 to-peach-300 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-105"
        title={`Profil de ${displayName} - Double-cliquez pour les paramètres`}
      >
        {user.user_metadata?.first_name ? (
          <span className="text-sm font-medium text-neutral-700">
            {user.user_metadata.first_name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User className="w-5 h-5 text-neutral-700" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-20">
            <div className="px-4 py-3 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-800">
                {displayName}
              </p>
              <p className="text-xs text-neutral-600 truncate">{user.email}</p>
              <p className="text-xs text-primary-500 mt-1">
                💡 Double-clic sur l'avatar → Paramètres
              </p>
            </div>
            
            <div className="py-1">
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}