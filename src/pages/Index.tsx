
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/components/HomePage';
import { TaskManager } from '@/components/TaskManager';
import { HabitTrackerEnhanced } from '@/components/HabitTrackerEnhanced';
import { FocusTimer } from '@/components/FocusTimer';
import { MoreFeaturesEnhanced } from '@/components/MoreFeaturesEnhanced';
import { NotesJournal } from '@/components/NotesJournal';
import { CalendarEvents } from '@/components/CalendarEvents';
import { ReadingTracker } from '@/components/ReadingTracker';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { IdeaVault } from '@/components/IdeaVault';
import { WellnessTracker } from '@/components/WellnessTracker';
import { LearningTracker } from '@/components/LearningTracker';
import { Analytics } from '@/components/Analytics';
import { AppSettings } from '@/components/AppSettings';
import { GymFitnessTracker } from '@/components/GymFitnessTracker';
import { RecipeManager } from '@/components/RecipeManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigate = (event: any) => {
      setActiveTab(event.detail);
      setActiveFeature(null);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const getHeaderTitle = () => {
    if (activeFeature) {
      switch (activeFeature) {
        case 'notes': return 'Notes & Journal';
        case 'calendar': return 'Calendar & Events';
        case 'reading': return 'Reading Tracker';
        case 'expenses': return 'Expense Tracker';
        case 'ideas': return 'Idea Vault';
        case 'wellness': return 'Wellness Tracker';
        case 'learning': return 'Learning Tracker';
        case 'analytics': return 'Analytics';
        case 'settings': return 'Settings';
        case 'gym': return 'Gym & Fitness';
        case 'recipes': return 'Recipe Manager';
        default: return 'More Features';
      }
    }
    
    switch (activeTab) {
      case 'home': return 'Personal Tracker';
      case 'tasks': return 'Task Manager';
      case 'habits': return 'Advanced Habits';
      case 'focus': return 'Focus Timer';
      case 'more': return 'More Features';
      default: return 'Personal Tracker';
    }
  };

  const handleFeatureSelect = (feature: string) => {
    setActiveFeature(feature);
  };

  const handleBackToMore = () => {
    setActiveFeature(null);
  };

  const renderContent = () => {
    if (activeFeature) {
      switch (activeFeature) {
        case 'notes': return <NotesJournal onBack={handleBackToMore} />;
        case 'calendar': return <CalendarEvents onBack={handleBackToMore} />;
        case 'reading': return <ReadingTracker onBack={handleBackToMore} />;
        case 'expenses': return <ExpenseTracker onBack={handleBackToMore} />;
        case 'ideas': return <IdeaVault onBack={handleBackToMore} />;
        case 'wellness': return <WellnessTracker onBack={handleBackToMore} />;
        case 'learning': return <LearningTracker onBack={handleBackToMore} />;
        case 'analytics': return <Analytics onBack={handleBackToMore} />;
        case 'settings': return <AppSettings onBack={handleBackToMore} />;
        case 'gym': return <GymFitnessTracker onBack={handleBackToMore} />;
        case 'recipes': return <RecipeManager onBack={handleBackToMore} />;
        default: return <MoreFeaturesEnhanced onFeatureSelect={handleFeatureSelect} />;
      }
    }

    switch (activeTab) {
      case 'home': return <HomePage />;
      case 'tasks': return <TaskManager />;
      case 'habits': return <HabitTrackerEnhanced />;
      case 'focus': return <FocusTimer />;
      case 'more': return <MoreFeaturesEnhanced onFeatureSelect={handleFeatureSelect} />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={getHeaderTitle()} 
        showSettings={activeTab === 'home'}
        onSettingsClick={() => handleFeatureSelect('settings')}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {renderContent()}
      </main>
      
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
