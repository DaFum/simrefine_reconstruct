/**
 * Mesh Builders Barrel Export
 * Factory for creating unit meshes based on style
 */

import { buildTowersMesh } from "./towersMeshBuilder.js";
import { buildReactorMesh } from "./reactorMeshBuilder.js";
import { buildSupportMesh } from "./supportMeshBuilder.js";
import { buildRectMesh } from "./rectMeshBuilder.js";
import { buildDefaultMesh } from "./defaultMeshBuilder.js";

export { buildTowersMesh } from "./towersMeshBuilder.js";
export { buildReactorMesh } from "./reactorMeshBuilder.js";
export { buildSupportMesh } from "./supportMeshBuilder.js";
export { buildRectMesh } from "./rectMeshBuilder.js";
export { buildDefaultMesh } from "./defaultMeshBuilder.js";

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
