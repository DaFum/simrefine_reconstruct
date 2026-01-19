/**
 * Metrics Renderer
 * Handles rendering of production and financial metrics
 */

/**
 * Render production metrics (outputs and throughput)
 * @param {Object} context - Rendering context
 */
export function renderProductionMetrics(context) {
  const { elements, metrics, animateMetric, formatBpd } = context;

  animateMetric(elements.gasolineOutput, "gasoline", metrics.gasoline, formatBpd);
  animateMetric(elements.dieselOutput, "diesel", metrics.diesel, formatBpd);
  animateMetric(elements.jetOutput, "jet", metrics.jet, formatBpd);
  animateMetric(elements.lpgOutput, "lpg", metrics.lpg, formatBpd);
  animateMetric(elements.wasteOutput, "waste", metrics.waste || 0, formatBpd);

  if (elements.flareOutput) {
    const flare = Math.round((metrics.flareLevel || 0) * 100);
    elements.flareOutput.textContent = `${flare}%`;
    elements.flareOutput.classList.toggle("warning", flare > 15);
    elements.flareOutput.classList.toggle("danger", flare > 40);
  }
}

/**
 * Render financial metrics (profit, revenue, expenses)
 * @param {Object} context - Rendering context
 */
export function renderFinancialMetrics(context) {
  const { elements, metrics, animateMetric, profitFormatter } = context;

  const profitVal = Math.round(metrics.profitPerHour * 1000);
  animateMetric(
    elements.profitOutput,
    "profit",
    profitVal,
    (val) => `${profitFormatter.format(Math.round(val))} / hr`
  );

  if (elements.revenueOutput) {
    const revenue =
      typeof metrics.revenuePerDay === "number" ? Math.round(metrics.revenuePerDay * 1000) : 0;
    animateMetric(
      elements.revenueOutput,
      "revenue",
      revenue,
      (val) => `${profitFormatter.format(Math.round(val))} / day`
    );
  }

  if (elements.expenseOutput) {
    const expensePerHour =
      typeof metrics.expensePerDay === "number" ? Math.round((metrics.expensePerDay / 24) * 1000) : 0;
    animateMetric(
      elements.expenseOutput,
      "expense",
      expensePerHour,
      (val) => `${profitFormatter.format(Math.round(val))} / hr`
    );
  }

  if (elements.penaltyOutput) {
    const penaltyPerHour =
      typeof metrics.penaltyPerDay === "number" ? Math.round((metrics.penaltyPerDay / 24) * 1000) : 0;
    animateMetric(
      elements.penaltyOutput,
      "penalty",
      penaltyPerHour,
      (val) => `${profitFormatter.format(Math.round(val))} / hr`
    );
  }

  if (elements.marginOutput) {
    const margin = typeof metrics.marginMultiplier === "number" ? metrics.marginMultiplier : 0;
    elements.marginOutput.textContent = `${Math.round(margin * 100)}%`;
  }
}

/**
 * Render reliability and operational metrics
 * @param {Object} context - Rendering context
 */
export function renderReliabilityMetrics(context) {
  const { elements, metrics, maxCduCapacity } = context;

  elements.reliabilityOutput.textContent = `${Math.round(metrics.reliability * 100)}%`;

  if (elements.strainOutput) {
    const strainValue = Number.isFinite(metrics.operationalStrain)
      ? metrics.operationalStrain
      : 0;
    const strainRatio = Math.min(Math.max(strainValue / 12, 0), 1);
    const strainPct = Math.round(strainRatio * 100);
    elements.strainOutput.textContent = `${strainPct}%`;
    elements.strainOutput.classList.toggle("warning", strainPct >= 65);
  }

  if (elements.incidentsOutput) {
    elements.incidentsOutput.textContent = metrics.incidents || 0;
    elements.incidentsOutput.classList.toggle("danger", (metrics.incidents || 0) > 0);
  }

  if (elements.throughputOutput) {
    const intake = context.crudeIntake;
    const util = Math.round((intake / maxCduCapacity) * 100);
    elements.throughputOutput.textContent = `${util}%`;
  }

  elements.carbonOutput.textContent = `${metrics.carbon.toFixed(1)} tCO₂-eq`;
}
