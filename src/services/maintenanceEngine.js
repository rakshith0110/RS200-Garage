// Maintenance Calculation Engine — all business logic lives here, never in UI components

import maintenanceRules from '../data/maintenance-rules.json';

const UPCOMING_WINDOW_KM = 2000; // show items due within 2000 KM as "upcoming"
const DUE_SOON_WINDOW_KM = 800;  // show items due within 800 KM as "due_soon"

// ─── Service Interval Logic ───────────────────────────────────────────────────

export function calculateNextService(bikeData, services) {
  const { serviceIntervals } = maintenanceRules;
  const currentKm = bikeData.currentOdometer || 0;
  const purchaseDate = bikeData.purchaseDate ? new Date(bikeData.purchaseDate) : null;

  // Sort services by odometer
  const sorted = [...(services || [])].sort((a, b) => b.odometer - a.odometer);
  const lastService = sorted[0] || null;

  // Determine next service KM
  let nextKm = null;
  let serviceLabel = '';

  // Check free service thresholds
  const freeServices = serviceIntervals.filter(s => s.kmMin !== undefined);
  for (const fs of freeServices) {
    const alreadyDone = sorted.some(s => s.odometer >= fs.kmMin && s.odometer <= fs.kmMax + 1000);
    if (!alreadyDone && currentKm < fs.kmMax + 500) {
      nextKm = fs.kmMin;
      serviceLabel = fs.label;
      break;
    }
  }

  // If past free services, use 5000 km interval
  if (!nextKm) {
    const subsequentRule = serviceIntervals.find(s => s.intervalKm);
    const interval = subsequentRule?.intervalKm || 5000;
    const lastKm = lastService?.odometer || 0;
    nextKm = lastKm + interval;
    serviceLabel = `${(nextKm / 1000).toFixed(0)}K Service`;
  }

  const kmRemaining = nextKm - currentKm;

  // Estimate days remaining based on usage
  let daysRemaining = null;
  let estimatedDate = null;
  const avgDailyKm = calculateAverageDailyKm(bikeData, services);
  if (avgDailyKm > 0 && kmRemaining > 0) {
    daysRemaining = Math.round(kmRemaining / avgDailyKm);
    estimatedDate = new Date(Date.now() + daysRemaining * 86400000).toISOString().slice(0, 10);
  }

  // Also check 120-day interval for subsequent services
  let timeBasedNextDate = null;
  if (lastService?.date) {
    const lastDate = new Date(lastService.date);
    timeBasedNextDate = new Date(lastDate.getTime() + 120 * 86400000).toISOString().slice(0, 10);
  }

  let status = 'healthy';
  if (kmRemaining <= 0) status = 'overdue';
  else if (kmRemaining <= DUE_SOON_WINDOW_KM) status = 'due_soon';
  else if (kmRemaining <= UPCOMING_WINDOW_KM) status = 'upcoming';

  return {
    nextServiceKm: nextKm,
    serviceLabel,
    kmRemaining: Math.max(kmRemaining, 0),
    kmOverdue: kmRemaining < 0 ? Math.abs(kmRemaining) : 0,
    daysRemaining,
    estimatedDate,
    timeBasedNextDate,
    status,
    lastService,
  };
}

// ─── Per-Part Maintenance Status ──────────────────────────────────────────────

