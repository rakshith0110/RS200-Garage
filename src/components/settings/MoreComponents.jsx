import React, { useState, useRef } from 'react';
import { exportJSON, importJSON, exportCSV } from '../../services/storageService';
import { getSeedData } from '../../data/seed-data';
import { ConfirmDialog } from '../common/UIKit';
import maintenanceRules from '../../data/maintenance-rules.json';

// ─── More Menu ─────────────────────────────────────────────────────────────────
export function MoreMenu({ onNavigate }) {
  const menuItems = [
    { icon: '📋', label: 'Next Service', sublabel: 'Service checklist & upcoming work', route: 'next-service' },
    { icon: '📅', label: 'Maintenance Schedule', sublabel: 'All maintenance rules & intervals', route: 'maintenance' },
    { icon: '💰', label: 'Expenses', sublabel: 'Cost tracking & analytics', route: 'expenses' },
    { icon: '📊', label: 'Usage / Odometer', sublabel: 'Odometer history & usage stats', route: 'usage' },
    { icon: '🏍️', label: 'Bike Information', sublabel: 'Vehicle details & documents', route: 'bike-info' },
    { icon: '⚙️', label: 'Upgrades', sublabel: 'Modifications & accessories', route: 'upgrades' },
    { icon: '💾', label: 'Backup & Restore', sublabel: 'Export & import your data', route: 'backup' },
    { icon: '🔧', label: 'Settings', sublabel: 'App preferences & about', route: 'settings' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>More</h1>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <div className="card">
          {menuItems.map(item => (
            <button
              key={item.route}
              className="list-row"
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
              onClick={() => onNavigate(item.route)}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sublabel}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance Schedule Page ─────────────────────────────────────────────────
export function MaintenanceSchedulePage({ data, onBack }) {
  const [filterCat, setFilterCat] = React.useState('all');
  const currentKm = data.bike.currentOdometer || 0;

  const categories = [...new Set(maintenanceRules.maintenanceItems.map(r => r.category))];

  const items = filterCat === 'all'
    ? maintenanceRules.maintenanceItems
    : maintenanceRules.maintenanceItems.filter(r => r.category === filterCat);

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Maintenance Schedule</h1>
      </div>

      <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="chip" onClick={() => setFilterCat('all')}
            style={filterCat === 'all' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}>All</button>
          {categories.map(c => (
            <button key={c} className="chip" onClick={() => setFilterCat(c)}
              style={filterCat === c ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div className="disclaimer" style={{ marginBottom: 16 }}>
          Maintenance standard: Bajaj Pulsar RS200 BSVI Owner's Manual. Items marked "Practical Estimate" are not official Bajaj requirements — they are general guidelines only.
        </div>
        {items.map(rule => {
          const part = data.parts.find(p => p.ruleId === rule.id);
          const lastKm = part?.lastServiceOdometer || 0;
          const nextKm = rule.intervalKm ? lastKm + rule.intervalKm : null;
          return (
            <div key={rule.id} className="card" style={{ marginBottom: 10 }}>
              <div className="card-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{rule.name}</div>
                  <span className="chip" style={{ fontSize: 10, textTransform: 'capitalize', flexShrink: 0 }}>
                    {rule.sourceType?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{rule.action}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {rule.intervalKm && (
                    <span className="chip" style={{ fontSize: 11 }}>Every {rule.intervalKm.toLocaleString()} KM</span>
                  )}
                  {rule.intervalDays && (
                    <span className="chip" style={{ fontSize: 11 }}>or {Math.round(rule.intervalDays / 365 * 10) / 10} years</span>
                  )}
                  {rule.expectedLifeKmMin && (
                    <span className="chip" style={{ fontSize: 11 }}>Life: {rule.expectedLifeKmMin.toLocaleString()}–{(rule.expectedLifeKmMax || rule.expectedLifeKmMin).toLocaleString()} KM</span>
                  )}
                  {rule.conditionBased && (
                    <span className="chip" style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderColor: 'var(--blue)' }}>Condition Based</span>
                  )}
                </div>
                {nextKm && (
                  <div style={{ marginTop: 8, fontSize: 12, color: nextKm <= currentKm ? 'var(--red-text)' : 'var(--green-text)', fontWeight: 700 }}>
                    {nextKm <= currentKm
                      ? `⚠️ Overdue by ${(currentKm - nextKm).toLocaleString()} KM`
                      : `✓ Due at ${nextKm.toLocaleString()} KM (${(nextKm - currentKm).toLocaleString()} KM away)`}
                  </div>
                )}
                {rule.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{rule.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upgrades Page ─────────────────────────────────────────────────────────────
export function UpgradesPage({ data, onAddUpgrade, onDeleteUpgrade, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const currentKm = data.bike.currentOdometer || 0;

  const [form, setForm] = useState({
    name: '', category: 'accessories', date: today(), odometer: currentKm,
    cost: '', brand: '', partNumber: '', description: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sorted = [...(data.upgrades || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = () => {
    if (!form.name) return;
    onAddUpgrade({ ...form, cost: Number(form.cost || 0), odometer: Number(form.odometer || 0) });
    setShowAdd(false);
  };

  const UPGRADE_CATS = ['accessories', 'protection', 'lighting', 'exhaust', 'performance', 'cosmetic', 'electronics', 'other'];

  if (showAdd) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setShowAdd(false)}>←</button>
          <h1>Add Upgrade</h1>
        </div>
        <div style={{ padding: 16 }}>
          {[
            { label: 'Name *', key: 'name' },
            { label: 'Brand', key: 'brand' },
            { label: 'Description', key: 'description' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input type="text" className="form-input" value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {UPGRADE_CATS.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost (₹)</label>
              <input type="number" className="form-input" value={form.cost} onChange={e => set('cost', e.target.value)} inputMode="decimal" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} max={today()} />
            </div>
            <div className="form-group">
              <label className="form-label">Odometer (KM)</label>
              <input type="number" className="form-input" value={form.odometer} onChange={e => set('odometer', e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 2 }}>Save Upgrade</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Upgrades</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>
      <div style={{ padding: 16 }}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">⚡</span>
            <h3>No Upgrades</h3>
            <p>Record modifications and accessories here.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Upgrade</button>
          </div>
        ) : (
          sorted.map(upg => (
            <div key={upg.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{upg.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {upg.brand ? `${upg.brand} · ` : ''}{new Date(upg.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {upg.cost > 0 && <div style={{ fontSize: 15, fontWeight: 800 }}>₹{upg.cost.toLocaleString()}</div>}
                  <span className="chip" style={{ fontSize: 10, textTransform: 'capitalize' }}>{upg.category}</span>
                </div>
              </div>
              {upg.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{upg.description}</div>}
              <button onClick={() => setDeleteId(upg.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', marginTop: 6 }}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Upgrade?"
        message="This will remove the upgrade record permanently."
        danger
        onConfirm={() => { onDeleteUpgrade(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ─── Backup & Restore ─────────────────────────────────────────────────────────
export function BackupPage({ data, onImport, onReset, onBack }) {
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importParsed, setImportParsed] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef();

  const handleExportJSON = () => exportJSON(data);
  const handleExportCSV = (type) => exportCSV(data, type);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importJSON(ev.target.result);
      if (!result.success) {
        setImportError(result.error);
        setImportSummary(null);
        setImportParsed(null);
      } else {
        setImportError('');
        setImportSummary(result.summary);
        setImportParsed(result.data);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (importParsed) {
      onImport(importParsed);
      setImportSummary(null);
      setImportParsed(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Backup & Restore</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* Export */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Export Data</div>
            <div className="stack gap-10">
              <button className="btn btn-secondary btn-full" onClick={handleExportJSON}>
                📥 Export JSON Backup
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Downloads a complete backup of all your data as JSON
              </div>
            </div>
          </div>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Export CSV</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['services', 'expenses', 'issues', 'odometer'].map(type => (
                <button key={type} className="btn btn-secondary btn-sm" onClick={() => handleExportCSV(type)}>
                  📊 {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Import */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Import Data</div>
            <button className="btn btn-secondary btn-full" onClick={() => fileRef.current?.click()}>
              📤 Select JSON Backup File
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
            {importError && (
              <div style={{ background: 'var(--red-bg)', color: 'var(--red-text)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: 12, fontSize: 13 }}>
                ❌ {importError}
              </div>
            )}
            {importSummary && (
              <div style={{ background: 'var(--green-bg)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-text)', marginBottom: 8 }}>✅ Valid backup file found</div>
                <div className="stack gap-4" style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <span>{importSummary.services} service records</span>
                  <span>{importSummary.issues} issues</span>
                  <span>{importSummary.expenses} expenses</span>
                  <span>{importSummary.upgrades} upgrades</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  ⚠️ This will replace all your current data. This action cannot be undone.
                </div>
                <button className="btn btn-primary btn-full" onClick={handleConfirmImport}>
                  Confirm Import
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Load Demo Data */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 8 }}>Demo Data</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Load sample data to explore all app features. This will replace your current data.
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => { onImport(getSeedData()); }}>
              🎭 Load Demo Data
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="card" style={{ borderColor: 'var(--red-bg)' }}>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 8, color: 'var(--red-text)' }}>Danger Zone</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Permanently delete all data and reset the app to its initial state.
            </div>
            <button className="btn btn-danger btn-full" onClick={() => setConfirmReset(true)}>
              🗑️ Reset Application
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset Application?"
        message="This will permanently delete ALL your data including services, parts, issues, expenses and odometer history. This action cannot be undone."
        danger
        onConfirm={() => { onReset(); setConfirmReset(false); }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export function SettingsPage({ data, onBack }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>Settings</h1>
      </div>

      <div style={{ padding: 16 }}>
        {/* About */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-section" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏍️</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>RS200 Garage</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Personal Motorcycle Maintenance Tracker</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Version 1.0.0</div>
          </div>
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 10 }}>Maintenance Standard</div>
            <div className="info-row"><span className="label">Vehicle</span><span className="value">Bajaj Pulsar RS200 BSVI</span></div>
            <div className="info-row"><span className="label">Source</span><span className="value">Bajaj Auto Owner's Manual</span></div>
            <div className="info-row"><span className="label">Source Type</span><span className="value">Manufacturer Documentation</span></div>
            <div style={{ marginTop: 10 }}>
              <a href="https://cdn.bajajauto.com/-/media/assets/bajajauto/customer-service/owners-manual/owners-manual-pdf/om-for-website/pulsar_rs200_om.pdf"
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent)', fontSize: 13 }}>
                View Owner's Manual PDF ↗
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="card">
          <div className="card-section">
            <div className="section-title" style={{ marginBottom: 8 }}>Important Disclaimer</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              RS200 Garage is a <strong>personal maintenance tracker</strong>. It is not a mechanical diagnostic tool or substitute for a qualified mechanic.
              <br /><br />
              Maintenance interval estimates are for tracking purposes only. Actual component life depends on riding style, road conditions, and maintenance quality.
              <br /><br />
              For safety-critical components (brakes, tyres, suspension), always inspect physically and consult a qualified mechanic.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
