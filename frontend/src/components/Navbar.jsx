import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  LayoutDashboard, 
  PenTool, 
  History, 
  Menu, 
  X, 
  ArrowRight,
  Target,
  BrainCircuit,
  Cpu,
  User,
  LogOut,
  LogIn,
  Bot,
  Headphones
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenAIConfig, user, onOpenAuth, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'workspace', label: 'Workspace', icon: PenTool },
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    { id: 'pronunciation', label: 'Audio Coach', icon: Headphones },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'comprehension', label: 'Reading', icon: BookOpen },
    { id: 'coach', label: 'AI Coach', icon: BrainCircuit },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'model-info', label: 'AI Architecture', icon: Cpu },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
          }}>
            <BookOpen size={20} strokeWidth={2.3} />
            <Sparkles 
              size={12} 
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                color: '#FDE047',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
              }} 
            />
          </div>
          <div>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #17172B 0%, #4F46E5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Readify
            </span>
            <span style={{
              marginLeft: '6px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'var(--secondary)',
              color: 'var(--secondary-text)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              AI Platform
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '22px' }} className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                style={{
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  position: 'relative',
                  padding: '6px 0',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {link.label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    borderRadius: '2px',
                    backgroundColor: 'var(--primary)',
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onOpenAIConfig && onOpenAIConfig()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
            title="Configure AI Model Engine"
            className="ai-engine-btn"
          >
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span>AI Config</span>
          </button>

          {/* User Auth indicator */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1D4ED8',
                }}
                title={`Signed in as ${user.email} (${user.role})`}
              >
                <User size={13} />
                <span>{user.name.split(' ')[0]}</span>
                <span style={{
                  fontSize: '0.65rem',
                  backgroundColor: '#DBEAFE',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px' }}
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => handleNavClick('workspace')}
            className="btn btn-primary"
            style={{ display: 'none' }}
            id="nav-cta-btn"
          >
            <span>Start Reading</span>
            <ArrowRight size={16} />
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--text-main)',
              background: 'var(--surface-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 24px 24px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {Icon && <Icon size={18} />}
                  <span>{link.label}</span>
                </button>
              );
            })}
            
            {user ? (
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>Sign Out ({user.name})</span>
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                className="btn btn-secondary"
                style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
              >
                <LogIn size={16} />
                <span>Sign In / Demo Login</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('workspace')}
              className="btn btn-primary"
              style={{ marginTop: '6px', width: '100%', justifyContent: 'center' }}
            >
              <span>Start Reading</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          #nav-cta-btn { display: inline-flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
