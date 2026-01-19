/**
 * Economy Renderer
 * Handles rendering of futures, costs, and basis metrics
 */

const PRODUCTS = [
  {
    label: "Gasoline",
    elementPrefix: "gasoline",
    futuresKey: "futuresGasoline",
    costKey: "costGasoline",
    basisKey: "basisGasoline",
  },
  {
    label: "Diesel",
    elementPrefix: "diesel",
    futuresKey: "futuresDiesel",
    costKey: "costDiesel",
    basisKey: "basisDiesel",
  },
  {
    label: "Jet Fuel",
    elementPrefix: "jet",
    futuresKey: "futuresJet",
    costKey: "costJet",
    basisKey: "basisJet",
  },
];

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {Intl.NumberFormat} formatter - Currency formatter
 * @returns {string} Formatted currency
 */
function formatCurrency(value, formatter) {
  if (!Number.isFinite(value)) {
    return "$0.00";
  }
  return formatter.format(value);
}

/**
 * Format signed currency value (with + or -)
 * @param {number} value - Value to format
 * @param {Intl.NumberFormat} formatter - Currency formatter
 * @returns {string} Formatted signed currency
 */
function formatSignedCurrency(value, formatter) {
  if (!Number.isFinite(value)) {
    return "$0.00";
  }
  const absolute = Math.abs(value);
  if (absolute < 0.005) {
    return "$0.00";
  }
  const formatted = formatter.format(absolute);
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatted}`;
}

/**
 * Render economy metrics (futures, costs, basis)
 * @param {Object} context - Rendering context
 */
export function renderEconomy(context) {
  const { elements, metrics, priceFormatter } = context;

  if (!priceFormatter) {
    return;
  }

  PRODUCTS.forEach((product) => {
    const futuresValue = Number(metrics[product.futuresKey]);
    const costValue = Number(metrics[product.costKey]);
    const basisValue = Number(metrics[product.basisKey]);

    const futuresEl = elements[`${product.elementPrefix}Futures`];
    if (futuresEl) {
      futuresEl.textContent = formatCurrency(futuresValue, priceFormatter);
      futuresEl.setAttribute(
        "title",
        `${product.label} futures respond to demand, reliability, and shipping performance.`
      );
    }

    const costEl = elements[`${product.elementPrefix}Cost`];
    if (costEl) {
      costEl.textContent = formatCurrency(costValue, priceFormatter);
      costEl.setAttribute(
        "title",
        `${product.label} per-barrel production cost including crude, maintenance, and logistics penalties.`
      );
    }

    const basisEl = elements[`${product.elementPrefix}Basis`];
    if (basisEl) {
      const nearZero = !Number.isFinite(basisValue) || Math.abs(basisValue) < 0.005;
      const formatted = nearZero ? "$0.00" : formatSignedCurrency(basisValue, priceFormatter);
      basisEl.textContent = formatted;
      basisEl.classList.toggle("positive", !nearZero && basisValue > 0.01);
      basisEl.classList.toggle("negative", !nearZero && basisValue < -0.01);
      basisEl.setAttribute("aria-label", `${product.label} basis ${formatted}`);
      basisEl.setAttribute("title", `Futures spread: ${formatted}`);
    }
  });
}
