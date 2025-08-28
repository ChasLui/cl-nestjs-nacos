import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigCache } from '../src/cache/config-cache';

describe('ConfigCache', () => {
  let cache: ConfigCache;

  beforeEach(() => {
    cache = new ConfigCache({
      defaultTTL: 1000, // 1 second
      maxSize: 5,
      cleanupInterval: 500, // 0.5 second
    });
  });

  afterEach(() => {
    cache.clear();
    cache.destroy();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const stats = cache.stats();
      expect(stats.size).toBe(2);

      cache.clear();
      const statsAfterClear = cache.stats();
      expect(statsAfterClear.size).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should return correct size', () => {
      let stats = cache.stats();
      expect(stats.size).toBe(0);

      cache.set('key1', 'value1');
      stats = cache.stats();
      expect(stats.size).toBe(1);

      cache.set('key2', 'value2');
      stats = cache.stats();
      expect(stats.size).toBe(2);

      cache.delete('key1');
      stats = cache.stats();
      expect(stats.size).toBe(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect custom TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1'); // Uses default 1000ms TTL
      expect(cache.get('key1')).toBe('value1');

      // Should still be there after 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(cache.get('key1')).toBe('value1');

      // Should expire after 1200ms
      await new Promise((resolve) => setTimeout(resolve, 800));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle zero TTL (no expiration)', async () => {
      cache.set('key1', 'value1', 0);
      expect(cache.get('key1')).toBe('value1');

      // Should still be there (no expiration)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('LRU (Least Recently Used)', () => {
    it('should evict least recently used items when maxSize is exceeded', () => {
      // Fill cache to maxSize (5)
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      let stats = cache.stats();
      expect(stats.size).toBe(5);

      // Add one more item, should evict key1 (least recently used)
      cache.set('key6', 'value6');
      stats = cache.stats();
      expect(stats.size).toBe(5);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });

    it('should handle cache eviction correctly', () => {
      // Fill cache beyond maxSize
      for (let i = 1; i <= 7; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      const stats = cache.stats();
      expect(stats.size).toBe(5); // Should not exceed maxSize

      // The last items should still be there
      expect(cache.has('key7')).toBe(true);
      expect(cache.has('key6')).toBe(true);
      expect(cache.has('key5')).toBe(true);
    });

    it('should update existing items without changing size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      let stats = cache.stats();
      expect(stats.size).toBe(2);

      // Update existing key
      cache.set('key1', 'new-value1');
      stats = cache.stats();
      expect(stats.size).toBe(2); // Size should remain the same
      expect(cache.get('key1')).toBe('new-value1');
    });
  });

  describe('automatic cleanup', () => {
    it('should automatically clean up expired entries', async () => {
      const shortTTLCache = new ConfigCache({
        defaultTTL: 200, // 200ms
        cleanupInterval: 100, // 100ms cleanup interval
      });

      shortTTLCache.set('key1', 'value1');
      shortTTLCache.set('key2', 'value2');
      let stats = shortTTLCache.stats();
      expect(stats.size).toBe(2);

      // Wait for entries to expire and cleanup to run
      await new Promise((resolve) => setTimeout(resolve, 350));

      stats = shortTTLCache.stats();
      expect(stats.size).toBe(0);
      shortTTLCache.destroy();
    });

    it('should not clean up non-expired entries', async () => {
      cache.set('key1', 'value1', 2000); // Long TTL
      cache.set('key2', 'value2', 100); // Short TTL

      // Wait for cleanup to run (should only remove key2)
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle setting same key multiple times', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      cache.set('key1', 'value3');

      expect(cache.get('key1')).toBe('value3');
      const stats = cache.stats();
      expect(stats.size).toBe(1);
    });

    it('should handle deleting non-existent keys', () => {
      expect(() => cache.delete('non-existent')).not.toThrow();
      const stats = cache.stats();
      expect(stats.size).toBe(0);
    });

    it('should handle getting expired entries', async () => {
      cache.set('key1', 'value1', 50); // Very short TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle cache with maxSize of 1', () => {
      const smallCache = new ConfigCache({ maxSize: 1 });

      smallCache.set('key1', 'value1');
      let stats = smallCache.stats();
      expect(stats.size).toBe(1);

      smallCache.set('key2', 'value2');
      stats = smallCache.stats();
      expect(stats.size).toBe(1);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);

      smallCache.destroy();
    });

    it('should handle default options', () => {
      const defaultCache = new ConfigCache();

      defaultCache.set('key1', 'value1');
      expect(defaultCache.has('key1')).toBe(true);
      expect(defaultCache.get('key1')).toBe('value1');

      defaultCache.destroy();
    });
  });

  describe('statistics and introspection', () => {
    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // Access key1
      cache.get('key3'); // Try to access non-existent key

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).not.toContain('key3');
    });

    it('should provide all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const stats = cache.stats();
      expect(stats.keys).toHaveLength(3);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toContain('key3');
    });

    it('should handle empty cache stats', () => {
      const stats = cache.stats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });

  describe('memory management', () => {
    it('should clean up resources on destroy', () => {
      const testCache = new ConfigCache({
        defaultTTL: 1000,
        cleanupInterval: 100,
      });

      testCache.set('key1', 'value1');
      let stats = testCache.stats();
      expect(stats.size).toBe(1);

      testCache.destroy();
      stats = testCache.stats();
      expect(stats.size).toBe(0);
    });

    it('should handle destroy multiple times', () => {
      const testCache = new ConfigCache();

      expect(() => {
        testCache.destroy();
        testCache.destroy();
        testCache.destroy();
      }).not.toThrow();
    });
  });

  describe('edge cases and coverage improvements', () => {
    it('should handle has() method with expired items', () => {
      const cache = new ConfigCache({ defaultTTL: 1 }); // 1ms TTL

      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);

      // Wait for expiration and check again
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.has('key')).toBe(false);
          cache.destroy();
          resolve(undefined);
        }, 10);
      });
    });

    it('should handle has() method with non-existent keys', () => {
      const cache = new ConfigCache({ defaultTTL: 1000 });

      expect(cache.has('non-existent')).toBe(false);
      cache.destroy();
    });

    it('should handle get() method returning undefined for expired items', () => {
      const cache = new ConfigCache({ defaultTTL: 1 }); // 1ms TTL

      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.get('key')).toBeUndefined();
          cache.destroy();
          resolve(undefined);
        }, 10);
      });
    });

    it('should handle multiple operations on same key', () => {
      const cache = new ConfigCache({ defaultTTL: 1000, maxSize: 2 });

      // Set initial value
      cache.set('key', 'value1');
      expect(cache.get('key')).toBe('value1');

      // Update value
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');

      // Delete and check
      expect(cache.delete('key')).toBe(true);
      expect(cache.get('key')).toBeUndefined();
      expect(cache.has('key')).toBe(false);

      cache.destroy();
    });

    it('should handle stats with various operations', () => {
      const cache = new ConfigCache({ defaultTTL: 1000, maxSize: 3 });

      // Initial stats
      let stats = cache.stats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);

      // Add items and check stats
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');

      // Test operations
      cache.get('key1'); // This should work
      cache.get('non-existent'); // This should return undefined

      // Stats should still show correct size
      stats = cache.stats();
      expect(stats.size).toBe(2);

      cache.destroy();
    });
  });
});
