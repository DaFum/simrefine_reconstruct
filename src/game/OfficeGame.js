import { createGameState } from "./state.js";
import { runGameSystems } from "./systems/runSystems.js";
import { generateFloor, enterRoom } from "./systems/roomSystem.js";
import { spawnPlayer } from "./systems/spawnSystem.js";
import { OfficeInput } from "./OfficeInput.js";

export class OfficeGame {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = createGameState();
        this.running = false;
        this.time = 0;
        this.input = new OfficeInput();
        this.speedMultiplier = 1;
        this.logs = []; // Compatibility with UI
    }

    start() {
        this.state.map.rooms = generateFloor(1);
        spawnPlayer(this.state);
        // Enter first room
        if (this.state.map.rooms.length > 0) {
            enterRoom(this.state, this.state.map.rooms[0].id);
        }
        this.input.attach(this.state.player);
        this.running = true;
        this.pushLog("info", "Office Crawler mode engaged. Survive the 9-to-5.");
    }

    update(deltaSeconds) {
        if (!this.running) return;
        this.time += deltaSeconds;

        // Handle input movement
        const move = this.input.getMovement();
        if (move.x !== 0 || move.y !== 0) {
            const speed = this.state.player.speed || 100; // pixels per second?
            this.state.player.position.x += move.x * speed * deltaSeconds;
            this.state.player.position.y += move.y * speed * deltaSeconds;
        }

        runGameSystems(this.state);
    }

    reset() {
        this.state = createGameState();
        this.start();
    }

    toggleRunning() {
        this.running = !this.running;
        return this.running;
    }

    setSpeedMultiplier(val) {
        this.speedMultiplier = val;
        return val;
    }

    // API Compatibility with RefinerySimulation
    getMetrics() {
        // Map player stats to metrics UI so it's not empty
        return {
            profitPerHour: this.state.player.health, // Hack: Show health as profit
            reliability: 1, // 100%
            score: 0,
            missionCompleted: false,
            // dummy values to prevent UI crash
            gasoline: 0, diesel: 0, jet: 0,
            storageGasoline: 0, storageDiesel: 0, storageJet: 0,
            storageUtilization: 0,
            shipmentReliability: 1,
            carbon: 0
        };
    }

    getLogisticsState() {
        return {
            storage: { capacity: {}, levels: {} },
            shipments: [],
            alerts: []
        };
    }

    getFlows() { return {}; }
    getUnits() { return []; }
    getScenarioList() { return []; }
    getActiveAlerts() { return []; }
    getRecorderState() { return {}; }

    pushLog(level, message) {
        this.logs.push({ level, message, timestamp: "Now" });
        // Maybe emit event if UI listens to it, but UI currently polls logs?
        // Actually UI likely just polls simulation.logs or we don't expose it directly yet.
        // RefinerySimulation has getLogs().
    }

    getLogs() {
        return this.logs;
    }

    // Additional helpers
    getEntities() {
        const currentRoom = this.state.map.rooms.find(r => r.id === this.state.map.currentRoomId);
        return {
            player: this.state.player,
            enemies: currentRoom ? currentRoom.enemies : [],
            props: currentRoom ? currentRoom.props : [],
            room: currentRoom
        };
    }

    dispose() {
        this.input.detach();
    }
}
