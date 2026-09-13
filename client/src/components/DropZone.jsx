import React, { useState, useRef } from 'react';
import { UploadCloud, FolderPlus, FileText } from 'lucide-react';

export function DropZone({ onFilesSelected, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      className={`dropzone-container ${isDragOver ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <UploadCloud className="dropzone-icon" />
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drop files here to share</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        or <span style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>browse from your device</span>
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
        Supports Images, Videos, PDFs, ZIPs, Documents, Audio & folders
      </p>
    </div>
  );
}
