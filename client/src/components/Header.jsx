import React from 'react';
import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { ConnectionBadge } from './ConnectionBadge.jsx';

export function Header({ connectionState }) {
  return (
    <header className="app-header">
      <Link to="/" className="logo-brand">
        <div className="logo-icon">
          <Share2 size={22} />
        </div>
        <span className="logo-text">ShareFlow</span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {connectionState && <ConnectionBadge state={connectionState} />}
        <ThemeToggle />
      </div>
    </header>
  );
}
