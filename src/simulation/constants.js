/**
 * Simulation Constants
 * Contains all constant values used across the simulation system
 */

export const PRODUCT_LABELS = {
  gasoline: "gasoline",
  diesel: "diesel",
  jet: "jet fuel",
};

export const HOURS_PER_DAY = 24;

export const SHIPMENT_PARCEL_SIZES = {
  gasoline: 44,
  diesel: 36,
  jet: 30,
};

export const SHIPMENT_HORIZON_HOURS = 48;
export const BASE_CRUDE_THROUGHPUT = 120;

export const BASE_PRICES = {
  gasoline: 96,
  diesel: 88,
  jet: 112,
  lpg: 54,
};

export const UNIT_CATEGORIES = {
  CORE: "core",
  NAPHTHA: "naphtha",
  CONVERSION: "conversion",
  FINISHING: "finishing",
  SUPPORT: "support",
};

export const UNIT_DEFINITIONS = [
  { id: "distillation", name: "Crude Distillation Unit", capacity: 180, category: UNIT_CATEGORIES.CORE },
  { id: "reformer", name: "Naphtha Reformer", capacity: 60, category: UNIT_CATEGORIES.NAPHTHA },
  { id: "fcc", name: "Catalytic Cracker", capacity: 85, category: UNIT_CATEGORIES.CONVERSION },
  { id: "hydrocracker", name: "Hydrocracker", capacity: 65, category: UNIT_CATEGORIES.CONVERSION },
  { id: "alkylation", name: "Alkylation", capacity: 45, category: UNIT_CATEGORIES.FINISHING },
  { id: "sulfur", name: "Sulfur Recovery", capacity: 35, category: UNIT_CATEGORIES.SUPPORT },
];

export const SPEED_PRESETS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
];

export const DEFAULT_PARAMS = {
  crudeIntake: 120,
  productFocus: 0.5,
  maintenance: 0.65,
  safety: 0.45,
  environment: 0.35,
};

export const SCENARIOS = {
  steady: {
    key: "steady",
    name: "Steady Operations",
    description: "Balanced demand and average Bay Area crude quality.",
    crudeMultiplier: 1,
    qualityShift: 0,
    priceModifier: 1,
    gasolineBias: 0,
    dieselBias: 0,
    jetBias: 0,
    riskMultiplier: 1,
    maintenancePenalty: 0,
    environmentPressure: 0.2,
  },
  summerRush: {
    key: "summerRush",
    name: "Summer Driving Rush",
    description: "Gasoline demand surges with tourist traffic. Lighter crudes are available but the plant runs hot.",
    crudeMultiplier: 1.05,
    qualityShift: -0.05,
    priceModifier: 1.08,
    gasolineBias: 0.24,
    dieselBias: -0.12,
    jetBias: -0.05,
    riskMultiplier: 1.12,
    maintenancePenalty: 0.05,
    environmentPressure: 0.1,
  },
  winterDiesel: {
    key: "winterDiesel",
    name: "Winter Heating Demand",
    description: "Heating oil and diesel spike while heavy, sour crude dominates supply.",
    crudeMultiplier: 0.95,
    qualityShift: 0.08,
    priceModifier: 1.02,
    gasolineBias: -0.1,
    dieselBias: 0.28,
    jetBias: -0.04,
    riskMultiplier: 1.2,
    maintenancePenalty: 0.12,
    environmentPressure: 0.28,
  },
  exportPush: {
    key: "exportPush",
    name: "Pacific Jet Fuel Push",
    description: "Airlines pre-buy jet fuel for Pacific routes. Margins improve for kerosene and hydrogen-hungry units.",
    crudeMultiplier: 1,
    qualityShift: -0.02,
    priceModifier: 1.06,
    gasolineBias: -0.04,
    dieselBias: -0.08,
    jetBias: 0.32,
    riskMultiplier: 1.15,
    maintenancePenalty: 0.08,
    environmentPressure: 0.18,
  },
  maintenanceCrunch: {
    key: "maintenanceCrunch",
    name: "Deferred Maintenance",
    description: "Budget cuts delayed turnarounds. Equipment is fragile and utilities are strained.",
    crudeMultiplier: 0.9,
    qualityShift: 0.05,
    priceModifier: 0.97,
    gasolineBias: 0,
    dieselBias: 0.05,
    jetBias: 0,
    riskMultiplier: 1.45,
    maintenancePenalty: 0.3,
    environmentPressure: 0.35,
  },
  quakeDrill: {
    key: "quakeDrill",
    name: "Earthquake Drill",
    description: "A simulated quake tests emergency response. Utilities cut, shipments disrupted, and accidents spike.",
    crudeMultiplier: 0.82,
    qualityShift: 0.12,
    priceModifier: 1.11,
    gasolineBias: -0.06,
    dieselBias: 0.12,
    jetBias: 0,
    riskMultiplier: 1.85,
    maintenancePenalty: 0.42,
    environmentPressure: 0.42,
  },
};
