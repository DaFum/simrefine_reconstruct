/**
 * Reactor Mesh Builder
 * Creates reactor-style unit meshes (e.g., FCC reactors)
 */

import * as THREE from "../../../vendor/three.module.js";

const PEDESTAL_MIN_HEIGHT = 1.6;
const PEDESTAL_HEIGHT_RATIO = 0.32;
const PEDESTAL_RADIUS_RATIO = 0.32;
const PEDESTAL_TOP_RATIO = 0.95;
const PEDESTAL_BOTTOM_RATIO = 1.02;
const SPHERE_RADIUS_RATIO = 0.55;
const BAND_RADIUS_RATIO = 0.82;
const BAND_TUBE_RATIO = 0.08;
const RISER_HEIGHT_RATIO = 1.2;
const RISER_TOP_RATIO = 0.2;
const RISER_BOTTOM_RATIO = 0.16;
const RISER_X_OFFSET = 0.48;
const RISER_Y_OFFSET = 1.1;
const CYCLONE_RADIUS_RATIO = 0.24;
const CYCLONE_HEIGHT_RATIO = 0.5;
const CYCLONE_X_OFFSET = 0.6;
const CYCLONE_Y_OFFSET = 1.4;
const INDICATOR_ANCHOR_OFFSET = 1.35;

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

  const pedestalHeight = Math.max(PEDESTAL_MIN_HEIGHT, baseHeight * PEDESTAL_HEIGHT_RATIO);
  const pedestalRadius = Math.min(baseWidth, baseDepth) * PEDESTAL_RADIUS_RATIO;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(
      pedestalRadius * PEDESTAL_TOP_RATIO,
      pedestalRadius * PEDESTAL_BOTTOM_RATIO,
      pedestalHeight,
      32
    ),
    accentMaterial.clone()
  );
  pedestal.position.y = pedestalHeight / 2;
  group.add(pedestal);
  accentMeshes.push(pedestal);

  const sphereRadius = Math.min(baseWidth, baseDepth) * SPHERE_RADIUS_RATIO;
  const vessel = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius, 40, 32),
    bodyMaterial
  );
  vessel.position.y = pedestalHeight + sphereRadius;
  group.add(vessel);
  body = vessel;

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(
      sphereRadius * BAND_RADIUS_RATIO,
      sphereRadius * BAND_TUBE_RATIO,
      16,
      48
    ),
    accentMaterial.clone()
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = vessel.position.y;
  group.add(band);
  cap = band;
  accentMeshes.push(band);

  const riserHeight = sphereRadius * RISER_HEIGHT_RATIO;
  const riser = new THREE.Mesh(
    new THREE.CylinderGeometry(
      sphereRadius * RISER_TOP_RATIO,
      sphereRadius * RISER_BOTTOM_RATIO,
      riserHeight,
      24
    ),
    accentMaterial.clone()
  );
  riser.position.set(
    sphereRadius * RISER_X_OFFSET,
    pedestalHeight + sphereRadius * RISER_Y_OFFSET,
    0
  );
  group.add(riser);
  accentMeshes.push(riser);

  const cyclone = new THREE.Mesh(
    new THREE.ConeGeometry(
      sphereRadius * CYCLONE_RADIUS_RATIO,
      sphereRadius * CYCLONE_HEIGHT_RATIO,
      24
    ),
    accentMaterial.clone()
  );
  cyclone.position.set(
    -sphereRadius * CYCLONE_X_OFFSET,
    pedestalHeight + sphereRadius * CYCLONE_Y_OFFSET,
    0
  );
  group.add(cyclone);
  accentMeshes.push(cyclone);

  const indicatorAnchor = pedestalHeight + sphereRadius * INDICATOR_ANCHOR_OFFSET;

  return { body, cap, accentMeshes, indicatorAnchor };
}
