/**
 * Pipeline Configurations
 * Visual and routing configuration for refinery pipelines
 */
import { HOURS_PER_DAY } from "../simulation/constants.js";
export const PIPELINE_CONFIGS = [
  {
    id: "toReformer",
    metric: "toReformer",
    capacity: 70 / HOURS_PER_DAY,
    color: 0x6fc2ff,
    phase: 0,
    path: [
      { unit: "distillation", anchor: "west", dy: -0.2 },
      { x: 5.6, y: 4.5 },
      { x: 5.2, y: 7.1 },
      { unit: "reformer", anchor: "east", dy: -0.1 },
    ],
  },
  {
    id: "toCracker",
    metric: "toCracker",
    capacity: 90 / HOURS_PER_DAY,
    color: 0xf7b25c,
    phase: 1.3,
    path: [
      { unit: "distillation", anchor: "east", dy: -0.25 },
      { x: 9.5, y: 4.5 },
      { x: 9.7, y: 6.8 },
      { unit: "fcc", anchor: "west", dy: -0.1 },
    ],
  },
  {
    id: "toHydrocracker",
    metric: "toHydrocracker",
    capacity: 70 / HOURS_PER_DAY,
    color: 0x8ee2c4,
    phase: 2.2,
    path: [
      { unit: "distillation", anchor: "north", dx: 0.2 },
      { x: 4.6, y: 3.2 },
      { unit: "hydrocracker", anchor: "south", dx: 0.1 },
    ],
  },
  {
    id: "toAlkylation",
    metric: "toAlkylation",
    capacity: 45 / HOURS_PER_DAY,
    color: 0xc5a1ff,
    phase: 2.9,
    path: [
      { unit: "fcc", anchor: "east", dy: -0.15 },
      { x: 12, y: 6.9 },
      { unit: "alkylation", anchor: "west", dy: -0.1 },
    ],
  },
  {
    id: "toExport",
    metric: "toExport",
    capacity: 160 / HOURS_PER_DAY,
    color: 0x9ec8ff,
    phase: 3.6,
    path: [
      { unit: "distillation", anchor: "east", dy: 0.3 },
      { x: 11, y: 4.8 },
      { x: 11.3, y: 9.4 },
      { x: 13.6, y: 9.4 },
    ],
  },
];

export default PIPELINE_CONFIGS;
