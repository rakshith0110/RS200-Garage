import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardBg from '../../assets/rs200 dashboard.png';
import {
  calculateNextService,
  getUpcomingMaintenance,
  getOverdueMaintenance,
  calculateBikeHealth,
} from '../../services/maintenanceEngine';
import {
  formatKm, formatDate, formatRelativeKm, STATUS_COLORS, STATUS_LABELS
} from '../../utils/formatUtils';
import { StatusBadge, ProgressBar, EmptyState } from '../common/UIKit';

function OdometerCard({ bike, nextService, onUpdate }) {
  const kmRemaining = nextService?.kmRemaining ?? 0;
  const kmOverdue = nextService?.kmOverdue ?? 0;
  const progressPct = nextService?.nextServiceKm
    ? Math.min(100, ((nextService.nextServiceKm - kmRemaining) / nextService.nextServiceKm) * 100)
    : 0;

  return (
    <div style={{
      background: 'var(--text)',
      color: 'white',
      padding: '24px 20px 20px',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* subtle bike image background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        opacity: 0.13,
        pointerEvents: 'none',
        borderRadius: 'var(--radius-lg)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
            BAJAJ PULSAR RS200
          </div>
          <div className="odometer-display" style={{ color: 'white' }}>
            {(bike.currentOdometer || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
            KM — Current
          </div>
        </div>
        <button
          className="btn btn-sm"
          onClick={onUpdate}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700 }}
        >
          Update
        </button>
      </div>

      {nextService && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Next Service
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {(nextService.nextServiceKm || 0).toLocaleString('en-IN')} KM
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {kmOverdue > 0 ? (
                <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: 15 }}>
                  {kmOverdue.toLocaleString('en-IN')} KM Overdue
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {kmRemaining.toLocaleString('en-IN')} KM
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Remaining
                  </div>
                </div>
              )}
              {nextService.daysRemaining !== null && (
                <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>
                  ~{nextService.daysRemaining} days
                </div>
              )}
            </div>
          </div>
          <ProgressBar value={progressPct} color={kmOverdue > 0 ? '#ef4444' : '#22c55e'} height={4} />
        </div>
      )}
    </div>
  );
}

