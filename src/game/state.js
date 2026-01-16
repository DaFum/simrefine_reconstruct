export function createGameState() {
  return {
    map: {
      rooms: [],
      currentRoomId: null,
      floorLevel: 1,
    },
    player: {
      position: { x: 0, y: 0 },
      speed: 10,
      health: 100,
    },
    ui: {
      notifications: [],
    },
    difficulty: 1,
  };
}
