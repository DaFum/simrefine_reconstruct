import { ROOM_TEMPLATES } from "../content/rooms.js";
import { spawnEnemiesForRoom } from "./spawnSystem.js";

function pickRandomRoomType() {
  const types = Object.keys(ROOM_TEMPLATES);
  return types[Math.floor(Math.random() * types.length)];
}

function getRoomCenter(room) {
    return {
        x: room.bounds.x + room.bounds.width / 2,
        y: room.bounds.y + room.bounds.height / 2
    };
}

export function generateFloor(floorLevel) {
  const rooms = [];
  const roomCount = 3 + floorLevel; // Scale with difficulty

  let currentX = 0;

  // 1. Create rooms from templates
  for (let i = 0; i < roomCount; i++) {
    const type = i === 0 ? "BreakRoom" : pickRandomRoomType(); // Start in BreakRoom
    const template = ROOM_TEMPLATES[type];

    // Simple layout: linear arrangement
    const bounds = {
        x: currentX,
        y: 0,
        width: template.bounds.width,
        height: template.bounds.height
    };

    rooms.push({
      ...template, // Start with template props
      bounds, // Override bounds with positioned bounds
      id: `room-${i}`,
      doors: [],
      enemies: [],
      isCleared: false,
      // Deep copy props so we can modify them if needed
      props: template.props.map(p => ({...p})),
    });

    currentX += bounds.width + 50; // Gap
  }

  // 2. Connect rooms (linear for now)
  for (let i = 0; i < rooms.length - 1; i++) {
    const roomA = rooms[i];
    const roomB = rooms[i + 1];

    // Create a "door" connection
    // For linear layout, door is at right of A and left of B
    const doorPosA = { x: roomA.bounds.x + roomA.bounds.width, y: roomA.bounds.y + roomA.bounds.height / 2 };
    const doorPosB = { x: roomB.bounds.x, y: roomB.bounds.y + roomB.bounds.height / 2 };

    roomA.doors.push({
      toRoomId: roomB.id,
      position: doorPosA,
      locked: Math.random() < 0.2,
    });
    roomB.doors.push({
      toRoomId: roomA.id,
      position: doorPosB,
      locked: Math.random() < 0.2,
    });
  }

  return rooms;
}

export function enterRoom(state, roomId) {
  const room = state.map.rooms.find((r) => r.id === roomId);
  if (!room) return;

  state.map.currentRoomId = roomId;
  state.player.position = getRoomCenter(room);

  // Spawn enemies if not cleared
  if (!room.isCleared) {
    room.enemies = spawnEnemiesForRoom(room, state.difficulty);
  }
}
