/**
 * Support Mesh Builder
 * Creates support-style unit meshes (e.g., sulfur recovery)
 */

import * as THREE from "../../../vendor/three.module.js";

/**
 * Build support-style unit mesh
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildSupportMesh(context) {
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

  const cradleHeight = baseHeight * 0.18;
  const cradle = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth * 0.92, cradleHeight, baseDepth * 0.74),
    accentMaterial.clone()
  );
  cradle.position.y = cradleHeight / 2;
  group.add(cradle);
  accentMeshes.push(cradle);

  const drumRadius = Math.min(baseHeight, baseDepth) * 0.36;
  const drumLength = baseWidth * 0.95;
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(drumRadius, drumRadius, drumLength, 32),
    bodyMaterial
  );
  drum.rotation.z = Math.PI / 2;
  drum.position.y = cradleHeight + drumRadius;
  group.add(drum);
  body = drum;

  const scrubber = new THREE.Mesh(
    new THREE.CylinderGeometry(drumRadius * 0.28, drumRadius * 0.24, baseHeight * 0.65, 20),
    accentMaterial.clone()
  );
  scrubber.position.set(0, drum.position.y + baseHeight * 0.32, baseDepth * 0.3);
  group.add(scrubber);
  cap = scrubber;
  accentMeshes.push(scrubber);

  const indicatorAnchor = drum.position.y + baseHeight * 0.35;

  return { body, cap, accentMeshes, indicatorAnchor };
}
