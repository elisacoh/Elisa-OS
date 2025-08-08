import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import QuoteCard from './components/QuoteCard';
import MoodTracker from './components/MoodTracker';
import HabitsTracker from './components/HabitsTracker';
import TodayTasksCard from './components/TodayTasksCard';
import PlannerPreviewCard from './components/PlannerPreviewCard';
import GoalsProgressCard from './components/GoalsProgressCard';
import JournalPreviewCard from './components/JournalPreviewCard';
import TasksView from './components/TasksView';
import GoalsView from './components/GoalsView';
import JournalView from './components/JournalView';
import PlannerView from './components/PlannerView';
import SettingsView from './components/SettingsView';
import { LogIn } from 'lucide-react';

// Composant pour les vues non implémentées
function ComingSoonView({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="border border-blue-500 text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-neutral-300 to-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-50">
          <span className="text-2xl">🚧</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-600 font-display mb-4 opacity-75">
          {title}
        </h1>
        <p className="text-neutral-500 mb-8 opacity-75">
          {description}
        </p>
        
        <div className="bg-neutral-100 rounded-xl p-6 opacity-75">
          <h3 className="text-lg font-semibold text-neutral-600 mb-3">Bientôt disponible</h3>
          <p className="text-sm text-neutral-500">
            Cette section est en cours de développement. Elle sera disponible dans une prochaine mise à jour.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  
  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-rose-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-rose-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✨</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 font-display mb-4">
            Life Organizer
          </h1>
          <p className="text-neutral-600 mb-8">
            Organisez votre vie avec élégance. Connectez-vous pour accéder à vos tâches, objectifs et habitudes.
          </p>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 mx-auto"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </button>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-neutral-500">
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Tâches intelligentes</div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">Objectifs connectés</div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-2">💪</div>
              <div className="font-medium">Suivi d'habitudes</div>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium">Interface élégante</div>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'planner':
        return <PlannerView />;
      case 'tasks':
        return <TasksView />;
      case 'journal':
        return <JournalView />;
      case 'goals':
        return <GoalsView />;
      case 'settings':
        return <SettingsView />;
      case 'body':
        return <ComingSoonView 
          title="Corps & Santé" 
          description="Suivez votre forme physique, vos habitudes santé et votre bien-être corporel." 
        />;
      case 'mind':
        return <ComingSoonView 
          title="Mental & Mindfulness" 
          description="Développez votre bien-être mental avec méditation, gratitude et développement personnel." 
        />;
      case 'skills':
        return <ComingSoonView 
          title="Compétences" 
          description="Suivez votre progression dans l'apprentissage de nouvelles compétences et formations." 
        />;
      case 'projects':
        return <ComingSoonView 
          title="Projets" 
          description="Gérez vos projets personnels et professionnels avec des outils avancés." 
        />;
      case 'reset':
        return <ComingSoonView 
          title="Reset & Détox" 
          description="Outils pour faire le vide, se ressourcer et repartir sur de bonnes bases." 
        />;
      case 'dashboard':
      default:
        return (
          <>
            <header className="mb-6 md:mb-8 animate-fade-in px-4 md:px-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 font-display">
                  Bonjour, {user.user_metadata?.first_name || user.email?.split('@')[0]} ✨
                </h1>
                <div className="text-sm text-neutral-600 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm self-start md:self-auto">
                  {today}
                </div>
              </div>
              <p className="text-neutral-600">Prête à transformer cette journée en quelque chose de magnifique ?</p>
            </header>

            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="animate-slide-in">
                  <QuoteCard />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    <TodayTasksCard onViewChange={setCurrentView} />
                  </div>
                  <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                    <PlannerPreviewCard onViewChange={setCurrentView} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                    <MoodTracker />
                  </div>
                  <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
                    <HabitsTracker />
                  </div>
                </div>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-4 md:space-y-6">
                <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
                  <GoalsProgressCard onViewChange={setCurrentView} />
                </div>
                
                <div className="animate-slide-in" style={{ animationDelay: '0.6s' }}>
                  <JournalPreviewCard onViewChange={setCurrentView} />
                </div>

                <div className="bg-gradient-to-br from-rose-100 to-peach-100 rounded-2xl p-6 animate-slide-in" style={{ animationDelay: '0.7s' }}>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">Vision du mois</h3>
                  <p className="text-sm text-neutral-700 italic">
                    "Être plus présente à moi-même et cultiver la douceur dans mon quotidien."
                  </p>
                  <div className="mt-4 w-full bg-white/50 rounded-full h-2">
                    <div className="bg-gradient-to-r from-rose-400 to-peach-400 h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">75% du mois écoulé</p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-rose-50/30 overflow-hidden w-full">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Le contenu principal s'adapte à la largeur de la sidebar */}
      {/*flag1*/}
      <main className="md:ml-16 flex-1 transition-all duration-300 p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden">
        <div className="max-w-screen-xl mx-auto">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;