export function calculateMaintenanceStatus(ruleId, partData, currentKm, currentDate = new Date()) {
  const rule = maintenanceRules.maintenanceItems.find(r => r.id === ruleId);
  if (!rule) return { status: 'no_rule', health: 100, nextDueKm: null };

  const lastKm = partData?.lastServiceOdometer || 0;
  const lastDate = partData?.lastServiceDate ? new Date(partData.lastServiceDate) : null;

  if (rule.ruleType === 'km_interval') {
    const nextDueKm = lastKm + rule.intervalKm;
    const kmRemaining = nextDueKm - currentKm;
    const consumed = currentKm - lastKm;
    // Health: percentage of interval remaining (not consumed)
    const rawHealth = Math.max(0, Math.min(100, Math.round(((rule.intervalKm - consumed) / rule.intervalKm) * 100)));
    const status = getKmStatus(kmRemaining);
    // Clamp health so overdue = 0%, due_soon gets amber range
    const health = status === 'overdue' ? 0 : rawHealth;
    return {
      status,
      health,
      nextDueKm,
      kmRemaining: Math.max(kmRemaining, 0),
      kmOverdue: kmRemaining < 0 ? Math.abs(kmRemaining) : 0,
      consumed,
      interval: rule.intervalKm,
    };
  }

  if (rule.ruleType === 'km_or_time') {
    const nextDueKm = lastKm + rule.intervalKm;
    const kmRemaining = nextDueKm - currentKm;
    let timeTriggered = false;
    let daysOverdue = 0;
    if (lastDate && rule.intervalDays) {
      const daysSince = Math.floor((currentDate - lastDate) / 86400000);
      daysOverdue = daysSince - rule.intervalDays;
      if (daysOverdue >= 0) timeTriggered = true;
    }
    const consumed = currentKm - lastKm;
    const health = Math.max(0, Math.min(100, Math.round(((rule.intervalKm - consumed) / rule.intervalKm) * 100)));
    const status = timeTriggered ? 'overdue' : getKmStatus(kmRemaining);
    return { status, health, nextDueKm, kmRemaining: Math.max(kmRemaining, 0), kmOverdue: kmRemaining < 0 ? Math.abs(kmRemaining) : 0, timeTriggered, daysOverdue: Math.max(daysOverdue, 0) };
  }

  if (rule.ruleType === 'time_based') {
    if (!lastDate) return { status: 'not_enough_data', health: 100 };
    const daysSince = Math.floor((currentDate - lastDate) / 86400000);
    const lifeYears = rule.expectedLifeYearsMax || 3;
    const lifeDays = lifeYears * 365;
    const health = Math.max(0, Math.min(100, Math.round(((lifeDays - daysSince) / lifeDays) * 100)));
    const status = daysSince > lifeDays ? 'overdue' : (daysSince > lifeDays * 0.8 ? 'due_soon' : 'healthy');
    return { status, health, daysSince, lifeYears };
  }

  if (rule.ruleType === 'condition' || rule.ruleType === 'expected_life' || rule.ruleType === 'km_or_condition') {
    if (!partData?.lastServiceOdometer) return { status: 'condition_based', health: 100 };
    const consumed = currentKm - lastKm;
    const maxLife = rule.expectedLifeKmMax || rule.expectedLifeKmMin || 30000;
    const health = Math.max(0, Math.min(100, Math.round(((maxLife - consumed) / maxLife) * 100)));
    const status = consumed > maxLife ? 'inspect_required' : (consumed > maxLife * 0.85 ? 'due_soon' : 'condition_based');
    if (rule.ruleType === 'km_or_condition' && rule.intervalKm) {
      const nextDueKm = lastKm + rule.intervalKm;
      const kmRemaining = nextDueKm - currentKm;
      return { status: consumed > maxLife ? 'inspect_required' : getKmStatus(kmRemaining), health, nextDueKm, kmRemaining: Math.max(kmRemaining, 0) };
    }
    return { status, health, consumed, expectedLifeKmMax: maxLife };
  }

  return { status: 'condition_based', health: 100 };
}

function getKmStatus(kmRemaining) {
  if (kmRemaining <= 0) return 'overdue';
  if (kmRemaining <= DUE_SOON_WINDOW_KM) return 'due_soon';
  if (kmRemaining <= UPCOMING_WINDOW_KM) return 'upcoming';
  return 'healthy';
}

// ─── Upcoming Maintenance List ─────────────────────────────────────────────────

export function getUpcomingMaintenance(parts, currentKm, currentDate = new Date()) {
  const items = [];
  for (const rule of maintenanceRules.maintenanceItems) {
    if (rule.ruleType === 'condition') continue; // skip pure condition items
    const partData = (parts || []).find(p => p.ruleId === rule.id);
    const calc = calculateMaintenanceStatus(rule.id, partData, currentKm, currentDate);
    if (calc.status !== 'healthy' && calc.status !== 'not_enough_data' && calc.status !== 'no_rule') {
      items.push({
        ruleId: rule.id,
        name: rule.name,
        category: rule.category,
        status: calc.status,
        nextDueKm: calc.nextDueKm,
        kmRemaining: calc.kmRemaining,
        kmOverdue: calc.kmOverdue || 0,
        health: calc.health,
        conditionBased: rule.conditionBased,
        action: rule.action,
      });
    }
  }
  // Sort: overdue first, then by kmRemaining ascending
  return items.sort((a, b) => {
    const order = { overdue: 0, inspect_required: 1, due: 2, due_soon: 3, upcoming: 4, condition_based: 5 };
    const ao = order[a.status] ?? 9;
    const bo = order[b.status] ?? 9;
    if (ao !== bo) return ao - bo;
    return (a.kmRemaining || 0) - (b.kmRemaining || 0);
  });
}

export function getOverdueMaintenance(parts, currentKm, currentDate = new Date()) {
  return getUpcomingMaintenance(parts, currentKm, currentDate)
    .filter(i => i.status === 'overdue' || i.status === 'inspect_required');
}

// ─── Next Service Checklist ────────────────────────────────────────────────────

