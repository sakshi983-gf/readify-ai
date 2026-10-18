import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AIConfigModal from './components/AIConfigModal';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import api from './services/api';

export default function App() {
  // Navigation: 'landing' | 'workspace' | 'dashboard' | 'history'
  const [activePage, setActivePage] = useState('landing');
  
  // AI Config Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Workspace state shared between pages
  const [workspacePassage, setWorkspacePassage] = useState('');
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [preloadedAnalysis, setPreloadedAnalysis] = useState(null);

  // Quick action: start reading fresh
  const handleStartReading = () => {
    setWorkspacePassage('');
    setWorkspaceTitle('');
    setPreloadedAnalysis(null);
    setActivePage('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick action: load pre-configured sample passage
  const handleLoadSample = (sample) => {
    setWorkspacePassage(sample.text);
    setWorkspaceTitle(sample.title);
    setPreloadedAnalysis(null);
    setActivePage('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick action: load existing history analysis by ID
  const handleSelectHistoryItem = async (historyId) => {
    try {
      const res = await api.getHistoryById(historyId);
      if (res.success && res.data) {
        const item = res.data;
        setWorkspacePassage(item.original_text);
        setWorkspaceTitle(item.title);
        
        const mockAnalysis = {
          id: item.id,
          title: item.title,
          original_text: item.original_text,
          corrected_text: item.corrected_text,
          word_count: item.word_count,
          char_count: item.char_count,
          reading_time_minutes: item.reading_time_minutes,
          readability: {
            reading_ease: item.readability_score,
            level_label: item.readability_level || 'Standard',
            grade_level: 8.0,
            reading_time_minutes: item.reading_time_minutes,
          },
          grammar: {
            errors: [],
            error_count: item.grammar_errors_count,
            message: item.grammar_errors_count === 0 
              ? 'No common errors detected.' 
              : `Found ${item.grammar_errors_count} improvement items.`,
            score: item.grammar_score,
            formula: `Grammar Accuracy Score: ${item.grammar_score}%`,
          },
          questions: item.quiz_data || [],
          quiz_data: item.quiz_data || [],
          scores: {
            grammar_score: item.grammar_score,
            grammar_formula: `Grammar Accuracy: ${item.grammar_score}%`,
            comprehension_score: item.comprehension_score,
            overall_score: item.overall_score,
            overall_formula: `Overall Score: ${item.overall_score}%`,
          },
          feedback: item.feedback || [],
          status: item.status,
        };

        setPreloadedAnalysis(mockAnalysis);
        setActivePage('workspace');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      alert(`Failed to load analysis record: ${err.message}`);
    }
  };

  const isLanding = activePage === 'landing';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Universal Sticky Glassmorphism Header */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onOpenAIConfig={() => setIsAIModalOpen(true)}
      />

      {/* AI Configuration Modal */}
      <AIConfigModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />

      {/* Main Content Layout */}
      {isLanding ? (
        <main style={{ flex: 1 }}>
          <LandingPage 
            onStartReading={handleStartReading} 
            onLoadSample={handleLoadSample}
            setActivePage={setActivePage}
          />
        </main>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
          {/* SaaS Sidebar for Workspace, Dashboard, and History */}
          <Sidebar 
            activePage={activePage} 
            setActivePage={setActivePage} 
            onStartNew={handleStartReading}
            onOpenAIConfig={() => setIsAIModalOpen(true)}
          />

          {/* Subpage Viewport */}
          <main style={{ flex: 1, overflowX: 'hidden' }}>
            {activePage === 'workspace' && (
              <WorkspacePage 
                initialPassage={workspacePassage}
                initialTitle={workspaceTitle}
                preloadedAnalysis={preloadedAnalysis}
                setActivePage={setActivePage}
                onAnalysisComplete={() => {}}
              />
            )}

            {activePage === 'dashboard' && (
              <DashboardPage 
                setActivePage={setActivePage}
                onSelectHistoryItem={handleSelectHistoryItem}
              />
            )}

            {activePage === 'history' && (
              <HistoryPage 
                setActivePage={setActivePage}
                onSelectHistoryItem={handleSelectHistoryItem}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
