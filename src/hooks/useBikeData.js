// useBikeData — central state hook for all RS200 Garage data
import { useState, useCallback, useEffect } from 'react';
import { loadData, saveData, getDefaultData } from '../services/storageService';
import { generateId, today } from '../utils/formatUtils';
import { validateOdometer } from '../services/maintenanceEngine';
import partDefinitions from '../data/part-definitions.json';

function initializeParts(existingParts) {
  // Merge part-definitions with any stored part data
  return partDefinitions.map(def => {
    const stored = (existingParts || []).find(p => p.id === def.id);
    return stored || {
      id: def.id,
      name: def.name,
      category: def.category,
      ruleId: def.ruleId,
      lastServiceDate: null,
      lastServiceOdometer: null,
      status: 'healthy',
      condition: 'unknown',
      brand: '',
      partNumber: '',
      cost: null,
      history: [],
      notes: '',
    };
  });
}

export function useBikeData() {
  const [data, setData] = useState(() => {
    const stored = loadData();
    if (stored) {
      return { ...stored, parts: initializeParts(stored.parts) };
    }
    const defaults = getDefaultData();
    return { ...defaults, parts: initializeParts([]) };
  });

  const [toast, setToast] = useState(null);

  const persist = useCallback((newData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Bike / Odometer ──────────────────────────────────────────────────────────

  const updateOdometer = useCallback((newKm, date = today(), notes = '') => {
    const validation = validateOdometer(newKm, data.bike.currentOdometer);
    if (!validation.valid) return { success: false, error: validation.error, isRollback: validation.isRollback };

    const entry = { id: generateId('odo'), date, odometer: newKm, notes };
    const updated = {
      ...data,
      bike: { ...data.bike, currentOdometer: newKm },
      odometerHistory: [...data.odometerHistory, entry],
    };
    persist(updated);
    showToast('Odometer updated');
    return { success: true };
  }, [data, persist, showToast]);

  const updateBikeInfo = useCallback((bikeInfo) => {
    const updated = { ...data, bike: { ...data.bike, ...bikeInfo } };
    persist(updated);
    showToast('Bike information saved');
  }, [data, persist, showToast]);

  // ── Services ─────────────────────────────────────────────────────────────────

  const addService = useCallback((serviceData) => {
    const newService = {
      id: generateId('svc'),
      ...serviceData,
      createdAt: new Date().toISOString(),
    };

    // Update bike odometer if service odometer is higher
    let bikeUpdate = data.bike;
    if (serviceData.odometer > data.bike.currentOdometer) {
      bikeUpdate = { ...data.bike, currentOdometer: serviceData.odometer };
    }

    // Update parts based on work done
    let updatedParts = [...data.parts];
    for (const workItem of serviceData.work || []) {
      const partIdx = updatedParts.findIndex(p => p.id === workItem.partId || p.ruleId === workItem.item);
      if (partIdx >= 0) {
        const part = updatedParts[partIdx];
        updatedParts[partIdx] = {
          ...part,
          lastServiceDate: serviceData.date,
          lastServiceOdometer: serviceData.odometer,
          history: [...(part.history || []), {
            date: serviceData.date,
            odometer: serviceData.odometer,
            action: workItem.action,
            notes: workItem.notes || '',
            serviceId: newService.id,
          }],
        };
      }
    }

    // Resolve issues if marked
    let updatedIssues = [...data.issues];
    for (const ir of serviceData.issuesResolved || []) {
      const idx = updatedIssues.findIndex(i => i.id === ir.issueId);
      if (idx >= 0) {
        updatedIssues[idx] = {
          ...updatedIssues[idx],
          status: ir.resolution === 'fixed' ? 'fixed' : ir.resolution === 'partially_fixed' ? 'partially_fixed' : 'monitoring',
          resolution: ir.resolution,
          resolutionDate: serviceData.date,
          resolutionOdometer: serviceData.odometer,
          resolutionNotes: ir.notes || '',
        };
      }
    }

    // Add odometer history if different
    let updatedOdoHistory = [...data.odometerHistory];
    if (!updatedOdoHistory.some(o => o.odometer === serviceData.odometer && o.date === serviceData.date)) {
      updatedOdoHistory.push({ id: generateId('odo'), date: serviceData.date, odometer: serviceData.odometer, notes: `Service record` });
    }

    const updated = {
      ...data,
      bike: bikeUpdate,
      services: [...data.services, newService],
      parts: updatedParts,
      issues: updatedIssues,
      odometerHistory: updatedOdoHistory,
    };
    persist(updated);
    showToast('Service recorded');
    return { success: true, id: newService.id };
  }, [data, persist, showToast]);

  const updateService = useCallback((id, serviceData) => {
    const updated = {
      ...data,
      services: data.services.map(s => s.id === id ? { ...s, ...serviceData } : s),
    };
    persist(updated);
    showToast('Service updated');
  }, [data, persist, showToast]);

  const deleteService = useCallback((id) => {
    const updated = { ...data, services: data.services.filter(s => s.id !== id) };
    persist(updated);
    showToast('Service deleted');
  }, [data, persist, showToast]);

  // ── Issues ────────────────────────────────────────────────────────────────────

  const addIssue = useCallback((issueData) => {
    const newIssue = {
      id: generateId('issue'),
      ...issueData,
      createdAt: new Date().toISOString(),
    };
    const updated = { ...data, issues: [...data.issues, newIssue] };
    persist(updated);
    showToast('Issue added');
    return { success: true, id: newIssue.id };
  }, [data, persist, showToast]);

  const updateIssue = useCallback((id, issueData) => {
    const updated = {
      ...data,
      issues: data.issues.map(i => i.id === id ? { ...i, ...issueData } : i),
    };
    persist(updated);
    showToast('Issue updated');
  }, [data, persist, showToast]);

  const deleteIssue = useCallback((id) => {
    const updated = { ...data, issues: data.issues.filter(i => i.id !== id) };
    persist(updated);
    showToast('Issue deleted');
  }, [data, persist, showToast]);

  // ── Upgrades ──────────────────────────────────────────────────────────────────

  const addUpgrade = useCallback((upgradeData) => {
    const newUpgrade = { id: generateId('upg'), ...upgradeData, createdAt: new Date().toISOString() };
    const updated = { ...data, upgrades: [...data.upgrades, newUpgrade] };
    persist(updated);
    showToast('Upgrade added');
    return { success: true };
  }, [data, persist, showToast]);

  const deleteUpgrade = useCallback((id) => {
    const updated = { ...data, upgrades: data.upgrades.filter(u => u.id !== id) };
    persist(updated);
    showToast('Upgrade deleted');
  }, [data, persist, showToast]);

  // ── Expenses ──────────────────────────────────────────────────────────────────

  const addExpense = useCallback((expenseData) => {
    const newExpense = { id: generateId('exp'), ...expenseData, createdAt: new Date().toISOString() };
    const updated = { ...data, expenses: [...data.expenses, newExpense] };
    persist(updated);
    showToast('Expense added');
    return { success: true };
  }, [data, persist, showToast]);

  const deleteExpense = useCallback((id) => {
    const updated = { ...data, expenses: data.expenses.filter(e => e.id !== id) };
    persist(updated);
    showToast('Expense deleted');
  }, [data, persist, showToast]);

  // ── Parts ─────────────────────────────────────────────────────────────────────

  const updatePart = useCallback((id, partData) => {
    const updated = {
      ...data,
      parts: data.parts.map(p => p.id === id ? { ...p, ...partData } : p),
    };
    persist(updated);
    showToast('Part updated');
  }, [data, persist, showToast]);

  const addPartEvent = useCallback((partId, event) => {
    const updated = {
      ...data,
      parts: data.parts.map(p => {
        if (p.id !== partId) return p;
        return {
          ...p,
          lastServiceDate: event.date,
          lastServiceOdometer: event.odometer,
          history: [...(p.history || []), { ...event, id: generateId('phist') }],
        };
      }),
    };
    persist(updated);
    showToast('Part event recorded');
  }, [data, persist, showToast]);

  // ── Custom Maintenance ─────────────────────────────────────────────────────────

  const addCustomMaintenance = useCallback((item) => {
    const newItem = { id: generateId('cm'), ...item, sourceType: 'user_defined' };
    const updated = { ...data, customMaintenance: [...data.customMaintenance, newItem] };
    persist(updated);
    showToast('Custom maintenance added');
  }, [data, persist, showToast]);

  const deleteCustomMaintenance = useCallback((id) => {
    const updated = { ...data, customMaintenance: data.customMaintenance.filter(c => c.id !== id) };
    persist(updated);
  }, [data, persist]);

  // ── Settings ──────────────────────────────────────────────────────────────────

  const updateSettings = useCallback((settings) => {
    const updated = { ...data, settings: { ...data.settings, ...settings } };
    persist(updated);
  }, [data, persist]);

  // ── Full Data Replace (import) ─────────────────────────────────────────────────

  const replaceAllData = useCallback((newData) => {
    const withParts = { ...newData, parts: initializeParts(newData.parts) };
    persist(withParts);
    showToast('Data imported successfully');
  }, [persist, showToast]);

  return {
    data,
    toast,
    // actions
    updateOdometer,
    updateBikeInfo,
    addService, updateService, deleteService,
    addIssue, updateIssue, deleteIssue,
    addUpgrade, deleteUpgrade,
    addExpense, deleteExpense,
    updatePart, addPartEvent,
    addCustomMaintenance, deleteCustomMaintenance,
    updateSettings,
    replaceAllData,
  };
}
