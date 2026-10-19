import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Quote, 
  AlertCircle 
} from 'lucide-react';
import api from '../services/api';

export default function ComprehensionPage({ setActivePage }) {
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [passages, setPassages] = useState([]);
  const [activePassage, setActivePassage] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPassages();
  }, [topic, difficulty]);

  const fetchPassages = async () => {
    setLoading(true);
    setUserAnswers({});
    setEvaluationResult(null);
    try {
      const res = await api.getComprehensionPassages(topic, difficulty);
      if (res.success && res.data?.passages) {
        setPassages(res.data.passages);
        if (res.data.passages.length > 0) {
          setActivePassage(res.data.passages[0]);
        } else {
          setActivePassage(null);
        }
      }
    } catch (err) {
      console.error('Failed to load passages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPassage = (p) => {
    setActivePassage(p);
    setUserAnswers({});
    setEvaluationResult(null);
  };

  const handleAnswerChange = (qId, val) => {
    if (evaluationResult) return;
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!activePassage) return;
    const answeredCount = Object.keys(userAnswers).filter(k => !!userAnswers[k].trim()).length;
    if (answeredCount === 0) {
      alert('Please answer the questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitComprehension({
        passage_id: activePassage.id,
        answers: userAnswers
      });

      if (res.success && res.data) {
        setEvaluationResult(res.data);
        if (res.data.score_percentage >= 70) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <BookOpen size={16} />
          <span>Grounded Reading Comprehension</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Evidence-Based Reading Modules
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
          Read carefully curated passages and answer comprehension questions evaluated directly against factual evidence cited in the text.
        </p>
      </div>

      {/* Filter and Passage Selector */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Topic:</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.86rem', backgroundColor: 'white' }}
            >
              <option value="all">All Topics</option>
              <option value="Science">Science & Biology</option>
              <option value="Technology">Technology & Engineering</option>
              <option value="History">History & Culture</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Difficulty:</span>
            {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: difficulty === diff ? 'var(--primary)' : 'var(--surface-secondary)',
                  color: difficulty === diff ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Quick Passage Tabs */}
          {passages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {passages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPassage(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: activePassage?.id === p.id ? 700 : 500,
                    backgroundColor: activePassage?.id === p.id ? 'var(--primary-light)' : 'transparent',
                    color: activePassage?.id === p.id ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Loading leveled reading passages...</p>
        </div>
      ) : !activePassage ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <BookOpen size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Passages Found</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>Try selecting a different topic or difficulty level.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '24px' }}>
          {/* Left Column: Passage Reader */}
          <div className="card" style={{ padding: '28px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary">{activePassage.topic}</span>
                <span className="badge badge-secondary">{activePassage.difficulty}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={14} />
                <span>~{Math.max(1, Math.round(activePassage.word_count / 150))} min read</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', lineHeight: 1.3 }}>
              {activePassage.title}
            </h2>

            <div style={{
              fontSize: '0.98rem',
              lineHeight: 1.85,
              color: '#334155',
              padding: '20px',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #EEF2F6',
              whiteSpace: 'pre-wrap',
            }}>
              {activePassage.text}
            </div>
          </div>

          {/* Right Column: Comprehension Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Score Banner */}
            {evaluationResult && (
              <div className="card" style={{
                padding: '20px',
                backgroundColor: evaluationResult.score_percentage >= 70 ? '#F0FDF4' : '#FFFBEB',
                border: `1px solid ${evaluationResult.score_percentage >= 70 ? '#DCFCE7' : '#FEF3C7'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: evaluationResult.score_percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: evaluationResult.score_percentage >= 70 ? '#16A34A' : '#D97706',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                  }}>
                    {Math.round(evaluationResult.score_percentage)}%
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Comprehension Score: {evaluationResult.correct_count} / {evaluationResult.total_questions} Correct
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Review evidence citations below for each question.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            {activePassage.questions.map((q, idx) => {
              const resItem = evaluationResult?.breakdown?.find(b => b.question_id === q.id);
              const userAns = userAnswers[q.id] || '';

              return (
                <div key={q.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-primary">Question {idx + 1} ({q.type === 'mcq' ? 'MCQ' : 'Short Answer'})</span>
                    {resItem && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: resItem.is_correct ? 'var(--success)' : 'var(--danger-text)',
                      }}>
                        {resItem.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {resItem.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.5 }}>
                    {q.question}
                  </h3>

                  {q.type === 'mcq' && q.options ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt) => {
                        const isSelected = userAns === opt.id;
                        const isCorrect = resItem && resItem.expected_answer === opt.id;
                        const isWrongSelection = resItem && !resItem.is_correct && isSelected;

                        let bg = 'var(--surface)';
                        let border = '1px solid var(--border-subtle)';
                        if (evaluationResult) {
                          if (isCorrect) {
                            bg = '#DCFCE7';
                            border = '2px solid #16A34A';
                          } else if (isWrongSelection) {
                            bg = '#FEE2E2';
                            border = '2px solid #DC2626';
                          }
                        } else if (isSelected) {
                          bg = 'var(--primary-light)';
                          border = '2px solid var(--primary)';
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt.id)}
                            disabled={!!evaluationResult}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: bg,
                              border,
                              fontSize: '0.88rem',
                              textAlign: 'left',
                              cursor: evaluationResult ? 'default' : 'pointer',
                              fontWeight: isSelected ? 700 : 500,
                            }}
                          >
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-secondary)',
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Type short answer here..."
                        value={userAns}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={!!evaluationResult}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.88rem',
                        }}
                      />
                    </div>
                  )}

                  {/* Passage Evidence Citation */}
                  {resItem && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #EEF2F6',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      color: 'var(--text-secondary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 700, marginBottom: '2px' }}>
                        <Quote size={13} style={{ color: 'var(--primary)' }} />
                        <span>Passage Evidence Citation:</span>
                      </div>
                      <em>"{resItem.passage_evidence}"</em>
                    </div>
                  )}
                </div>
              );
            })}

            {!evaluationResult && (
              <button
                onClick={handleSubmit}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={submitting}
              >
                <span>{submitting ? 'Checking evidence...' : 'Submit Answers'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
