import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { Header } from '../components/Header.jsx';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div className="bg-glow" />
        
        <div className="glass-card">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              background: 'var(--accent-gradient)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)'
            }}>
              <Share2 size={32} />
            </div>

            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Share Anything</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Fast device-to-device file & data transfer using simple 6-digit codes.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => navigate('/host')} className="btn-primary">
              <span>Create Share</span>
              <ArrowRight size={18} />
            </button>

            <button onClick={() => navigate('/join')} className="btn-secondary">
              <span>Enter Share Code</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={18} color="var(--accent-color)" />
              <span>Zero Config</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={18} color="var(--success-color)" />
              <span>SHA-256 Verified</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <Lock size={18} color="var(--accent-color)" />
              <span>Auto-Expiring</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
