// Date and number formatting utilities

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatKm(km) {
  if (km === null || km === undefined) return '—';
  return `${Number(km).toLocaleString('en-IN')} KM`;
}

export function formatCurrency(amount, currency = '₹') {
  if (amount === null || amount === undefined) return '—';
  return `${currency}${Number(amount).toLocaleString('en-IN')}`;
}

export function formatRelativeKm(km) {
  if (!km) return '';
  const abs = Math.abs(km);
  return `${Number(abs).toLocaleString('en-IN')} KM`;
}

export function formatDays(days) {
  if (days === null || days === undefined) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / 86400000);
}

export function generateId(prefix = 'rec') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export const STATUS_LABELS = {
  healthy: 'Healthy',
  upcoming: 'Upcoming',
  due_soon: 'Due Soon',
  due: 'Due',
  overdue: 'Overdue',
  condition_based: 'Condition Based',
  inspect_required: 'Inspect',
  not_enough_data: 'No Data',
};

export const STATUS_COLORS = {
  healthy: { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  upcoming: { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  due_soon: { bg: '#fed7aa', text: '#c2410c', dot: '#f97316' },
  due: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  overdue: { bg: '#fee2e2', text: '#7f1d1d', dot: '#dc2626' },
  condition_based: { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
  inspect_required: { bg: '#fed7aa', text: '#c2410c', dot: '#f97316' },
  not_enough_data: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

export const PRIORITY_COLORS = {
  critical: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  high: { bg: '#fed7aa', text: '#c2410c', dot: '#f97316' },
  medium: { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  low: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

export const CATEGORY_LABELS = {
  engine: 'Engine',
  cooling: 'Cooling',
  drive: 'Drive',
  brakes: 'Brakes',
  suspension: 'Suspension',
  tyres: 'Tyres',
  wheels: 'Wheels',
  electrical: 'Electrical',
  transmission: 'Transmission',
  controls: 'Controls',
  body: 'Body',
};

export const SERVICE_TYPES = [
  { value: 'periodic_service', label: 'Periodic Service' },
  { value: 'general_service', label: 'General Service' },
  { value: 'repair', label: 'Repair' },
  { value: 'part_replacement', label: 'Part Replacement' },
  { value: 'upgrade_modification', label: 'Upgrade / Modification' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'accident_repair', label: 'Accident Repair' },
  { value: 'tyre_replacement', label: 'Tyre Replacement' },
  { value: 'electrical_work', label: 'Electrical Work' },
  { value: 'other', label: 'Other' },
];

export const WORK_ACTIONS = [
  'Replaced', 'Checked', 'Cleaned', 'Adjusted', 'Lubricated', 'Topped up', 'Repaired', 'Not touched'
];
