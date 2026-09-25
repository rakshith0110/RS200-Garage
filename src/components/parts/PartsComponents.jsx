import React, { useState, useMemo } from 'react';
import { calculateMaintenanceStatus } from '../../services/maintenanceEngine';
import { formatDate, formatKm, today, CATEGORY_LABELS } from '../../utils/formatUtils';
import { StatusBadge, ProgressBar, EmptyState } from '../common/UIKit';
import maintenanceRules from '../../data/maintenance-rules.json';

const CATEGORY_ORDER = ['engine', 'cooling', 'drive', 'brakes', 'suspension', 'tyres', 'wheels', 'electrical', 'transmission', 'controls'];
const CATEGORY_ICONS = {
  engine: '🔩', cooling: '🌡️', drive: '⛓️', brakes: '🔴',
  suspension: '🌀', tyres: '⬤', wheels: '🔘', electrical: '🔋',
  transmission: '🔄', controls: '🎮', body: '🏍️',
};

function PartCard({ part, rule, currentKm, onClick }) {
  const calc = useMemo(
    () => calculateMaintenanceStatus(rule?.id, part, currentKm),
    [rule, part, currentKm]
  );

  const lastKm = part.lastServiceOdometer;
  const kmSince = lastKm ? currentKm - lastKm : null;

  return (
    <div
      style={{
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '12px 14px', cursor: 'pointer', marginBottom: 8, overflow: 'hidden',
        width: '100%', boxSizing: 'border-box',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{part.name}</div>
          {lastKm ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Last: {formatKm(lastKm)} · {kmSince?.toLocaleString()} KM ago
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No service recorded</div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}><StatusBadge status={calc.status} size="xs" /></div>
      </div>

      {rule && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {calc.nextDueKm ? `Due: ${formatKm(calc.nextDueKm)}` : rule.action}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: calc.health > 60 ? 'var(--green-text)' : calc.health > 30 ? 'var(--amber-text)' : 'var(--red-text)' }}>
              {calc.health}%
            </span>
          </div>
          <ProgressBar value={calc.health} />
        </div>
      )}
    </div>
  );
}

