import React from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={20} color="var(--success-color)" />}
          {toast.type === 'error' && <AlertCircle size={20} color="var(--error-color)" />}
          {toast.type === 'info' && <Info size={20} color="var(--accent-color)" />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
