import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Gauge, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight,
  BookOpen,
  Sliders,
  Flame,
  VolumeX,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function PronunciationPage({ setActivePage, user }) {
  // Mode: 'curated' | 'custom' | 'minimal_pairs'
  const [activeTab, setActiveTab] = useState('curated');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  // Exercises state
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Target text & custom input
  const [targetText, setTargetText] = useState("Good morning! I am very excited to practice my English pronunciation today.");
  const [customInputText, setCustomInputText] = useState("");
  const [exerciseMeta, setExerciseMeta] = useState(null);

  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const utteranceRef = useRef(null);

  // STT & Evaluation State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch Exercises from Backend
  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoadingExercises(true);
    try {
      const res = await api.getPronunciationExercises();
      if (res.success && res.data && res.data.length > 0) {
        setExercises(res.data);
        const first = res.data[0];
        setTargetText(first.text);
        setExerciseMeta(first);
      }
    } catch (err) {
      console.error('Failed to load pronunciation exercises:', err);
    } finally {
      setLoadingExercises(false);
    }
  };

  // Populate browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(enVoices.length > 0 ? enVoices : voices);
        if (enVoices.length > 0 && !selectedVoice) {
          // Prefer US or UK native voices if present
          const preferred = enVoices.find(v => v.lang.includes('US') || v.lang.includes('GB')) || enVoices[0];
          setSelectedVoice(preferred.name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenTranscript(transcript);
      setIsRecording(false);
      clearInterval(timerRef.current);

      const elapsed = startTimeRef.current 
        ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
        : Math.max(1, recordingSeconds);

      await runEvaluation(targetText, transcript, elapsed);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition status:', event.error);
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (event.error === 'no-speech') {
        setErrorMsg('No speech detected. Please speak closer to your microphone.');
      } else if (event.error === 'not-allowed') {
        setErrorMsg('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearInterval(timerRef.current);
    };
  }, [targetText, recordingSeconds]);

  // Run Backend CMUDict Evaluation
  const runEvaluation = async (reference, spoken, duration) => {
    setIsEvaluating(true);
    setErrorMsg('');
    try {
      const res = await api.evaluatePronunciation({
        reference_text: reference,
        spoken_text: spoken,
        duration_seconds: duration
      });

      if (res.success && res.data) {
        setEvaluationResult(res.data);
        if (res.data.word_analysis && res.data.word_analysis.length > 0) {
          setSelectedWordDetail(res.data.word_analysis[0]);
        }
      } else {
        setErrorMsg(res.error || 'Evaluation failed. Please try again.');
      }
    } catch (err) {
      console.error('Pronunciation evaluation error:', err);
      setErrorMsg('Failed to evaluate audio against phonetic model.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // TTS Play / Pause
  const handleToggleTTS = () => {
    if (!('speechSynthesis' in window) || !targetText) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      const voiceObj = availableVoices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    // Highlight words on boundary if supported
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const textBefore = targetText.slice(0, event.charIndex);
        const wordIdx = textBefore.trim().split(/\s+/).filter(Boolean).length;
        setCurrentWordIndex(wordIdx);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utteranceRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // Microphone toggle
  const handleToggleRecording = () => {
    if (!sttSupported || !recognitionRef.current) {
      alert('Speech Recognition is not available in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    } else {
      setSpokenTranscript('');
      setEvaluationResult(null);
      setErrorMsg('');
      setRecordingSeconds(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
    }
  };

  // Select Exercise
  const handleSelectExercise = (exercise, index) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setCurrentExerciseIndex(index);
    setTargetText(exercise.text);
    setExerciseMeta(exercise);
    setSpokenTranscript('');
    setEvaluationResult(null);
    setSelectedWordDetail(null);
    setErrorMsg('');
  };

  // Apply Custom Text
  const handleApplyCustomText = () => {
    if (!customInputText.trim()) return;
    setTargetText(customInputText.trim());
    setExerciseMeta({
      title: "Custom Practice Sentence",
      level: "Custom",
      focus: "Self-Selected Material",
      description: "User supplied sentence or paragraph for phonetic assessment."
    });
    setSpokenTranscript('');
    setEvaluationResult(null);
    setSelectedWordDetail(null);
    setErrorMsg('');
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    if (activeTab === 'minimal_pairs') return ex.category === 'minimal_pairs';
    if (selectedLevel === 'all') return true;
    return ex.level.toLowerCase() === selectedLevel.toLowerCase();
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <Headphones size={18} />
          <span>Module 15: Acoustic & Phonetic Speech Intelligence</span>
        </div>
        <h1 style={{ fontSize: '1.95rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Listen & Speak: Audio & Pronunciation Coach
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '860px', lineHeight: 1.6 }}>
          Master natural English pacing, phonetic precision, and conversational clarity. Evaluated using the canonical 
          <strong> Carnegie Mellon University Pronouncing Dictionary (CMUDict)</strong>, Levenshtein Phonetic Distance, and international <strong>CEFR spoken fluency levels</strong>.
        </p>
      </div>

      {/* Tabs Strip */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '6px',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setActiveTab('curated'); setSelectedLevel('all'); }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'curated' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'curated' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Curated Drills ({exercises.length})
          </button>

          <button
            onClick={() => { setActiveTab('minimal_pairs'); }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'minimal_pairs' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'minimal_pairs' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Minimal Pairs & Phoneme Contrast
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'custom' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'custom' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Custom Practice Input
          </button>
        </div>

        {/* Level Filter for Curated */}
        {activeTab === 'curated' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Difficulty:</span>
            {['all', 'beginner', 'intermediate', 'advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: '1px solid',
                  borderColor: selectedLevel === lvl ? 'var(--primary)' : 'var(--border-subtle)',
                  backgroundColor: selectedLevel === lvl ? 'var(--primary-light)' : 'transparent',
                  color: selectedLevel === lvl ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Left = Target Text & Audio Player, Right = Mic Station & Live Feedback */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '24px', marginBottom: '28px' }}>
        {/* Left Column: Target Passage & TTS Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Sentence Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  textTransform: 'uppercase'
                }}>
                  {exerciseMeta?.level || 'Drill'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {exerciseMeta?.title || 'Target Articulation Sentence'}
                </span>
              </div>

              {exerciseMeta?.focus && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Focus: <strong>{exerciseMeta.focus}</strong>
                </span>
              )}
            </div>

            {/* Target Display with Dynamic Word Highlighting */}
            <div style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: '1.25rem',
              lineHeight: 1.8,
              fontWeight: 500,
              color: '#1E293B',
              marginBottom: '20px',
              minHeight: '120px'
            }}>
              {targetText.split(/\s+/).map((word, idx) => {
                const isCurrentWord = isPlaying && currentWordIndex === idx;
                return (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-block',
                      marginRight: '6px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isCurrentWord ? '#FEF08A' : 'transparent',
                      color: isCurrentWord ? '#854D0E' : 'inherit',
                      fontWeight: isCurrentWord ? 700 : 'inherit',
                      transform: isCurrentWord ? 'scale(1.05)' : 'none',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* TTS Audio Controls Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#F1F5F9',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleToggleTTS}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={16} />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Listen to Native Voice</span>
                    </>
                  )}
                </button>

                {isPlaying && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                    <Volume2 size={16} className="animate-pulse" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Speaking ({speechRate}x)...</span>
                  </div>
                )}
              </div>

              {/* Speed Pacing Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pacing:</span>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      if (isPlaying) {
                        window.speechSynthesis.cancel();
                        setIsPlaying(false);
                      }
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: speechRate === rate ? 'var(--primary)' : '#CBD5E1',
                      backgroundColor: speechRate === rate ? 'var(--primary)' : 'white',
                      color: speechRate === rate ? 'white' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Mode Form */}
            {activeTab === 'custom' && (
              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Paste or Type Your Own Practice Text:
                </label>
                <textarea
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="Enter any sentence or paragraph to practice speaking and receive phonetic scoring..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={handleApplyCustomText}
                  className="btn btn-secondary btn-sm"
                  disabled={!customInputText.trim()}
                >
                  Load Custom Text for Evaluation
                </button>
              </div>
            )}
          </div>

          {/* Curated Drill Picker Carousel */}
          {activeTab !== 'custom' && filteredExercises.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                <span>Select Practice Drill ({filteredExercises.length} available)</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredExercises.map((ex, idx) => {
                  const isCurrent = targetText === ex.text;
                  return (
                    <div
                      key={ex.id || idx}
                      onClick={() => handleSelectExercise(ex, idx)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: isCurrent ? 'var(--primary)' : 'var(--border-subtle)',
                        backgroundColor: isCurrent ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--text-main)' }}>
                          {ex.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>
                          {ex.level}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Microphone Recording Station */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Microphone Speech Studio
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Press the microphone and read the target passage aloud into your microphone.
            </p>

            {/* Giant Pulsating Mic Button */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '-12px',
                  right: '-12px',
                  bottom: '-12px',
                  borderRadius: '50%',
                  border: '3px solid #EF4444',
                  animation: 'pulse 1.5s infinite',
                  opacity: 0.6
                }} />
              )}
              <button
                onClick={handleToggleRecording}
                disabled={isEvaluating}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isRecording ? '#DC2626' : 'var(--primary)',
                  color: 'white',
                  cursor: isEvaluating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isRecording ? '0 0 25px rgba(220, 38, 38, 0.6)' : '0 10px 25px rgba(79, 70, 229, 0.4)',
                  transition: 'all 0.2s ease',
                  transform: isRecording ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
              </button>
            </div>

            {/* Recording Status & Timer */}
            <div style={{ marginBottom: '16px' }}>
              {isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626', animation: 'ping 1s infinite' }} />
                  <span>Recording... {recordingSeconds}s</span>
                </div>
              ) : isEvaluating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Evaluating Phonetic Distance (CMUDict)...</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Click to start speaking
                </span>
              )}
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                width: '100%',
                textAlign: 'left'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Recognized Spoken Speech Preview */}
            {spokenTranscript && (
              <div style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Recognized Acoustic Transcript:
                </span>
                <p style={{ fontSize: '0.92rem', color: '#1E293B', fontStyle: 'italic', margin: 0 }}>
                  "{spokenTranscript}"
                </p>
              </div>
            )}
          </div>

          {/* Quick Tips Box */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <span>How Scoring Works (Examiner Note)</span>
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              The engine matches your spoken tokens against the <strong>123,455-word CMU Pronouncing Dictionary</strong>. 
              It executes dynamic Levenshtein phoneme alignment to compute the <strong>Phoneme Error Rate (PER)</strong>, speech tempo (WPM), and assigns an official <strong>CEFR Spoken Fluency tier (A1–C2)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Phonetic Diagnostic Report Card */}
      {evaluationResult && (
        <div className="card animate-fade-in" style={{ padding: '28px', border: '1.5px solid var(--primary-light)', boxShadow: '0 8px 30px rgba(79, 70, 229, 0.08)' }}>
          {/* Diagnostic Header with CEFR Badge */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  letterSpacing: '0.05em'
                }}>
                  CEFR LEVEL: {evaluationResult.cefr_level}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Acoustic & Phonetic Performance Report
                </h2>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                {evaluationResult.cefr_description}
              </p>
            </div>

            {/* Big Overall Score Ring */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: evaluationResult.overall_score >= 80 ? '#ECFDF5' : evaluationResult.overall_score >= 65 ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${evaluationResult.overall_score >= 80 ? '#A7F3D0' : evaluationResult.overall_score >= 65 ? '#FDE68A' : '#FECACA'}`
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: evaluationResult.overall_score >= 80 ? '#059669' : evaluationResult.overall_score >= 65 ? '#D97706' : '#DC2626'
              }}>
                {evaluationResult.overall_score}%
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                  Pronunciation Score
                </span>
                <span style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: evaluationResult.overall_score >= 80 ? '#059669' : evaluationResult.overall_score >= 65 ? '#D97706' : '#DC2626'
                }}>
                  {evaluationResult.overall_score >= 85 ? 'Excellent Articulation' : evaluationResult.overall_score >= 70 ? 'Competent Fluency' : 'Needs Practice'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Diagnostic Pillars: Accuracy, Completeness, Fluency, Speech Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {/* Accuracy Pillar */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Phoneme Accuracy
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                  {evaluationResult.accuracy_score}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ width: `${evaluationResult.accuracy_score}%`, height: '100%', backgroundColor: '#059669', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                Clarity of pronounced sounds
              </span>
            </div>

            {/* Completeness Pillar */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Word Completeness
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {evaluationResult.completeness_score}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ width: `${evaluationResult.completeness_score}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                Ratio of words articulated
              </span>
            </div>

            {/* Fluency Pillar */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Spoken Rhythm
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#7C3AED' }}>
                  {evaluationResult.fluency_score}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                <div style={{ width: `${evaluationResult.fluency_score}%`, height: '100%', backgroundColor: '#7C3AED', borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                Pacing & continuous delivery
              </span>
            </div>

            {/* WPM & Tempo Pillar */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Speaking Velocity
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}>
                  {evaluationResult.words_per_minute} WPM
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: evaluationResult.pace_assessment === 'Ideal conversational pace' ? '#059669' : '#D97706',
                display: 'block'
              }}>
                {evaluationResult.pace_assessment}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Standard target: 110–160 WPM
              </span>
            </div>
          </div>

          {/* Word-by-Word Phonemic Alignment Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Interactive Word-by-Word Phonetic Alignment
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Click any word below to inspect its CMU phonemes and articulation coaching
              </span>
            </div>

            {/* Word Tiles Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              {evaluationResult.word_analysis.map((wordItem, idx) => {
                const isSelected = selectedWordDetail?.word === wordItem.word;
                let bg = '#DCFCE7';
                let border = '#86EFAC';
                let textCol = '#166534';

                if (wordItem.status === 'needs_work') {
                  bg = '#FEF3C7';
                  border = '#FCD34D';
                  textCol = '#92400E';
                } else if (wordItem.status === 'omitted') {
                  bg = '#FEE2E2';
                  border = '#FCA5A5';
                  textCol = '#991B1B';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedWordDetail(wordItem)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: bg,
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : border}`,
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.05)' : 'none',
                      boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, color: textCol }}>
                      {wordItem.word}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: textCol, opacity: 0.85, fontFamily: 'monospace' }}>
                      {wordItem.phonemes || '...'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Word Deep Dive Panel */}
          {selectedWordDetail && (
            <div style={{
              padding: '18px 22px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A8A' }}>
                    Word: "{selectedWordDetail.word}"
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    backgroundColor: selectedWordDetail.status === 'perfect' || selectedWordDetail.status === 'good' ? '#DCFCE7' : '#FEE2E2',
                    color: selectedWordDetail.status === 'perfect' || selectedWordDetail.status === 'good' ? '#166534' : '#991B1B'
                  }}>
                    {selectedWordDetail.status.replace('_', ' ')}
                  </span>
                </div>

                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                  ARPAbet: {selectedWordDetail.phonemes}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
                💡 <strong>Articulation Tip:</strong> {selectedWordDetail.tip || 'Pronounce each syllable distinctly with proper tongue placement.'}
              </p>
            </div>
          )}

          {/* Articulation Feedback Recommendations */}
          {evaluationResult.feedback && evaluationResult.feedback.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                Coaching Feedback & Phonetic Recommendations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {evaluationResult.feedback.map((fb, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                    <span>{fb}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Retry or Next */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleToggleRecording}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={16} />
              <span>Practice Again</span>
            </button>

            {filteredExercises.length > 0 && (
              <button
                onClick={() => {
                  const nextIdx = (currentExerciseIndex + 1) % filteredExercises.length;
                  handleSelectExercise(filteredExercises[nextIdx], nextIdx);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Next Drill</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
