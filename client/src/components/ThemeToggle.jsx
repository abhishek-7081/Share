import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        padding: '0.5rem 0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        fontWeight: '500'
      }}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={18} color="#f59e0b" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon size={18} color="#6366f1" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
