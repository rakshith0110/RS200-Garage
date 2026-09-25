import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/formatUtils';

export function StatusBadge({ status, size = 'sm' }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.not_enough_data;
  const label = STATUS_LABELS[status] || status;
  return (
    <span className="status-badge" style={{ background: colors.bg, color: colors.text, fontSize: size === 'xs' ? '10px' : '11px' }}>
      <span className="dot" style={{ background: colors.dot }} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const colors = {
    critical: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
    high: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
    medium: { bg: '#fefce8', text: '#854d0e', dot: '#eab308' },
    low: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  };
  const c = colors[priority] || colors.low;
  return (
    <span className="status-badge" style={{ background: c.bg, color: c.text }}>
      <span className="dot" style={{ background: c.dot }} />
      {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Low'}
    </span>
  );
}

export function ProgressBar({ value, color, height = 6 }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  let barColor = color;
  if (!barColor) {
    if (pct > 60) barColor = '#22c55e';
    else if (pct > 30) barColor = '#f59e0b';
    else barColor = '#ef4444';
  }
  return (
    <div className="progress-bar-wrap" style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast ${toast.type || 'success'}`}>{toast.message}</div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: 4 }}>
          {action}
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="overlay" style={{ alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export function BottomSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span className="section-title">{title}</span>
      {action && (
        <button className="btn btn-ghost btn-sm" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}
