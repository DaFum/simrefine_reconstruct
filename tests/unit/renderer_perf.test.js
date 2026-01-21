
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from '../../vendor/three.module.js';

// Mock canvas
const mockContext = {
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0
};

// Mock HTMLCanvasElement.getContext
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = () => mockContext;
}

// Mock the three module
vi.mock('../../vendor/three.module.js', async () => {
    // Basic mock implementation of Color
    class MockColor {
        constructor(hex) {
            this.r = 0;
            this.g = 0;
            this.b = 0;
            if (hex !== undefined) this.set(hex);
            MockColor.instances++;
        }
        set(_hex) { return this; }
        copy(_c) { return this; }
        clone() { return new MockColor(); }
        lerp(_c, _t) { return this; }
        multiplyScalar(_s) { return this; }
        equals(_c) { return false; }
        getHex() { return 0; }
    }
    MockColor.instances = 0;

    class MockMesh {
        constructor() {
            MockMesh.instances++;
            this.position = { set: () => {}, copy: () => {}, y: 0 };
            this.rotation = { set: () => {}, x: 0, y: 0, z: 0 };
            this.scale = { set: () => {}, x: 1, y: 1, z: 1 };
            this.material = { color: new MockColor(), opacity: 1, emissiveIntensity: 0, map: { dispose: () => {} }, dispose: () => {} };
            this.geometry = { dispose: () => {}, parameters: {} };
            this.visible = true;
        }
    }
    MockMesh.instances = 0;

    const actual = await vi.importActual('../../vendor/three.module.js');
    return {
        ...actual,
        Color: MockColor,
        Vector3: actual.Vector3, // Use actual or mock if needed
        Scene: class { add() {}; remove() {}; },
        WebGLRenderer: class {
            constructor() { this.domElement = document.createElement('canvas'); this.shadowMap = {}; }
            setSize() {}
            render() {}
            setPixelRatio() {}
        },
        PerspectiveCamera: class {
            constructor() { this.position = { set: () => {}, clone: () => ({ sub: () => ({ lengthSq: () => 0, normalize: () => {}, multiplyScalar: () => ({ x:0, z:0 }) }) }) }; this.lookAt = () => {}; this.updateProjectionMatrix = () => {}; }
        },
        Group: class {
             constructor() { this.position = { set: () => {}, copy: () => {}, clone: () => ({ sub: () => ({ lengthSq: () => 0, normalize: () => {}, multiplyScalar: () => ({ x:0, z:0 }) }) }) }; this.rotation = { set: () => {} }; this.add = () => {}; this.remove = () => {}; this.updateMatrixWorld = () => {}; this.getWorldPosition = () => new actual.Vector3(); }
        },
        Mesh: MockMesh,
        MeshStandardMaterial: class { constructor() { this.color = new MockColor(); this.userData = {}; } },
        MeshBasicMaterial: class {
            constructor() { this.color = new MockColor(); this.userData = {}; }
            clone() { return new this.constructor(); }
        },
        SpriteMaterial: class { constructor() { this.color = new MockColor(); } },
        Sprite: class { constructor() { this.position = { set: () => {}, copy: () => {} }; this.scale = { set: () => {} }; this.material = { opacity: 1 }; } },
        TextureLoader: class { load() { return {}; } },
        CanvasTexture: class {},
        Raycaster: class { setFromCamera() {}; ray = { intersectPlane: () => false }; },
        Plane: class {},
        PlaneGeometry: class { constructor() { this.translate = () => {}; } },
        BoxGeometry: class { constructor() { this.translate = () => {}; } },
        CylinderGeometry: class {},
        CircleGeometry: class {},
        RingGeometry: class {},
        TubeGeometry: class { constructor() { this.clone = () => new this.constructor(); } },
        CatmullRomCurve3: class {},
        InstancedMesh: class { constructor() { this.instanceMatrix = { setUsage: () => {} }; } setMatrixAt() {} },
        HemisphereLight: class { constructor() { this.color = { set: () => {} }; this.groundColor = { set: () => {} }; } },
        DirectionalLight: class { constructor() { this.position = { set: () => {} }; this.color = { set: () => {} }; } },
        PointLight: class { constructor() { this.position = { set: () => {} }; } },
        Box3: class { setFromObject() { return { max: { y: 10 } }; } },
        Vector2: actual.Vector2,
        MathUtils: actual.MathUtils,
        Shape: actual.Shape,
        ExtrudeGeometry: class { computeVertexNormals() {}; rotateX() {}; translate() {}; },
        GridHelper: class { constructor() { this.material = { opacity: 1, transparent: false, color: { set: () => {} } }; this.position = { y: 0 }; } },
        LineBasicMaterial: class { constructor() { this.color = new MockColor(); this.userData = {}; } },
        LineSegments: class { constructor() { this.position = { y: 0 }; } },
        BufferGeometry: class { setAttribute() {} },
        Float32BufferAttribute: class {},
        Object3D: class { constructor() { this.position = { copy: () => {} }; this.lookAt = () => {}; this.updateMatrix = () => {}; } },
    };
});

import { TileRenderer } from '../../src/renderer3d.js';

describe('TileRenderer Performance', () => {
    let renderer;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        THREE.Color.instances = 0; // Reset counter
        THREE.Mesh.instances = 0;
    });

    it('should not instantiate new Colors during render loop for tanks', () => {
        // Setup tank mocks
        const storageConfig = [
             { key: "gasoline", color: 0xffc857 },
             { key: "diesel", color: 0x88f18b },
        ];

        renderer = new TileRenderer(container, {}, [], []);

        // Manually populate storageMeshes to simulate existing tanks
        renderer.storageMeshes = new Map();
        storageConfig.forEach(cfg => {
            const mockTank = {
                key: cfg.key,
                group: new THREE.Group(),
                indicator: new THREE.Mesh(),
                baseColor: new THREE.Color(cfg.color),
                shell: new THREE.Mesh(),
                gaugeGroup: new THREE.Group(),
                gaugeTickMaterials: [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()],
                label: { material: { opacity: 1 }, position: { y: 0 } }
            };
            renderer.storageMeshes.set(cfg.key, mockTank);
        });

        // Reset counter after initialization (initialization creates colors)
        const _initialInstances = THREE.Color.instances;
        THREE.Color.instances = 0;

        // Run render loop once
        renderer.render(0.016, { logistics: { storage: { levels: { gasoline: 50 }, capacity: { gasoline: 100 } } } });

        console.log(`Instances created during render: ${THREE.Color.instances}`);

        // Assert that no new colors were created
        expect(THREE.Color.instances).toBe(0);
    });

    it('should reuse meshes when spawning ripples', () => {
        renderer = new TileRenderer(container, {}, [], []);

        const _initialMeshCount = THREE.Mesh.instances;
        THREE.Mesh.instances = 0;

        // Spawn first ripple (creates mesh)
        renderer.spawnRipple(0, 0);
        expect(THREE.Mesh.instances).toBe(1);
        expect(renderer.effects.length).toBe(1);

        // Simulate effect completion
        const effect = renderer.effects[0];
        effect.age = effect.duration + 0.1;
        renderer._updateEffects(0.1); // This should recycle the mesh

        expect(renderer.effects.length).toBe(0);
        expect(renderer.ripplePool.length).toBe(1);

        THREE.Mesh.instances = 0; // Reset count

        // Spawn second ripple (should reuse mesh)
        renderer.spawnRipple(1, 1);

        expect(renderer.effects.length).toBe(1);
        expect(renderer.ripplePool.length).toBe(0);
        expect(THREE.Mesh.instances).toBe(0); // No new mesh created!
    });
});
