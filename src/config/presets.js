/**
 * Preset Configurations
 * Operation modes and session presets for the simulation
 */

export const OPERATION_PRESETS = {
  auto: {
    label: "AUTO",
    crude: 120,
    focus: 0.5,
    maintenance: 0.65,
    safety: 0.45,
    environment: 0.35,
    log: "Operator returned controls to automatic balancing.",
  },
  manual: {
    label: "MANUAL",
    crude: 180,
    focus: 0.68,
    maintenance: 0.45,
    safety: 0.36,
    environment: 0.22,
    log: "Manual push: throughput prioritized for gasoline blending.",
  },
  shutdown: {
    label: "SHUTDN",
    crude: 0,
    focus: 0.5,
    maintenance: 0.82,
    safety: 0.72,
    environment: 0.55,
    log: "Emergency shutdown drill initiated.",
  },
};

export const SESSION_PRESETS = {
  legacy: {
    scenario: "maintenanceCrunch",
    params: {
      crude: 112,
      focus: 0.46,
      maintenance: 0.38,
      safety: 0.34,
      environment: 0.28,
    },
    storageLevels: { gasoline: 212, diesel: 158, jet: 122 },
    shipments: [
      { product: "gasoline", volume: 88, window: 4.2, dueIn: 0.9 },
      { product: "diesel", volume: 74, window: 3.8, dueIn: 0.6 },
    ],
    shipmentStats: { total: 4, onTime: 2, missed: 2 },
    nextShipmentIn: 0.8,
    units: [
      { id: "distillation", integrity: 0.58 },
      { id: "reformer", integrity: 0.4 },
      { id: "fcc", integrity: 0.45 },
      { id: "hydrocracker", integrity: 0.42, downtime: 95 },
      { id: "alkylation", integrity: 0.5 },
      { id: "sulfur", integrity: 0.56 },
    ],
    marketStress: 0.44,
    timeMinutes: 60 * 9,
    log: "Recovered training save loaded — tanks brimmed and maintenance overdue.",
  },
  modern: {
    scenario: "exportPush",
    params: {
      crude: 168,
      focus: 0.64,
      maintenance: 0.55,
      safety: 0.48,
      environment: 0.32,
    },
    storageLevels: { gasoline: 126, diesel: 104, jet: 68 },
    shipments: [
      { product: "jet", volume: 82, window: 5.5, dueIn: 1.6 },
      { product: "gasoline", volume: 64, window: 4.8, dueIn: 2.1 },
    ],
    shipmentStats: { total: 3, onTime: 1, missed: 0 },
    nextShipmentIn: 1.4,
    units: [
      { id: "reformer", integrity: 0.72 },
      { id: "hydrocracker", integrity: 0.68 },
      { id: "alkylation", integrity: 0.74 },
    ],
    unitOverrides: {
      hydrocracker: { throttle: 1.08 },
      sulfur: { throttle: 1.05 },
    },
    marketStress: 0.3,
    timeMinutes: 60 * 3,
    log: "Modernization drill loaded — chase export contracts without breaking reliability.",
  },
};
