/**
 * Logistics Renderer
 * Handles rendering of storage, shipments, and logistics controls
 */

const PRODUCT_LABELS = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  jet: "Jet Fuel",
};

/**
 * Format hours into a human-readable string
 * @param {number} hours - Hours to format
 * @returns {string} Formatted time
 */
function formatHours(hours) {
  if (!Number.isFinite(hours) || hours < 0) {
    return "—";
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours.toFixed(1)} h`;
}

/**
 * Render inventory bar for a product
 * @param {Object} context - Rendering context
 * @param {string} product - Product key (gasoline, diesel, jet)
 */
export function renderInventoryBar(context, product) {
  const { elements, storage } = context;
  const key = product.charAt(0).toUpperCase() + product.slice(1);

  const barEl = elements[`inventory${key}Bar`];
  const labelEl = elements[`inventory${key}Label`];

  if (!barEl || !storage) {
    return;
  }

  const level = storage.levels?.[product] ?? 0;
  const capacity = storage.capacity?.[product] ?? 1;
  const ratio = capacity > 0 ? Math.min(level / capacity, 1) : 0;

  barEl.style.width = `${Math.round(ratio * 100)}%`;

  if (labelEl) {
    labelEl.textContent = `${Math.round(level)} / ${Math.round(capacity)} kb`;
  }

  barEl.classList.toggle("warning", ratio >= 0.75);
  barEl.classList.toggle("danger", ratio >= 0.9);
}

/**
 * Render logistics controls (expedite, delay, expand)
 * @param {Object} context - Rendering context
 */
export function renderLogisticsControls(context) {
  const { elements, logistics, shipments } = context;

  // Expedite button
  if (elements.logisticsExpedite) {
    const cooldown = logistics?.extraShipmentCooldown ?? 0;
    const disabled = cooldown > 0.05;
    elements.logisticsExpedite.disabled = disabled;
    elements.logisticsExpedite.setAttribute("aria-disabled", disabled ? "true" : "false");
    elements.logisticsExpedite.textContent = disabled
      ? `Call Emergency Ship (${cooldown.toFixed(1)}h)`
      : "Call Emergency Ship";
    elements.logisticsExpedite.title = disabled
      ? `Emergency charter crews resetting (${cooldown.toFixed(1)} hours)`
      : "Stage an expedited marine shipment";
  }

  // Delay button
  if (elements.logisticsDelay) {
    const pending = Array.isArray(shipments)
      ? shipments
          .filter((shipment) => shipment && shipment.status === "pending" && !shipment.rush)
          .sort((a, b) => (a.dueIn ?? Infinity) - (b.dueIn ?? Infinity))
      : [];
    const candidate = pending[0];
    const disabled = !candidate;
    elements.logisticsDelay.disabled = disabled;
    elements.logisticsDelay.setAttribute("aria-disabled", disabled ? "true" : "false");
    elements.logisticsDelay.textContent = disabled
      ? "Delay Next Ship"
      : `Delay ${PRODUCT_LABELS[candidate.product] || candidate.product}`;

    if (disabled) {
      elements.logisticsDelay.title = "No standard shipments are waiting at the dock.";
    } else {
      const due = Number.isFinite(candidate.dueIn) ? candidate.dueIn : 0;
      elements.logisticsDelay.title = `Push the next ${
        PRODUCT_LABELS[candidate.product] || candidate.product
      } sailing back (currently due in ${formatHours(due)}).`;
    }
  }

  // Expand button
  if (elements.logisticsExpand) {
    const nextLevel = (logistics?.upgrades?.level || 0) + 1;
    const maxed = (logistics?.upgrades?.level || 0) >= 6;
    elements.logisticsExpand.disabled = maxed;
    elements.logisticsExpand.setAttribute("aria-disabled", maxed ? "true" : "false");
    elements.logisticsExpand.textContent = maxed
      ? "Tank Farm Fully Expanded"
      : `Expand Tank Farm (Lvl ${nextLevel})`;
    elements.logisticsExpand.title = maxed
      ? "All planned tank expansions complete"
      : "Authorize capital project to expand storage";
  }
}

/**
 * Render storage status display
 * @param {Object} context - Rendering context
 */
export function renderStorageStatus(context) {
  const { elements, logistics } = context;

  if (!elements.storageStatus) {
    return;
  }

  const pressure = logistics?.pressure || {};
  const throttle = Math.round((pressure.throttle ?? 1) * 100);
  const ratio = pressure.lastRatio ? Math.round(pressure.lastRatio * 100) : null;

  const parts = [`Crude feed ${throttle}%`];

  if (Number.isFinite(ratio)) {
    parts.push(`tanks ${ratio}% full`);
  }

  if (logistics?.upgrades?.level) {
    parts.push(`capacity lvl ${logistics.upgrades.level}`);
  }

  if (pressure.active) {
    parts.push("pressure easing");
    elements.storageStatus.dataset.state = "alert";
  } else {
    elements.storageStatus.dataset.state = "stable";
  }

  elements.storageStatus.textContent = parts.join(" · ");
}