export function PartsCatalogue({ data, onSelectPart }) {
  const currentKm = data.bike.currentOdometer || 0;
  const [selectedCat, setSelectedCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const partGroups = useMemo(() => {
    const groups = {};
    for (const part of data.parts || []) {
      const cat = part.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      const rule = maintenanceRules.maintenanceItems.find(r => r.id === part.ruleId);
      const calc = calculateMaintenanceStatus(rule?.id, part, currentKm);
      if (filterStatus !== 'all' && calc.status !== filterStatus) continue;
      groups[cat].push({ part, rule, calc });
    }
    return groups;
  }, [data.parts, currentKm, filterStatus]);

  const categories = CATEGORY_ORDER.filter(c => partGroups[c]?.length > 0);
  const displayCats = selectedCat === 'all' ? categories : categories.filter(c => c === selectedCat);

  const attentionCount = useMemo(() => {
    let n = 0;
    for (const part of data.parts || []) {
      const rule = maintenanceRules.maintenanceItems.find(r => r.id === part.ruleId);
      const calc = calculateMaintenanceStatus(rule?.id, part, currentKm);
      if (['overdue', 'due', 'due_soon', 'inspect_required'].includes(calc.status)) n++;
    }
    return n;
  }, [data.parts, currentKm]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bike Parts</h1>
        {attentionCount > 0 && (
          <span style={{ background: 'var(--red-bg)', color: 'var(--red-text)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
            {attentionCount} Need Attention
          </span>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
          <button
            className="chip"
            onClick={() => setSelectedCat('all')}
            style={selectedCat === 'all' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}
          >
            All
          </button>
          {CATEGORY_ORDER.map(cat => {
            if (!partGroups[cat]?.length) return null;
            return (
              <button
                key={cat}
                className="chip"
                onClick={() => setSelectedCat(cat)}
                style={selectedCat === cat ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0', width: '100%', boxSizing: 'border-box' }}>
        {displayCats.map(cat => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{CATEGORY_LABELS[cat] || cat}</span>
            </div>
            {(partGroups[cat] || []).map(({ part, rule }) => (
              <PartCard
                key={part.id}
                part={part}
                rule={rule}
                currentKm={currentKm}
                onClick={() => onSelectPart(part.id)}
              />
            ))}
          </div>
        ))}

        {displayCats.length === 0 && (
          <EmptyState icon="⚙️" title="No Parts Found" description="Parts matching your filter will appear here." />
        )}
      </div>
    </div>
  );
}

// ─── Part Detail ──────────────────────────────────────────────────────────────
export function PartDetail({ partId, data, onBack, onUpdatePart, onAddEvent }) {
  const currentKm = data.bike.currentOdometer || 0;
  const part = data.parts.find(p => p.id === partId);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ date: today(), odometer: currentKm, action: 'Replaced', notes: '' });

  if (!part) return null;

  const rule = maintenanceRules.maintenanceItems.find(r => r.id === part.ruleId);
  const calc = calculateMaintenanceStatus(rule?.id, part, currentKm);
  const history = [...(part.history || [])].sort((a, b) => b.odometer - a.odometer);

  const handleAddEvent = () => {
    onAddEvent(partId, {
      date: eventForm.date,
      odometer: Number(eventForm.odometer),
      action: eventForm.action,
      notes: eventForm.notes,
    });
    setShowAddEvent(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>{part.name}</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddEvent(true)}>+ Event</button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Status Card */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <StatusBadge status={calc.status} />
              <span style={{ fontSize: 24, fontWeight: 800, color: calc.health > 60 ? 'var(--green-text)' : calc.health > 30 ? 'var(--amber-text)' : 'var(--red-text)' }}>
                {calc.health}%
              </span>
            </div>
            <ProgressBar value={calc.health} height={8} />
          </div>

          <div className="card-section">
            <div className="info-row">
              <span className="label">Last Service</span>
              <span className="value">{formatKm(part.lastServiceOdometer) || '—'}</span>
            </div>
            <div className="info-row">
              <span className="label">Last Service Date</span>
              <span className="value">{formatDate(part.lastServiceDate)}</span>
            </div>
            <div className="info-row">
              <span className="label">Current KM</span>
              <span className="value">{formatKm(currentKm)}</span>
            </div>
            {part.lastServiceOdometer && (
              <div className="info-row">
                <span className="label">KM Since Last</span>
                <span className="value">{formatKm(currentKm - part.lastServiceOdometer)}</span>
              </div>
            )}
            {calc.nextDueKm && (
              <div className="info-row">
                <span className="label">Next Due</span>
                <span className="value">{formatKm(calc.nextDueKm)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rule Info */}
        {rule && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Maintenance Rule</div>
              <div className="info-row">
                <span className="label">Action</span>
                <span className="value">{rule.action}</span>
              </div>
              <div className="info-row">
                <span className="label">Rule Type</span>
                <span className="value" style={{ textTransform: 'capitalize' }}>{rule.ruleType?.replace(/_/g, ' ')}</span>
              </div>
              {rule.intervalKm && (
                <div className="info-row">
                  <span className="label">Interval</span>
                  <span className="value">{formatKm(rule.intervalKm)}</span>
                </div>
              )}
              {rule.expectedLifeKmMin && (
                <div className="info-row">
                  <span className="label">Expected Life</span>
                  <span className="value">{rule.expectedLifeKmMin.toLocaleString()}–{(rule.expectedLifeKmMax || rule.expectedLifeKmMin).toLocaleString()} KM</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Source</span>
                <span className="value" style={{ textTransform: 'capitalize' }}>{rule.sourceType?.replace(/_/g, ' ')}</span>
              </div>
            </div>
            {rule.conditionBased && (
              <div className="card-section">
                <div className="disclaimer">
                  ℹ️ This is a condition-based item. The health indicator is an estimate only. Actual replacement/inspection must be based on the component's physical condition.
                </div>
              </div>
            )}
            {rule.replacementSymptoms && (
              <div className="card-section">
                <div className="section-title" style={{ marginBottom: 8 }}>Replacement Symptoms</div>
                {rule.replacementSymptoms.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                    • {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Part Info */}
        {(part.brand || part.partNumber || part.notes) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Part Information</div>
              {part.brand && <div className="info-row"><span className="label">Brand</span><span className="value">{part.brand}</span></div>}
              {part.partNumber && <div className="info-row"><span className="label">Part Number</span><span className="value">{part.partNumber}</span></div>}
              {part.cost && <div className="info-row"><span className="label">Last Cost</span><span className="value">₹{part.cost.toLocaleString()}</span></div>}
              {part.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{part.notes}</div>}
            </div>
          </div>
        )}

        {/* History */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Service History</div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No service history recorded for this part.
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} className="timeline-item" style={{ marginBottom: 12 }}>
                  <div className="timeline-dot" style={{ background: h.action === 'Replaced' ? 'var(--accent)' : 'var(--green)' }} />
                  <div style={{ flex: 1, marginLeft: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{h.action}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{formatKm(h.odometer)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(h.date)}</div>
                    {h.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{h.notes}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Event Sheet */}
      {showAddEvent && (
        <div className="overlay" onClick={() => setShowAddEvent(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <h2>Add Service Event</h2>
              <button className="close-btn" onClick={() => setShowAddEvent(false)}>✕</button>
            </div>
            <div className="sheet-body">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={eventForm.date}
                  onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} max={today()} />
              </div>
              <div className="form-group">
                <label className="form-label">Odometer (KM)</label>
                <input type="number" className="form-input" value={eventForm.odometer}
                  onChange={e => setEventForm(f => ({ ...f, odometer: e.target.value }))} inputMode="numeric" />
              </div>
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-select" value={eventForm.action}
                  onChange={e => setEventForm(f => ({ ...f, action: e.target.value }))}>
                  {['Replaced', 'Checked', 'Cleaned', 'Adjusted', 'Lubricated', 'Repaired', 'Inspected', 'Topped up'].map(a =>
                    <option key={a} value={a}>{a}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" className="form-input" value={eventForm.notes}
                  onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brand, specs, observations..." />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleAddEvent}>Save Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
