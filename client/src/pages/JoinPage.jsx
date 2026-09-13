import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import { Header } from '../components/Header.jsx';
import { CodeInput } from '../components/CodeInput.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loader2 } from 'lucide-react';

export function JoinPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleCodeComplete = async (code) => {
    setLoading(true);
    try {
      const res = await api.joinSession(code);
      wsClient.connect(res.sessionId, 'guest');
      addToast('Connected to sharing session!', 'success');
      navigate(`/transfer/${res.sessionId}`, { state: { role: 'guest', code } });
    } catch (err) {
      addToast(err.message || 'Invalid or expired sharing code.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div className="glass-card">
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Enter Share Code</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Enter the 6-digit code displayed on Device A to connect.
          </p>

          <CodeInput onComplete={handleCodeComplete} disabled={loading} />

          {loading && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
              <Loader2 size={20} className="spin" />
              <span>Verifying code and connecting...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
