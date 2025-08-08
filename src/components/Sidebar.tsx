import React, { useState } from 'react';
import { Home, CheckSquare, Target, BookOpen, Calendar, Heart, Brain, GraduationCap, FolderOpen, RotateCcw, ChevronRight, ChevronLeft, Settings, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import UserMenu from './UserMenu';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: 'dashboard', enabled: true },
  { icon: Calendar, label: 'Planner', path: 'planner', enabled: true },
  { icon: CheckSquare, label: 'Tâches', path: 'tasks', enabled: true },
  { icon: BookOpen, label: 'Journal', path: 'journal', enabled: true },
  { icon: Target, label: 'Objectifs', path: 'goals', enabled: true },
  { icon: Heart, label: 'Corps', path: 'body', enabled: false },
  { icon: Brain, label: 'Mental', path: 'mind', enabled: false },
  { icon: GraduationCap, label: 'Compétences', path: 'skills', enabled: false },
  { icon: FolderOpen, label: 'Projets', path: 'projects', enabled: false },
  { icon: RotateCcw, label: 'Reset', path: 'reset', enabled: false },
];

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSettingsClick = () => {
    onViewChange('settings');
    setIsMobileMenuOpen(false);
  };

  const handleUserIconDoubleClick = () => {
    onViewChange('settings');
    setIsMobileMenuOpen(false);
  };

  const handleMenuItemClick = (path: string, enabled: boolean) => {
    if (enabled) {
      onViewChange(path);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Fixed top-left */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-3 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg border border-neutral-200/50"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-neutral-600" />
        ) : (
          <Menu className="w-5 h-5 text-neutral-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex fixed left-0 top-0 h-full bg-white/95 backdrop-blur-lg border-r border-neutral-200/50 flex-col py-6 z-50 shadow-xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      }`}>
        {/* Logo et bouton d'expansion */}
        <div className="flex items-center justify-between px-6 mb-8">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-primary-400 to-rose-400 rounded-xl flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
              onDoubleClick={handleUserIconDoubleClick}
              title="Double-cliquez pour ouvrir les paramètres"
            >
              <Heart className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-neutral-800 font-display whitespace-nowrap">
                  Life Organizer
                </h1>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 text-neutral-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.path;
            const isEnabled = item.enabled;
            
            return (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.path, isEnabled)}
                disabled={!isEnabled}
                className={`group relative overflow-visible flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  !isEnabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : isActive 
                      ? 'bg-primary-100 text-primary-600 shadow-lg' 
                      : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                } ${isExpanded ? 'justify-start' : 'justify-center'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                
                {isExpanded && (
                  <span className="font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}

                {!isEnabled && (
                  <div className={`absolute ${isExpanded ? '-top-1 -right-1' : '-top-1 -right-1'} w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center`}>
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                )}

                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60]">
                    {item.label}
                    {!isEnabled && (
                      <div className="text-xs text-neutral-300 mt-1">Bientôt disponible</div>
                    )}
                    
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-neutral-900"></div>
                  </div>
                )}
              </button>
            );
          })}

          <div className="my-4 border-t border-neutral-200"></div>

          <button
            onClick={handleSettingsClick}
            className={`group relative overflow-visible flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              currentView === 'settings'
                ? 'bg-primary-100 text-primary-600 shadow-lg' 
                : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
            } ${isExpanded ? 'justify-start' : 'justify-center'}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            
            {isExpanded && (
              <span className="font-medium whitespace-nowrap overflow-hidden">
                Paramètres
              </span>
            )}

            {!isExpanded && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60]">
                Paramètres
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-neutral-900"></div>
              </div>
            )}
          </button>
        </nav>
        
        {/* User menu */}
        <div className={`px-3 mt-auto ${isExpanded ? '' : 'flex justify-center'}`}>
          {user ? (
            <div className={`flex items-center gap-3 ${isExpanded ? '' : 'justify-center'}`}>
              <div 
                onDoubleClick={handleUserIconDoubleClick}
                className="cursor-pointer"
                title="Double-cliquez pour ouvrir les paramètres"
              >
                <UserMenu onSettingsClick={handleSettingsClick} />
              </div>
              {isExpanded && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {user.user_metadata?.first_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-primary-500 mt-1">
                    Double-clic → Paramètres
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-3 ${isExpanded ? '' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-mint-300 to-peach-300 rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-medium text-neutral-700">?</span>
              </div>
              {isExpanded && (
                <div className="text-sm text-neutral-600">
                  Non connecté
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-lg border-r border-neutral-200/50 flex flex-col py-6 z-50 shadow-xl transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 mb-8">
          <div 
            className="w-10 h-10 bg-gradient-to-br from-primary-400 to-rose-400 rounded-xl flex items-center justify-center shadow-md"
            onDoubleClick={handleUserIconDoubleClick}
          >
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-neutral-800 font-display">
            Life Organizer
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.path;
            const isEnabled = item.enabled;
            
            return (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.path, isEnabled)}
                disabled={!isEnabled}
                className={`relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                  !isEnabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : isActive 
                      ? 'bg-primary-100 text-primary-600 shadow-lg' 
                      : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>

                {!isEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                )}
              </button>
            );
          })}

          <div className="my-4 border-t border-neutral-200"></div>

          <button
            onClick={handleSettingsClick}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
              currentView === 'settings'
                ? 'bg-primary-100 text-primary-600 shadow-lg' 
                : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Paramètres</span>
          </button>
        </nav>
        
        {/* User menu mobile */}
        <div className="px-3 mt-auto">
          {user ? (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <div onDoubleClick={handleUserIconDoubleClick}>
                <UserMenu onSettingsClick={handleSettingsClick} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-mint-300 to-peach-300 rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-medium text-neutral-700">?</span>
              </div>
              <div className="text-sm text-neutral-600">
                Non connecté
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}