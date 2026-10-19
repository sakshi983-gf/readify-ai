import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  File, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Layers, 
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import api from '../services/api';

export default function DocumentDropzone({ onImportText, onNavigateToCoach, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedDoc, setExtractedDoc] = useState(null);
  const [selectedPageIdx, setSelectedPageIdx] = useState('all'); // 'all' or page number (1-indexed)
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    setErrorMsg('');
    setIsLoading(true);
    setExtractedDoc(null);
    setSelectedPageIdx('all');

    try {
      const res = await api.extractDocument(file);
      if (res.success && res.data) {
        setExtractedDoc(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to extract text from document.');
      }
    } catch (err) {
      console.error('Document extraction error:', err);
      setErrorMsg(err.message || 'Error processing document. Ensure it is a valid PDF or text file.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentText = () => {
    if (!extractedDoc) return '';
    if (selectedPageIdx === 'all') {
      return extractedDoc.full_text;
    }
    const pageObj = extractedDoc.pages.find(p => p.page_number === selectedPageIdx);
    return pageObj ? pageObj.text : extractedDoc.full_text;
  };

  const handleImportToWorkspace = () => {
    const textToImport = getCurrentText();
    if (!textToImport) return;

    const title = selectedPageIdx === 'all' 
      ? extractedDoc.title || extractedDoc.filename 
      : `${extractedDoc.title || extractedDoc.filename} (Page ${selectedPageIdx})`;

    if (onImportText) {
      onImportText(textToImport, title);
    }
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'white',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      marginBottom: '20px',
      transition: 'all 0.2s ease',
    }}>
      {/* Top Header */}
      <div style={{
        padding: '14px 20px',
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UploadCloud size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              PDF & Document Dropzone
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Auto-extracts clean text, joins hyphenated breaks, and partitions pages
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close Dropzone"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        {/* Drop Area (Visible when no doc is loaded or during loading) */}
        {!extractedDoc && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '36px 20px',
              border: `2px dashed ${isDragging ? 'var(--primary)' : '#CBD5E1'}`,
              borderRadius: 'var(--radius-md)',
              backgroundColor: isDragging ? '#EEF2FF' : '#F8FAFC',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.text"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Extracting & Normalizing Text...
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Parsing document stream with PyPDF and fixing line breaks
                </span>
              </div>
            ) : (
              <>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: isDragging ? 'var(--primary)' : '#E0E7FF',
                  color: isDragging ? 'white' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  <UploadCloud size={26} />
                </div>

                <div>
                  <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {isDragging ? 'Drop file to extract text!' : 'Drag & Drop PDF or Document here'}
                  </h5>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    or click to browse from your device
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>
                    .PDF
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>
                    .TXT
                  </span>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>
                    .MD
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                    Max 20MB
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            marginTop: '14px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Document Multi-Page Preview & Ingestion Card */}
        {extractedDoc && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Metadata Summary Banner */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: '#DBEAFE',
                  color: '#1D4ED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  {extractedDoc.file_type}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                    {extractedDoc.title || extractedDoc.filename}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} />
                      {extractedDoc.page_count} {extractedDoc.page_count === 1 ? 'Page' : 'Pages'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={13} />
                      {extractedDoc.total_words} Words
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      ~{extractedDoc.reading_time_minutes} min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Different File Button */}
              <button
                onClick={() => {
                  setExtractedDoc(null);
                  setErrorMsg('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '5px 12px' }}
              >
                Upload Different File
              </button>
            </div>

            {/* Multi-Page Navigation Pills */}
            {extractedDoc.pages && extractedDoc.pages.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Select Page:
                </span>
                <button
                  onClick={() => setSelectedPageIdx('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: selectedPageIdx === 'all' ? 'var(--primary)' : 'var(--border-subtle)',
                    backgroundColor: selectedPageIdx === 'all' ? 'var(--primary-light)' : 'white',
                    color: selectedPageIdx === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  All Pages ({extractedDoc.total_words} words)
                </button>

                {extractedDoc.pages.map((p) => (
                  <button
                    key={p.page_number}
                    onClick={() => setSelectedPageIdx(p.page_number)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: selectedPageIdx === p.page_number ? 'var(--primary)' : 'var(--border-subtle)',
                      backgroundColor: selectedPageIdx === p.page_number ? 'var(--primary-light)' : 'white',
                      color: selectedPageIdx === p.page_number ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Page {p.page_number} ({p.word_count}w)
                  </button>
                ))}
              </div>
            )}

            {/* Extracted Text Preview Box */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              maxHeight: '220px',
              overflowY: 'auto',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              color: '#334155',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit'
            }}>
              {getCurrentText()}
            </div>

            {/* Action Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '8px'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Viewing: <strong>{selectedPageIdx === 'all' ? 'Full Document' : `Page ${selectedPageIdx}`}</strong> (
                {selectedPageIdx === 'all' 
                  ? `${extractedDoc.total_words} words` 
                  : `${extractedDoc.pages.find(p => p.page_number === selectedPageIdx)?.word_count || 0} words`}
                )
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleImportToWorkspace}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <Sparkles size={16} />
                  <span>Import into Reading Workspace</span>
                </button>

                {onNavigateToCoach && (
                  <button
                    onClick={() => onNavigateToCoach(getCurrentText())}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Practice Pronunciation</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
