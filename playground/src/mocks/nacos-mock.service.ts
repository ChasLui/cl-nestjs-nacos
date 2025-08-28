import { Injectable } from '@nestjs/common';

/**
 * Mock Nacos配置数据
 */
const MOCK_CONFIGS = {
  'app.yaml': `
server:
  port: 3000
  name: "NestJS Nacos Demo"

database:
  host: "localhost"
  port: 5432
  username: "demo_user"
  password: "demo_password"
  database: "demo_db"

redis:
  host: "localhost"
  port: 6379
  password: "redis_password"

features:
  enableCache: true
  enableLogging: true
  maxRetries: 3

messages:
  welcome: "欢迎使用 cl-nestjs-nacos 示例应用！"
  description: "这是一个演示如何使用 Nacos 配置中心的示例"
`,

  'common.properties': `
# 公共配置
app.name=NestJS Nacos Demo
app.version=1.0.0
app.environment=development

# 日志配置
logging.level=info
logging.file=/var/log/app.log

# 缓存配置
cache.ttl=300
cache.maxSize=1000
`,

  'microservice.json': `{
  "serviceName": "demo-service",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "metrics": "/metrics",
    "info": "/info"
  },
  "timeout": {
    "connect": 5000,
    "read": 10000
  },
  "retry": {
    "maxAttempts": 3,
    "backoff": "exponential"
  }
}`,
};

/**
 * Mock的Nacos配置客户端
 * 模拟真实的nacos客户端行为
 */
@Injectable()
export class MockNacosConfigClient {
  private subscribers = new Map<string, ((content: string) => void)[]>();

  /**
   * 获取配置
   */
  async getConfig(dataId: string, group = 'DEFAULT_GROUP'): Promise<string> {
    console.log(`[Mock Nacos] Getting config: dataId=${dataId}, group=${group}`);

    // 模拟网络延迟
    await this.delay(100);

    const config = MOCK_CONFIGS[dataId as keyof typeof MOCK_CONFIGS];
    if (!config) {
      throw new Error(`Config not found: ${dataId}`);
    }

    return config;
  }

  /**
   * 发布配置
   */
  async publishConfig(dataId: string, group = 'DEFAULT_GROUP', content: string): Promise<boolean> {
    console.log(`[Mock Nacos] Publishing config: dataId=${dataId}, group=${group}`);

    // 模拟网络延迟
    await this.delay(200);

    // 更新mock配置
    (MOCK_CONFIGS as Record<string, string>)[dataId] = content;

    // 通知订阅者
    this.notifySubscribers(dataId, group, content);

    return true;
  }

  /**
   * 订阅配置变更
   */
  subscribe(params: { dataId: string; group?: string }, callback: (content: string) => void): void {
    const { dataId, group = 'DEFAULT_GROUP' } = params;
    const key = `${dataId}@${group}`;

    console.log(`[Mock Nacos] Subscribing to config changes: ${key}`);

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    this.subscribers.get(key)!.push(callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(params: { dataId: string; group?: string }): void {
    const { dataId, group = 'DEFAULT_GROUP' } = params;
    const key = `${dataId}@${group}`;

    console.log(`[Mock Nacos] Unsubscribing from config changes: ${key}`);
    this.subscribers.delete(key);
  }

  /**
   * 模拟配置变更通知
   */
  simulateConfigChange(dataId: string, group = 'DEFAULT_GROUP', newContent: string): void {
    console.log(`[Mock Nacos] Simulating config change: dataId=${dataId}, group=${group}`);

    // 更新配置
    (MOCK_CONFIGS as Record<string, string>)[dataId] = newContent;

    // 通知订阅者
    this.notifySubscribers(dataId, group, newContent);
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(dataId: string, group: string, content: string): void {
    const key = `${dataId}@${group}`;
    const callbacks = this.subscribers.get(key);

    if (callbacks) {
      console.log(`[Mock Nacos] Notifying ${callbacks.length} subscribers for ${key}`);
      callbacks.forEach((callback) => {
        try {
          callback(content);
        } catch (error) {
          console.error(`[Mock Nacos] Error notifying subscriber:`, error);
        }
      });
    }
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取所有可用的配置列表
   */
  getAvailableConfigs(): string[] {
    return Object.keys(MOCK_CONFIGS);
  }
}
