/**
 * Snapshot Utilities
 * Functions for creating and restoring simulation state snapshots
 */

import { clamp } from "./calculations.js";

/**
 * Deep clone helper for snapshot serialization
 */
export function deepClone(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(deepClone);
  }
  const result = {};
  for (const key in value) {
    result[key] = deepClone(value[key]);
  }
  return result;
}

/**
 * Validate and sanitize a numeric value from snapshot
 */
export function sanitizeNumber(value, defaultValue = 0, min = -Infinity, max = Infinity) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value, min, max);
  }
  return defaultValue;
}

/**
 * Validate and restore recorder state from snapshot
 */
export function restoreRecorderState(snapshotRecorder, createDefault) {
  if (!snapshotRecorder || typeof snapshotRecorder !== "object") {
    return createDefault();
  }

  const restored = createDefault();
  restored.active = Boolean(snapshotRecorder.active);
  restored.startedAt = sanitizeNumber(snapshotRecorder.startedAt, 0);
  restored.elapsedHours = sanitizeNumber(snapshotRecorder.elapsedHours, 0, 0);
  restored.lastUpdatedAt = snapshotRecorder.lastUpdatedAt != null
    ? sanitizeNumber(snapshotRecorder.lastUpdatedAt, null)
    : null;
  restored.profit = sanitizeNumber(snapshotRecorder.profit, 0);
  restored.penalty = sanitizeNumber(snapshotRecorder.penalty, 0, 0);
  restored.incidents = sanitizeNumber(snapshotRecorder.incidents, 0, 0);
  restored.reliabilityHours = sanitizeNumber(snapshotRecorder.reliabilityHours, 0, 0);
  restored.carbon = sanitizeNumber(snapshotRecorder.carbon, 0, 0);

  if (snapshotRecorder.production && typeof snapshotRecorder.production === "object") {
    ["gasoline", "diesel", "jet"].forEach((product) => {
      const value = snapshotRecorder.production[product];
      if (typeof value === "number" && Number.isFinite(value)) {
        restored.production[product] = Math.max(0, value);
      }
    });
  }

  if (snapshotRecorder.shipments && typeof snapshotRecorder.shipments === "object") {
    restored.shipments.delivered = sanitizeNumber(snapshotRecorder.shipments.delivered, 0, 0);
    restored.shipments.missed = sanitizeNumber(snapshotRecorder.shipments.missed, 0, 0);
  }

  return restored;
}

/**
 * Restore pipeline boosts from snapshot
 */
export function restorePipelineBoosts(snapshotBoosts, currentTimeMinutes) {
  if (!snapshotBoosts || typeof snapshotBoosts !== "object") {
    return {};
  }

  const boosts = {};
  Object.entries(snapshotBoosts).forEach(([stream, boost]) => {
    if (!boost || typeof boost !== "object") {
      return;
    }
    const multiplier = sanitizeNumber(boost.multiplier, 1);
    const expiresAt = sanitizeNumber(boost.expiresAt, currentTimeMinutes);
    const label = typeof boost.label === "string" ? boost.label : stream;
    boosts[stream] = { multiplier, expiresAt, label };
  });

  return boosts;
}

/**
 * Restore unit state from snapshot entry
 */
