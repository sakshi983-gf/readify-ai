import React from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  Home, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Activity,
  Target,
  BookOpen,
  BrainCircuit,
  Cpu,
  Bot,
  Headphones
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, onStartNew, onOpenAIConfig }) {
  const menuItems = [
    { id: 'workspace', label: 'Reading Workspace', icon: PenTool },
    { id: 'tutor', label: 'AI English Tutor', icon: Bot, badge: 'AI' },
    { id: 'pronunciation', label: 'Audio & Speech Coach', icon: Headphones, badge: 'NEW' },
    { id: 'practice', label: 'Grammar Drills', icon: Target },
    { id: 'comprehension', label: 'Passage Quizzes', icon: BookOpen },
    { id: 'coach', label: 'AI Learning Coach', icon: BrainCircuit },
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'history', label: 'Reading History', icon: History },
    { id: 'model-info', label: 'AI Model & Benchmarks', icon: Cpu },
    { id: 'landing', label: 'Back to Home', icon: Home },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      minHeight: 'calc(100vh - 70px)',
      flexShrink: 0,
    }} className="app-sidebar">
      <div>
        {/* Quick Action Button */}
        <button
          onClick={() => {
            if (onStartNew) onStartNew();
            setActivePage('workspace');
          }}
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '24px', justifyContent: 'center' }}
        >
          <Sparkles size={16} />
          <span>New Analysis</span>
        </button>

        {/* Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '8px 12px 6px',
          }}>
            Menu
          </div>

          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
                className="sidebar-btn"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && isActive && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'white',
                    color: 'var(--primary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Tips Box */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#F8FAFC',
          border: '1px solid #EEF2F6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Activity size={15} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              How Scoring Works
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Overall score blends <strong>60% Quiz Comprehension</strong> and <strong>40% Grammar Accuracy</strong> based on error density.
          </p>
        </div>
      </div>

      {/* Footer System Status */}
      <div 
        onClick={() => onOpenAIConfig && onOpenAIConfig()}
        style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        title="Click to view AI Engine settings"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--success)',
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            AI Engine (Smart NLP)
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
          Config
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .app-sidebar {
            display: none !important;
          }
        }
        .sidebar-btn:hover {
          background-color: var(--surface-hover);
          color: var(--text-main);
        }
      `}</style>
    </aside>
  );
}
