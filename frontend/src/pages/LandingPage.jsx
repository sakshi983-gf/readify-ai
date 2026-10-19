import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  MessageSquareText, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Brain,
  FileCheck2,
  Award,
  Layers,
  Bot,
  Volume2,
  Palette
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import { SAMPLE_PASSAGES } from '../constants/samplePassages';

export default function LandingPage({ onStartReading, onLoadSample, setActivePage }) {
  const features = [
    {
      icon: Sparkles,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      title: 'Interactive Squiggly Editor',
      desc: 'Grammarly-style wavy colored underlines highlighting errors with floating popover cards and 1-click accept fixes.',
      pageId: 'workspace'
    },
    {
      icon: Volume2,
      color: '#059669',
      bgColor: '#ECFDF5',
      title: 'Listen & Speak Audio Coach',
      desc: 'Text-to-speech audio playback with pitch/speed controls plus microphone speech-to-text pronunciation accuracy scoring.',
      pageId: 'pronunciation'
    },
    {
      icon: Bot,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      title: 'Conversational AI English Tutor',
      desc: 'Interactive AI tutor ready to explain grammar concepts, build vocabulary, and conduct realistic job interview roleplays.',
      pageId: 'tutor'
    },
    {
      icon: Palette,
      color: '#D97706',
      bgColor: '#FFFBEB',
      title: 'Multi-Tone Writing Studio',
      desc: 'Instantly transform any passage into Academic, Professional, Casual, or Concise styles with live word-delta metrics.',
      pageId: 'workspace'
    },
    {
      icon: HelpCircle,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      title: 'Comprehension Quizzes & Scoring',
      desc: 'Auto-generates 5 passage-based multiple choice questions evaluating main ideas, factual details, vocabulary, and inferences.',
      pageId: 'comprehension'
    },
    {
      icon: TrendingUp,
      color: '#DC2626',
      bgColor: '#FEF2F2',
      title: 'Personalized Adaptive Coach',
      desc: 'Tracks weaknesses across verb tenses, articles, and agreement to recommend targeted practice exercises.',
      pageId: 'coach'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Paste or Type Your Passage',
      desc: 'Enter any English essay, article, or textbook excerpt. View live character counts, word statistics, and estimated reading time.'
    },
    {
      step: '02',
      title: 'Analyze Grammar & Answer Questions',
      desc: 'Our local NLP engine identifies sentence-level improvements and creates a 5-question comprehension quiz specifically from your text.'
    },
    {
      step: '03',
      title: 'Review Detailed Scores & Feedback',
      desc: 'Inspect your comprehension breakdown, examine highlighted grammar corrections, and track long-term progress on your dashboard.'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
        }}>
          {/* Left Column */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--secondary)',
              color: 'var(--secondary-text)',
              fontSize: '0.84rem',
              fontWeight: 700,
              marginBottom: '20px',
            }}>
              <Sparkles size={16} />
              <span>AI-Powered Reading Assistant</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--text-main)',
              marginBottom: '20px',
            }}>
              Read Smarter. <br />
              <span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Understand Better.
              </span>
            </h1>

            <p style={{
              fontSize: '1.12rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '32px',
              maxWidth: '520px',
            }}>
              Readify empowers students, learners, and educators to boost reading comprehension, 
              refine grammar accuracy, and expand vocabulary with instant local NLP assessment.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
              <button
                onClick={onStartReading}
                className="btn btn-primary btn-lg"
              >
                <span>Start Reading</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('features-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-secondary btn-lg"
              >
                <span>Explore Features</span>
              </button>
            </div>

            {/* Trust note & badges */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '20px',
            }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                ✨ Your personal space to learn, practice, and improve.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--success)' }} /> 100% Free & Local
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Zap size={16} style={{ color: 'var(--warning)' }} /> Zero API Keys Required
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Brain size={16} style={{ color: 'var(--primary)' }} /> NLP Question Engine
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Live Interactive Preview Card */}
          <div style={{ position: 'relative' }}>
            {/* Background subtle glow effect */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(248, 249, 252, 0) 70%)',
              zIndex: 0,
              filter: 'blur(30px)',
            }} />

            <div className="card" style={{
              position: 'relative',
              zIndex: 1,
              padding: '28px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.15), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
            }}>
              {/* Card Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}>
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Interactive Analysis Preview
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Real-time grammar & comprehension output
                    </p>
                  </div>
                </div>
                <span className="badge badge-success">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>

              {/* Sample paragraph with highlighted grammar changes */}
              <div style={{
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                lineHeight: 1.7,
                marginBottom: '20px',
                border: '1px solid #EEF2F6',
              }}>
                "Yesterday <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', textDecoration: 'line-through' }}>i</span> <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>I</span> visited <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', textDecoration: 'line-through' }}>the the</span> city library. She <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', textDecoration: 'line-through' }}>have</span> <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>has</span> told me that reading improves vocabulary..."
              </div>

              {/* Score Display Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <div style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                  <ScoreRing score={92} size={64} strokeWidth={6} label="" color="#4F46E5" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginTop: '4px', display: 'block' }}>Overall Score</span>
                </div>
                <div style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                  <ScoreRing score={90} size={64} strokeWidth={6} label="" color="#059669" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginTop: '4px', display: 'block' }}>Comprehension</span>
                </div>
                <div style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                  <ScoreRing score={95} size={64} strokeWidth={6} label="" color="#7C3AED" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginTop: '4px', display: 'block' }}>Grammar</span>
                </div>
              </div>

              {/* Sample Feedback Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
              }}>
                <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  "Great work! 5 passage questions generated with Flesch Standard readability."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant 1-Click Sample Passages Section */}
      <section style={{
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '60px 24px',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '10px' }}>
              One-Click Exploration
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Try a Sample Passage Instantly
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '8px auto 0' }}>
              Select any pre-configured passage to test grammar correction, comprehension questions, and scoring immediately.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {SAMPLE_PASSAGES.map((sample) => (
              <div 
                key={sample.id}
                className="card card-interactive"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                      {sample.tag}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {sample.difficulty}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {sample.title}
                  </h3>
                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {sample.text}
                  </p>
                </div>

                <button
                  onClick={() => onLoadSample(sample)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>Load into Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
            Complete Capability
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Built for Academic Excellence
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '10px auto 0' }}>
            Everything students and lifelong readers need to strengthen their linguistic clarity and reading comprehension.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index}
                className="card card-interactive"
                onClick={() => {
                  if (feat.pageId) {
                    setActivePage(feat.pageId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{
                  padding: '30px 24px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: feat.pageId ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: feat.bgColor,
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        backgroundColor: '#F1F5F9',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="badge badge-secondary" style={{ marginBottom: '12px', backgroundColor: 'white' }}>
              Simple 3-Step Flow
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              How Readify Works
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '10px auto 0' }}>
              Seamlessly transition from reading raw text to receiving deep contextual understanding.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
          }}>
            {steps.map((st, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '32px 26px',
                  borderRadius: 'var(--radius-lg)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{
                  fontSize: '2.8rem',
                  fontWeight: 900,
                  color: '#E2E8F0',
                  lineHeight: 1,
                  display: 'block',
                  marginBottom: '16px',
                }}>
                  {st.step}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  {st.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{
        maxWidth: '1240px',
        margin: '80px auto 0',
        padding: '0 24px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '60px 32px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)',
        }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '16px' }}>
            Elevate Your Reading & Writing Skills Today
          </h2>
          <p style={{
            fontSize: '1.08rem',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '560px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            Experience AI-driven reading diagnostics, comprehensive grammar correction, 
            and interactive comprehension assessment completely free on your computer.
          </p>
          <button
            onClick={onStartReading}
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'white',
              color: '#4F46E5',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s',
            }}
          >
            <span>Launch Reading Workspace</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        maxWidth: '1240px',
        margin: '60px auto 0',
        padding: '30px 24px 0',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <BookOpen size={14} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
            Readify
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
            AI-Powered Reading Comprehension and Grammar Assistant
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <button onClick={() => setActivePage('landing')}>Home</button>
          <button onClick={() => setActivePage('workspace')}>Workspace</button>
          <button onClick={() => setActivePage('dashboard')}>Dashboard</button>
          <button onClick={() => setActivePage('history')}>History</button>
        </div>
      </footer>
    </div>
  );
}
