export const MISSIONS = [
  {
    id: "tutorial_stabilize",
    title: "Stabilization Protocol",
    description: "The refinery is coming out of a turnaround. Stabilize operations to prove readiness for higher loads.",
    objectives: [
      {
        type: "production",
        product: "diesel",
        target: 100,
        label: "Produce 100kb Diesel",
        progress: 0
      },
      {
        type: "reliability",
        threshold: 0.98,
        duration: 2,
        label: "Hold Reliability > 98% for 2h",
        timeRemaining: 2
      }
    ],
    next: "summer_rush",
    reward: "Unlocks Summer Rush Scenario"
  },
  {
    id: "summer_rush",
    title: "Summer Rush: Gasoline",
    description: "Tourist season is peaking. The market needs gasoline, but the heat puts strain on the cooling systems.",
    objectives: [
      {
        type: "production",
        product: "gasoline",
        target: 350,
        label: "Produce 350kb Gasoline",
        progress: 0
      },
      {
        type: "delivery",
        product: "gasoline",
        target: 200,
        label: "Ship 200kb Gasoline",
        progress: 0
      }
    ],
    next: "winter_diesel",
    reward: "Score Bonus +150"
  },
  {
    id: "winter_diesel",
    title: "Winter Heating",
    description: "A cold front is approaching. Switch focus to diesel and heating oil production.",
    objectives: [
      {
        type: "production",
        product: "diesel",
        target: 400,
        label: "Produce 400kb Diesel",
        progress: 0
      },
      {
        type: "reliability",
        threshold: 0.90,
        duration: 4,
        label: "Reliability > 90% (4h)",
        timeRemaining: 4
      }
    ],
    next: null,
    reward: "Season Complete"
  }
];
