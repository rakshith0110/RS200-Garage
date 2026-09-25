import React, { useState, useMemo } from 'react';
import { formatDate, formatKm, today, generateId } from '../../utils/formatUtils';
import { calculateExpenseSummary, calculateCostPerKm } from '../../services/maintenanceEngine';
import { EmptyState, ConfirmDialog } from '../common/UIKit';

const EXPENSE_CATEGORIES = ['maintenance', 'repair', 'parts', 'consumables', 'upgrades', 'insurance', 'other'];
const CAT_ICONS = {
  maintenance: '🔧', repair: '🛠️', parts: '⚙️', consumables: '🛢️',
  upgrades: '⚡', insurance: '📄', other: '💰',
};

function AddExpenseForm({ data, onSave, onCancel }) {
  const currentKm = data.bike.currentOdometer || 0;
  const [form, setForm] = useState({
    date: today(), category: 'maintenance', amount: '', description: '',
    odometer: currentKm, workshop: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.amount || !form.description) return;
    onSave({ ...form, amount: Number(form.amount), odometer: Number(form.odometer) });
  };

  return (
    <div>
      <div style={{ padding: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input type="number" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" inputMode="decimal" />
        </div>
        <div className="form-group">
          <label className="form-label">Description *</label>
          <input type="text" className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was this expense for?" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <label className="form-label">Workshop</label>
          <input type="text" className="form-input" value={form.workshop} onChange={e => set('workshop', e.target.value)} placeholder="Where?" />
        </div>
      </div>
      <div className="sticky-action-bar" style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>Add Expense</button>
      </div>
    </div>
  );
}

export function ExpensesPage({ data, onAddExpense, onDeleteExpense }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filterYear, setFilterYear] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const summary = useMemo(() => calculateExpenseSummary(data.expenses), [data.expenses]);
  const costPerKm = useMemo(() => calculateCostPerKm(data.expenses, data.odometerHistory, data.bike.currentOdometer), [data]);

  const years = useMemo(() => {
    const set = new Set((data.expenses || []).map(e => new Date(e.date).getFullYear()));
    return ['all', ...Array.from(set).sort((a, b) => b - a)];
  }, [data.expenses]);

  const filtered = useMemo(() => {
    let expenses = [...(data.expenses || [])];
    if (filterYear !== 'all') expenses = expenses.filter(e => new Date(e.date).getFullYear() === Number(filterYear));
    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.expenses, filterYear]);

  if (showAdd) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setShowAdd(false)}>←</button>
          <h1>Add Expense</h1>
        </div>
        <AddExpenseForm data={data} onSave={(e) => { onAddExpense(e); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {/* Summary Cards */}
      <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>₹{Math.round(summary.total).toLocaleString()}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>₹{Math.round(summary.thisYear).toLocaleString()}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Year</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{costPerKm > 0 ? `₹${costPerKm.toFixed(1)}` : '—'}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Per KM</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ marginTop: 12 }}>
          {Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {CAT_ICONS[cat] || '💰'} {cat}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>₹{Math.round(amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Year filter */}
      <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {years.map(y => (
            <button key={y} className="chip" onClick={() => setFilterYear(String(y))}
              style={filterYear === String(y) ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}>
              {y === 'all' ? 'All Years' : y}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        {filtered.length === 0 ? (
          <EmptyState icon="💰" title="No Expenses" description="Track your RS200 spending here." action="+ Add Expense" onAction={() => setShowAdd(true)} />
        ) : (
          filtered.map(exp => (
            <div key={exp.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{exp.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {formatDate(exp.date)} {exp.workshop ? `· ${exp.workshop}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>₹{Math.round(exp.amount || 0).toLocaleString()}</div>
                  <span className="chip" style={{ fontSize: 10, textTransform: 'capitalize' }}>{exp.category}</span>
                </div>
              </div>
              <button
                onClick={() => setDeleteId(exp.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', marginTop: 4 }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Expense?"
        message="This will remove the expense record permanently."
        danger
        onConfirm={() => { onDeleteExpense(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
