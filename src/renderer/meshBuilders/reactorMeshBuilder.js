/**
 * Reactor Mesh Builder
 * Creates reactor-style unit meshes (e.g., FCC reactors)
 */

import * as THREE from "../../../vendor/three.module.js";

/**
 * Build reactor-style unit mesh
 * @param {Object} context - Building context
 * @returns {Object} Mesh components
 */
export function buildReactorMesh(context) {
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

  const pedestalHeight = Math.max(1.6, baseHeight * 0.32);
  const pedestalRadius = Math.min(baseWidth, baseDepth) * 0.32;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalRadius * 0.95, pedestalRadius * 1.02, pedestalHeight, 32),
    accentMaterial.clone()
  );
  pedestal.position.y = pedestalHeight / 2;
  group.add(pedestal);
  accentMeshes.push(pedestal);

  const sphereRadius = Math.min(baseWidth, baseDepth) * 0.55;
  const vessel = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius, 40, 32),
    bodyMaterial
  );
  vessel.position.y = pedestalHeight + sphereRadius;
  group.add(vessel);
  body = vessel;

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(sphereRadius * 0.82, sphereRadius * 0.08, 16, 48),
    accentMaterial.clone()
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = vessel.position.y;
  group.add(band);
  cap = band;
  accentMeshes.push(band);

  const riserHeight = sphereRadius * 1.2;
  const riser = new THREE.Mesh(
    new THREE.CylinderGeometry(sphereRadius * 0.2, sphereRadius * 0.16, riserHeight, 24),
    accentMaterial.clone()
  );
  riser.position.set(sphereRadius * 0.48, pedestalHeight + sphereRadius * 1.1, 0);
  group.add(riser);
  accentMeshes.push(riser);

  const cyclone = new THREE.Mesh(
    new THREE.ConeGeometry(sphereRadius * 0.24, sphereRadius * 0.5, 24),
    accentMaterial.clone()
  );
  cyclone.position.set(-sphereRadius * 0.6, pedestalHeight + sphereRadius * 1.4, 0);
  group.add(cyclone);
  accentMeshes.push(cyclone);

  const indicatorAnchor = pedestalHeight + sphereRadius * 1.35;

  return { body, cap, accentMeshes, indicatorAnchor };
}
