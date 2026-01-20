import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderScorecard, drawScoreTrend } from '../../../../src/ui/renderers/scorecardRenderer.js';

describe('scorecardRenderer', () => {
  describe('renderScorecard', () => {
    let mockElements;
    let mockMetrics;
    let context;

    beforeEach(() => {
      mockElements = {
        scoreGrade: {
          textContent: '',
          setAttribute: vi.fn(),
          removeAttribute: vi.fn()
        },
        scoreDelta: {
          textContent: '',
          classList: {
            remove: vi.fn(),
            add: vi.fn()
          },
          setAttribute: vi.fn(),
          removeAttribute: vi.fn()
        },
        scoreNote: {
          textContent: ''
        }
      };

      mockMetrics = {
        grade: 'B+',
        score: 75,
        scoreDelta: 2.5,
        scoreNote: 'Performance improving'
      };

      context = {
        elements: mockElements,
        metrics: mockMetrics,
        lastSignature: '',
        setSignature: vi.fn()
      };
    });

    it('should render grade correctly', () => {
      renderScorecard(context);

      expect(mockElements.scoreGrade.textContent).toBe('B+');
    });

    it('should set title attribute with score', () => {
      renderScorecard(context);

      expect(mockElements.scoreGrade.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('75')
      );
    });

    it('should handle missing grade', () => {
      context.metrics.grade = undefined;
      renderScorecard(context);

      expect(mockElements.scoreGrade.textContent).toBe('—');
    });

    it('should render positive delta', () => {
      context.metrics.scoreDelta = 3.2;
      renderScorecard(context);

      expect(mockElements.scoreDelta.classList.add).toHaveBeenCalledWith('positive');
      expect(mockElements.scoreDelta.textContent).toContain('▲');
      expect(mockElements.scoreDelta.textContent).toContain('3.2');
    });

    it('should render negative delta', () => {
      context.metrics.scoreDelta = -2.8;
      renderScorecard(context);

      expect(mockElements.scoreDelta.classList.add).toHaveBeenCalledWith('negative');
      expect(mockElements.scoreDelta.textContent).toContain('▼');
      expect(mockElements.scoreDelta.textContent).toContain('2.8');
    });

    it('should show dash for negligible delta', () => {
      context.metrics.scoreDelta = 0.02;
      renderScorecard(context);

      expect(mockElements.scoreDelta.textContent).toBe('—');
    });

    it('should remove previous delta classes', () => {
      renderScorecard(context);

      expect(mockElements.scoreDelta.classList.remove).toHaveBeenCalledWith('positive', 'negative');
    });

    it('should render score note', () => {
      renderScorecard(context);

      expect(mockElements.scoreNote.textContent).toBe('Performance improving');
    });

    it('should use default note when missing', () => {
      context.metrics.scoreNote = undefined;
      renderScorecard(context);

      expect(mockElements.scoreNote.textContent).toContain('stabilizing');
    });

    it('should return true when rendering succeeds', () => {
      const result = renderScorecard(context);
      expect(result).toBe(true);
    });

    it('should return false when scoreGrade element missing', () => {
      context.elements.scoreGrade = null;
      const result = renderScorecard(context);

      expect(result).toBe(false);
    });

    it('should handle undefined score', () => {
      context.metrics.score = undefined;
      renderScorecard(context);

      expect(mockElements.scoreGrade.removeAttribute).toHaveBeenCalledWith('title');
    });

    it('should handle zero delta', () => {
      context.metrics.scoreDelta = 0;
      renderScorecard(context);

      expect(mockElements.scoreDelta.textContent).toBe('—');
      expect(mockElements.scoreDelta.removeAttribute).toHaveBeenCalledWith('title');
    });

    it('should set title for positive delta', () => {
      context.metrics.scoreDelta = 5;
      renderScorecard(context);

      expect(mockElements.scoreDelta.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('upward')
      );
    });

    it('should set title for negative delta', () => {
      context.metrics.scoreDelta = -5;
      renderScorecard(context);

      expect(mockElements.scoreDelta.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('downward')
      );
    });

    it('should handle missing scoreDelta element', () => {
      context.elements.scoreDelta = null;

      expect(() => renderScorecard(context)).not.toThrow();
    });

    it('should handle missing scoreNote element', () => {
      context.elements.scoreNote = null;

      expect(() => renderScorecard(context)).not.toThrow();
    });
  });

  describe('drawScoreTrend', () => {
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
      mockCanvas = {
        width: 200,
        height: 100
      };

      mockCtx = {
        canvas: mockCanvas,
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        setLineDash: vi.fn()
      };
    });

    it('should clear canvas before drawing', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    });

    it('should draw background', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
    });

    it('should handle empty history', () => {
      drawScoreTrend(mockCtx, []);

      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('should handle null context gracefully', () => {
      expect(() => drawScoreTrend(null, [70, 75, 80])).not.toThrow();
    });

    it('should draw target line', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);

      expect(mockCtx.setLineDash).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw filled area', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);

      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw line chart', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);

      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should handle single data point', () => {
      const history = [75];

      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should handle large history', () => {
      const history = Array.from({ length: 100 }, (_, i) => 70 + i * 0.1);

      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
      expect(mockCtx.lineTo.mock.calls.length).toBeGreaterThan(50);
    });

    it('should scale values correctly', () => {
      const history = [50, 75, 100];
      drawScoreTrend(mockCtx, history);

      // Should have called moveTo and lineTo for each point
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle all same values', () => {
      const history = [75, 75, 75, 75];

      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should handle extreme value ranges', () => {
      const history = [0, 100];

      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should apply gutters to prevent clipping', () => {
      const history = [70, 75, 80];
      drawScoreTrend(mockCtx, history);

      // Check that drawing calls are within canvas bounds
      const calls = mockCtx.lineTo.mock.calls;
      calls.forEach(call => {
        const [x, y] = call;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(200);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle grade with special characters', () => {
      const context = {
        elements: {
          scoreGrade: { textContent: '', setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreDelta: { textContent: '', classList: { remove: vi.fn(), add: vi.fn() }, setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreNote: { textContent: '' }
        },
        metrics: { grade: 'A++', score: 95, scoreDelta: 0, scoreNote: 'Excellent' },
        lastSignature: '',
        setSignature: vi.fn()
      };

      renderScorecard(context);
      expect(context.elements.scoreGrade.textContent).toBe('A++');
    });

    it('should handle very small delta values', () => {
      const context = {
        elements: {
          scoreGrade: { textContent: '', setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreDelta: { textContent: '', classList: { remove: vi.fn(), add: vi.fn() }, setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreNote: { textContent: '' }
        },
        metrics: { grade: 'B', score: 70, scoreDelta: 0.001, scoreNote: 'Stable' },
        lastSignature: '',
        setSignature: vi.fn()
      };

      renderScorecard(context);
      expect(context.elements.scoreDelta.textContent).toBe('—');
    });

    it('should handle negative score values', () => {
      const mockCtx = {
        canvas: { width: 200, height: 100 },
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        setLineDash: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0
      };

      const history = [-10, 0, 10];
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });
  });
});