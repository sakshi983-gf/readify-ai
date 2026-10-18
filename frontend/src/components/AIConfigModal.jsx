import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Check, AlertCircle, X, Shield, Cpu, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AIConfigModal({ isOpen, onClose }) {
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Check current config
      fetch('/api/ai-config')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCurrentConfig(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatusMsg('Please enter an API key or close this modal to keep using the local AI engine.');
      setIsSuccess(false);
      return;
    }

    setSaving(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key: apiKey.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setStatusMsg(`${provider.toUpperCase()} AI successfully activated! All analyses will now use pure cloud LLM intelligence.`);
        setApiKey('');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setIsSuccess(false);
        setStatusMsg(data.error || 'Failed to update key.');
      }
    } catch (err) {
      setIsSuccess(false);
      setStatusMsg('Network error communicating with backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '28px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '6px',
            borderRadius: '6px',
            color: 'var(--text-muted)',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              AI Engine Configuration
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Optional: Boost with 100% Free Cloud LLM (Gemini / Groq Llama 3)
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#F8FAFC',
          border: '1px solid #EEF2F6',
          fontSize: '0.84rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          marginBottom: '20px',
        }}>
          Readify's <strong>Built-in Smart Engine</strong> is currently active and runs locally without any API keys. If you want maximum ChatGPT-grade performance (like funded AI projects), you can optionally connect a free Groq or Google Gemini key.
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Select AI Provider (Both 100% Free with No Credit Card):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setProvider('groq')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${provider === 'groq' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: provider === 'groq' ? 'var(--primary-light)' : 'var(--surface)',
                  color: provider === 'groq' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={16} />
                <span>Groq Llama 3.1</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${provider === 'gemini' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: provider === 'gemini' ? 'var(--primary-light)' : 'var(--surface)',
                  color: provider === 'gemini' ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={16} />
                <span>Google Gemini</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {provider === 'groq' ? 'Groq Free API Key' : 'Gemini Free API Key'}:
              </label>
              <a
                href={provider === 'groq' ? 'https://console.groq.com/keys' : 'https://aistudio.google.com/app/apikey'}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Get Free Key (Instant) &rarr;
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder={provider === 'groq' ? 'gsk_...' : 'AIzaSy...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {statusMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isSuccess ? '#ECFDF5' : 'var(--danger-bg)',
              color: isSuccess ? '#065F46' : 'var(--danger-text)',
              border: `1px solid ${isSuccess ? '#A7F3D0' : 'var(--danger-border)'}`,
              fontSize: '0.84rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Use Built-in Engine
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Activate Cloud LLM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
