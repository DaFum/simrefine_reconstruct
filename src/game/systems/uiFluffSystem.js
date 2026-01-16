function getCurrentRoom(state) {
  if (!state.map.currentRoomId) return null;
  return state.map.rooms.find((r) => r.id === state.map.currentRoomId);
}

export function showRoomNotification(state) {
  const currentRoom = getCurrentRoom(state);
  if (!currentRoom) return;

  const messages = {
    BreakRoom: "Take a break! ☕",
    CubicleFarm: "Watch out for micromanagers...",
    MeetingRoom: "This could’ve been an email.",
  };
  const msg = messages[currentRoom.type];
  if (msg && !state.ui.notifications.includes(msg)) {
      state.ui.notifications.push(msg);
  }
}
