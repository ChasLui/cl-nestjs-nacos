import { Injectable, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
// 从我们的库中导入NacosService
import { NacosService } from 'cl-nestjs-nacos';
import { MockNacosService } from '../mocks/mock-nacos.service';

// 定义一个通用的配置服务接口
interface ConfigService {
  getConfig<T = unknown>(key?: string): Promise<T>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

@Injectable()
export class ConfigDemoService implements OnModuleInit {
  private configService: ConfigService;

  constructor(
    @Optional() private readonly nacosService?: NacosService,
    @Optional() private readonly mockNacosService?: MockNacosService,
  ) {
    // 根据可用的服务选择使用哪个
    this.configService = (this.nacosService || this.mockNacosService) as ConfigService;

    if (!this.configService) {
      throw new Error('没有可用的配置服务 (NacosService 或 MockNacosService)');
    }

    const serviceType = this.nacosService ? 'Real NacosService' : 'MockNacosService';
    console.log(`🎯 ConfigDemoService 使用: ${serviceType}`);
  }

  async onModuleInit() {
    console.log('🎯 ConfigDemoService 初始化完成');

    // 监听配置变更事件
    this.configService.on('ready', () => {
      console.log('✅ 配置服务已准备就绪');
    });

    // 监听配置变更事件（如果支持）
    if ('on' in this.configService) {
      this.configService.on('configChanged', (data) => {
        console.log('🔄 配置已更新:', data);
      });
    }
  }

  /**
   * 获取所有配置
   */
  async getAllConfig() {
    try {
      const config = await this.configService.getConfig();
      return {
        success: true,
        message: '获取配置成功',
        data: config,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '获取配置失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 根据key获取配置
   */
  async getConfigByKey(key: string) {
    try {
      const value = await this.configService.getConfig(key);

      if (value === undefined) {
        throw new NotFoundException(`配置项 '${key}' 不存在`);
      }

      return {
        success: true,
        message: `获取配置项 '${key}' 成功`,
        data: {
          key,
          value,
          type: typeof value,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        message: `获取配置项 '${key}' 失败`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfig() {
    try {
      // 这里可以触发配置重新加载的逻辑
      // 在实际实现中，可能需要调用nacos服务的reload方法
      const config = await this.configService.getConfig();

      return {
        success: true,
        message: '配置重新加载成功',
        data: {
          configKeys: Object.keys(config),
          reloadTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '配置重新加载失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 模拟配置变更
   */
  async simulateConfigChange(dataId: string, content: string) {
    try {
      // 如果是Mock服务，调用其模拟变更方法
      if (this.mockNacosService && 'simulateConfigChange' in this.mockNacosService) {
        this.mockNacosService.simulateConfigChange(dataId, content);
      }

      return {
        success: true,
        message: `模拟配置变更成功`,
        data: {
          dataId,
          content,
          changeTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '模拟配置变更失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取数据库配置示例
   */
  async getDatabaseConfig() {
    try {
      const database = await this.configService.getConfig('database');
      return {
        success: true,
        message: '获取数据库配置成功',
        data: database,
        usage: '可以在服务中使用这些配置来连接数据库',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '获取数据库配置失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取功能开关配置示例
   */
  async getFeaturesConfig() {
    try {
      const features = await this.configService.getConfig('features');
      return {
        success: true,
        message: '获取功能开关配置成功',
        data: features,
        usage: '可以根据这些开关来控制功能的启用/禁用',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '获取功能开关配置失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取消息配置示例
   */
  async getMessagesConfig() {
    try {
      const messages = await this.configService.getConfig('messages');
      return {
        success: true,
        message: '获取消息配置成功',
        data: messages,
        usage: '可以用于国际化或动态消息显示',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '获取消息配置失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
