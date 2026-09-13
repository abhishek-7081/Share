import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import { Header } from '../components/Header.jsx';
import { CodeDisplay } from '../components/CodeDisplay.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loader2 } from 'lucide-react';

export function HostPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [connState, setConnState] = useState('DISCONNECTED');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    let unsubState;
    let unsubJoined;

    async function initSession() {
      try {
        const res = await api.createSession();
        setSession(res);
        setLoading(false);

        // Connect WebSocket as host
        wsClient.connect(res.sessionId, 'host');
        
        unsubState = wsClient.onStateChange((state) => {
          setConnState(state);
        });

        unsubJoined = wsClient.on('DEVICE_JOINED', () => {
          addToast('Peer device connected!', 'success');
          navigate(`/transfer/${res.sessionId}`, { state: { role: 'host', code: res.code } });
        });
      } catch (err) {
        addToast(err.message || 'Failed to create sharing session.', 'error');
        setLoading(false);
      }
    }

    initSession();

    return () => {
      if (unsubState) unsubState();
      if (unsubJoined) unsubJoined();
    };
  }, []);

  return (
    <>
      <Header connectionState={connState} />
      <div className="page-wrapper">
        <div className="glass-card">
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Create Share Session</h2>

          {loading ? (
            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="spin" color="var(--accent-color)" />
              <p>Generating unique share code...</p>
            </div>
          ) : session ? (
            <>
              <CodeDisplay code={session.code} expiresAt={session.expiresAt} />
              
              <div style={{ marginTop: '1.5rem', color: 'var(--warning-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" />
                <span>Waiting for Device B to enter code...</span>
              </div>
            </>
          ) : (
            <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1.5rem' }}>
              Retry Session Creation
            </button>
          )}
        </div>
      </div>
    </>
  );
}