export function generateNextServiceChecklist(bikeData, parts, issues, services) {
  const currentKm = bikeData.currentOdometer || 0;
  const nextSvc = calculateNextService(bikeData, services);
  const targetKm = nextSvc.nextServiceKm;

  const scheduledItems = [];
  const routineChecks = [];

  for (const rule of maintenanceRules.maintenanceItems) {
    const partData = (parts || []).find(p => p.ruleId === rule.id);
    const lastKm = partData?.lastServiceOdometer || 0;

    if (rule.ruleType === 'km_interval' || rule.ruleType === 'km_or_time') {
      const nextDueKm = lastKm + rule.intervalKm;
      if (nextDueKm <= targetKm) {
        scheduledItems.push({ id: rule.id, name: rule.name, nextDueKm, action: rule.action, overdue: nextDueKm < currentKm });
      }
    } else if (rule.conditionBased) {
      routineChecks.push({ id: rule.id, name: rule.name, action: rule.action });
    }
  }

  const openIssues = (issues || []).filter(i => ['open', 'monitoring', 'partially_fixed'].includes(i.status) && i.attachToNextService);

  return {
    targetKm,
    kmRemaining: nextSvc.kmRemaining,
    scheduledItems,
    routineChecks,
    openIssues,
  };
}

// ─── Health Calculation ────────────────────────────────────────────────────────

export function calculateBikeHealth(parts, issues, currentKm, currentDate = new Date()) {
  const categoryWeights = {
    engine: 25,
    brakes: 20,
    drive: 15,
    suspension: 10,
    cooling: 10,
    tyres: 10,
    electrical: 5,
    transmission: 5,
  };

  const categoryHealths = {};

  for (const rule of maintenanceRules.maintenanceItems) {
    const partData = (parts || []).find(p => p.ruleId === rule.id);
    const calc = calculateMaintenanceStatus(rule.id, partData, currentKm, currentDate);
    const cat = rule.category;
    if (!categoryHealths[cat]) categoryHealths[cat] = [];
    categoryHealths[cat].push(calc.health);
  }

  let totalWeightedHealth = 0;
  let totalWeight = 0;
  const categoryScores = {};

  for (const [cat, scores] of Object.entries(categoryHealths)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    categoryScores[cat] = Math.round(avg);
    const weight = categoryWeights[cat] || 5;
    totalWeightedHealth += avg * weight;
    totalWeight += weight;
  }

  // Penalize for open critical/high issues
  const openCritical = (issues || []).filter(i => i.status === 'open' && i.priority === 'critical').length;
  const openHigh = (issues || []).filter(i => i.status === 'open' && i.priority === 'high').length;
  const penalty = openCritical * 5 + openHigh * 2;

  const overallHealth = Math.max(0, Math.min(100, Math.round(totalWeightedHealth / (totalWeight || 1)) - penalty));

  return { overallHealth, categoryScores };
}

// ─── Average Daily KM ─────────────────────────────────────────────────────────

export function calculateAverageDailyKm(bikeData, services) {
  const entries = [...(services || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (entries.length < 2) return 0;

  const first = entries[0];
  const last = entries[entries.length - 1];
  const kmDiff = last.odometer - first.odometer;
  const daysDiff = Math.max(1, Math.floor((new Date(last.date) - new Date(first.date)) / 86400000));
  return kmDiff / daysDiff;
}

// ─── Odometer Validation ──────────────────────────────────────────────────────

export function validateOdometer(newKm, currentKm) {
  if (isNaN(newKm) || newKm < 0) return { valid: false, error: 'Odometer must be a positive number.' };
  if (newKm < currentKm) {
    return {
      valid: false,
      error: `Odometer cannot go backwards. Current: ${currentKm.toLocaleString()} KM. Entered: ${newKm.toLocaleString()} KM.`,
      isRollback: true,
    };
  }
  return { valid: true };
}

// ─── Cost Calculations ────────────────────────────────────────────────────────

export function calculateCostPerKm(expenses, odometerHistory, currentKm) {
  const relevantCategories = ['maintenance', 'repair', 'parts', 'consumables'];
  const totalCost = (expenses || [])
    .filter(e => relevantCategories.includes(e.category?.toLowerCase()))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  if (!currentKm || currentKm === 0) return 0;
  return totalCost / currentKm;
}

export function calculateExpenseSummary(expenses) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const byCategory = {};
  let total = 0;
  let thisYear = 0;

  for (const e of expenses || []) {
    const amount = e.amount || 0;
    total += amount;
    if (new Date(e.date).getFullYear() === currentYear) thisYear += amount;
    const cat = e.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  }

  return { total, thisYear, byCategory };
}

// ─── Part History Merge ────────────────────────────────────────────────────────

export function getPartHistory(partId, services) {
  const history = [];
  for (const svc of services || []) {
    for (const work of svc.work || []) {
      if (work.item === partId || work.partId === partId) {
        history.push({
          date: svc.date,
          odometer: svc.odometer,
          action: work.action,
          notes: work.notes || '',
          serviceId: svc.id,
        });
      }
    }
  }
  return history.sort((a, b) => b.odometer - a.odometer);
}
