import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import api from '../services/api';

export default function CoachPage({ setActivePage, onStartPractice }) {
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  const fetchDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await api.getCoachDiagnostic();
      if (res.success && res.data) {
        setDiagnostic(res.data);
      }
    } catch (err) {
      console.error('Failed to load coach diagnostic:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <Sparkles size={16} />
          <span>AI Learning Coach Diagnostics</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Personalized Fluency & Weak-Area Roadmap
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
          Continuous diagnostic analysis based on your actual grammar edits, exercise submissions, and comprehension scores.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Synthesizing personalized diagnostic report...</p>
        </div>
      ) : !diagnostic ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>No diagnostic data available.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Top Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Overall Mastery Card */}
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.4rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}>
                {Math.round(diagnostic.overall_mastery)}%
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Grammar Mastery Score
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {diagnostic.overall_mastery >= 80 ? 'Proficient Fluency' : (diagnostic.overall_mastery >= 65 ? 'Developing Fluency' : 'Foundational')}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Evaluated across {diagnostic.total_exercises_completed} completed exercises
                </span>
              </div>
            </div>

            {/* Recommended Tier Card */}
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Target size={30} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Proficiency Tier
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {diagnostic.recommended_level}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Current level: {diagnostic.current_level}
                </span>
              </div>
            </div>

            {/* Coach Summary Callout */}
            <div className="card" style={{ padding: '24px', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
                <Lightbulb size={16} />
                <span>Coach Summary</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {diagnostic.coach_summary}
              </p>
            </div>
          </div>

          {/* Actionable Learning Roadmap */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Zap size={20} style={{ color: 'var(--warning)' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Priority Action Plan
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Top study recommendations targeted to your highest frequency grammatical errors.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {diagnostic.actionable_steps.map((step) => (
                <div
                  key={step.priority}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: step.priority === 1 ? '#FFFBEB' : '#F8FAFC',
                    border: `1px solid ${step.priority === 1 ? '#FEF3C7' : '#EEF2F6'}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className={`badge ${step.priority === 1 ? 'badge-warning' : 'badge-primary'}`}>
                        Priority #{step.priority}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {step.title}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Accuracy: {step.current_accuracy}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {step.action}
                    </p>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Core Rule: </strong>{step.core_rule}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px' }}>
                      <strong>Pro Tip: </strong>{step.pro_tip}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (step.category === 'reading_comprehension') {
                        setActivePage('comprehension');
                      } else {
                        if (onStartPractice) onStartPractice(step.category);
                        setActivePage('practice');
                      }
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Practice Now</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Grammar Topic Mastery Breakdown */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Full Grammar Topic Mastery Map
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Continuous diagnostic tracking across all 11 standardized grammatical categories.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {diagnostic.all_topics.map((t) => {
                const isMastered = t.status === 'mastered';
                const isWeak = t.status === 'weak';
                const color = isMastered ? '#16A34A' : (isWeak ? '#DC2626' : '#D97706');
                const bg = isMastered ? '#DCFCE7' : (isWeak ? '#FEE2E2' : '#FEF3C7');

                return (
                  <div
                    key={t.category}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {t.title}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        backgroundColor: bg,
                        color,
                      }}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: '#EEF2F6', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{
                        width: `${t.accuracy}%`,
                        height: '100%',
                        borderRadius: '4px',
                        backgroundColor: color,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>{t.attempts} attempts</span>
                      <span><strong>{Math.round(t.accuracy)}%</strong> accuracy</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
