import type { ConfigValue } from '../types';

/**
 * 配置缓存项
 */
interface ConfigCacheItem {
  value: ConfigValue;
  timestamp: number;
  ttl?: number; // 生存时间（毫秒）
}

/**
 * 配置缓存选项
 */
export interface ConfigCacheOptions {
  /** 默认TTL（毫秒），0表示永不过期 */
  defaultTTL?: number;
  /** 最大缓存条目数 */
  maxSize?: number;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
}

/**
 * 配置缓存管理器
 * 提供内存缓存以提高配置访问性能
 */
export class ConfigCache {
  private cache = new Map<string, ConfigCacheItem>();
  private cleanupTimer?: number;

  constructor(private readonly options: ConfigCacheOptions = {}) {
    const {
      cleanupInterval = 5 * 60 * 1000, // 默认5分钟清理一次
    } = options;

    // 启动定期清理
    if (cleanupInterval > 0) {
      this.cleanupTimer = globalThis.setInterval(() => {
        this.cleanup();
      }, cleanupInterval) as unknown as number;
    }
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: ConfigValue, ttl?: number): void {
    const { maxSize = 1000, defaultTTL = 0 } = this.options;

    // 如果超过最大大小，移除最旧的条目
    if (this.cache.size >= maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const item: ConfigCacheItem = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? defaultTTL,
    };

    this.cache.set(key, item);
  }

  /**
   * 获取缓存值
   */
  get(key: string): ConfigValue | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * 检查是否存在缓存
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: ConfigCacheItem): boolean {
    if (!item.ttl || item.ttl === 0) {
      return false; // 永不过期
    }

    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * 销毁缓存，清理定时器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      globalThis.clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}
