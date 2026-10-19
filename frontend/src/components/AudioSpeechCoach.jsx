import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import api from '../services/api';

export default function AudioSpeechCoach({ text = '', onSpokenCorrectly }) {
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [synthAvailable, setSynthAvailable] = useState(false);
  const utteranceRef = useRef(null);

  // STT Pronunciation State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState(null);
  const [wordAnalysis, setWordAnalysis] = useState([]);
  const [cefrLevel, setCefrLevel] = useState(null);
  const [wpm, setWpm] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check browser speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynthAvailable(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSttSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        setIsRecording(false);
        const elapsed = startTimeRef.current 
          ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
          : 3;
        await evaluatePronunciation(spoken, text, elapsed);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  // Handle Text-To-Speech Playback
  const handlePlayTTS = () => {
    if (!synthAvailable || !text) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel(); // clear previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopTTS = () => {
    if (synthAvailable) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Handle Microphone Recording
  const handleToggleRecording = () => {
    if (!sttSupported || !recognitionRef.current) {
      alert('Speech Recognition is not supported on this browser. Chrome, Edge, or Safari are recommended.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setPronunciationScore(null);
      setWordAnalysis([]);
      setCefrLevel(null);
      setWpm(null);
      startTimeRef.current = Date.now();
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Start recognition error:', err);
      }
    }
  };

  // Evaluate spoken words against target sentence using Backend CMUDict + PER
  const evaluatePronunciation = async (spoken, target, duration = 3) => {
    setIsEvaluating(true);
    try {
      const res = await api.evaluatePronunciation({
        reference_text: target,
        spoken_text: spoken,
        duration_seconds: duration
      });

      if (res.success && res.data) {
        const score = res.data.overall_score;
        setPronunciationScore(score);
        setCefrLevel(res.data.cefr_level);
        setWpm(res.data.words_per_minute);

        const mappedAnalysis = (res.data.word_analysis || []).map(w => ({
          word: w.word,
          matched: w.status === 'perfect' || w.status === 'good',
          status: w.status,
          phonemes: w.phonemes,
          tip: w.tip
        }));
        setWordAnalysis(mappedAnalysis);

        if (score >= 80 && onSpokenCorrectly) {
          onSpokenCorrectly(score);
        }
        return;
      }
    } catch (e) {
      console.warn('Backend phonetic evaluation fallback:', e);
    } finally {
      setIsEvaluating(false);
    }

    // Client-side fallback if backend call unavailable
    const cleanWords = (str) => 
      str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    const spokenTokens = cleanWords(spoken);
    const targetTokens = cleanWords(target);

    if (targetTokens.length === 0) return;

    let matches = 0;
    const analysis = targetTokens.map((targetWord) => {
      const isMatched = spokenTokens.includes(targetWord);
      if (isMatched) matches += 1;
      return {
        word: targetWord,
        matched: isMatched
      };
    });

    const score = Math.round((matches / targetTokens.length) * 100);
    setPronunciationScore(score);
    setWordAnalysis(analysis);

    if (score >= 80 && onSpokenCorrectly) {
      onSpokenCorrectly(score);
    }
  };

  return (
    <div style={{
      padding: '20px',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Volume2 size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Audio & Pronunciation Coach
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Listen to native pacing and practice speaking into your microphone for real-time fluency scoring.
            </p>
          </div>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>Speed:</span>
          {[0.75, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                setSpeechRate(rate);
                if (isPlaying) {
                  handleStopTTS();
                }
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid var(--border-subtle)',
                backgroundColor: speechRate === rate ? 'var(--primary)' : 'white',
                color: speechRate === rate ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons Strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {/* TTS Play / Pause */}
        <button
          onClick={handlePlayTTS}
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'} btn-sm`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {isPlaying ? (
            <>
              <Pause size={14} />
              <span>Pause Audio</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Listen to Passage ({speechRate}x)</span>
            </>
          )}
        </button>

        {/* Microphone Recording Button */}
        <button
          onClick={handleToggleRecording}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: isRecording ? '1px solid #EF4444' : '1px solid #E2E8F0',
            backgroundColor: isRecording ? '#FEE2E2' : 'white',
            color: isRecording ? '#DC2626' : 'var(--text-main)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isRecording ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
          }}
        >
          {isRecording ? (
            <>
              <MicOff size={14} className="animate-pulse" />
              <span>Listening... (Speak Now)</span>
            </>
          ) : (
            <>
              <Mic size={14} style={{ color: 'var(--primary)' }} />
              <span>Practice Pronunciation</span>
            </>
          )}
        </button>
      </div>

      {/* Live Speaking Feedback Card */}
      {(transcript || pronunciationScore !== null) && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pronunciation Accuracy
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {cefrLevel && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  letterSpacing: '0.04em'
                }}>
                  CEFR {cefrLevel}
                </span>
              )}
              {wpm !== null && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E'
                }}>
                  {wpm} WPM
                </span>
              )}
              {pronunciationScore !== null && (
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: pronunciationScore >= 80 ? '#059669' : pronunciationScore >= 60 ? '#D97706' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Award size={14} />
                  {pronunciationScore}% Accuracy
                </span>
              )}
            </div>
          </div>

          {/* Spoken sentence word-by-word visual alignment */}
          {wordAnalysis.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {wordAnalysis.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    backgroundColor: item.matched ? '#DCFCE7' : '#FEE2E2',
                    color: item.matched ? '#166534' : '#991B1B',
                  }}
                  title={item.matched ? 'Pronounced clearly' : 'Missed or mispronounced'}
                >
                  {item.word}
                </span>
              ))}
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Recognized Speech:</strong> <em>"{transcript}"</em>
          </p>
        </div>
      )}
    </div>
  );
}
