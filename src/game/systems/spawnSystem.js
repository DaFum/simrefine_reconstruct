import { pickRandomEnemyForRoom } from "../content/enemies.js";

function getEnemyDensity(roomType) {
  // Simple density map: enemies per room type
  const densities = {
    BreakRoom: 1,
    CubicleFarm: 3,
    MeetingRoom: 2,
  };
  return densities[roomType] || 1;
}

function getRandomPositionInRoom(room) {
  return {
    x: room.bounds.x + Math.random() * room.bounds.width,
    y: room.bounds.y + Math.random() * room.bounds.height,
  };
}

function getRoomCenter(room) {
  return {
    x: room.bounds.x + room.bounds.width / 2,
    y: room.bounds.y + room.bounds.height / 2,
  };
}

export function spawnPlayer(state) {
  const breakRoom = state.map.rooms.find((r) => r.type === "BreakRoom");
  if (breakRoom) {
    state.player.position = getRoomCenter(breakRoom);
  } else if (state.map.rooms.length > 0) {
    state.player.position = getRoomCenter(state.map.rooms[0]);
  }
}

export function spawnEnemiesForRoom(room, difficulty) {
  const enemyCount = Math.floor(difficulty * getEnemyDensity(room.type));
  return Array(enemyCount)
    .fill(0)
    .map(() => ({
      type: pickRandomEnemyForRoom(room.type),
      position: getRandomPositionInRoom(room),
    }));
}
