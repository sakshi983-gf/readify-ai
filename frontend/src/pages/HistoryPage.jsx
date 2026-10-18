import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Search, 
  RefreshCw,
  AlertTriangle,
  X,
  ArrowRight,
  Inbox
} from 'lucide-react';
import api from '../services/api';

export default function HistoryPage({ setActivePage, onSelectHistoryItem }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(50, 0);
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await api.deleteHistory(id);
      if (res.success) {
        setHistoryList(prev => prev.filter(item => item.id !== id));
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      }
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reading history? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.clearAllHistory();
      if (res.success) {
        setHistoryList([]);
        setSelectedRecord(null);
      }
    } catch (err) {
      alert(`Error clearing history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.getHistoryById(id);
      if (res.success && res.data) {
        setSelectedRecord(res.data);
      }
    } catch (err) {
      alert(`Failed to load details: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredHistory = historyList.filter(item => {
    const q = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const preview = (item.preview_text || '').toLowerCase();
    return title.includes(q) || preview.includes(q);
  });

  return (
    <div className="animate-fade-in" style={{ padding: '32px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Reading History
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
            Review past passages, inspected errors, quiz performance, and score records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchHistory}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {historyList.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search previous passages by keywords or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 46px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface)',
            fontSize: '0.95rem',
            color: 'var(--text-main)',
            outline: 'none',
          }}
        />
      </div>

      {/* History Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading reading history from SQLite database...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Inbox size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Reading History Found
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
            {searchQuery ? 'No passages match your search criteria.' : 'You have not analyzed any passages yet. Start reading in the workspace!'}
          </p>
          <button
            onClick={() => setActivePage('workspace')}
            className="btn btn-primary"
          >
            <span>Go to Reading Workspace</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredHistory.map((item) => (
            <div 
              key={item.id} 
              className="card card-interactive"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                    <Calendar size={12} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <span className={`badge ${item.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {item.status === 'completed' ? 'Quiz Completed' : 'Analyzed'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {item.title || 'Untitled Passage'}
                </h3>

                <p style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.preview_text}...
                </p>

                {/* Score Pill Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '18px',
                }}>
                  <span style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                    Overall: {item.overall_score}%
                  </span>
                  <span style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#065F46', fontWeight: 600 }}>
                    Comp: {item.comprehension_score}%
                  </span>
                  <span style={{ fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--secondary)', color: 'var(--secondary-text)', fontWeight: 600 }}>
                    Grammar: {item.grammar_score}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <button
                  onClick={() => handleViewDetail(item.id)}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={14} />
                  <span>Inspect Details</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (onSelectHistoryItem) onSelectHistoryItem(item.id);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Load</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger-text)' }}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Inspection Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="card" style={{
            maxWidth: '740px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {selectedRecord.title || 'Untitled Passage'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Analyzed on {new Date(selectedRecord.created_at).toLocaleString()} • {selectedRecord.word_count} words
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original vs Corrected */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Original Passage:
              </h4>
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F8FAFC',
                border: '1px solid #EEF2F6',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                maxHeight: '160px',
                overflowY: 'auto',
              }}>
                {selectedRecord.original_text}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                Corrected Passage:
              </h4>
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F0FDF4',
                border: '1px solid #DCFCE7',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#14532D',
                maxHeight: '160px',
                overflowY: 'auto',
              }}>
                {selectedRecord.corrected_text}
              </div>
            </div>

            {/* Scores summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#EEF2FF' }}>
                <span style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 700 }}>Overall Score</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5' }}>{selectedRecord.overall_score}%</h4>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ECFDF5' }}>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Comprehension</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{selectedRecord.comprehension_score}%</h4>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F5F3FF' }}>
                <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 700 }}>Grammar Score</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED' }}>{selectedRecord.grammar_score}%</h4>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  if (onSelectHistoryItem) onSelectHistoryItem(selectedRecord.id);
                }}
                className="btn btn-primary"
              >
                <span>Load in Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div className="card" style={{
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Delete Analysis Record?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to delete this reading history entry? This action cannot be reversed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
