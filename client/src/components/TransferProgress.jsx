import React from 'react';
import { Play, Pause, XCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatBytes, formatSpeed, formatEta } from '../utils/formatters.js';

export function TransferProgress({
  fileName,
  progress = 0,
  uploadedBytes = 0,
  totalBytes = 0,
  speed = 0,
  eta = 0,
  status = 'TRANSFERRING', // 'TRANSFERRING' | 'PAUSED' | 'COMPLETED' | 'VERIFYING' | 'FAILED'
  onPause,
  onResume,
  onCancel,
  onDownload
}) {
  return (
    <div className="glass-card" style={{ maxWidth: '600px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', wordBreak: 'break-all' }}>{fileName}</h3>
        {status === 'COMPLETED' ? (
          <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', fontWeight: '600' }}>
            <CheckCircle2 size={18} /> Complete
          </span>
        ) : (
          <span style={{ color: 'var(--accent-color)', fontWeight: '600', fontSize: '0.95rem' }}>
            {progress}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        <span>{formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}</span>
        {status === 'TRANSFERRING' && (
          <>
            <span>Speed: {formatSpeed(speed)}</span>
            <span>ETA: {formatEta(eta)}</span>
          </>
        )}
      </div>

      {/* Integrity Verification Notice */}
      {status === 'VERIFYING' && (
        <div style={{ marginTop: '1rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <ShieldCheck size={18} />
          <span>Verifying SHA-256 integrity checksum...</span>
        </div>
      )}

      {/* Verified SHA-256 notice */}
      {status === 'COMPLETED' && (
        <div style={{ marginTop: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <ShieldCheck size={16} />
          <span>SHA-256 byte-for-byte verified</span>
        </div>
      )}

      {/* Action Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        {status === 'TRANSFERRING' && onPause && (
          <button onClick={onPause} className="btn-secondary" style={{ flex: 1 }}>
            <Pause size={16} /> Pause
          </button>
        )}
        {status === 'PAUSED' && onResume && (
          <button onClick={onResume} className="btn-primary" style={{ flex: 1 }}>
            <Play size={16} /> Resume
          </button>
        )}
        {status !== 'COMPLETED' && onCancel && (
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1, borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--error-color)' }}>
            <XCircle size={16} /> Cancel
          </button>
        )}
        {status === 'COMPLETED' && onDownload && (
          <button onClick={onDownload} className="btn-primary" style={{ flex: 1 }}>
            Download File
          </button>
        )}
      </div>
    </div>
  );
}
