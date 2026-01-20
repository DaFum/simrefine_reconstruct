/**
 * Mesh Builders Barrel Export
 * Factory for creating unit meshes based on style
 */

import { buildTowersMesh } from "./towersMeshBuilder.js";
import { buildReactorMesh } from "./reactorMeshBuilder.js";
import { buildSupportMesh } from "./supportMeshBuilder.js";
import { buildRectMesh } from "./rectMeshBuilder.js";
import { buildDefaultMesh } from "./defaultMeshBuilder.js";

export {
  buildTowersMesh,
  buildReactorMesh,
  buildSupportMesh,
  buildRectMesh,
  buildDefaultMesh,
};

const MESH_BUILDERS = {
  towers: buildTowersMesh,
  reactor: buildReactorMesh,
  support: buildSupportMesh,
  rect: buildRectMesh,
  default: buildDefaultMesh,
};

/**
 * Build unit mesh based on style
 * @param {string} style - Unit style type
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildUnitMesh(style, context) {
  const builder = MESH_BUILDERS[style] || MESH_BUILDERS.default;
  return builder(context);
}
