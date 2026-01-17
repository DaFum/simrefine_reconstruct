import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Move mock definition inside vi.mock factory to avoid hoisting issues
vi.mock('../../vendor/three.module.js', () => {
  const mockFn = (impl) => vi.fn(impl);

  class MockVector3 {
    constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    normalize() { return this; }
    lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    clone() {
        const v = new MockVector3(this.x, this.y, this.z);
        v.lerp = this.lerp;
        v.project = this.project;
        return v;
    }
    lerp() { return this; }
    cross() { return this; }
    setY(y) { this.y = y; return this; }
    project() { return { x:0, y:0 }; }
  }

  class MockVector2 {
      constructor(x, y) { this.x = x; this.y = y; }
      set() {}
  }

  class MockColor {
    constructor(hex) { }
    set() {}
    setHex() {}
    copy() { return this; }
    lerp() { return this; }
    clone() { return new MockColor(); }
    multiplyScalar() { return this; }
    getHex() { return 0xffffff; }
  }

  class MockScene {
    constructor() {
      this.background = { set: vi.fn() };
    }
    add() {}
    remove() {}
    traverse() {}
  }

  class MockWebGLRenderer {
    constructor() {
      this.domElement = document.createElement('canvas');
      this.shadowMap = { enabled: false };
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
  }

  class MockPerspectiveCamera {
    constructor() {
      this.position = new MockVector3();
      this.aspect = 1;
    }
    lookAt() {}
    updateProjectionMatrix() {}
  }

  class MockGroup {
    constructor() {
        this.position = new MockVector3();
        this.rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
        this.scale = { set: vi.fn(), setScalar: vi.fn() };
    }
    add() {}
    remove() {}
    updateMatrixWorld() {}
    traverse() {}
    getWorldPosition() { return new MockVector3(); }
  }

  class MockMesh {
    constructor() {
        this.position = new MockVector3();
        this.rotation = { x: 0, y: 0, z: 0, set: vi.fn() };
        this.scale = { set: vi.fn(), y: 1, setScalar: vi.fn() };
        this.material = {
            color: new MockColor(),
            opacity: 1,
            transparent: false,
            emissiveIntensity: 0,
            dispose: vi.fn(),
            map: { dispose: vi.fn() },
            userData: {}
        };
        this.geometry = {
            dispose: vi.fn(),
            parameters: { height: 10, path: { getPoint: vi.fn(() => new MockVector3()) } }
        };
        this.visible = true;
        this.userData = {};
    }
    clone() { return this; }
  }

  class MockRaycaster {
      constructor() {
          this.ray = { intersectPlane: vi.fn() };
      }
      setFromCamera() {}
  }

  return {
    Scene: MockScene,
    WebGLRenderer: MockWebGLRenderer,
    PerspectiveCamera: MockPerspectiveCamera,
    Group: MockGroup,
    Mesh: MockMesh,
    Color: MockColor,
    Vector2: MockVector2,
    Vector3: MockVector3,
    Plane: class {},
    Raycaster: MockRaycaster,
    GridHelper: class { constructor() { this.position = {}; this.material = { color: new MockColor() }; } },
    HemisphereLight: class { constructor() { this.color = { set: vi.fn() }; this.groundColor = { set: vi.fn() }; } },
    DirectionalLight: class { constructor() { this.position = { set: vi.fn() }; this.color = { set: vi.fn() }; } },
    PointLight: class { constructor() { this.position = { set: vi.fn() }; this.color = { set: vi.fn() }; } },
    PlaneGeometry: class { translate() {} rotateX() {} },
    BoxGeometry: class { translate() {} },
    CylinderGeometry: class {},
    SphereGeometry: class {},
    TorusGeometry: class {},
    ConeGeometry: class { rotateX() {} },
    RingGeometry: class {},
    CircleGeometry: class {},
    ExtrudeGeometry: class { rotateX() {} translate() {} computeVertexNormals() {} },
    TubeGeometry: class { clone() {} },
    Shape: class { moveTo() {} lineTo() {} quadraticCurveTo() {} },
    CatmullRomCurve3: class {},
    InstancedMesh: class { constructor() { this.instanceMatrix = { setUsage: vi.fn() }; } setMatrixAt() {} },
    MeshStandardMaterial: class {
        constructor() {
            this.color = new MockColor();
            this.userData = {};
        }
        clone() { return this; }
    },
    MeshBasicMaterial: class {
        constructor() {
            this.color = new MockColor();
            this.userData = {};
        }
        clone() { return this; }
    },
    LineBasicMaterial: class {
        constructor() {
            this.color = new MockColor();
            this.userData = {};
        }
        clone() { return this; }
    },
    SpriteMaterial: class { constructor() { this.map = {}; this.color = {}; this.userData = {}; } },
    Sprite: class { constructor() { this.position = new MockVector3(); this.scale = { set: vi.fn() }; this.material = { opacity: 1, rotation: 0 }; } },
    CanvasTexture: class {},
    Box3: class { setFromObject() { return { max: { y: 10 } }; } },
    Object3D: class { constructor() { this.position = new MockVector3(); } lookAt() {} updateMatrix() {} },
    BufferGeometry: class { setAttribute() {} },
    Float32BufferAttribute: class {},
    LineSegments: class { constructor() { this.position = {}; } },
    LineBasicMaterial: class { constructor() { this.color = new MockColor(); this.userData = {}; } },
    DoubleSide: 2,
    SRGBColorSpace: 'srgb',
    sRGBEncoding: 3001,
    NormalBlending: 1,
    AdditiveBlending: 2,
    DynamicDrawUsage: 1
  };
});

import * as THREE from '../../vendor/three.module.js';
import { TileRenderer } from '../../src/renderer3d.js';

describe('TileRenderer', () => {
  let container;
  let simulation;
  let renderer;

  beforeEach(() => {
    // Mock HTMLCanvasElement.getContext
    const mockContext = {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        shadowColor: '',
        shadowBlur: 0
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext);

    container = document.createElement('div');
    simulation = {
        getUnit: vi.fn(),
        getUnits: vi.fn(() => []),
        getFlows: vi.fn(() => ({})),
        getActionToysState: vi.fn(() => ({ convoys: [], inspections: [] })),
        pipelineBoosts: {}
    };

    const unitDefs = [
        { id: 'u1', tileX: 0, tileY: 0, width: 2, height: 2, color: 0xff0000, accent: 0x00ff00, style: 'rect', name: 'Unit 1' }
    ];
    const pipelineDefs = [
        { id: 'p1', path: [{ x: 0, y: 0 }, { x: 5, y: 5 }], color: 0x0000ff, metric: 'flow1' }
    ];

    renderer = new TileRenderer(container, simulation, unitDefs, pipelineDefs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize successfully', () => {
    expect(renderer).toBeDefined();
    expect(renderer.scene).toBeDefined();
  });

  it('should create unit meshes', () => {
      expect(renderer.unitMeshes.size).toBe(1);
      const unit = renderer.unitMeshes.get('u1');
      expect(unit).toBeDefined();
  });

  it('should create pipeline meshes', () => {
      expect(renderer.pipelineMeshes.size).toBe(1);
  });

  it('should render frame', () => {
      vi.spyOn(renderer.renderer, 'render');
      renderer.render(0.1, { flows: { flow1: 50 }, logistics: {} });
      expect(renderer.renderer.render).toHaveBeenCalled();
  });

  it('should handle interaction visibility', () => {
      renderer.setGridVisible(false);
      expect(renderer.gridHelper.visible).toBe(false);

      renderer.setFlowVisible(false);
      expect(renderer.flowVisible).toBe(false);
  });

  it('should highlight units', () => {
      renderer.setSelectedUnit('u1');
      expect(renderer.selectedUnitId).toBe('u1');

      renderer.setHoverUnit('u1');
      expect(renderer.hoverUnitId).toBe('u1');
  });

  it('should cycle palettes', () => {
      renderer.cyclePalette();
      expect(renderer.paletteIndex).toBe(1);
  });
});
