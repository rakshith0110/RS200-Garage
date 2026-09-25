import React, { useState, useMemo } from 'react';
import { formatDate, formatKm, today, formatDays, daysSince } from '../../utils/formatUtils';
import { validateOdometer } from '../../services/maintenanceEngine';
import { ProgressBar } from '../common/UIKit';

// ─── Update Odometer ──────────────────────────────────────────────────────────
export function UpdateOdometerSheet({ data, onUpdate, onClose }) {
  const currentKm = data.bike.currentOdometer || 0;
  const [km, setKm] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const newKm = Number(km);
    const validation = validateOdometer(newKm, currentKm);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    const result = onUpdate(newKm, date, notes);
    if (result?.success) {
      onClose();
    } else if (result?.error) {
      setError(result.error);
    }
  };

  const diff = km && Number(km) > currentKm ? Number(km) - currentKm : null;

  return (
    <div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Current Odometer</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>{currentKm.toLocaleString()} KM</div>
        </div>

        <div className="form-group">
          <label className="form-label">New Odometer Reading (KM)</label>
          <input
            type="number"
            className="form-input"
            value={km}
            onChange={e => { setKm(e.target.value); setError(''); }}
            placeholder={`Greater than ${currentKm.toLocaleString()}`}
            inputMode="numeric"
            autoFocus
            style={{ fontSize: 20, fontWeight: 700 }}
          />
          {error && (
            <div className="form-error" style={{ marginTop: 8 }}>
              <strong>⚠️</strong> {error}
            </div>
          )}
          {diff && <div style={{ fontSize: 12, color: 'var(--green-text)', marginTop: 6, fontWeight: 600 }}>+{diff.toLocaleString()} KM from current</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} max={today()} />
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Trip to Mysore" />
        </div>
      </div>
      <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }} disabled={!km}>Update Odometer</button>
      </div>
    </div>
  );
}

// ─── Usage / Odometer History Page ───────────────────────────────────────────
export function UsagePage({ data }) {
  const currentKm = data.bike.currentOdometer || 0;
  const history = useMemo(() =>
    [...(data.odometerHistory || [])].sort((a, b) => b.odometer - a.odometer),
    [data.odometerHistory]
  );

  const stats = useMemo(() => {
    if (history.length < 2) return null;
    const oldest = history[history.length - 1];
    const newest = history[0];
    const totalDays = Math.max(1, Math.floor((new Date(newest.date) - new Date(oldest.date)) / 86400000));
    const totalKm = newest.odometer - oldest.odometer;
    const avgDaily = totalKm / totalDays;
    const avgMonthly = avgDaily * 30;
    const avgYearly = avgDaily * 365;
    return { avgDaily: Math.round(avgDaily), avgMonthly: Math.round(avgMonthly), avgYearly: Math.round(avgYearly), totalDays };
  }, [history]);

  const purchaseDate = data.bike.purchaseDate;
  const bikeAge = purchaseDate ? Math.floor((new Date() - new Date(purchaseDate)) / 86400000) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Usage</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* Current stats */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>
                {currentKm.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Total Kilometres
              </div>
            </div>
            {bikeAge !== null && (
              <div className="info-row">
                <span className="label">Bike Age</span>
                <span className="value">{formatDays(bikeAge)}</span>
              </div>
            )}
            {purchaseDate && (
              <div className="info-row">
                <span className="label">Purchase Date</span>
                <span className="value">{formatDate(purchaseDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Usage Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Daily', value: stats.avgDaily },
                  { label: 'Monthly', value: stats.avgMonthly },
                  { label: 'Yearly', value: stats.avgYearly },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '12px 8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value.toLocaleString()}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      KM / {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="disclaimer">
                  Based on {stats.totalDays} days of odometer history. Estimates may be inaccurate with limited data.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Odometer history */}
        <div className="card">
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Odometer History</div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No odometer history recorded yet.
              </div>
            ) : (
              history.map((entry, i) => {
                const prev = history[i + 1];
                const diff = prev ? entry.odometer - prev.odometer : null;
                return (
                  <div key={entry.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{entry.odometer.toLocaleString()} KM</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(entry.date)}
                        {entry.notes && ` · ${entry.notes}`}
                      </div>
                    </div>
                    {diff !== null && (
                      <div style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 700, alignSelf: 'center' }}>
                        +{diff.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
