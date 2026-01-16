import { enterRoom } from "./roomSystem.js";

const PROP_SIZES = {
  Printer: { width: 30, height: 30 },
  CoffeeMachine: { width: 20, height: 20 },
  FilingCabinet: { width: 25, height: 40 },
};

const DOOR_SIZE = { width: 40, height: 80 };

function getCurrentRoom(state) {
  if (!state.map.currentRoomId) return null;
  return state.map.rooms.find((r) => r.id === state.map.currentRoomId);
}

function isPointInsideRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function resolveWallCollision(player, bounds) {
  // Simple clamp
  player.position.x = Math.max(bounds.x, Math.min(bounds.x + bounds.width, player.position.x));
  player.position.y = Math.max(bounds.y, Math.min(bounds.y + bounds.height, player.position.y));
}

function isColliding(player, position, size) {
  // Simple AABB or distance check. Let's use simple distance for "interaction range"
  // or AABB for collision.
  // Assuming player size is roughly 20x20
  const playerSize = 20;
  const dx = Math.abs(player.position.x - position.x);
  const dy = Math.abs(player.position.y - position.y);

  const combinedHalfWidth = (playerSize + (size?.width || 20)) / 2;
  const combinedHalfHeight = (playerSize + (size?.height || 20)) / 2;

  return dx < combinedHalfWidth && dy < combinedHalfHeight;
}

export function checkRoomCollisions(state) {
  const currentRoom = getCurrentRoom(state);
  if (!currentRoom) return;

  // Check walls
  if (!isPointInsideRect(state.player.position, currentRoom.bounds)) {
    resolveWallCollision(state.player, currentRoom.bounds);
  }

  // Check props
  currentRoom.props.forEach((prop) => {
    const size = PROP_SIZES[prop.type] || { width: 20, height: 20 };
    // Adjust prop position to be absolute if it's relative in template
    // In our generateFloor, we updated bounds but not props positions relative to new bounds?
    // Wait, room templates have positions like {x: 100, y: 100}.
    // These should be relative to room origin.
    const absPropPos = {
        x: currentRoom.bounds.x + prop.position.x,
        y: currentRoom.bounds.y + prop.position.y
    };

    if (isColliding(state.player, absPropPos, size)) {
      if (typeof prop.effect === "function") {
        prop.effect(state);
      }
    }
  });

  // Check doors
  currentRoom.doors.forEach((door) => {
    if (isColliding(state.player, door.position, DOOR_SIZE) && !door.locked) {
      enterRoom(state, door.toRoomId);
    }
  });
}
