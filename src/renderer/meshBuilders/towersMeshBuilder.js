/**
 * Towers Mesh Builder
 * Creates tower-style unit meshes (e.g., distillation columns)
 */

import * as THREE from "../../../vendor/three.module.js";

/**
 * Build towers-style unit mesh
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildTowersMesh(context) {
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

  const towerRadius = Math.min(baseWidth, baseDepth) * 0.18;
  const towerSpacing = Math.min(baseWidth, baseDepth) * 0.42;
  const heights = [baseHeight * 1.18, baseHeight * 0.94, baseHeight * 0.78];
  const offsets = [-towerSpacing, 0, towerSpacing];

  heights.forEach((height, index) => {
    const radius = towerRadius * (index === 0 ? 1.08 : 0.94 - index * 0.04);
    const geometry = new THREE.CylinderGeometry(radius, radius * 0.96, height, 28);
    const material = index === 0 ? bodyMaterial : accentMaterial.clone();
    const shell = new THREE.Mesh(geometry, material);
    shell.position.set(offsets[index], height / 2, index === 1 ? towerSpacing * 0.25 : 0);
    group.add(shell);

    if (index === 0) {
      body = shell;
    } else {
      accentMeshes.push(shell);
    }
  });

  const walkway = new THREE.Mesh(
    new THREE.TorusGeometry(towerRadius * 1.15, towerRadius * 0.08, 12, 32),
    accentMaterial.clone()
  );
  walkway.rotation.x = Math.PI / 2;
  walkway.position.y = heights[0] * 0.72;
  group.add(walkway);
  cap = walkway;
  accentMeshes.push(walkway);

  const stackHeight = heights[0] * 0.35;
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(towerRadius * 0.42, towerRadius * 0.32, stackHeight, 20),
    accentMaterial.clone()
  );
  stack.position.set(offsets[0] * 0.42, heights[0] - stackHeight / 2, 0);
  group.add(stack);
  accentMeshes.push(stack);

  const indicatorAnchor = heights[0] * 0.74;

  return { body, cap, accentMeshes, indicatorAnchor };
}
