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
    reward: "Score Bonus +150",
    triggers: [
        {
            type: "metric",
            metric: "gasoline",
            operator: ">",
            value: 100,
            event: {
                id: "summer_surge_decision",
                title: "Market Opportunity: Spot Surge",
                description: "A competitor's outage has spiked spot gasoline prices by +15%. Traders are asking to release reserve stocks immediately, but this risks running dry if production hiccups.",
                choices: [
                    {
                        id: "release_reserves",
                        label: "Release Reserves (Profit +$2M, Risk Low Inventory)",
                        effect: (sim) => {
                            sim.metrics.revenuePerDay += 2000000;
                            sim.storage.levels.gasoline = Math.max(0, sim.storage.levels.gasoline - 50);
                            sim.pushLog("success", "Reserves released into the rally.");
                        }
                    },
                    {
                        id: "hold_steady",
                        label: "Hold Steady (Maintain Reliability)",
                        effect: (sim) => {
                            sim.pushLog("info", "Market opportunity declined. Focusing on stability.");
                        }
                    }
                ]
            }
        }
    ]
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
