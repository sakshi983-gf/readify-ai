import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  Layers, 
  BookOpen, 
  AlertCircle,
  Filter
} from 'lucide-react';
import api from '../services/api';

export default function PracticePage({ setActivePage }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Practice session state
  const [userAnswers, setUserAnswers] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch exercises when filters change
  useEffect(() => {
    fetchExercises();
  }, [selectedCategory, selectedDifficulty]);

  const fetchCategories = async () => {
    try {
      const res = await api.getPracticeCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    setErrorMsg('');
    setUserAnswers({});
    setSubmissionResult(null);

    try {
      const res = await api.getPracticeExercises(selectedCategory, selectedDifficulty, 5);
      if (res.success && res.data) {
        setExercises(res.data.exercises || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load exercises.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    if (submissionResult) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPractice({
        category: selectedCategory,
        difficulty: selectedDifficulty,
        answers: userAnswers,
      });

      if (res.success && res.data) {
        setSubmissionResult(res.data);
        if (res.data.score_percentage >= 80) {
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <Sparkles size={16} />
          <span>Interactive Grammar Practice</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Master English Grammar Rules
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
          Target your weak areas with interactive multiple-choice drills, fill-in-the-blanks, and detailed pedagogical explanations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Topic:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.86rem', backgroundColor: 'white' }}
            >
              <option value="all">All Grammar Topics</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.available_exercises} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Level:</span>
            {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: selectedDifficulty === diff ? 'var(--primary)' : 'var(--surface-secondary)',
                  color: selectedDifficulty === diff ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                }}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Reset / Reload Button */}
          <button
            onClick={fetchExercises}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={14} />
            <span>Reset Drills</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Loading verified grammar exercises...</p>
        </div>
      ) : errorMsg ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--danger-text)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{errorMsg}</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <BookOpen size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Exercises Found</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Try selecting a different topic or difficulty level above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Submission Results Banner */}
          {submissionResult && (
            <div className="card" style={{
              padding: '24px',
              backgroundColor: submissionResult.score_percentage >= 70 ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${submissionResult.score_percentage >= 70 ? '#DCFCE7' : '#FEF3C7'}`,
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: submissionResult.score_percentage >= 70 ? '#DCFCE7' : '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: submissionResult.score_percentage >= 70 ? '#16A34A' : '#D97706',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                  }}>
                    {Math.round(submissionResult.score_percentage)}%
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Practice Session Score: {submissionResult.correct_count} / {submissionResult.total_questions} Correct
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {submissionResult.recommendation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchExercises}
                  className="btn btn-primary"
                >
                  <span>Practice More Drills</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Exercise Cards */}
          {exercises.map((ex, idx) => {
            const resultItem = submissionResult?.breakdown?.find(b => b.question_id === ex.id);
            const userChoice = userAnswers[ex.id];

            return (
              <div key={ex.id} className="card" style={{ padding: '24px', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-primary">Question {idx + 1}</span>
                    <span className="badge badge-secondary">{ex.category_label}</span>
                    <span className="badge" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-muted)' }}>
                      {ex.difficulty}
                    </span>
                  </div>

                  {resultItem && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700 }}>
                      {resultItem.is_correct ? (
                        <>
                          <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                          <span style={{ color: 'var(--success)' }}>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={18} style={{ color: 'var(--danger-text)' }} />
                          <span style={{ color: 'var(--danger-text)' }}>Incorrect</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Prompt */}
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '18px' }}>
                  {ex.question}
                </h3>

                {/* Multiple Choice Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ex.options.map((opt) => {
                    const isSelected = userChoice === opt.id;
                    const isCorrect = resultItem && resultItem.correct_answer === opt.id;
                    const isWrongSelection = resultItem && !resultItem.is_correct && isSelected;

                    let bg = 'var(--surface)';
                    let border = '1px solid var(--border-subtle)';
                    let color = 'var(--text-main)';

                    if (submissionResult) {
                      if (isCorrect) {
                        bg = '#DCFCE7';
                        border = '2px solid #16A34A';
                        color = '#14532D';
                      } else if (isWrongSelection) {
                        bg = '#FEE2E2';
                        border = '2px solid #DC2626';
                        color = '#991B1B';
                      }
                    } else if (isSelected) {
                      bg = 'var(--primary-light)';
                      border = '2px solid var(--primary)';
                      color = 'var(--primary)';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(ex.id, opt.id)}
                        disabled={!!submissionResult}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: bg,
                          border,
                          color,
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          cursor: submissionResult ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-secondary)',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                        }}>
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation Callout */}
                {resultItem && (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #EEF2F6',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>Explanation: </strong>
                    {resultItem.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Action */}
          {!submissionResult && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={handleSubmit}
                className="btn btn-primary btn-lg"
                disabled={submitting || Object.keys(userAnswers).length === 0}
              >
                <span>{submitting ? 'Evaluating...' : 'Submit Answers & Receive Score'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
