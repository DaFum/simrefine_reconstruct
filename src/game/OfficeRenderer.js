import * as THREE from "../vendor/three.module.js";

export class OfficeRenderer {
    constructor(container, game) {
        this.container = container;
        this.game = game;

        this.width = container.clientWidth || 800;
        this.height = container.clientHeight || 600;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // Orthographic camera for top-down view
        // View size: Let's say 800x600 pixels maps to 800x600 units for simplicity, centered
        this.camera = new THREE.OrthographicCamera(
            this.width / -2, this.width / 2,
            this.height / 2, this.height / -2,
            1, 1000
        );
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Cache for meshes
        this.playerMesh = null;
        this.enemyMeshes = new Map(); // id -> mesh
        this.propMeshes = new Map();
        this.roomMesh = null;
        this.currentRoomId = null;

        // Assets (Geometry/Material placeholders)
        this.playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green Player
        this.enemyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red Enemy
        this.propMat = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue Prop
        this.floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        this.wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

        this._createPlayer();
    }

    _createPlayer() {
        const geo = new THREE.BoxGeometry(20, 20, 20);
        this.playerMesh = new THREE.Mesh(geo, this.playerMat);
        this.scene.add(this.playerMesh);
    }

    _updateRoom(room) {
        if (!room) return;
        if (this.currentRoomId === room.id) return;

        // Clear old room (except player)
        if (this.roomGroup) {
            this.scene.remove(this.roomGroup);
        }

        this.roomGroup = new THREE.Group();
        this.scene.add(this.roomGroup);
        this.currentRoomId = room.id;

        // Build Floor
        const floorGeo = new THREE.PlaneGeometry(room.bounds.width, room.bounds.height);
        const floor = new THREE.Mesh(floorGeo, this.floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(
            room.bounds.x + room.bounds.width/2,
            -10, // Slightly below
            room.bounds.y + room.bounds.height/2
        );
        this.roomGroup.add(floor);

        // Create Props
        this.propMeshes.clear();
        room.props.forEach((prop, idx) => {
             const geo = new THREE.BoxGeometry(20, 20, 20);
             const mesh = new THREE.Mesh(geo, this.propMat);
             // Prop positions in template are relative to room origin?
             // The simulation `collisionSystem` assumed they were relative to `room.bounds`.
             // Let's assume `room.props` have `position.x/y` relative to `room.bounds.x/y`.
             mesh.position.set(
                 room.bounds.x + prop.position.x,
                 10,
                 room.bounds.y + prop.position.y
             );
             this.roomGroup.add(mesh);
             this.propMeshes.set(`prop-${idx}`, mesh);
        });

        // Center camera on room
        this.camera.position.x = room.bounds.x + room.bounds.width / 2;
        this.camera.position.z = room.bounds.y + room.bounds.height / 2;
        this.camera.updateProjectionMatrix();
    }

    render(delta, state) {
        const entities = this.game.getEntities();

        // Update Room Geometry if changed
        this._updateRoom(entities.room);

        // Update Player
        if (entities.player) {
            this.playerMesh.position.set(entities.player.position.x, 10, entities.player.position.y);
            // Camera follow player with some stiffness? For now static room cam is fine.
        }

        // Update Enemies
        // Simple pool or recreate? Recreate for prototype simplicity.
        // Remove old enemies
        this.enemyMeshes.forEach(mesh => this.scene.remove(mesh));
        this.enemyMeshes.clear();

        if (entities.enemies) {
            entities.enemies.forEach((enemy, idx) => {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 15, 15), this.enemyMat);
                mesh.position.set(enemy.position.x, 7.5, enemy.position.y);
                this.scene.add(mesh);
                this.enemyMeshes.set(`enemy-${idx}`, mesh);
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    resizeToContainer(container) {
        if (!this.renderer || !container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.renderer.setSize(width, height, false);

        this.camera.left = width / -2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = height / -2;
        this.camera.updateProjectionMatrix();
    }

    getSurface() {
        return this.renderer.domElement;
    }

    // Stub for compatibility with main.js calls
    setGridVisible() {}
    setFlowVisible() {}
    cyclePalette() {}
    setHighlightedPipelines() {}
    setSelectedUnit() {}
    setHoverUnit() {}
    setPointer() {}
    resetView() {}
}
