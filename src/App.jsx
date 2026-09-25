import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { SplashScreen } from './components/common/SplashScreen';
import { useBikeData } from './hooks/useBikeData';
import { BottomNav } from './components/common/BottomNav';
import { Toast, BottomSheet } from './components/common/UIKit';
import { Dashboard } from './components/dashboard/Dashboard';
import {
  ServiceHistory, ServiceDetail, RecordServiceForm, NextServicePage,
} from './components/service/ServiceComponents';
import { PartsCatalogue, PartDetail } from './components/parts/PartsComponents';
import { IssuesDashboard } from './components/issues/IssuesComponents';
import { ExpensesPage } from './components/expenses/ExpensesComponents';
import { UsagePage, UpdateOdometerSheet } from './components/settings/UsageComponents';
import { BikeInfoPage } from './components/settings/BikeInfoPage';
import {
  MoreMenu, MaintenanceSchedulePage, UpgradesPage, BackupPage, SettingsPage,
} from './components/settings/MoreComponents';
import { getDefaultData } from './services/storageService';
import './styles/global.css';

// ─── Sheet wrappers ───────────────────────────────────────────────────────────
function OdometerSheetWrapper({ data, actions, onClose }) {
  const { updateOdometer } = actions;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <h2>Update Odometer</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <UpdateOdometerSheet data={data} onUpdate={updateOdometer} onClose={onClose} />
      </div>
    </div>
  );
}

function RecordServiceSheetWrapper({ data, actions, onClose, navigate }) {
  const { addService } = actions;
  return (
    <div className="page" style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'var(--bg)', overflowY: 'auto', maxWidth: 480, margin: '0 auto' }}>
      <div className="page-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <h1>Record Service</h1>
      </div>
      <RecordServiceForm
        data={data}
        onSave={(svcData) => {
          addService(svcData);
          onClose();
          navigate('/service');
        }}
        onCancel={onClose}
      />
    </div>
  );
}

function AddIssueSheetWrapper({ data, actions, onClose }) {
  const { addIssue } = actions;
  const [form, setForm] = useState({
    title: '', category: 'other', priority: 'medium', status: 'open',
    firstNoticedDate: new Date().toISOString().slice(0, 10),
    firstNoticedOdometer: data.bike.currentOdometer || 0,
    description: '', attachToNextService: true, notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title) return;
    addIssue({ ...form, firstNoticedOdometer: Number(form.firstNoticedOdometer) });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <h2>Add Issue</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-body">
          <div className="form-group">
            <label className="form-label">Issue Title *</label>
            <input type="text" className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Front brake squeaking" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {['brakes', 'engine', 'drive', 'suspension', 'electrical', 'body', 'tyres', 'other'].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue..." style={{ minHeight: 60 }} />
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 16, cursor: 'pointer' }}
            onClick={() => set('attachToNextService', !form.attachToNextService)}
          >
            <span style={{ fontSize: 18 }}>{form.attachToNextService ? '✅' : '☐'}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Attach to Next Service</span>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave}>Add Issue</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const [showOdometer, setShowOdometer] = useState(false);
  const [showRecordService, setShowRecordService] = useState(false);
  const [showAddIssue, setShowAddIssue] = useState(false);

  const {
    data, toast,
    updateOdometer, updateBikeInfo,
    addService, updateService, deleteService,
    addIssue, updateIssue, deleteIssue,
    addUpgrade, deleteUpgrade,
    addExpense, deleteExpense,
    updatePart, addPartEvent,
    replaceAllData, updateSettings,
    addCustomMaintenance, deleteCustomMaintenance,
  } = useBikeData();

  const actions = {
    updateOdometer, updateBikeInfo,
    addService, updateService, deleteService,
    addIssue, updateIssue, deleteIssue,
    addUpgrade, deleteUpgrade,
    addExpense, deleteExpense,
    updatePart, addPartEvent,
    replaceAllData,
  };

  const handleReset = () => {
    const defaults = getDefaultData();
    replaceAllData(defaults);
    navigate('/');
  };

  return (
    <>
    {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
    <div className="app-shell">
      <Routes>
        {/* ── Home / Dashboard ── */}
        <Route path="/" element={
          <Dashboard
            data={data}
            onUpdateOdometer={() => setShowOdometer(true)}
            onRecordService={() => setShowRecordService(true)}
            onAddIssue={() => setShowAddIssue(true)}
            onNextService={() => navigate('/next-service')}
          />
        } />

        {/* ── Service ── */}
        <Route path="/service" element={
          <ServiceHistory
            data={data}
            onAdd={() => setShowRecordService(true)}
            onSelect={(id) => navigate(`/service/${id}`)}
          />
        } />
        <Route path="/service/:id" element={<ServiceDetailRoute data={data} actions={actions} />} />
        <Route path="/next-service" element={
          <NextServicePage
            data={data}
            onBack={() => navigate(-1)}
            onStartService={() => setShowRecordService(true)}
          />
        } />

        {/* ── Parts ── */}
        <Route path="/parts" element={
          <PartsCatalogue
            data={data}
            onSelectPart={(id) => navigate(`/parts/${id}`)}
          />
        } />
        <Route path="/parts/:id" element={<PartDetailRoute data={data} actions={actions} />} />

        {/* ── Issues ── */}
        <Route path="/issues" element={
          <IssuesDashboard
            data={data}
            onAddIssue={addIssue}
            onUpdateIssue={updateIssue}
            onDeleteIssue={deleteIssue}
          />
        } />

        {/* ── More ── */}
        <Route path="/more" element={
          <MoreMenu onNavigate={(route) => navigate(`/more/${route}`)} />
        } />
        <Route path="/more/expenses" element={
          <ExpensesPage data={data} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />
        } />
        <Route path="/more/usage" element={<UsagePage data={data} />} />
        <Route path="/more/bike-info" element={
          <BikeInfoPage data={data} onUpdate={updateBikeInfo} />
        } />
        <Route path="/more/maintenance" element={
          <MaintenanceSchedulePage data={data} onBack={() => navigate('/more')} />
        } />
        <Route path="/more/upgrades" element={
          <UpgradesPage data={data} onAddUpgrade={addUpgrade} onDeleteUpgrade={deleteUpgrade} onBack={() => navigate('/more')} />
        } />
        <Route path="/more/backup" element={
          <BackupPage
            data={data}
            onImport={replaceAllData}
            onReset={handleReset}
            onBack={() => navigate('/more')}
          />
        } />
        <Route path="/more/settings" element={
          <SettingsPage data={data} onBack={() => navigate('/more')} />
        } />
      </Routes>

      <BottomNav />
      <Toast toast={toast} />

      {showOdometer && (
        <OdometerSheetWrapper data={data} actions={actions} onClose={() => setShowOdometer(false)} />
      )}
      {showRecordService && (
        <RecordServiceSheetWrapper data={data} actions={actions} onClose={() => setShowRecordService(false)} navigate={navigate} />
      )}
      {showAddIssue && (
        <AddIssueSheetWrapper data={data} actions={actions} onClose={() => setShowAddIssue(false)} />
      )}
    </div>
    </>
  );
}

// ─── Route helpers ────────────────────────────────────────────────────────────
function ServiceDetailRoute({ data, actions }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <ServiceDetail
      serviceId={id}
      data={data}
      onBack={() => navigate('/service')}
      onDelete={actions.deleteService}
    />
  );
}

function PartDetailRoute({ data, actions }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <PartDetail
      partId={id}
      data={data}
      onBack={() => navigate('/parts')}
      onUpdatePart={actions.updatePart}
      onAddEvent={actions.addPartEvent}
    />
  );
}
