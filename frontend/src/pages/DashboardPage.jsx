import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';

export default function DashboardPage({ setActivePage, onSelectHistoryItem }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to connect to Readify database. Ensure the Flask backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const overview = stats?.overview || {
    total_analyzed: 0,
    avg_comprehension: 0,
    avg_grammar: 0,
    avg_overall: 0,
    total_words: 0
  };

  const trendsData = (stats?.score_trends || []).map((t, idx) => ({
    name: `#${idx + 1}`,
    title: t.title || `Passage #${idx + 1}`,
    Comprehension: t.comprehension_score || 0,
    Grammar: t.grammar_score || 100,
    Overall: t.overall_score || 0,
  }));

  const recent = stats?.recent_activities || [];

  return (
    <div className="animate-fade-in" style={{ padding: '32px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Reading Progress Dashboard
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Monitor your reading accuracy metrics, comprehension trends, and historical performance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActivePage('workspace')}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>Start New Analysis</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger-text)',
          marginBottom: '24px',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* KPI Statistic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Total Analyzed */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Passages Analyzed
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BookOpen size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
            {overview.total_analyzed}
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Total reading sessions recorded
          </p>
        </div>

        {/* Avg Comprehension */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Comprehension
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HelpCircle size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
            {overview.avg_comprehension}%
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Across all answered quizzes
          </p>
        </div>

        {/* Avg Grammar Accuracy */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Avg Grammar Score
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--secondary)',
              color: 'var(--secondary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#6D28D9', lineHeight: 1.1 }}>
            {overview.avg_grammar}%
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Based on error density metrics
          </p>
        </div>

        {/* Total Words Read */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Words Read
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
            {overview.total_words.toLocaleString()}
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Cumulative volume processed
          </p>
        </div>
      </div>

      {/* Score Trend Chart Section */}
      <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Historical Score Progression
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Track how your comprehension and grammar accuracy evolve over consecutive readings.
            </p>
          </div>
          <span className="badge badge-primary">
            <TrendingUp size={12} /> Real Data
          </span>
        </div>

        {trendsData.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '0.82rem',
                  }}
                />
                <Area type="monotone" dataKey="Overall" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOverall)" />
                <Area type="monotone" dataKey="Comprehension" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #EEF2F6',
          }}>
            <Inbox size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              No Historical Score Data Yet
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '4px auto 16px' }}>
              Analyze your first passage in the workspace to begin generating performance charts and trend tracking.
            </p>
            <button
              onClick={() => setActivePage('workspace')}
              className="btn btn-primary btn-sm"
            >
              <span>Analyze a Passage Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Recent Activities Section */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Recent Reading Activities
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              The latest passages analyzed and scored.
            </p>
          </div>
          <button
            onClick={() => setActivePage('history')}
            className="btn btn-ghost btn-sm"
          >
            <span>View All in History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #EEF2F6',
          }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              No recent reading activity found.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Title / Passage</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Words</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Grammar</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Quiz Comp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Overall</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr 
                    key={item.id} 
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.title || 'Untitled Passage'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {item.word_count}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-secondary" style={{ color: '#6D28D9', backgroundColor: 'var(--secondary)' }}>
                        {item.grammar_score}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${item.comprehension_score >= 80 ? 'badge-success' : 'badge-secondary'}`}>
                        {item.comprehension_score ? `${item.comprehension_score}%` : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)' }}>
                      {item.overall_score}%
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (onSelectHistoryItem) onSelectHistoryItem(item.id);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>View</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: #F8FAFC;
        }
      `}</style>
    </div>
  );
}
