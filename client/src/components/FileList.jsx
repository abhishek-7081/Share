import React from 'react';
import { CheckCircle2, Clock, Loader2, Download, AlertCircle, File } from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

export function FileList({ files = [], onDownload }) {
  if (files.length === 0) return null;

  return (
    <div style={{ marginTop: '1.5rem', width: '100%' }}>
      <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Files ({files.length})
      </h4>

      <div>
        {files.map((file, idx) => (
          <div key={file.id || idx} className="file-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <File size={18} color="var(--accent-color)" />
              <span style={{ fontSize: '0.95rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                {file.name}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {formatBytes(file.size)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {file.status === 'COMPLETED' && (
                <>
                  <CheckCircle2 size={18} color="var(--success-color)" />
                  {onDownload && (
                    <button
                      onClick={() => onDownload(file)}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      <Download size={14} /> Download
                    </button>
                  )}
                </>
              )}

              {file.status === 'TRANSFERRING' && (
                <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Loader2 size={16} className="spin" /> {file.progress || 0}%
                </span>
              )}

              {file.status === 'WAITING' && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={16} /> Queued
                </span>
              )}

              {file.status === 'FAILED' && (
                <span style={{ color: 'var(--error-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={16} /> Failed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
