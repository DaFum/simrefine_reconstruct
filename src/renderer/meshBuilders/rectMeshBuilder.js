/**
 * Rect Mesh Builder
 * Creates rectangular-style unit meshes (e.g., reformer units)
 */

import * as THREE from "../../../vendor/three.module.js";

/**
 * Build rect-style unit mesh
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildRectMesh(context) {
  const {
    group,
    baseWidth,
    baseDepth,
    baseHeight,
    bodyMaterial,
    accentMaterial,
  } = context;

  const accentMeshes = [];
  let body = null;
  let cap = null;

  const pedestalHeight = baseHeight * 0.18;
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth * 0.98, pedestalHeight, baseDepth * 0.9),
    accentMaterial.clone()
  );
  pedestal.position.y = pedestalHeight / 2;
  group.add(pedestal);
  accentMeshes.push(pedestal);

  const blockHeight = baseHeight * 0.78;
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth * 0.9, blockHeight, baseDepth * 0.82),
    bodyMaterial
  );
  block.position.y = pedestalHeight + blockHeight / 2;
  group.add(block);
  body = block;

  const roofHeight = baseHeight * 0.12;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth * 0.94, roofHeight, baseDepth * 0.86),
    accentMaterial.clone()
  );
  roof.position.y = pedestalHeight + blockHeight + roofHeight / 2;
  group.add(roof);
  cap = roof;
  accentMeshes.push(roof);

  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(baseWidth * 0.08, baseWidth * 0.1, baseHeight * 0.82, 18),
    accentMaterial.clone()
  );
  stack.position.set(
    -baseWidth * 0.28,
    pedestalHeight + blockHeight + baseHeight * 0.42,
    baseDepth * 0.18
  );
  group.add(stack);
  accentMeshes.push(stack);

  const indicatorAnchor = pedestalHeight + blockHeight + roofHeight * 0.6;

  return { body, cap, accentMeshes, indicatorAnchor };
}
