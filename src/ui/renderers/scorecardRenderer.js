/**
 * Scorecard Renderer
 * Handles rendering of score, grade, and performance trend
 */

/**
 * Render scorecard display (grade, delta, note)
 * @param {Object} context - Rendering context
 * @returns {boolean} Whether the trend needs redrawing
 */
export function renderScorecard(context) {
  const { elements, metrics } = context;
  const { scoreGrade, scoreDelta, scoreNote } = elements;

  if (!scoreGrade) {
    return false;
  }

  const grade = metrics.grade ?? "—";
  scoreGrade.textContent = grade;

  if (typeof metrics.score === "number") {
    scoreGrade.setAttribute("title", `Composite score ${metrics.score.toFixed(0)}`);
  } else {
    scoreGrade.removeAttribute("title");
  }

  if (scoreDelta) {
    const delta = typeof metrics.scoreDelta === "number" ? metrics.scoreDelta : 0;
    scoreDelta.classList.remove("positive", "negative");

    if (Math.abs(delta) < 0.05) {
      scoreDelta.textContent = "—";
      scoreDelta.removeAttribute("title");
    } else {
      const positive = delta > 0;
      scoreDelta.classList.add(positive ? "positive" : "negative");
      const arrow = positive ? "▲" : "▼";
      scoreDelta.textContent = `${arrow}${Math.abs(delta).toFixed(1)}`;
      scoreDelta.setAttribute(
        "title",
        positive ? "Score trending upward" : "Score trending downward"
      );
    }
  }

  if (scoreNote) {
    scoreNote.textContent = metrics.scoreNote || "Plant stabilizing…";
  }

  return true;
}

/**
 * Draw score trend chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number[]} history - Score history array
 */
export function drawScoreTrend(ctx, history) {
  if (!ctx) return;

  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(6, 12, 20, 0.75)";
  ctx.fillRect(0, 0, width, height);

  if (!history.length) {
    return;
  }

  const min = Math.min(50, ...history);
  const max = Math.max(95, ...history);
  const range = Math.max(1, max - min);
  const gutterX = 4;
  const gutterY = 4;

  // Draw target line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  const targetNormalized = (75 - min) / range;
  const targetY = height - gutterY - targetNormalized * (height - gutterY * 2);
  const clampedTargetY = Math.min(height - gutterY, Math.max(gutterY, targetY));
  ctx.beginPath();
  ctx.moveTo(gutterX, clampedTargetY);
  ctx.lineTo(width - gutterX, clampedTargetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Calculate points
  const points = history.map((value, index) => {
    const x = gutterX + (index / Math.max(1, history.length - 1)) * (width - gutterX * 2);
    const normalized = (value - min) / range;
    const y = height - gutterY - normalized * (height - gutterY * 2);
    return { x, y };
  });

  // Draw filled area
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, height - gutterY);
  ctx.lineTo(points[0].x, height - gutterY);
  ctx.closePath();
  ctx.fillStyle = "rgba(88, 217, 149, 0.18)";
  ctx.fill();

  // Draw line
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = "#58d995";
  ctx.lineWidth = 2;
  ctx.stroke();
}
