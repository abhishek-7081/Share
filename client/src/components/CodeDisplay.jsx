import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export function CodeDisplay({ code, expiresAt }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const codeDigits = (code || '000000').toString().padStart(6, '0').split('');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    addToast('Sharing code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-display-container">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Your Sharing Code
      </p>
      
      <div className="code-digits">
        {codeDigits.map((digit, idx) => (
          <div key={idx} className="digit-box">
            {digit}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button
          onClick={handleCopy}
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
        >
          {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
    </div>
  );
}
