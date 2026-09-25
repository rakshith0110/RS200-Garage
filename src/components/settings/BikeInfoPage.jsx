import React, { useState } from 'react';
import { today, formatDate } from '../../utils/formatUtils';

const SPEC_FIELDS = [
  { key: 'engine',           label: 'Engine',            unit: '' },
  { key: 'fuelSystem',       label: 'Fuel System',       unit: '' },
  { key: 'cooling',          label: 'Cooling',           unit: '' },
  { key: 'transmission',     label: 'Transmission',      unit: '' },
  { key: 'fuelTankCapacity', label: 'Fuel Tank',         unit: ' L' },
  { key: 'battery',          label: 'Battery',           unit: '' },
  { key: 'frontTyre',        label: 'Front Tyre',        unit: '' },
  { key: 'rearTyre',         label: 'Rear Tyre',         unit: '' },
  { key: 'frontBrake',       label: 'Front Brake',       unit: '' },
  { key: 'rearBrake',        label: 'Rear Brake',        unit: '' },
  { key: 'kerbWeight',       label: 'Kerb Weight',       unit: ' kg' },
];

export function BikeInfoPage({ data, onUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [form,    setForm]       = useState({ ...data.bike, specs: { ...(data.bike.specs || {}) } });
  const bike = data.bike;

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSpec  = (k, v) => setForm(f => ({ ...f, specs: { ...f.specs, [k]: v } }));

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  const insuranceDays = bike.insuranceExpiry
    ? Math.floor((new Date(bike.insuranceExpiry) - new Date()) / 86400000)
    : null;
  const pucDays = bike.pucExpiry
    ? Math.floor((new Date(bike.pucExpiry) - new Date()) / 86400000)
    : null;

  // ── Edit mode ────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setEditing(false)}>←</button>
          <h1>Edit Bike Info</h1>
        </div>
        <div style={{ padding: 16 }}>

          {/* Identity fields */}
          <div className="section-title" style={{ marginBottom: 10 }}>Identity</div>
          {[
            { label: 'Manufacturer',       key: 'make' },
            { label: 'Model',              key: 'model' },
            { label: 'Variant',            key: 'variant' },
            { label: 'Manufacturing Year', key: 'manufacturingYear', type: 'number' },
            { label: 'Colour',             key: 'colour' },
            { label: 'Registration No.',   key: 'registrationNumber' },
            { label: 'Chassis / VIN',      key: 'chassisNumber' },
            { label: 'Engine Number',      key: 'engineNumber' },
            { label: 'Purchase Date',      key: 'purchaseDate',      type: 'date' },
            { label: 'Insurance Expiry',   key: 'insuranceExpiry',   type: 'date' },
            { label: 'PUC Expiry',         key: 'pucExpiry',         type: 'date' },
            { label: 'Warranty Info',      key: 'warrantyInfo' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input
                type={f.type || 'text'}
                className="form-input"
                value={form[f.key] || ''}
                onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}

          {/* Specs fields */}
          <div className="section-title" style={{ margin: '20px 0 10px' }}>Technical Specifications</div>
          {[
            { label: 'Engine',          key: 'engine' },
            { label: 'Fuel System',     key: 'fuelSystem' },
            { label: 'Cooling',         key: 'cooling' },
            { label: 'Transmission',    key: 'transmission' },
            { label: 'Fuel Tank (L)',   key: 'fuelTankCapacity', type: 'number' },
            { label: 'Battery',         key: 'battery' },
            { label: 'Front Tyre',      key: 'frontTyre' },
            { label: 'Rear Tyre',       key: 'rearTyre' },
            { label: 'Front Brake',     key: 'frontBrake' },
            { label: 'Rear Brake',      key: 'rearBrake' },
            { label: 'Kerb Weight (kg)',key: 'kerbWeight', type: 'number' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input
                type={f.type || 'text'}
                className="form-input"
                value={form.specs?.[f.key] || ''}
                onChange={e => setSpec(f.key, e.target.value)}
              />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 2 }}>Save Changes</button>
        </div>
      </div>
    );
  }

  // ── View mode ────────────────────────────────────────────────────────────────
  const specs = bike.specs || {};
  const hasSpecs = Object.values(specs).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Bike Information</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
      </div>

      <div style={{ padding: 16 }}>

        {/* Hero card */}
        <div style={{
          background: 'var(--text)', color: 'white',
          borderRadius: 'var(--radius-lg)', padding: '20px',
          marginBottom: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28 }}>🏍️</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>
            {bike.make} {bike.model}
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 2 }}>
            {bike.variant}{bike.manufacturingYear ? ` · ${bike.manufacturingYear}` : ''}
          </div>
          {bike.colour && (
            <div style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>{bike.colour}</div>
          )}
          {/* Key specs summary row */}
          {hasSpecs && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 16,
              marginTop: 16, paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Engine',   value: specs.engine },
                { label: 'Cooling',  value: specs.cooling },
                { label: 'Gears',    value: specs.transmission },
                { label: 'Weight',   value: specs.kerbWeight ? `${specs.kerbWeight} kg` : undefined },
              ].filter(s => s.value).map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9 }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        {(bike.insuranceExpiry || bike.pucExpiry) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Documents</div>
              {bike.insuranceExpiry && (
                <div className="info-row">
                  <span className="label">Insurance Expiry</span>
                  <span className="value" style={{ color: insuranceDays !== null && insuranceDays < 30 ? 'var(--red-text)' : 'inherit' }}>
                    {formatDate(bike.insuranceExpiry)}
                    {insuranceDays !== null && insuranceDays < 90 && (
                      <span style={{ fontSize: 11, marginLeft: 6, color: insuranceDays < 0 ? 'var(--red-text)' : insuranceDays < 30 ? 'var(--orange-text)' : 'var(--amber-text)' }}>
                        {insuranceDays < 0 ? 'EXPIRED' : `${insuranceDays}d left`}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {bike.pucExpiry && (
                <div className="info-row">
                  <span className="label">PUC Expiry</span>
                  <span className="value" style={{ color: pucDays !== null && pucDays < 30 ? 'var(--red-text)' : 'inherit' }}>
                    {formatDate(bike.pucExpiry)}
                    {pucDays !== null && pucDays < 90 && (
                      <span style={{ fontSize: 11, marginLeft: 6, color: pucDays < 0 ? 'var(--red-text)' : pucDays < 30 ? 'var(--orange-text)' : 'var(--amber-text)' }}>
                        {pucDays < 0 ? 'EXPIRED' : `${pucDays}d left`}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration */}
        {(bike.registrationNumber || bike.purchaseDate || bike.warrantyInfo) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Registration</div>
              {bike.registrationNumber && (
                <div className="info-row">
                  <span className="label">Reg. Number</span>
                  <span className="value">{bike.registrationNumber}</span>
                </div>
              )}
              {bike.purchaseDate && (
                <div className="info-row">
                  <span className="label">Purchase Date</span>
                  <span className="value">{formatDate(bike.purchaseDate)}</span>
                </div>
              )}
              {bike.warrantyInfo && (
                <div className="info-row">
                  <span className="label">Warranty</span>
                  <span className="value">{bike.warrantyInfo}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Specifications */}
        {hasSpecs && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Technical Specifications</div>
              {SPEC_FIELDS.map(sf => {
                const val = specs[sf.key];
                if (val === undefined || val === null || val === '') return null;
                return (
                  <div key={sf.key} className="info-row">
                    <span className="label">{sf.label}</span>
                    <span className="value">{val}{sf.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tyres quick-view */}
        {(specs.frontTyre || specs.rearTyre) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 10 }}>Tyres & Brakes</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Front Tyre',  value: specs.frontTyre },
                  { label: 'Rear Tyre',   value: specs.rearTyre },
                  { label: 'Front Brake', value: specs.frontBrake },
                  { label: 'Rear Brake',  value: specs.rearBrake },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sensitive identifiers notice */}
        <div className="disclaimer">
          ⚠️ Chassis number and engine number are stored locally on your device only and are not shown on the main dashboard.
        </div>

        {bike.notes && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-section">
              <div className="section-title" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{bike.notes}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
