import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';

/**
 * Mock的NacosService
 * 模拟真实NacosService的API，提供相同的接口
 */
@Injectable()
export class MockNacosService extends EventEmitter implements OnModuleInit {
  private config: Record<string, unknown> = {};
  private isReady = false;

  // Mock配置数据
  private readonly mockConfigs = {
    server: {
      port: 3000,
      name: 'NestJS Nacos Demo',
    },
    database: {
      host: 'localhost',
      port: 5432,
      username: 'demo_user',
      password: 'demo_password',
      database: 'demo_db',
    },
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'redis_password',
    },
    features: {
      enableCache: true,
      enableLogging: true,
      maxRetries: 3,
    },
    messages: {
      welcome: '欢迎使用 cl-nestjs-nacos 示例应用！',
      description: '这是一个演示如何使用 Nacos 配置中心的示例',
    },
    // 从properties文件解析的配置
    'app.name': 'NestJS Nacos Demo',
    'app.version': '1.0.0',
    'app.environment': 'development',
    'logging.level': 'info',
    'logging.file': '/var/log/app.log',
    'cache.ttl': 300,
    'cache.maxSize': 1000,
    // 从JSON文件解析的配置
    serviceName: 'demo-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      info: '/info',
    },
    timeout: {
      connect: 5000,
      read: 10000,
    },
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
    },
  };

  async onModuleInit() {
    console.log('🎭 MockNacosService 正在初始化...');

    // 模拟异步配置加载
    setTimeout(() => {
      this.config = { ...this.mockConfigs };
      this.isReady = true;
      this.emit('ready');
      console.log('✅ Mock Nacos 配置加载完成');
    }, 500);
  }

  /**
   * 获取配置
   * 模拟真实NacosService的getConfig方法
   */
  async getConfig<T = unknown>(key?: string): Promise<T> {
    if (!this.isReady) {
      return new Promise((resolve) => {
        this.once('ready', () => {
          resolve(this.getConfigData<T>(key));
        });
      });
    }

    return this.getConfigData<T>(key);
  }

  private getConfigData<T>(key?: string): T {
    if (key) {
      const value = this.config[key];
      if (value === undefined) {
        throw new Error(`配置项 '${key}' 不存在`);
      }
      return value as T;
    }
    return this.config as T;
  }

  /**
   * 模拟配置变更
   */
  simulateConfigChange(key: string, value: unknown) {
    console.log(`🔄 模拟配置变更: ${key} = ${JSON.stringify(value)}`);
    this.config[key] = value;
    this.emit('configChanged', { key, value, config: this.config });
  }

  /**
   * 获取所有配置键
   */
  getConfigKeys(): string[] {
    return Object.keys(this.config);
  }

  /**
   * 检查配置是否就绪
   */
  isConfigReady(): boolean {
    return this.isReady;
  }
}
