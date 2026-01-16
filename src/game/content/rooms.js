export const ROOM_TEMPLATES = {
  BreakRoom: {
    type: "BreakRoom",
    bounds: { x: 0, y: 0, width: 400, height: 300 },
    props: [
      {
        type: "CoffeeMachine",
        position: { x: 100, y: 100 },
        effect: applyCoffeeBoost,
      },
    ],
  },
  CubicleFarm: {
    type: "CubicleFarm",
    bounds: { x: 0, y: 0, width: 500, height: 400 },
    props: [
      {
        type: "Printer",
        position: { x: 200, y: 150 },
        effect: jamPrinter,
      },
    ],
  },
  MeetingRoom: {
    type: "MeetingRoom",
    bounds: { x: 0, y: 0, width: 600, height: 350 },
    props: [],
  },
};

export function applyCoffeeBoost(state) {
  state.player.speed *= 1.5;
  setTimeout(() => {
    state.player.speed /= 1.5;
  }, 5000);
}

export function jamPrinter(state) {
  state.ui.notifications.push("The printer is jamming! Paper enemies incoming!");
}
