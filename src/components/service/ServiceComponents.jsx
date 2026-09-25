import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate, formatKm, generateId, today, SERVICE_TYPES, WORK_ACTIONS } from '../../utils/formatUtils';
import { EmptyState, BottomSheet, ConfirmDialog, StatusBadge } from '../common/UIKit';
import { generateNextServiceChecklist } from '../../services/maintenanceEngine';

const MAINTENANCE_ITEMS = [
  { id: 'engine-oil', label: 'Engine Oil', category: 'engine' },
  { id: 'oil-filter', label: 'Oil Filter', category: 'engine' },
  { id: 'air-filter', label: 'Air Filter', category: 'engine' },
  { id: 'spark-plug', label: 'Spark Plug', category: 'engine' },
  { id: 'valve-clearance', label: 'Valve Clearance', category: 'engine' },
  { id: 'chain-lubrication', label: 'Chain Lube', category: 'drive' },
  { id: 'chain-sprocket-set', label: 'Chain/Sprockets', category: 'drive' },
  { id: 'front-brake-pads', label: 'Front Brake Pads', category: 'brakes' },
  { id: 'rear-brake-pads', label: 'Rear Brake Pads', category: 'brakes' },
  { id: 'brake-fluid', label: 'Brake Fluid', category: 'brakes' },
  { id: 'front-fork-oil', label: 'Fork Oil', category: 'suspension' },
  { id: 'coolant', label: 'Coolant', category: 'cooling' },
  { id: 'battery', label: 'Battery', category: 'electrical' },
  { id: 'front-tyre', label: 'Front Tyre', category: 'tyres' },
  { id: 'rear-tyre', label: 'Rear Tyre', category: 'tyres' },
  { id: 'other', label: 'Other', category: 'other' },
];