export function restoreUnitState(unit, entry) {
  if (!unit || !entry) return;

  if (typeof entry.integrity === "number" && Number.isFinite(entry.integrity)) {
    unit.integrity = clamp(entry.integrity, 0, 1);
  }
  if (typeof entry.downtime === "number" && Number.isFinite(entry.downtime)) {
    unit.downtime = Math.max(0, entry.downtime);
  }
  if (typeof entry.incidents === "number" && Number.isFinite(entry.incidents)) {
    unit.incidents = Math.max(0, entry.incidents);
  }
  if (typeof entry.status === "string") {
    unit.status = entry.status;
  }

  unit.manualOffline = Boolean(entry.manualOffline);
  unit.emergencyOffline = Boolean(entry.emergencyOffline);

  if (typeof entry.overrideThrottle === "number" && Number.isFinite(entry.overrideThrottle)) {
    unit.overrideThrottle = clamp(entry.overrideThrottle, 0, 1.2);
  }
  if (typeof entry.mode === "string") {
    unit.mode = entry.mode;
  }
  if (typeof entry.alert === "string" || entry.alert === null) {
    unit.alert = entry.alert;
  }
  if (typeof entry.alertTimer === "number" && Number.isFinite(entry.alertTimer)) {
    unit.alertTimer = Math.max(0, entry.alertTimer);
  } else {
    unit.alertTimer = Math.max(0, unit.alertTimer || 0);
  }

  unit.alertDetail = entry.alertDetail ? { ...entry.alertDetail } : null;
  unit.lastIncident = entry.lastIncident ? { ...entry.lastIncident } : null;
}

/**
 * Restore unit overrides from snapshot
 */
export function restoreUnitOverrides(snapshotOverrides, unitMap) {
  const overrides = {};

  if (!snapshotOverrides || typeof snapshotOverrides !== "object") {
    return overrides;
  }

  Object.entries(snapshotOverrides).forEach(([unitId, override]) => {
    if (!override || typeof override !== "object") {
      return;
    }
    const unit = unitMap[unitId];
    if (!unit) {
      return;
    }

    const record = {};
    if (typeof override.throttle === "number" && Number.isFinite(override.throttle)) {
      record.throttle = clamp(override.throttle, 0, 1.2);
      unit.overrideThrottle = record.throttle;
    }
    if (override.offline) {
      record.offline = true;
      unit.manualOffline = unit.manualOffline || !unit.emergencyOffline;
      if (unit.downtime <= 0 && unit.status !== "offline") {
        unit.status = "standby";
      }
    }
    if (Object.keys(record).length) {
      overrides[unitId] = record;
    }
  });

  return overrides;
}

/**
 * Restore directive stats from snapshot
 */
export function restoreDirectiveStats(snapshotStats, directivesLength) {
  if (!snapshotStats || typeof snapshotStats !== "object") {
    return { total: directivesLength, completed: 0, failed: 0 };
  }

  return {
    total: sanitizeNumber(snapshotStats.total, 0, 0),
    completed: sanitizeNumber(snapshotStats.completed, 0, 0),
    failed: sanitizeNumber(snapshotStats.failed, 0, 0),
  };
}

/**
 * Restore logs from snapshot
 */
export function restoreLogs(snapshotLogs, formatTime) {
  if (!Array.isArray(snapshotLogs)) {
    return [];
  }

  return snapshotLogs
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      level: entry.level || "info",
      message: entry.message || "",
      timestamp: entry.timestamp || formatTime(),
      unitId: entry.unitId,
      product: entry.product,
    }))
    .slice(-80);
}

/**
 * Restore performance history from snapshot
 */
export function restorePerformanceHistory(snapshotHistory) {
  if (!Array.isArray(snapshotHistory)) {
    return [];
  }

  return snapshotHistory
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ ...entry }))
    .slice(-120);
}

/**
 * Create units snapshot data
 */
export function createUnitsSnapshot(units) {
  return units.map((unit) => ({
    id: unit.id,
    integrity: unit.integrity,
    status: unit.status,
    downtime: unit.downtime,
    incidents: unit.incidents,
    manualOffline: unit.manualOffline,
    emergencyOffline: unit.emergencyOffline,
    overrideThrottle: unit.overrideThrottle,
    mode: unit.mode,
    alert: unit.alert,
    alertTimer: unit.alertTimer,
    alertDetail: unit.alertDetail ? deepClone(unit.alertDetail) : null,
    lastIncident: unit.lastIncident ? deepClone(unit.lastIncident) : null,
  }));
}
