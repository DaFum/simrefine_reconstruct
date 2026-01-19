/**
 * Default Mesh Builder
 * Creates default box-style unit meshes
 */

import * as THREE from "../../../vendor/three.module.js";

/**
 * Build default-style unit mesh
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildDefaultMesh(context) {
  const {
    group,
    baseWidth,
    baseDepth,
    baseHeight,
    bodyMaterial,
    accentMaterial,
  } = context;

  const accentMeshes = [];

  const block = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth),
    bodyMaterial
  );
  block.position.y = baseHeight / 2;
  group.add(block);
  const body = block;

  const topper = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth * 0.78, baseHeight * 0.32, baseDepth * 0.78),
    accentMaterial.clone()
  );
  topper.position.y = baseHeight + topper.geometry.parameters.height / 2 - 0.4;
  group.add(topper);
  const cap = topper;
  accentMeshes.push(topper);

  const indicatorAnchor = baseHeight * 0.62;

  return { body, cap, accentMeshes, indicatorAnchor };
}
