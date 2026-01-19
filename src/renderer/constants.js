/**
 * Renderer Constants
 * Contains all constant values used across the renderer system
 */

import * as THREE from "../../vendor/three.module.js";

export const DEFAULT_OPTIONS = {
  interactionEnabled: true,
};

export const SHIP_COLORS = {
  gasoline: 0xffa552,
  diesel: 0x7ed37e,
  jet: 0x6fc7ff,
};

export const DEFAULT_SHIP_COLOR = 0x8ba7d6;

export const PALETTES = [
  {
    name: "Twilight",
    sky: 0x0f1726,
    ground: 0x1b2736,
    gridMajor: 0x2e3f55,
    gridMinor: 0x233244,
    sun: 0xffe7b0,
    ambientTop: 0x8ea9ff,
    ambientBottom: 0x101829,
    flowLow: 0x2469a4,
    flowHigh: 0x66f5ff,
    pointer: 0xffffff,
    storageShell: 0x2b3442,
    storageLabels: 0xeaf2ff,
    highlight: 0xffffff,
  },
  {
    name: "Daybreak",
    sky: 0x1c2736,
    ground: 0x263445,
    gridMajor: 0x3b516b,
    gridMinor: 0x2b3c4f,
    sun: 0xfff2cc,
    ambientTop: 0xb0c6ff,
    ambientBottom: 0x1a2434,
    flowLow: 0x2c7a45,
    flowHigh: 0x98ff9f,
    pointer: 0xf6ffdc,
    storageShell: 0x304050,
    storageLabels: 0xf7fbe9,
    highlight: 0xf0ffd5,
  },
];

export const STORAGE_CONFIG = [
  { key: "gasoline", color: 0xffc857, offset: new THREE.Vector2(2.6, -1.8) },
  { key: "diesel", color: 0x88f18b, offset: new THREE.Vector2(2.6, 0.2) },
  { key: "jet", color: 0x6fd3ff, offset: new THREE.Vector2(2.6, 2) },
];

export const ALERT_COLOR = new THREE.Color(0xff7e6f);
export const HEAT_COLOR = new THREE.Color(0xffd66f);
export const COLOR_WHITE = new THREE.Color(0xffffff);
