import { checkRoomCollisions } from "./collisionSystem.js";
import { showRoomNotification } from "./uiFluffSystem.js";

function spawnPaperEnemies(state) {
    state.ui.notifications.push("Papercut alert!");
}

function updateRoom(state) {
  const currentRoom = state.map.rooms.find((r) => r.id === state.map.currentRoomId);
  if (!currentRoom || currentRoom.isCleared) return;

  // Example: Printer jam logic
  currentRoom.props.forEach((prop) => {
    if (prop.type === "Printer" && Math.random() < 0.01) {
      // prop.effect = spawnPaperEnemies; // Dynamic effect replacement example
      if(Math.random() < 0.1) spawnPaperEnemies(state);
    }
  });
}

export function runGameSystems(state) {
  checkRoomCollisions(state);
  updateRoom(state);
  showRoomNotification(state);
}