// ─── Record Service Form ──────────────────────────────────────────────────────
export function RecordServiceForm({ data, onSave, onCancel }) {
  const currentKm = data.bike.currentOdometer || 0;
  const openIssues = (data.issues || []).filter(i => ['open', 'monitoring', 'partially_fixed'].includes(i.status));

  const [form, setForm] = useState({
    date: today(),
    odometer: currentKm || '',
    type: 'general_service',
    workshop: '',
    cost: '',
    work: [],
    issuesResolved: [],
    upgrades: '',
    additionalWork: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [workActions, setWorkActions] = useState({});
  const [workNotes, setWorkNotes] = useState({});
  const [issueResolutions, setIssueResolutions] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleWorkItem = (id) => {
    setWorkActions(wa => {
      if (wa[id]) {
        const next = { ...wa };
        delete next[id];
        return next;
      }
      return { ...wa, [id]: 'Replaced' };
    });
  };

  const toggleIssue = (id) => {
    setIssueResolutions(ir => {
      if (ir[id]) {
        const next = { ...ir };
        delete next[id];
        return next;
      }
      return { ...ir, [id]: 'fixed' };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.odometer) errs.odometer = 'Odometer is required';
    else if (Number(form.odometer) < currentKm) errs.odometer = `Must be ≥ current odometer (${currentKm.toLocaleString()} KM)`;
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const workItems = Object.entries(workActions).map(([item, action]) => ({
      item,
      action,
      notes: workNotes[item] || '',
      partId: item,
    }));

    const issuesResolvedArr = Object.entries(issueResolutions).map(([issueId, resolution]) => ({
      issueId,
      resolution,
      notes: '',
    }));

    onSave({
      date: form.date,
      odometer: Number(form.odometer),
      type: form.type,
      workshop: form.workshop,
      cost: form.cost ? Number(form.cost) : 0,
      work: workItems,
      issuesResolved: issuesResolvedArr,
      upgrades: form.upgrades,
      additionalWork: form.additionalWork,
      notes: form.notes,
    });
  };

  const categories = [...new Set(MAINTENANCE_ITEMS.map(i => i.category))];

  return (
    <div>
      <div className="sheet-body" style={{ padding: '0 16px' }}>
        {/* Basic Info */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Basic Information</div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} max={today()} />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Odometer (KM)</label>
            <input type="number" className="form-input" value={form.odometer} onChange={e => set('odometer', e.target.value)}
              placeholder={`≥ ${currentKm.toLocaleString()}`} inputMode="numeric" />
            {errors.odometer && <div className="form-error">{errors.odometer}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
              {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Workshop / Location</label>
            <input type="text" className="form-input" value={form.workshop} onChange={e => set('workshop', e.target.value)} placeholder="Service centre name" />
          </div>
          <div className="form-group">
            <label className="form-label">Total Cost (₹)</label>
            <input type="number" className="form-input" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
        </div>

        {/* Maintenance Work */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Maintenance Work Done</div>
          {categories.map(cat => {
            const items = MAINTENANCE_ITEMS.filter(i => i.category === cat);
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {cat}
                </div>
                {items.map(item => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        background: workActions[item.id] ? 'var(--accent-light)' : 'var(--bg-surface)',
                        border: `1px solid ${workActions[item.id] ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      }}
                      onClick={() => toggleWorkItem(item.id)}
                    >
                      <span style={{ fontSize: 16 }}>{workActions[item.id] ? '✅' : '☐'}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{item.label}</span>
                    </div>
                    {workActions[item.id] && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 6, paddingLeft: 4 }}>
                        <select
                          className="form-select"
                          value={workActions[item.id]}
                          onChange={e => setWorkActions(wa => ({ ...wa, [item.id]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                          style={{ flex: 1 }}
                        >
                          {WORK_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Notes"
                          value={workNotes[item.id] || ''}
                          onChange={e => setWorkNotes(wn => ({ ...wn, [item.id]: e.target.value }))}
                          style={{ flex: 1 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Open Issues */}
        {openIssues.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Issues Addressed</div>
            {openIssues.map(issue => (
              <div key={issue.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: issueResolutions[issue.id] ? 'var(--green-bg)' : 'var(--bg-surface)',
                    border: `1px solid ${issueResolutions[issue.id] ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}
                  onClick={() => toggleIssue(issue.id)}
                >
                  <span style={{ fontSize: 16 }}>{issueResolutions[issue.id] ? '✅' : '☐'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{issue.title}</span>
                  <span style={{ fontSize: 10, background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 20, color: 'var(--text-muted)' }}>
                    {issue.priority}
                  </span>
                </div>
                {issueResolutions[issue.id] && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, paddingLeft: 4 }}>
                    {['fixed', 'partially_fixed', 'not_fixed', 'monitoring'].map(res => (
                      <button
                        key={res}
                        className={`btn btn-sm ${issueResolutions[issue.id] === res ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: 11, padding: '6px 10px' }}
                        onClick={() => setIssueResolutions(ir => ({ ...ir, [issue.id]: res }))}
                      >
                        {res.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Additional Notes */}
        <div style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Additional Work</label>
            <textarea className="form-textarea" value={form.additionalWork} onChange={e => set('additionalWork', e.target.value)} placeholder="Other work performed..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="General notes..." />
          </div>
        </div>
      </div>

      <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>Save Service Record</button>
      </div>
    </div>
  );
}

// ─── Service History ────────────────────────────────────────────────────────
const TYPE_LABELS = {
  periodic_service: 'Periodic Service', general_service: 'General Service', repair: 'Repair',
  part_replacement: 'Part Replacement', upgrade_modification: 'Upgrade / Modification',
  inspection: 'Inspection', accident_repair: 'Accident Repair', tyre_replacement: 'Tyre Replacement',
  electrical_work: 'Electrical Work', other: 'Other',
};

export function ServiceHistory({ data, onAdd, onSelect }) {
  const [filterType, setFilterType] = useState('all');
  const sorted = useMemo(() => [...(data.services || [])].sort((a, b) => b.odometer - a.odometer), [data.services]);
  const filtered = filterType === 'all' ? sorted : sorted.filter(s => s.type === filterType);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Service History</h1>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Record</button>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 2 }}>
          {['all', 'periodic_service', 'general_service', 'repair', 'part_replacement'].map(t => (
            <button
              key={t}
              className={`chip ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
              style={filterType === t ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}
            >
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔧"
          title="No Service History"
          description="Start tracking your RS200 maintenance."
          action="Record First Service"
          onAction={onAdd}
        />
      ) : (
        <div style={{ padding: '12px 16px 0' }}>
          {filtered.map((svc, idx) => (
            <div key={svc.id} className="timeline-item" style={{ marginBottom: 16 }} onClick={() => onSelect(svc.id)}>
              {idx < filtered.length - 1 && <div className="timeline-line" />}
              <div className="timeline-dot" />
              <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{TYPE_LABELS[svc.type] || 'Service'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      {formatDate(svc.date)} · {svc.workshop || 'Unknown workshop'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{formatKm(svc.odometer)}</div>
                    {svc.cost > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{svc.cost.toLocaleString()}</div>}
                  </div>
                </div>
                {(svc.work || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {svc.work.slice(0, 4).map((w, i) => (
                      <span key={i} className="chip" style={{ fontSize: 11 }}>
                        {MAINTENANCE_ITEMS.find(m => m.id === w.item)?.label || w.item} — {w.action}
                      </span>
                    ))}
                    {svc.work.length > 4 && <span className="chip" style={{ fontSize: 11 }}>+{svc.work.length - 4} more</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Service Detail ────────────────────────────────────────────────────────
export function ServiceDetail({ serviceId, data, onBack, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const svc = data.services.find(s => s.id === serviceId);

  if (!svc) return <div className="page"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Service not found.</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Service Detail</h1>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
      </div>

      <div style={{ padding: 16 }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section">
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{TYPE_LABELS[svc.type] || 'Service'}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="chip">📅 {formatDate(svc.date)}</span>
              <span className="chip">📍 {formatKm(svc.odometer)}</span>
              {svc.workshop && <span className="chip">🏪 {svc.workshop}</span>}
              {svc.cost > 0 && <span className="chip">₹{svc.cost.toLocaleString()}</span>}
            </div>
          </div>
        </div>

        {(svc.work || []).length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Work Performed</div>
              {svc.work.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{MAINTENANCE_ITEMS.find(m => m.id === w.item)?.label || w.item}</div>
                    {w.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.notes}</div>}
                  </div>
                  <span className="chip" style={{ fontSize: 11 }}>{w.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(svc.issuesResolved || []).length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Issues Addressed</div>
              {svc.issuesResolved.map((ir, i) => {
                const issue = data.issues.find(iss => iss.id === ir.issueId);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{issue?.title || ir.issueId}</div>
                    <span className="chip" style={{ fontSize: 11, textTransform: 'capitalize' }}>{ir.resolution?.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(svc.notes || svc.additionalWork) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              {svc.additionalWork && (
                <div style={{ marginBottom: 12 }}>
                  <div className="section-title" style={{ marginBottom: 6 }}>Additional Work</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{svc.additionalWork}</div>
                </div>
              )}
              {svc.notes && (
                <div>
                  <div className="section-title" style={{ marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{svc.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Service Record?"
        message="This will permanently remove this service record. This action cannot be undone."
        danger
        onConfirm={() => { onDelete(svc.id); onBack(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ─── Next Service Page ─────────────────────────────────────────────────────
export function NextServicePage({ data, onBack, onStartService }) {
  const checklist = useMemo(() => generateNextServiceChecklist(data.bike, data.parts, data.issues, data.services), [data]);
  const [checked, setChecked] = useState({});

  const toggleCheck = (id) => setChecked(c => ({ ...c, [id]: !c[id] }));

  const totalItems = checklist.scheduledItems.length + checklist.routineChecks.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Next Service</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ background: 'var(--text)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Upcoming</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '4px 0' }}>
            {(checklist.targetKm || 0).toLocaleString()} KM Service
          </div>
          <div style={{ fontSize: 15, opacity: 0.7 }}>
            {checklist.kmRemaining > 0
              ? `${checklist.kmRemaining.toLocaleString()} KM Remaining`
              : `Overdue by ${Math.abs(checklist.kmRemaining).toLocaleString()} KM`}
          </div>
          {totalItems > 0 && (
            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{checkedCount} / {totalItems} items reviewed</div>
            </div>
          )}
        </div>

        {/* Scheduled Maintenance */}
        {checklist.scheduledItems.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Scheduled Maintenance</div>
              {checklist.scheduledItems.map(item => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                  onClick={() => toggleCheck(item.id)}
                >
                  <span style={{ fontSize: 18 }}>{checked[item.id] ? '✅' : '☐'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.action}</div>
                  </div>
                  {item.overdue && <span style={{ fontSize: 10, background: 'var(--red-bg)', color: 'var(--red-text)', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>OVERDUE</span>}
                  {item.nextDueKm && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{(item.nextDueKm / 1000).toFixed(0)}K</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Routine Checks */}
        {checklist.routineChecks.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Routine Checks</div>
              {checklist.routineChecks.map(item => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                  onClick={() => toggleCheck(`check_${item.id}`)}
                >
                  <span style={{ fontSize: 18 }}>{checked[`check_${item.id}`] ? '✅' : '☐'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Issues */}
        {checklist.openIssues.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 12 }}>Open Issues to Address</div>
              {checklist.openIssues.map(issue => (
                <div key={issue.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      First noticed: {formatKm(issue.firstNoticedOdometer)}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, background: 'var(--red-bg)', color: 'var(--red-text)', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {issue.priority?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {checklist.scheduledItems.length === 0 && checklist.openIssues.length === 0 && (
          <div className="card">
            <div className="card-section" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>All Clear</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>No scheduled maintenance due at the next service.</div>
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={onStartService} style={{ marginTop: 16 }}>
          Record Service
        </button>
      </div>
    </div>
  );
}
