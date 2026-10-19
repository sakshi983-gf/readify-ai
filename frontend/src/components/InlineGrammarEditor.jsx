import React, { useState } from 'react';
import { Check, X, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function InlineGrammarEditor({ 
  originalText = '', 
  errors = [], 
  onAcceptFix, 
  onTextChange 
}) {
  const [selectedError, setSelectedError] = useState(null);
  const [dismissedOffsets, setDismissedOffsets] = useState(new Set());

  // Filter out dismissed errors
  const activeErrors = errors.filter(e => !dismissedOffsets.has(e.offset));

  const handleDismiss = (offset) => {
    setDismissedOffsets(prev => new Set([...prev, offset]));
    setSelectedError(null);
  };

  const handleApplyFix = (err) => {
    if (!onAcceptFix) return;
    const replacement = err.replacements?.[0] || '';
    onAcceptFix(err, replacement);
    setDismissedOffsets(prev => new Set([...prev, err.offset]));
    setSelectedError(null);
  };

  // Determine squiggly underline color based on error type
  const getUnderlineColor = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('spell')) return '#EF4444'; // Red for spelling
    if (cat.includes('agreement') || cat.includes('tense')) return '#F59E0B'; // Amber for SVA / tense
    if (cat.includes('article') || cat.includes('prep')) return '#3B82F6'; // Blue for articles & prepositions
    if (cat.includes('structure')) return '#8B5CF6'; // Purple for sentence structure
    return '#EC4899'; // Pink default
  };

  // Render text segments with interactive underlined error spans
  const renderInteractiveContent = () => {
    if (!originalText) {
      return <p style={{ color: 'var(--text-muted)' }}>No text analyzed yet.</p>;
    }

    if (activeErrors.length === 0) {
      return (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1rem', color: 'var(--text-main)' }}>
          {originalText}
        </div>
      );
    }

    // Sort errors by offset
    const sorted = [...activeErrors].sort((a, b) => a.offset - b.offset);
    const elements = [];
    let lastIdx = 0;

    sorted.forEach((err, idx) => {
      const start = Math.max(0, err.offset);
      const length = Math.max(1, err.length || err.matched_text?.length || 1);
      const end = Math.min(originalText.length, start + length);

      if (start > lastIdx) {
        elements.push(
          <span key={`text-${lastIdx}`}>
            {originalText.substring(lastIdx, start)}
          </span>
        );
      }

      const isSelected = selectedError?.offset === err.offset;
      const color = getUnderlineColor(err.category);

      elements.push(
        <span
          key={`err-${idx}-${start}`}
          onClick={() => setSelectedError(isSelected ? null : err)}
          style={{
            textDecoration: 'underline',
            textDecorationStyle: 'wavy',
            textDecorationColor: color,
            textDecorationThickness: '2.5px',
            textUnderlineOffset: '4px',
            backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
            borderRadius: '2px',
            cursor: 'pointer',
            fontWeight: isSelected ? 700 : 500,
            transition: 'background-color 0.15s ease',
            padding: '1px 2px',
          }}
          title={`Click to review: ${err.category} (${err.explanation || err.message})`}
        >
          {originalText.substring(start, end) || err.matched_text}
        </span>
      );

      lastIdx = end;
    });

    if (lastIdx < originalText.length) {
      elements.push(
        <span key={`text-end`}>
          {originalText.substring(lastIdx)}
        </span>
      );
    }

    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: '1.02rem', color: 'var(--text-main)' }}>
        {elements}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Editor Body */}
      <div style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        minHeight: '180px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {renderInteractiveContent()}
      </div>

      {/* Floating Grammarly-Style Popover Card */}
      {selectedError && (
        <div 
          className="animate-fade-in"
          style={{
            marginTop: '12px',
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderLeft: `4px solid ${getUnderlineColor(selectedError.category)}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                {selectedError.type_label || selectedError.category}
              </span>
              {selectedError.confidence && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {Math.round(selectedError.confidence * 100)}% Confidence
                </span>
              )}
              {selectedError.requires_review && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Review Recommended
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
            {selectedError.explanation || selectedError.message}
          </p>

          {/* Quick Replacement Action */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'line-through'
              }}>
                {selectedError.matched_text || '[empty]'}
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#DCFCE7',
                color: '#166534',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                {selectedError.replacements?.[0] || '[remove]'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDismiss(selectedError.offset)}
                className="btn btn-secondary btn-sm"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleApplyFix(selectedError)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={14} />
                <span>Accept Fix</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
