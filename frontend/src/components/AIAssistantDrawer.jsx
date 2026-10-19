import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Minimize2, Lightbulb } from 'lucide-react';
import api from '../services/api';

export default function AIAssistantDrawer({ activePassage = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'drawer-intro',
      sender: 'ai',
      text: "Hi! I'm your Readify AI Assistant. Need help explaining an error, improving a sentence, or finding a better word?",
      suggestions: [
        "Explain Subject-Verb Agreement",
        "Give me synonyms for 'important'",
        "Help me rewrite this sentence"
      ]
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.sendTutorMessage({
        message: text,
        history,
        mode: 'general',
        current_passage: activePassage
      });

      if (res.success && res.data) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: res.data.reply,
            suggestions: res.data.suggested_prompts || [],
            corrections: res.data.corrections || []
          }
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: "I had trouble with that request. Please try again.",
          suggestions: ["Explain Subject-Verb Agreement"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          className="floating-ai-btn"
          title="Open Readify AI Tutor Assistant"
        >
          <Bot size={18} />
          <span>Ask AI Tutor</span>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 6px #10B981'
          }} />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '520px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Readify AI Tutor</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>Online English Mentor</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px'
              }}
              title="Close Drawer"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F8FAFC'
          }}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: isUser ? 'var(--primary)' : '#FFFFFF',
                    color: isUser ? 'white' : 'var(--text-main)',
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    border: isUser ? 'none' : '1px solid #E2E8F0',
                    boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {m.text}
                  </div>

                  {m.corrections && m.corrections.length > 0 && (
                    <div style={{
                      fontSize: '0.74rem',
                      color: '#92400E',
                      backgroundColor: '#FEF3C7',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      maxWidth: '85%'
                    }}>
                      Tip: '{m.corrections[0].matched_text}' &rarr; '{m.corrections[0].replacements?.[0]}'
                    </div>
                  )}

                  {m.suggestions && m.suggestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {m.suggestions.slice(0, 2).map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.72rem',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                AI Tutor is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'white'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI tutor..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: input.trim() && !loading ? 'var(--primary)' : '#E2E8F0',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'default'
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .floating-ai-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(79, 70, 229, 0.55);
        }
      `}</style>
    </>
  );
}