function QuickActions({ onRecordService, onUpdateOdometer, onAddIssue, onNextService }) {
  const actions = [
    { label: '+ Record\nService', icon: '🔧', onClick: onRecordService, primary: true },
    { label: 'Update\nOdometer', icon: '📍', onClick: onUpdateOdometer },
    { label: '+ Add\nIssue', icon: '⚠️', onClick: onAddIssue },
    { label: 'Next\nService', icon: '📋', onClick: onNextService },
  ];
  return (
    <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
      {actions.map((a, i) => (
        <button key={i} className={`quick-action-btn ${a.primary ? 'primary' : ''}`} onClick={a.onClick}>
          <span className="qa-icon">{a.icon}</span>
          <span style={{ whiteSpace: 'pre-line' }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function MaintenanceAlerts({ upcoming, overdue, currentKm }) {
  const allItems = [...overdue.map(i => ({ ...i, _overdue: true })), ...upcoming.filter(i => !overdue.some(o => o.ruleId === i.ruleId))];

  if (allItems.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-section">
        <div className="section-title" style={{ marginBottom: 12 }}>Attention Needed</div>
        {allItems.slice(0, 6).map(item => (
          <div key={item.ruleId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                {item.kmOverdue > 0
                  ? `Overdue by ${item.kmOverdue.toLocaleString()} KM`
                  : item.nextDueKm
                    ? `Due at ${item.nextDueKm.toLocaleString()} KM`
                    : 'Inspect required'}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenIssuesCard({ issues, onViewAll }) {
  const open = issues.filter(i => ['open', 'monitoring', 'partially_fixed'].includes(i.status));
  if (open.length === 0) return null;

  const criticalCount = open.filter(i => i.priority === 'critical').length;
  const highCount = open.filter(i => i.priority === 'high').length;
  const medCount = open.filter(i => i.priority === 'medium').length;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-section">
        <div className="card-header">
          <span className="section-title">Open Issues</span>
          <button className="btn btn-ghost btn-sm" onClick={onViewAll}>View All</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {criticalCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '3px 8px', borderRadius: 20 }}>🔴 {criticalCount} Critical</span>}
          {highCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', background: '#fff7ed', padding: '3px 8px', borderRadius: 20 }}>🟠 {highCount} High</span>}
          {medCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '3px 8px', borderRadius: 20 }}>🟡 {medCount} Medium</span>}
        </div>
        {open.slice(0, 3).map(issue => (
          <div key={issue.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                First noticed: {formatKm(issue.firstNoticedOdometer)}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: issue.priority === 'high' ? '#fff7ed' : issue.priority === 'critical' ? '#fee2e2' : '#fef3c7',
              color: issue.priority === 'high' ? '#c2410c' : issue.priority === 'critical' ? '#991b1b' : '#92400e'
            }}>
              {issue.priority?.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BikeHealthCard({ health, categoryScores }) {
  const categories = [
    { key: 'engine', label: 'Engine' },
    { key: 'brakes', label: 'Brakes' },
    { key: 'drive', label: 'Drive' },
    { key: 'cooling', label: 'Cooling' },
    { key: 'suspension', label: 'Suspension' },
    { key: 'tyres', label: 'Tyres' },
  ];

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-section">
        <div className="card-header">
          <span className="section-title">Personal Maintenance Health</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: health > 70 ? 'var(--green)' : health > 40 ? 'var(--amber)' : 'var(--red)' }}>
            {health}%
          </span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <ProgressBar value={health} height={8} />
        </div>
        <div className="disclaimer" style={{ marginBottom: 12 }}>
          Personal maintenance tracker score — based on recorded service history, not a mechanical diagnostic.
        </div>
        <div className="stack gap-8">
          {categories.map(cat => (
            <div key={cat.key} className="health-bar">
              <span className="health-label">{cat.label}</span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={categoryScores[cat.key] || 0} />
              </div>
              <span className="health-pct">{categoryScores[cat.key] || 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentServiceCard({ services, onViewAll }) {
  const recent = [...(services || [])].sort((a, b) => b.odometer - a.odometer).slice(0, 3);
  if (recent.length === 0) return null;

  const TYPE_LABELS = {
    periodic_service: 'Periodic Service', general_service: 'General Service', repair: 'Repair',
    part_replacement: 'Part Replacement', upgrade_modification: 'Upgrade', inspection: 'Inspection',
    tyre_replacement: 'Tyre Replacement', other: 'Service',
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-section">
        <div className="card-header">
          <span className="section-title">Recent Services</span>
          <button className="btn btn-ghost btn-sm" onClick={onViewAll}>View All</button>
        </div>
        {recent.map(svc => (
          <div key={svc.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{TYPE_LABELS[svc.type] || 'Service'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{formatDate(svc.date)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatKm(svc.odometer)}</div>
              {svc.cost > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{svc.cost.toLocaleString()}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({ data, onUpdateOdometer, onRecordService, onAddIssue, onNextService }) {
  const navigate = useNavigate();
  const currentKm = data.bike.currentOdometer || 0;

  const nextService = useMemo(() => calculateNextService(data.bike, data.services), [data.bike, data.services]);
  const upcoming = useMemo(() => getUpcomingMaintenance(data.parts, currentKm), [data.parts, currentKm]);
  const overdue = useMemo(() => getOverdueMaintenance(data.parts, currentKm), [data.parts, currentKm]);
  const { overallHealth, categoryScores } = useMemo(() => calculateBikeHealth(data.parts, data.issues, currentKm), [data.parts, data.issues, currentKm]);

  return (
    <div className="page">
      <div style={{ background: 'var(--bg)', padding: '16px 16px 0', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>RS200 Garage</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PERSONAL MOTORCYCLE TRACKER</div>
          </div>
          <span style={{ fontSize: 22 }}>🏍️</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <OdometerCard bike={data.bike} nextService={nextService} onUpdate={onUpdateOdometer} />
        <QuickActions
          onRecordService={onRecordService}
          onUpdateOdometer={onUpdateOdometer}
          onAddIssue={onAddIssue}
          onNextService={onNextService}
        />
        <MaintenanceAlerts upcoming={upcoming} overdue={overdue} currentKm={currentKm} />
        <OpenIssuesCard issues={data.issues} onViewAll={() => navigate('/issues')} />
        <BikeHealthCard health={overallHealth} categoryScores={categoryScores} />
        <RecentServiceCard services={data.services} onViewAll={() => navigate('/service')} />

        {data.services.length === 0 && data.bike.currentOdometer === 0 && (
          <EmptyState
            icon="🏍️"
            title="Welcome to RS200 Garage"
            description="Set up your bike information and record your first service to get started."
            action="Set Up Bike"
            onAction={() => navigate('/more/bike-info')}
          />
        )}
      </div>
    </div>
  );
}
