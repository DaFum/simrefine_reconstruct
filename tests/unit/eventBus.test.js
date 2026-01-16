import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../src/eventBus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('constructor', () => {
    it('should initialize with empty listeners map', () => {
      expect(eventBus.listeners).toBeInstanceOf(Map);
      expect(eventBus.listeners.size).toBe(0);
    });
  });

  describe('on', () => {
    it('should register a new event listener', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);

      expect(eventBus.listeners.has('TEST_EVENT')).toBe(true);
      expect(eventBus.listeners.get('TEST_EVENT').has(callback)).toBe(true);
    });

    it('should handle multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('TEST_EVENT', callback1);
      eventBus.on('TEST_EVENT', callback2);

      const listeners = eventBus.listeners.get('TEST_EVENT');
      expect(listeners.size).toBe(2);
      expect(listeners.has(callback1)).toBe(true);
      expect(listeners.has(callback2)).toBe(true);
    });

    it('should not add duplicate listeners', () => {
      const callback = vi.fn();

      eventBus.on('TEST_EVENT', callback);
      eventBus.on('TEST_EVENT', callback);

      const listeners = eventBus.listeners.get('TEST_EVENT');
      expect(listeners.size).toBe(1);
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('TEST_EVENT', callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(eventBus.listeners.get('TEST_EVENT').has(callback)).toBe(false);
    });

    it('should handle listeners for different events', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('EVENT_A', callback1);
      eventBus.on('EVENT_B', callback2);

      expect(eventBus.listeners.size).toBe(2);
      expect(eventBus.listeners.has('EVENT_A')).toBe(true);
      expect(eventBus.listeners.has('EVENT_B')).toBe(true);
    });
  });

  describe('off', () => {
    it('should remove a registered listener', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      eventBus.off('TEST_EVENT', callback);

      expect(eventBus.listeners.get('TEST_EVENT').has(callback)).toBe(false);
    });

    it('should handle removing non-existent event gracefully', () => {
      const callback = vi.fn();
      expect(() => eventBus.off('NON_EXISTENT', callback)).not.toThrow();
    });

    it('should handle removing non-existent callback gracefully', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('TEST_EVENT', callback1);
      expect(() => eventBus.off('TEST_EVENT', callback2)).not.toThrow();
    });

    it('should not affect other listeners when removing one', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('TEST_EVENT', callback1);
      eventBus.on('TEST_EVENT', callback2);
      eventBus.off('TEST_EVENT', callback1);

      const listeners = eventBus.listeners.get('TEST_EVENT');
      expect(listeners.has(callback1)).toBe(false);
      expect(listeners.has(callback2)).toBe(true);
    });
  });

  describe('emit', () => {
    it('should call registered listeners with provided data', () => {
      const callback = vi.fn();
      const data = { value: 42 };

      eventBus.on('TEST_EVENT', callback);
      eventBus.emit('TEST_EVENT', data);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(data);
    });

    it('should call all registered listeners for an event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      const data = { value: 'test' };

      eventBus.on('TEST_EVENT', callback1);
      eventBus.on('TEST_EVENT', callback2);
      eventBus.on('TEST_EVENT', callback3);
      eventBus.emit('TEST_EVENT', data);

      expect(callback1).toHaveBeenCalledWith(data);
      expect(callback2).toHaveBeenCalledWith(data);
      expect(callback3).toHaveBeenCalledWith(data);
    });

    it('should handle emit for non-existent event gracefully', () => {
      expect(() => eventBus.emit('NON_EXISTENT', {})).not.toThrow();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const successCallback = vi.fn();

      eventBus.on('TEST_EVENT', errorCallback);
      eventBus.on('TEST_EVENT', successCallback);

      expect(() => eventBus.emit('TEST_EVENT', {})).not.toThrow();
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });

    it('should log errors from failing listeners', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener failed');
      });

      eventBus.on('TEST_EVENT', errorCallback);
      eventBus.emit('TEST_EVENT', {});

      expect(console.error).toHaveBeenCalled();
    });

    it('should work with undefined data', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      eventBus.emit('TEST_EVENT');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should work with null data', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      eventBus.emit('TEST_EVENT', null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should preserve listener order', () => {
      const order = [];
      const callback1 = vi.fn(() => order.push(1));
      const callback2 = vi.fn(() => order.push(2));
      const callback3 = vi.fn(() => order.push(3));

      eventBus.on('TEST_EVENT', callback1);
      eventBus.on('TEST_EVENT', callback2);
      eventBus.on('TEST_EVENT', callback3);
      eventBus.emit('TEST_EVENT', {});

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('integration scenarios', () => {
    it('should support complex event flow', () => {
      const results = [];
      
      eventBus.on('INIT', () => {
        results.push('init');
        eventBus.emit('READY', { status: 'ready' });
      });

      eventBus.on('READY', (data) => {
        results.push(data.status);
        eventBus.emit('COMPLETE', { final: true });
      });

      eventBus.on('COMPLETE', (data) => {
        results.push(data.final);
      });

      eventBus.emit('INIT');

      expect(results).toEqual(['init', 'ready', true]);
    });

    it('should handle rapid successive emits', () => {
      const callback = vi.fn();
      eventBus.on('RAPID_EVENT', callback);

      for (let i = 0; i < 100; i++) {
        eventBus.emit('RAPID_EVENT', { count: i });
      }

      expect(callback).toHaveBeenCalledTimes(100);
    });

    it('should support dynamic subscription/unsubscription', () => {
      const callback = vi.fn();
      
      const unsub = eventBus.on('DYNAMIC', callback);
      eventBus.emit('DYNAMIC', { msg: 'first' });
      
      unsub();
      eventBus.emit('DYNAMIC', { msg: 'second' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ msg: 'first' });
    });
  });
});