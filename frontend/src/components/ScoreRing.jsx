import React from 'react';

export default function ScoreRing({ 
  score = 0, 
  size = 120, 
  strokeWidth = 10, 
  label = 'Score', 
  subLabel = '', 
  color = '#4F46E5',
  trackColor = '#EEF2FF',
  showPercent = true 
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: size > 100 ? '1.5rem' : '1.1rem', fontWeight: 800, color: '#17172B' }}>
            {safeScore}{showPercent ? '%' : ''}
          </span>
          {subLabel && (
            <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              {subLabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
          {label}
        </span>
      )}
    </div>
  );
}
