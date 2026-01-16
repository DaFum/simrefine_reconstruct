export function pickRandomEnemyForRoom(roomType) {
  const roomEnemyMap = {
    BreakRoom: ["Intern", "Janitor"],
    CubicleFarm: ["Micromanager", "Intern", "PrinterGolem"],
    MeetingRoom: ["PowerPointZombie", "BuzzwordBot"],
  };

  const enemies = roomEnemyMap[roomType] || [];
  if (enemies.length === 0) return "Intern";

  return enemies[Math.floor(Math.random() * enemies.length)];
}
