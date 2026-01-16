import { describe, it, expect } from "vitest";
import { createGameState } from "../../src/game/state.js";
import { generateFloor, enterRoom } from "../../src/game/systems/roomSystem.js";
import { spawnPlayer } from "../../src/game/systems/spawnSystem.js";
import { runGameSystems } from "../../src/game/systems/runSystems.js";

describe("Game Integration", () => {
  it("should initialize game state", () => {
    const state = createGameState();
    expect(state).toBeDefined();
    expect(state.map.rooms).toEqual([]);
    expect(state.player.health).toBe(100);
  });

  it("should generate floor with rooms", () => {
    const state = createGameState();
    state.map.rooms = generateFloor(1);
    expect(state.map.rooms.length).toBeGreaterThan(0);
    expect(state.map.rooms[0].type).toBe("BreakRoom");
  });

  it("should spawn player in break room", () => {
    const state = createGameState();
    state.map.rooms = generateFloor(1);
    spawnPlayer(state);

    // Check if player position is within the first room (BreakRoom)
    const breakRoom = state.map.rooms[0];
    const centerX = breakRoom.bounds.x + breakRoom.bounds.width / 2;
    const centerY = breakRoom.bounds.y + breakRoom.bounds.height / 2;

    expect(state.player.position.x).toBe(centerX);
    expect(state.player.position.y).toBe(centerY);
  });

  it("should transition between rooms", () => {
    const state = createGameState();
    state.map.rooms = generateFloor(1);
    const room1 = state.map.rooms[0];
    const room2 = state.map.rooms[1];

    // Manually trigger enterRoom for room 2
    enterRoom(state, room2.id);

    expect(state.map.currentRoomId).toBe(room2.id);

    // Room 2 should have enemies spawned
    expect(room2.enemies.length).toBeGreaterThan(0);
  });

  it("should run game loop and trigger notifications", () => {
      const state = createGameState();
      state.map.rooms = generateFloor(1);
      spawnPlayer(state);
      state.map.currentRoomId = state.map.rooms[0].id; // Set initial room

      runGameSystems(state);

      expect(state.ui.notifications).toContain("Take a break! ☕");
  });
});
