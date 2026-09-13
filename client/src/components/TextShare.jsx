import React, { useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export function TextShare({ onSendText, receivedText, disabled }) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendText(text.trim());
    addToast('Text sent to peer!', 'success');
    setText('');
  };

  const handleCopyReceived = () => {
    if (!receivedText) return;
    navigator.clipboard.writeText(receivedText);
    setCopied(true);
    addToast('Received text copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
      <form onSubmit={handleSend} style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
          Send Text or URL
        </label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text, code snippets, or links here..."
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.8rem',
            borderRadius: '12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-primary)',
            resize: 'vertical',
            marginBottom: '0.75rem'
          }}
        />
        <button type="submit" disabled={disabled || !text.trim()} className="btn-primary" style={{ width: 'auto' }}>
          <Send size={16} /> Send Text
        </button>
      </form>

      {receivedText && (
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Received Text:</span>
            <button onClick={handleCopyReceived} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              {copied ? <Check size={14} color="var(--success-color)" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.95rem' }}>
            {receivedText}
          </p>
        </div>
      )}
    </div>
  );
}
