1. User Interface (UI) & HUD
The "dashboard" through which the player interacts with the simulation.
 * Main Viewport:
   * Perspective: Top-down, 2D tile-based view of the refinery grounds.
   * Grid System: The map is divided into a grid for placing pipes, tanks, and units.
   * Agent Visualization: Small colored dots or "pulses" travel through pipes to represent fluid batches moving in real-time.
 * Top Menu Bar: Standard Windows-style dropdowns (File, Edit, Simulation, Windows, Help).
 * The "Whiteboard" Inspector:
   * Function: Clicking any object opens a dedicated window showing its internal logic.
   * Live Data: Displays real-time graphs for Temperature (^\circC), Pressure (PSI), and Flow Rate (Barrels/Hour).
   * Input/Output Sliders: Manual controls for specific valves or heater settings.
 * The Tool Palette: A floating window containing icons for construction (Pipes, Bulldozer) and Inspection (Magnifying Glass, Query Tool).
 * The Ticker: A scrolling marquee at the bottom showing current Crude Oil prices and Global Demand for products.
 * Alert System: A "Message Window" that logs events (e.g., "Tank 4 Full," "Pump B Maintenance Required," "Market Price of Jet Fuel Dropped").
2. Supply Chain & Inputs
The raw materials required to start the simulation loop.
 * Crude Oil Market:
   * Sweet vs. Sour: "Sweet" crude has low sulfur (easier to refine, expensive). "Sour" crude has high sulfur (cheaper, requires more processing).
   * Light vs. Heavy: "Light" crude yields more gasoline. "Heavy" crude yields more asphalt/heating oil.
   * Procurement Contracts: Players sign contracts for delivery (e.g., "10,000 barrels of West Texas Intermediate per month").
 * Logistics - Intake:
   * Marine Terminal: Tanker ships dock here. Players must schedule docking times to avoid "demurrage" (fines for ships waiting too long).
   * Pipeline Connection: Constant overland feed from external oil fields.
 * Storage Tank Farm:
   * Crude Tanks: Large tanks to buffer incoming shipments.
   * Segregation: Players must designate tanks for specific crude types. Mixing "Sweet" and "Sour" in one tank downgrades the entire batch to "Sour."
3. The Refining Process (Core Gameplay)
The heart of the game where physics and chemistry interact.

 * Atmospheric Distillation Unit (The Crude Unit):
   * Furnace: Heats the crude. Players set the temperature curve.
   * Fractionation Tower: Separates crude into layers based on boiling point:
     * Top: Gases (LPG).
     * Upper Middle: Naphtha (Gasoline base).
     * Middle: Kerosene (Jet Fuel base).
     * Lower Middle: Distillate (Diesel/Heating Oil).
     * Bottom: Residuum (Asphalt/Heavy Oil).
 * Conversion Units (Upgrading):
   * Vacuum Distillation: Re-boils the heavy "bottoms" to squeeze out more product.
   * Fluid Catalytic Cracker (FCC): breaks down heavy molecules into high-value gasoline.
     * Mechanic: Requires "Catalyst" input. Managing catalyst regeneration is a sub-loop.
   * Hydrotreater: Uses Hydrogen to remove sulfur from products (crucial for environmental compliance).
   * Coker: Cooks the heaviest sludge into solid "Coke" (sold as solid fuel) and lighter oils.
 * Piping Network:
   * Visual Feedback: Pipes change color based on content (Black=Crude, Amber=Gas, Blue=Water, Green=Acid/Chemicals).
   * Capacity: Pipes have a maximum flow rate. Exceeding it causes back-pressure.
   * Valves & Junctions: Players place valves to manually stop/start flow or route fluids to different destinations.
4. Blending & Outputs
Mixing intermediate fluids to meet market specifications.
 * Blending Tanks: The final step before sale.
   * Octane Balancing: Mixing high-octane "Reformate" with low-octane "Naphtha" to hit the target (e.g., 87, 89, or 92 Octane).
   * Additives: Injecting detergents or stabilizers to meet quality standards.
 * Product Storage: Finished goods tanks (Gasoline, Jet A, Heating Oil, Bunker Fuel).
 * Distribution:
   * Truck Rack: For local delivery of gasoline/diesel.
   * Pipeline Out: For massive export of heating oil.
   * Barges: For export of bunker fuel.
5. Economics & Management
The "Business Simulation" layer.
 * Ledger & Finance:
   * Balance Sheet: Income (Sales) vs. Expenses (Crude, Catalyst, Energy, Maintenance, Staff, Fines, Insurance).
   * Profitability Index: A tracked metric showing efficiency per barrel processed.
 * Staffing (HR):
   * Departments: Operations, Maintenance, Lab, Safety.
   * Headcount: Hiring more staff improves reaction time to alarms but increases overhead.
   * Training Budget: Spending on training reduces operator error (accidental valve closures).
 * Market Dynamics:
   * Seasonality: Heating Oil demand spikes in winter; Gasoline spikes in summer.
   * Spot Market: Selling excess product instantly at a lower price vs. fulfilling long-term contracts.
6. Maintenance & Reliability
The "survival" mechanic.

 * Component Health: Every unit has a hidden "Wear" variable (0-100%).
 * Maintenance Strategies:
   * Reactive: Fix it when it breaks (cheap now, expensive later, high downtime).
   * Preventative: Scheduled shutdowns (planned downtime, moderate cost).
   * Predictive: High-tech sensors (high install cost, lowest downtime).
 * Turnarounds: A gameplay phase where the player must take a unit offline for major overhaul without disrupting the rest of the plant.
7. Disasters, Safety & Environment
 * Chemical Imbalances:
   * Overpressure: If a pipe is blocked while a pump is running, pressure spikes -> Leak/Rupture.
   * Runaway Reaction: In the Hydrotreater, losing temperature control causes a thermal runaway -> Explosion.
 * Environmental Impact:
   * Flaring: Burning off excess gas creates visible flames on stacks and generates "Emissions Points."
   * Spills: Leaks turn the ground black, requiring expensive cleanup crews.
   * Fines: Exceeding EPA limits results in massive cash penalties.
 * Emergency Response:
   * Fire: Spreads across tiles. Players deploy Fire Brigades (agents) to douse flames.
   * Evacuation: In severe events, the plant must be evacuated, halting all production.
8. Meta-Game Tools (Training Features)
 * The "Time Machine" (Record/Playback):
   * VCR Controls: Record, Stop, Rewind, Play, Fast Forward.
   * Ghost Mode: Watch a previous session to see exactly which valve turn caused the explosion 20 minutes later.
 * Scenario Editor:
   * Trigger Setup: Create logic conditions (e.g., "IF Tank A < 10% AND Crude Price > $50 THEN Trigger Pump Failure").
   * Save/Load Scenario: Share training files with other users.
 * The Assumptions Editor ("Black Box" Access):
   * Access the variables defining physics (e.g., "Boiling Point of Naphtha," "Flammability of Jet Fuel").
   * Modify economic constants (e.g., "Tax Rate," "Inflation").
9. Audio & Atmosphere
 * Soundscape: Constant hum of machinery, rhythmic pumping sounds, steam hissing.
 * Alarms: Distinct audio cues for different priority levels (Low = Beep, High = Siren).
 * Music: Minimalist, industrial-ambient score (similar to the jazzy/industrial MIDI of SimCity 2000).
