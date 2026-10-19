import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  HelpCircle, 
  AlertCircle, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  BarChart2, 
  Clock, 
  RefreshCw,
  Send,
  Zap,
  ChevronRight,
  Info,
  Palette,
  Volume2,
  Wand2,
  Layers,
  UploadCloud
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import InlineGrammarEditor from '../components/InlineGrammarEditor';
import AudioSpeechCoach from '../components/AudioSpeechCoach';
import ToneStudioWidget from '../components/ToneStudioWidget';
import DocumentDropzone from '../components/DocumentDropzone';
import { SAMPLE_PASSAGES } from '../constants/samplePassages';
import api from '../services/api';

export default function WorkspacePage({ 
  initialPassage = '', 
  initialTitle = '', 
  preloadedAnalysis = null,
  setActivePage,
  onAnalysisComplete 
}) {
  const [text, setText] = useState(initialPassage);
  const [title, setTitle] = useState(initialTitle);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(preloadedAnalysis);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Active Tab: 'grammar' | 'quiz' | 'scores' | 'feedback'
  const [activeTab, setActiveTab] = useState('grammar');

  // Quiz state
  const [userAnswers, setUserAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Document & PDF Dropzone state
  const [showDropzone, setShowDropzone] = useState(false);

  // Sync props if changed
  useEffect(() => {
    if (initialPassage) {
      setText(initialPassage);
    }
    if (initialTitle) {
      setTitle(initialTitle);
    }
    if (preloadedAnalysis) {
      setAnalysisResult(preloadedAnalysis);
      // If quiz was already answered in preloaded record:
      if (preloadedAnalysis.quiz_data && preloadedAnalysis.status === 'completed') {
        setQuizResults({
          comprehension_score: preloadedAnalysis.comprehension_score,
          overall_score: preloadedAnalysis.overall_score,
          breakdown: preloadedAnalysis.quiz_data,
          feedback: preloadedAnalysis.feedback,
        });
      }
    }
  }, [initialPassage, initialTitle, preloadedAnalysis]);

  // Calculations
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = text.length;
  const estimatedReadingTime = Math.max(0.1, Math.round((wordCount / 200) * 10) / 10);

  // Handle Passage Analysis
  const handleAnalyze = async () => {
    if (!text.trim()) {
      setErrorMsg('Please enter or paste a passage to analyze.');
      return;
    }
    if (wordCount < 5) {
      setErrorMsg(`Passage is too short (${wordCount} words). Please enter at least 5 words.`);
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');
    setQuizResults(null);
    setUserAnswers({});

    try {
      const response = await api.analyzePassage({
        text,
        title: title.trim() || undefined,
      });

      if (response.success && response.data) {
        setAnalysisResult(response.data);
        setActiveTab('grammar');
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
      } else {
        setErrorMsg(response.error || 'Failed to analyze passage.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error communicating with backend service. Ensure Flask is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Quiz Option Selection
  const handleSelectOption = (questionId, optionId) => {
    if (quizResults) return; // Prevent changing after submission
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async () => {
    if (!analysisResult?.id) return;
    const questions = analysisResult.questions || [];
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < questions.length) {
      const confirmIncomplete = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Do you want to submit anyway?`
      );
      if (!confirmIncomplete) return;
    }

    setSubmittingQuiz(true);
    try {
      const response = await api.submitAnswers({
        history_id: analysisResult.id,
        answers: userAnswers,
      });

      if (response.success && response.data) {
        setQuizResults(response.data);
        // Trigger celebratory confetti if score >= 80%
        if (response.data.comprehension_score >= 80) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      alert(`Failed to submit quiz: ${err.message}`);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Copy Corrected Text
  const handleCopyCorrected = () => {
    if (!analysisResult?.corrected_text) return;
    navigator.clipboard.writeText(analysisResult.corrected_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1-Click Accept Fix from Squiggly Editor
  const handleAcceptFix = (err, replacement) => {
    if (!analysisResult) return;
    const currentText = analysisResult.original_text || text;
    const start = Math.max(0, err.offset);
    const len = Math.max(1, err.length || (err.matched_text ? err.matched_text.length : 1));
    const updated = currentText.slice(0, start) + replacement + currentText.slice(start + len);
    setText(updated);
    setAnalysisResult(prev => ({
      ...prev,
      original_text: updated,
      grammar: {
        ...prev.grammar,
        errors: (prev.grammar?.errors || []).filter(e => e.offset !== err.offset),
        error_count: Math.max(0, (prev.grammar?.error_count || 1) - 1),
      }
    }));
  };

  // Reset workspace
  const handleClear = () => {
    if (text && !window.confirm('Clear all text and start fresh?')) return;
    setText('');
    setTitle('');
    setAnalysisResult(null);
    setQuizResults(null);
    setUserAnswers({});
    setErrorMsg('');
  };

  // Load sample passage
  const handleLoadSample = (sample) => {
    setText(sample.text);
    setTitle(sample.title);
    setAnalysisResult(null);
    setQuizResults(null);
    setUserAnswers({});
    setErrorMsg('');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '32px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Reading Workspace
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Paste or type any English passage to check grammar, test comprehension, and receive instant AI diagnostics.
          </p>
        </div>

        {/* Live Counters Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          padding: '8px 18px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <FileText size={15} style={{ color: 'var(--primary)' }} />
            <span><strong>{wordCount}</strong> words</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span><strong>{charCount}</strong> chars</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Clock size={15} style={{ color: 'var(--warning)' }} />
            <span><strong>{estimatedReadingTime}</strong> min read</span>
          </div>
        </div>
      </div>

      {/* Editor & Input Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        {/* Sample Loaders Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Load Sample:
            </span>
            {SAMPLE_PASSAGES.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => handleLoadSample(s)}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  transition: 'background-color 0.15s',
                }}
                className="sample-btn"
              >
                {s.tag}
              </button>
            ))}
            <span style={{ color: 'var(--border-subtle)', margin: '0 4px' }}>|</span>

            {/* Document / PDF Dropzone Button */}
            <button
              onClick={() => setShowDropzone(prev => !prev)}
              style={{
                fontSize: '0.78rem',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: showDropzone ? 'var(--primary-light)' : 'var(--surface-secondary)',
                color: showDropzone ? 'var(--primary)' : 'var(--text-main)',
                border: `1px solid ${showDropzone ? 'var(--primary)' : 'var(--border-subtle)'}`,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <UploadCloud size={14} style={{ color: 'var(--primary)' }} />
              <span>{showDropzone ? 'Hide PDF Dropzone' : 'Drop or Upload PDF / Doc'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {text && (
              <button
                onClick={handleClear}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger-text)' }}
              >
                <Trash2 size={14} />
                <span>Clear Text</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Document Dropzone Component */}
        {showDropzone && (
          <DocumentDropzone
            onImportText={(extractedText, docTitle) => {
              setText(extractedText);
              if (docTitle) setTitle(docTitle);
              setShowDropzone(false);
              setAnalysisResult(null);
              setQuizResults(null);
              setUserAnswers({});
              setErrorMsg('');
            }}
            onNavigateToCoach={(coachText) => {
              setText(coachText);
              if (setActivePage) {
                setActivePage('pronunciation');
              }
            }}
            onClose={() => setShowDropzone(false)}
          />
        )}

        {/* Optional Title Input */}
        <input
          type="text"
          placeholder="Optional: Passage Title or Topic (e.g. 'Science & Robotics Essay')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '14px',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />

        {/* Textarea */}
        <textarea
          rows={7}
          placeholder="Paste or type an English passage here (minimum 5 words)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'var(--text-main)',
            resize: 'vertical',
            outline: 'none',
            backgroundColor: '#FAFAFC',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.boxShadow = 'none';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setShowDropzone(true);
          }}
        />

        {/* Error notification */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            fontSize: '0.86rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Action Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '18px',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Free local NLP assessment • No personal data stored
          </span>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !text.trim()}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.98rem' }}
          >
            {analyzing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Analyzing Passage...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Analyze Passage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Quick Metrics Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Grammar Score
                </span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisResult.scores.grammar_score}%
                </h4>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}>
                <HelpCircle size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Comprehension
                </span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {quizResults ? `${quizResults.comprehension_score}%` : 'Quiz Ready'}
                </h4>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706'
              }}>
                <BookOpen size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Readability
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {analysisResult.readability.level_label.split(' ')[0]}
                </h4>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED'
              }}>
                <BarChart2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Overall Score
                </span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {quizResults ? `${quizResults.overall_score}%` : `${analysisResult.scores.overall_score}%`}
                </h4>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
            overflowX: 'auto',
          }}>
            <button
              onClick={() => setActiveTab('grammar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: activeTab === 'grammar' ? 700 : 500,
                color: activeTab === 'grammar' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'grammar' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '0.94rem',
              }}
            >
              <Sparkles size={16} />
              <span>Grammar Corrections</span>
              <span className={`badge ${analysisResult.grammar.error_count > 0 ? 'badge-warning' : 'badge-success'}`}>
                {analysisResult.grammar.error_count}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: activeTab === 'quiz' ? 700 : 500,
                color: activeTab === 'quiz' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'quiz' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '0.94rem',
              }}
            >
              <HelpCircle size={16} />
              <span>Comprehension Quiz</span>
              <span className="badge badge-primary">
                {quizResults ? 'Scored' : `${analysisResult.questions.length} Qs`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scores')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: activeTab === 'scores' ? 700 : 500,
                color: activeTab === 'scores' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'scores' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '0.94rem',
              }}
            >
              <BarChart2 size={16} />
              <span>Performance Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: activeTab === 'feedback' ? 700 : 500,
                color: activeTab === 'feedback' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '0.94rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Personalized Feedback</span>
            </button>

            <button
              onClick={() => setActiveTab('tone')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontWeight: activeTab === 'tone' ? 700 : 500,
                color: activeTab === 'tone' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'tone' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '0.94rem',
              }}
            >
              <Palette size={16} />
              <span>Multi-Tone Studio</span>
              <span className="badge badge-primary">4 Styles</span>
            </button>
          </div>

          {/* TAB 1: GRAMMAR CORRECTIONS */}
          {activeTab === 'grammar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}>
                {/* Original Text Pane with Interactive Squiggly Editor */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Interactive Squiggly Editor
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Hover or click wavy underlines to view error category & 1-click accept
                      </p>
                    </div>
                    <span className="badge badge-primary">Live Squiggles</span>
                  </div>
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.98rem',
                    lineHeight: 1.8,
                    border: '1px solid #EEF2F6',
                    minHeight: '160px',
                    position: 'relative',
                  }}>
                    <InlineGrammarEditor 
                      originalText={analysisResult.original_text}
                      errors={analysisResult.grammar?.errors || []}
                      onAcceptFix={handleAcceptFix}
                    />
                  </div>
                </div>

                {/* Corrected Text Pane */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Corrected Text
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        AI-polished version with preserved meaning & fixed grammar
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCorrected}
                      className="btn btn-secondary btn-sm"
                    >
                      {copied ? (
                        <>
                          <Check size={14} style={{ color: 'var(--success)' }} />
                          <span style={{ color: 'var(--success)' }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Corrected</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F0FDF4',
                    fontSize: '0.98rem',
                    lineHeight: 1.8,
                    border: '1px solid #DCFCE7',
                    whiteSpace: 'pre-wrap',
                    minHeight: '160px',
                    color: '#14532D',
                  }}>
                    {analysisResult.corrected_text}
                  </div>
                </div>
              </div>

              {/* Listen & Speak Pronunciation Coach Widget */}
              <AudioSpeechCoach 
                text={analysisResult.corrected_text || analysisResult.original_text}
              />

              {/* Detected Errors List */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Detected Grammar & Spelling Insights
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {analysisResult.grammar.message}
                    </p>
                  </div>
                </div>

                {/* Fine-grained Error Type Breakdown Pills */}
                {analysisResult.grammar.type_counts && Object.keys(analysisResult.grammar.type_counts).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {Object.entries(analysisResult.grammar.type_counts).map(([typeKey, count]) => (
                      <span 
                        key={typeKey} 
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                          color: '#1E40AF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}
                      >
                        {typeKey.replace(/_/g, ' ')}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {analysisResult.grammar.errors.length === 0 ? (
                  <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    backgroundColor: '#F0FDF4',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #DCFCE7',
                  }}>
                    <CheckCircle2 size={32} style={{ color: '#16A34A', margin: '0 auto 10px' }} />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14532D' }}>
                      No Common Errors Detected
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: '#166534', marginTop: '4px' }}>
                      Your text demonstrated high grammatical accuracy, clean punctuation, and proper capitalization.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysisResult.grammar.errors.map((err, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#FFFBEB',
                          border: '1px solid #FEF3C7',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div style={{ maxWidth: '80%' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                              {err.type_label || (err.category ? err.category.toUpperCase() : 'GRAMMAR')}
                            </span>
                            {err.confidence && (
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}>
                                {Math.round(err.confidence * 100)}% Confidence
                              </span>
                            )}
                            {err.requires_review && (
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}>
                                Review Recommended
                              </span>
                            )}
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              Offset {err.offset}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#92400E' }}>
                            {err.explanation || err.message}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'line-through',
                          }}>
                            {err.matched_text || '[missing]'}
                          </span>
                          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}>
                            {err.replacements?.[0] || '[remove]'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMPREHENSION QUIZ */}
          {activeTab === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quiz Header Banner */}
              <div style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Passage Comprehension Assessment
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#4338CA', marginTop: '2px' }}>
                    5 multiple-choice questions dynamically generated from your passage to measure understanding.
                  </p>
                </div>

                {quizResults && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Quiz Score:
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '6px 14px' }}>
                      {quizResults.correct_count} / {quizResults.total_questions} ({quizResults.comprehension_score}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(quizResults ? quizResults.breakdown : analysisResult.questions).map((q, idx) => {
                  const qId = String(q.id);
                  const isSubmitted = !!quizResults;
                  const isCorrect = q.is_correct;
                  const selectedOpt = userAnswers[qId] || q.selected_answer;

                  return (
                    <div 
                      key={q.id} 
                      className="card"
                      style={{
                        padding: '24px',
                        borderColor: isSubmitted 
                          ? (isCorrect ? '#86EFAC' : '#FCA5A5') 
                          : 'var(--border-subtle)',
                        backgroundColor: isSubmitted 
                          ? (isCorrect ? '#F0FDF4' : '#FEF2F2')
                          : 'var(--surface)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {idx + 1}
                          </span>
                          <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                            {q.type} Question
                          </span>
                        </div>

                        {isSubmitted && (
                          <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '18px' }}>
                        {q.question}
                      </h4>

                      {/* Options Grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {q.options.map((opt) => {
                          const isSelected = selectedOpt === opt.id;
                          let optBg = 'var(--surface)';
                          let optBorder = 'var(--border-subtle)';
                          let optColor = 'var(--text-main)';

                          if (isSubmitted) {
                            if (opt.id === q.correct_answer) {
                              optBg = '#DCFCE7';
                              optBorder = '#86EFAC';
                              optColor = '#166534';
                            } else if (isSelected && !isCorrect) {
                              optBg = '#FEE2E2';
                              optBorder = '#FCA5A5';
                              optColor = '#991B1B';
                            }
                          } else if (isSelected) {
                            optBg = 'var(--primary-light)';
                            optBorder = 'var(--primary)';
                            optColor = 'var(--primary)';
                          }

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectOption(qId, opt.id)}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${optBorder}`,
                                backgroundColor: optBg,
                                color: optColor,
                                cursor: isSubmitted ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: `1.5px solid ${isSelected ? 'var(--primary)' : '#CBD5E1'}`,
                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                color: isSelected ? 'white' : 'var(--text-secondary)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {opt.id}
                              </span>
                              <span style={{ fontSize: '0.92rem', fontWeight: isSelected ? 600 : 400 }}>
                                {opt.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box after submission */}
                      {isSubmitted && q.explanation && (
                        <div style={{
                          marginTop: '16px',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.86rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.55,
                        }}>
                          <strong style={{ color: 'var(--text-main)' }}>Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quiz Submit Button */}
              {!quizResults && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '220px' }}
                  >
                    {submittingQuiz ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Scoring Answers...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Submit Quiz & View Score</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERFORMANCE & SCORES */}
          {activeTab === 'scores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Reading Performance & Transparent Scoring
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  Every metric is calculated using verifiable linguistic models without hidden formulas.
                </p>

                {/* Score Rings Container */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '32px',
                  alignItems: 'center',
                  marginBottom: '40px',
                }}>
                  <ScoreRing
                    score={quizResults ? quizResults.overall_score : analysisResult.scores.overall_score}
                    size={130}
                    strokeWidth={11}
                    label="Overall Reading"
                    subLabel="Proficiency"
                    color="#4F46E5"
                  />
                  <ScoreRing
                    score={analysisResult.scores.grammar_score}
                    size={130}
                    strokeWidth={11}
                    label="Grammar Accuracy"
                    subLabel="Mechanics"
                    color="#7C3AED"
                  />
                  <ScoreRing
                    score={quizResults ? quizResults.comprehension_score : 0}
                    size={130}
                    strokeWidth={11}
                    label="Comprehension"
                    subLabel={quizResults ? 'Assessed' : 'Quiz Pending'}
                    color="#059669"
                  />
                  <ScoreRing
                    score={analysisResult.readability.reading_ease}
                    size={130}
                    strokeWidth={11}
                    label="Reading Ease"
                    subLabel={analysisResult.readability.level_label.split(' ')[0]}
                    color="#D97706"
                  />
                </div>

                {/* Documented Formulas Accordion / Cards */}
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                  Documented Mathematical Formulas
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>1. Overall Performance Formula</strong>
                      <span className="badge badge-primary">60% Comp + 40% Grammar</span>
                    </div>
                    <code style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                      {quizResults ? quizResults.overall_formula : analysisResult.scores.overall_formula}
                    </code>
                  </div>

                  <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>2. Grammar Error Density Formula</strong>
                      <span className="badge badge-secondary">Error Density Penalty</span>
                    </div>
                    <code style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                      {analysisResult.scores.grammar_formula}
                    </code>
                  </div>

                  <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>3. Flesch-Kincaid Readability Metric</strong>
                      <span className="badge badge-secondary">{analysisResult.readability.level_label}</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Reading Ease: <strong>{analysisResult.readability.reading_ease} / 100</strong> • Grade Level: <strong>Grade {analysisResult.readability.grade_level}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONALIZED FEEDBACK */}
          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Personalized Reading Recommendations
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Actionable feedback dynamically generated from your passage structure, grammar patterns, and quiz answers.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(quizResults?.feedback || analysisResult.feedback || []).map((fb, i) => {
                    let borderCol = 'var(--border-subtle)';
                    let bgCol = '#F8FAFC';
                    let iconColor = 'var(--primary)';

                    if (fb.type === 'success' || fb.type === 'celebration') {
                      borderCol = '#86EFAC';
                      bgCol = '#F0FDF4';
                      iconColor = '#16A34A';
                    } else if (fb.type === 'warning') {
                      borderCol = '#FDE68A';
                      bgCol = '#FFFBEB';
                      iconColor = '#D97706';
                    }

                    return (
                      <div
                        key={i}
                        style={{
                          padding: '18px 20px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${borderCol}`,
                          backgroundColor: bgCol,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                        }}
                      >
                        <div style={{ marginTop: '2px', color: iconColor }}>
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            {fb.title}
                          </h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {fb.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '32px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleClear}
                    className="btn btn-primary"
                  >
                    <span>Analyze Another Passage</span>
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={() => setActivePage('history')}
                    className="btn btn-secondary"
                  >
                    <span>View Reading History</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MULTI-TONE STUDIO */}
          {activeTab === 'tone' && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <ToneStudioWidget 
                currentText={analysisResult.corrected_text || text}
                onApplyToWorkspace={(rewritten) => {
                  setText(rewritten);
                  alert('Rewritten text applied to workspace input! You can run grammar analysis or edit further.');
                }}
              />
            </div>
          )}
        </div>
      )}

      <style>{`
        .sample-btn:hover {
          background-color: var(--secondary) !important;
          color: var(--secondary-text) !important;
          border-color: var(--primary-border) !important;
        }
      `}</style>
    </div>
  );
}
