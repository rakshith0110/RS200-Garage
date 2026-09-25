import React, { useState, useMemo } from 'react';
import { formatDate, formatKm, today, generateId } from '../../utils/formatUtils';
import { EmptyState, ConfirmDialog, PriorityBadge } from '../common/UIKit';

const CATEGORIES = ['engine', 'brakes', 'drive', 'suspension', 'electrical', 'body', 'cooling', 'controls', 'tyres', 'other'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['open', 'monitoring', 'partially_fixed', 'fixed', 'closed'];
const STATUS_LABELS = { open: 'Open', monitoring: 'Monitoring', partially_fixed: 'Partially Fixed', fixed: 'Fixed', closed: 'Closed' };

function AddIssueForm({ data, initialData, onSave, onCancel }) {
  const currentKm = data.bike.currentOdometer || 0;
  const [form, setForm] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'other',
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'open',
    firstNoticedDate: initialData?.firstNoticedDate || today(),
    firstNoticedOdometer: initialData?.firstNoticedOdometer || currentKm,
    description: initialData?.description || '',
    attachToNextService: initialData?.attachToNextService !== false,
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...form, firstNoticedOdometer: Number(form.firstNoticedOdometer) });
  };

  return (
    <div>
      <div style={{ padding: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Issue Title *</label>
          <input type="text" className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Front brake squeaking" />
          {errors.title && <div className="form-error">{errors.title}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">First Noticed</label>
            <input type="date" className="form-input" value={form.firstNoticedDate} onChange={e => set('firstNoticedDate', e.target.value)} max={today()} />
          </div>
          <div className="form-group">
            <label className="form-label">Odometer (KM)</label>
            <input type="number" className="form-input" value={form.firstNoticedOdometer} onChange={e => set('firstNoticedOdometer', e.target.value)} inputMode="numeric" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail..." />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." style={{ minHeight: 60 }} />
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 16, cursor: 'pointer' }}
          onClick={() => set('attachToNextService', !form.attachToNextService)}
        >
          <span style={{ fontSize: 20 }}>{form.attachToNextService ? '✅' : '☐'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Attach to Next Service</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Show this issue in the next service checklist</div>
          </div>
        </div>
      </div>

      <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
          {initialData ? 'Save Changes' : 'Add Issue'}
        </button>
      </div>
    </div>
  );
}

// ─── Issue Detail ──────────────────────────────────────────────────────────────
function IssueDetail({ issue, data, onBack, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setEditing(false)}>←</button>
          <h1>Edit Issue</h1>
        </div>
        <AddIssueForm
          data={data}
          initialData={issue}
          onSave={(updated) => { onUpdate(issue.id, updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const serviceResolutions = (data.services || []).flatMap(s =>
    (s.issuesResolved || [])
      .filter(ir => ir.issueId === issue.id)
      .map(ir => ({ ...ir, serviceDate: s.date, serviceOdometer: s.odometer }))
  );

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Issue Detail</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section">
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{issue.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <PriorityBadge priority={issue.priority} />
              <span className="chip">{STATUS_LABELS[issue.status] || issue.status}</span>
              <span className="chip" style={{ textTransform: 'capitalize' }}>{issue.category}</span>
              {issue.attachToNextService && <span className="chip" style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)', borderColor: 'var(--blue)' }}>In Next Service</span>}
            </div>
          </div>
          <div className="card-section">
            <div className="info-row"><span className="label">First Noticed</span><span className="value">{formatDate(issue.firstNoticedDate)}</span></div>
            <div className="info-row"><span className="label">At Odometer</span><span className="value">{formatKm(issue.firstNoticedOdometer)}</span></div>
            {issue.resolution && <div className="info-row"><span className="label">Resolution</span><span className="value" style={{ textTransform: 'capitalize' }}>{issue.resolution?.replace('_', ' ')}</span></div>}
            {issue.resolutionDate && <div className="info-row"><span className="label">Resolved On</span><span className="value">{formatDate(issue.resolutionDate)}</span></div>}
          </div>
          {issue.description && (
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{issue.description}</div>
            </div>
          )}
          {issue.notes && (
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{issue.notes}</div>
            </div>
          )}
        </div>

        {serviceResolutions.length > 0 && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Service History</div>
              {serviceResolutions.map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{r.resolution?.replace('_', ' ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(r.serviceDate)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{formatKm(r.serviceOdometer)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Issue?"
        message="This will permanently remove this issue. This action cannot be undone."
        danger
        onConfirm={() => { onDelete(issue.id); onBack(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ─── Issues Dashboard ──────────────────────────────────────────────────────────
export function IssuesDashboard({ data, onAddIssue, onUpdateIssue, onDeleteIssue }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState('open');

  const selected = selectedId ? data.issues.find(i => i.id === selectedId) : null;

  if (selected) {
    return (
      <IssueDetail
        issue={selected}
        data={data}
        onBack={() => setSelectedId(null)}
        onUpdate={onUpdateIssue}
        onDelete={onDeleteIssue}
      />
    );
  }

  if (showAdd) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setShowAdd(false)}>←</button>
          <h1>Add Issue</h1>
        </div>
        <AddIssueForm
          data={data}
          onSave={(issueData) => { onAddIssue(issueData); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      </div>
    );
  }

  const filtered = useMemo(() => {
    let issues = [...(data.issues || [])];
    if (filterStatus === 'open') issues = issues.filter(i => ['open', 'monitoring', 'partially_fixed'].includes(i.status));
    else if (filterStatus === 'resolved') issues = issues.filter(i => ['fixed', 'closed'].includes(i.status));
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return issues.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
  }, [data.issues, filterStatus]);

  const openCount = data.issues.filter(i => ['open', 'monitoring', 'partially_fixed'].includes(i.status)).length;
  const critCount = data.issues.filter(i => i.status === 'open' && i.priority === 'critical').length;
  const highCount = data.issues.filter(i => i.status === 'open' && i.priority === 'high').length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Issues</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {/* Summary */}
      {openCount > 0 && (
        <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {critCount > 0 && (
              <div style={{ flex: 1, background: 'var(--red-bg)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red-text)' }}>{critCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red-text)', textTransform: 'uppercase' }}>Critical</div>
              </div>
            )}
            {highCount > 0 && (
              <div style={{ flex: 1, background: 'var(--orange-bg)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange-text)' }}>{highCount}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange-text)', textTransform: 'uppercase' }}>High</div>
              </div>
            )}
            <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{openCount}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="segment-control">
          <button className={`segment-btn ${filterStatus === 'open' ? 'active' : ''}`} onClick={() => setFilterStatus('open')}>Open</button>
          <button className={`segment-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
          <button className={`segment-btn ${filterStatus === 'resolved' ? 'active' : ''}`} onClick={() => setFilterStatus('resolved')}>Resolved</button>
        </div>
      </div>

      {/* Issues List */}
      <div style={{ padding: '12px 16px 0' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="✅"
            title={filterStatus === 'open' ? 'No Open Issues' : 'No Issues Found'}
            description={filterStatus === 'open' ? 'Your issue tracker is clear.' : 'No issues match this filter.'}
            action={filterStatus === 'open' ? '+ Add Issue' : undefined}
            onAction={filterStatus === 'open' ? () => setShowAdd(true) : undefined}
          />
        ) : (
          filtered.map(issue => (
            <div
              key={issue.id}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '12px 14px', marginBottom: 10, cursor: 'pointer',
                borderLeft: `4px solid ${issue.priority === 'critical' ? 'var(--red)' : issue.priority === 'high' ? 'var(--orange)' : issue.priority === 'medium' ? 'var(--amber)' : 'var(--border)'}`,
              }}
              onClick={() => setSelectedId(issue.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 8 }}>{issue.title}</div>
                <PriorityBadge priority={issue.priority} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="chip" style={{ fontSize: 11 }}>{STATUS_LABELS[issue.status]}</span>
                <span className="chip" style={{ fontSize: 11, textTransform: 'capitalize' }}>{issue.category}</span>
                {issue.attachToNextService && <span style={{ fontSize: 10, color: 'var(--blue-text)', fontWeight: 700 }}>📋 Next Service</span>}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {formatKm(issue.firstNoticedOdometer)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
