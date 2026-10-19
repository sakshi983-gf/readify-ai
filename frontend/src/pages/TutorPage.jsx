import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RefreshCw, 
  Briefcase, 
  GraduationCap, 
  Coffee, 
  HelpCircle, 
  BookOpen, 
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Scale
} from 'lucide-react';
import api from '../services/api';

function formatInline(str) {
  // Bold **text** -> strong
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#1E1B4B' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderFormattedMessage(text, isUser) {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
  }

  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '3px' }} />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1E1B4B', margin: '8px 0 2px' }}>
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed === '---') {
          return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '8px 0' }} />;
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} style={{
              borderLeft: '3px solid #4F46E5',
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '4px',
              margin: '6px 0',
              fontStyle: 'italic',
              color: '#1E293B',
              fontSize: '0.94rem'
            }}>
              {formatInline(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '8px', paddingLeft: '8px', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <div style={{ flex: 1 }}>{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }
        return <div key={idx} style={{ lineHeight: 1.65 }}>{formatInline(trimmed)}</div>;
      })}
    </div>
  );
}

export default function TutorPage({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user ? user.name.split(' ')[0] : 'there'}! 👋 I am your **Readify AI English Tutor**.\n\nI can help you:\n- ✍️ **Explain any grammar mistake** in plain English\n- 🎭 **Practice conversational English** in realistic roleplays (Job interview, debate, coffee chat)\n- 📚 **Enrich your vocabulary** with sophisticated synonyms and examples\n- 📖 **Analyze reading passages** and clarify sentence structures\n\nHow can I help you improve your English today?`,
      suggestions: [
        "Explain Subject-Verb Agreement simply",
        "Give me 5 advanced synonyms for 'important'",
        "Start a Job Interview practice roleplay",
        "Why is 'She go to school' incorrect?"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('general'); // 'general' | 'roleplay' | 'explain_grammar' | 'vocab'
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.sendTutorMessage({
        message: text,
        history: history,
        mode: currentMode,
      });

      if (res.success && res.data) {
        if (res.data.mode) {
          setCurrentMode(res.data.mode);
        }
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.data.reply,
          suggestions: res.data.suggested_prompts || [],
          corrections: res.data.corrections || []
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: "I am having trouble processing that right now. Please ensure the Readify backend is running.",
          suggestions: ["Try asking again", "Explain Subject-Verb Agreement"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setCurrentMode('general');
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: "Chat cleared! What English topic, grammar question, or roleplay scenario would you like to explore next?",
        suggestions: [
          "Explain Subject-Verb Agreement",
          "Give me synonyms for 'show'",
          "Start a Job Interview roleplay",
          "Check a sentence for grammar errors"
        ]
      }
    ]);
  };

  const startRoleplay = (scenarioId) => {
    setCurrentMode('roleplay');
    let prompt = "Let's begin a practice conversation.";
    if (scenarioId === 'interview') {
      prompt = "Hello! I am ready for our job interview practice. Please ask me the first interview question.";
    } else if (scenarioId === 'seminar') {
      prompt = "Hello Professor! I am ready for our university seminar discussion on technology in education.";
    } else if (scenarioId === 'coffee') {
      prompt = "Hey! Let's have a casual conversation in English like two friends at a coffee shop.";
    } else if (scenarioId === 'debate') {
      prompt = "Can we switch to an academic debate roleplay on AI in education?";
    }
    handleSend(prompt);
  };

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px 20px',
      height: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Strip */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Readify AI English Tutor
              </h1>
              <span className="badge badge-success">Online & Local</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Your 24/7 personal conversational mentor, writing coach, and grammar explainer.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleClearChat}
            className="btn btn-secondary btn-sm"
            title="Clear Chat History"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Roleplay Presets Quick Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Practice Scenarios:
        </span>
        <button
          onClick={() => startRoleplay('interview')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          <Briefcase size={13} style={{ color: '#4F46E5' }} />
          <span>Job Interview</span>
        </button>
        <button
          onClick={() => startRoleplay('seminar')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          <GraduationCap size={13} style={{ color: '#059669' }} />
          <span>Academic Seminar</span>
        </button>
        <button
          onClick={() => startRoleplay('coffee')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          <Coffee size={13} style={{ color: '#D97706' }} />
          <span>Coffee Chat</span>
        </button>
        <button
          onClick={() => startRoleplay('debate')}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          <Scale size={13} style={{ color: '#7C3AED' }} />
          <span>Academic Debate</span>
        </button>

        {currentMode !== 'general' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#EEF2FF',
            color: 'var(--primary)',
            fontSize: '0.74rem',
            fontWeight: 700,
            marginLeft: 'auto'
          }}>
            <span>Active: {currentMode.replace('_', ' ').toUpperCase()}</span>
            <button
              onClick={() => setCurrentMode('general')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: 800,
                padding: '0 2px'
              }}
              title="Return to General Chat"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}>
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: isUser ? 'var(--primary)' : '#FAF5FF',
                color: isUser ? 'white' : '#7C3AED',
                border: isUser ? 'none' : '1px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isUser ? <User size={16} /> : <Bot size={18} />}
              </div>

              {/* Message Bubble Content */}
              <div style={{
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isUser ? 'var(--primary)' : '#FFFFFF',
                  color: isUser ? 'white' : 'var(--text-main)',
                  boxShadow: isUser ? '0 2px 6px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: '0.94rem',
                  lineHeight: 1.65
                }}>
                  {renderFormattedMessage(m.text, isUser)}
                </div>

                {/* Inline Grammar Tip on student's prompt */}
                {m.corrections && m.corrections.length > 0 && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FEF3C7',
                    fontSize: '0.78rem',
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Lightbulb size={14} style={{ color: '#D97706' }} />
                    <span>
                      <strong>Helpful Tip:</strong> '{m.corrections[0].matched_text}' &rarr; '{m.corrections[0].replacements?.[0]}'. {m.corrections[0].message}
                    </span>
                  </div>
                )}

                {/* Suggestion Chips */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.76rem',
                          color: '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        className="suggestion-chip"
                      >
                        <Sparkles size={11} style={{ color: 'var(--primary)' }} />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: '#FAF5FF',
              color: '#7C3AED',
              border: '1px solid #E9D5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={18} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px',
              backgroundColor: 'white',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <RefreshCw size={14} className="animate-spin" />
              <span>Readify AI is composing a response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Composer Strip */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'white',
            borderRadius: 'var(--radius-full)',
            padding: '6px 8px 6px 18px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a grammar question, request vocabulary, or practice conversation..."
            disabled={loading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.92rem',
              color: 'var(--text-main)',
              backgroundColor: 'transparent'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: input.trim() && !loading ? 'var(--primary)' : '#E2E8F0',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <style>{`
        .suggestion-chip:hover {
          background-color: var(--primary-light) !important;
          color: var(--primary) !important;
          border-color: var(--primary-border) !important;
        }
      `}</style>
    </div>
  );
}
