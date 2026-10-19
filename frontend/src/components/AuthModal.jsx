import React, { useState } from 'react';
import { User, Lock, Mail, X, Check, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [englishLevel, setEnglishLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let res;
      if (tab === 'login') {
        res = await api.login(email, password);
      } else {
        res = await api.register({
          username,
          email,
          password,
          english_level: englishLevel,
        });
      }

      if (res.success && res.data) {
        localStorage.setItem('readify_token', res.data.token);
        localStorage.setItem('readify_user', JSON.stringify(res.data.user));
        if (onAuthSuccess) {
          onAuthSuccess(res.data.user);
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPass);
      if (res.success && res.data) {
        localStorage.setItem('readify_token', res.data.token);
        localStorage.setItem('readify_user', JSON.stringify(res.data.user));
        if (onAuthSuccess) {
          onAuthSuccess(res.data.user);
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Quick login failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 250,
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '30px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Close Button */}
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          }}>
            <User size={24} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {tab === 'login' ? 'Sign in to Readify' : 'Create Student Account'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {tab === 'login' ? 'Access your personalized learning coach & history.' : 'Start your AI-powered English learning journey.'}
          </p>
        </div>

        {/* Demo Account Quick Switch Buttons */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #EEF2F6',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Demo Profiles (1-Click Viva Demo):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('student@readify.edu', 'DemoStudent123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'center' }}
              disabled={loading}
            >
              <Sparkles size={13} style={{ color: 'var(--primary)' }} />
              <span>Demo Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@readify.edu', 'DemoAdmin123!')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', justifyContent: 'center' }}
              disabled={loading}
            >
              <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => setTab('login')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: tab === 'login' ? 700 : 500,
              backgroundColor: tab === 'login' ? 'white' : 'transparent',
              color: tab === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'login' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            style={{
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: tab === 'register' ? 700 : 500,
              backgroundColor: tab === 'register' ? 'white' : 'transparent',
              color: tab === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'register' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            marginBottom: '16px',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                English Proficiency Level
              </label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', backgroundColor: 'white' }}
              >
                <option value="Beginner">Beginner (Foundations & Vocabulary)</option>
                <option value="Intermediate">Intermediate (Grammar & Comprehension)</option>
                <option value="Advanced">Advanced (Academic & Professional Writing)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
