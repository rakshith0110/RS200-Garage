// Storage Service — manages all localStorage persistence for RS200 Garage

const STORAGE_KEY = 'rs200-garage-data';
const SCHEMA_VERSION = 1;

export function getDefaultData() {
  return {
    app: {
      name: 'RS200 Garage',
      version: '1.0.0',
      schemaVersion: SCHEMA_VERSION,
    },
    bike: {
      make: 'Bajaj',
      model: 'Pulsar RS200',
      variant: 'BS4',
      manufacturingYear: '',
      registrationNumber: '',
      chassisNumber: '',
      engineNumber: '',
      purchaseDate: '',
      currentOdometer: 0,
      colour: '',
      insuranceExpiry: '',
      pucExpiry: '',
      warrantyInfo: '',
      notes: '',
      specs: {
        engine: '199.5cc',
        fuelSystem: 'Fuel Injection',
        cooling: 'Liquid Cooled',
        transmission: '6 Speed',
        fuelTankCapacity: 13,
        battery: '12V 8Ah VRLA',
        frontTyre: '110/70-17',
        rearTyre: '130/70-17',
        frontBrake: '300mm Disc',
        rearBrake: '230mm Disc',
        kerbWeight: 164,
      },
    },
    services: [],
    parts: [],
    issues: [],
    upgrades: [],
    expenses: [],
    odometerHistory: [],
    customMaintenance: [],
    settings: {
      theme: 'light',
      currency: '₹',
    },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.app?.schemaVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportJSON(data) {
  const filename = `rs200-garage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed?.app?.schemaVersion) {
      return { success: false, error: 'Invalid RS200 Garage backup file. Missing schema version.' };
    }
    if (parsed.app.schemaVersion > SCHEMA_VERSION) {
      return { success: false, error: `Backup schema version ${parsed.app.schemaVersion} is newer than this app version.` };
    }
    const summary = {
      services: (parsed.services || []).length,
      parts: (parsed.parts || []).length,
      issues: (parsed.issues || []).length,
      upgrades: (parsed.upgrades || []).length,
      expenses: (parsed.expenses || []).length,
      odometerHistory: (parsed.odometerHistory || []).length,
    };
    return { success: true, data: parsed, summary };
  } catch {
    return { success: false, error: 'Invalid JSON format. Please select a valid RS200 Garage backup file.' };
  }
}

export function exportCSV(data, type) {
  let rows = [];
  let filename = '';

  if (type === 'services') {
    filename = 'rs200-service-history.csv';
    rows = [
      ['Date', 'Odometer (KM)', 'Type', 'Workshop', 'Cost', 'Notes'],
      ...(data.services || []).map(s => [
        s.date, s.odometer, s.type, s.workshop || '', s.cost || 0, s.notes || ''
      ])
    ];
  } else if (type === 'expenses') {
    filename = 'rs200-expenses.csv';
    rows = [
      ['Date', 'Category', 'Amount', 'Description'],
      ...(data.expenses || []).map(e => [
        e.date, e.category, e.amount, e.description || ''
      ])
    ];
  } else if (type === 'issues') {
    filename = 'rs200-issues.csv';
    rows = [
      ['Title', 'Category', 'Priority', 'Status', 'First Noticed Date', 'First Noticed KM'],
      ...(data.issues || []).map(i => [
        i.title, i.category, i.priority, i.status, i.firstNoticedDate, i.firstNoticedOdometer
      ])
    ];
  } else if (type === 'odometer') {
    filename = 'rs200-odometer-history.csv';
    rows = [
      ['Date', 'Odometer (KM)', 'Notes'],
      ...(data.odometerHistory || []).map(o => [
        o.date, o.odometer, o.notes || ''
      ])
    ];
  }

  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
