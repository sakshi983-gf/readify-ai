import React, { useState } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Coffee, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function ToneStudioWidget({ currentText = '', onApplyToWorkspace }) {
  const [selectedTone, setSelectedTone] = useState('academic');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tones = [
    { id: 'academic', label: 'Academic', icon: GraduationCap, desc: 'Scholarly, formal vocabulary, elevated syntax' },
    { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Courteous, business-ready, active verbs' },
    { id: 'casual', label: 'Casual', icon: Coffee, desc: 'Friendly, natural phrasing, natural contractions' },
    { id: 'concise', label: 'Concise', icon: Zap, desc: 'Eliminates wordiness, high-impact brevity' },
  ];

  const handleRewrite = async (toneId) => {
    if (!currentText || !currentText.trim()) {
      alert('Please enter or analyze a passage in the workspace first.');
      return;
    }

    const target = toneId || selectedTone;
    setSelectedTone(target);
    setLoading(true);
    try {
      const res = await api.rewriteTone(currentText, target);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      alert(`Tone rewrite failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.rewritten_text) return;
    navigator.clipboard.writeText(result.rewritten_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      padding: '24px',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: '#FFFFFF',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#FAF5FF',
            color: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Multi-Tone Writing Studio
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Transform your passage into distinct stylistic registers with zero meaning distortion.
            </p>
          </div>
        </div>
      </div>

      {/* Tone Selection Buttons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
      }}>
        {tones.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          return (
            <button
              key={tone.id}
              onClick={() => handleRewrite(tone.id)}
              disabled={loading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 14px',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                backgroundColor: isSelected ? 'var(--primary-light)' : '#F8FAFC',
                color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem' }}>
                <Icon size={16} />
                <span>{tone.label}</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {tone.desc}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--primary)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Styling passage to {selectedTone} register...</p>
        </div>
      )}

      {/* Result Card */}
      {result && !loading && (
        <div style={{
          padding: '20px',
          borderRadius: '10px',
          backgroundColor: '#FAF5FF',
          border: '1px solid #E9D5FF',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {result.target_tone} Version
              </span>
              {result.reduction_percentage > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  <TrendingDown size={13} />
                  {result.reduction_percentage}% more concise
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopy}
                className="btn btn-secondary btn-sm"
              >
                {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {onApplyToWorkspace && (
                <button
                  onClick={() => onApplyToWorkspace(result.rewritten_text)}
                  className="btn btn-primary btn-sm"
                >
                  <span>Apply to Workspace</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'white',
            border: '1px solid #F3E8FF',
            fontSize: '0.94rem',
            lineHeight: 1.7,
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap'
          }}>
            {result.rewritten_text}
          </div>

          {result.key_adjustments && result.key_adjustments.length > 0 && (
            <div>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stylistic Adjustments Made:
              </span>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {result.key_adjustments.map((adj, i) => (
                  <li key={i}>{adj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
