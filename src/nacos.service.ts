import { NacosNamingClient, Instance } from 'nacos';
import { Injectable, Inject } from '@nestjs/common';
import { networkInterfaces } from 'os';
import { AbstractNacosClient } from './base/abstract-nacos-client';
import { NacosOptions, ServiceInfo } from './types';
import { NACOS_OPTIONS } from './constants';
import { ServiceError } from './errors';

// 使用类型体操中的ServiceInfo，但保持与nacos库的Instance类型兼容
type IService = ServiceInfo<Instance>;

/**
 * Nacos完整服务
 * 包含配置管理和服务注册功能
 */
@Injectable()
export class NacosService extends AbstractNacosClient {
  private service?: IService;
  private namingClient: NacosNamingClient | undefined;

  constructor(@Inject(NACOS_OPTIONS) options: NacosOptions) {
    super(options, 'nacos');

    // 仅在非仅配置模式下初始化服务信息
    if (!this.options.configOnly) {
      this.service = { name: 'nest-service' };
    }
  }

  /**
   * 获取命名客户端
   */
  private async getNamingClient(): Promise<NacosNamingClient> {
    if (this.namingClient) {
      return this.namingClient;
    }

    const options = {
      serverList: this.options.server,
      namespace: this.options.namespace,
      logger: console,
    };

    // 处理HTTP格式的服务器地址
    if (/^http/.test(options.serverList)) {
      const url = new globalThis.URL(this.options.server);
      options.serverList = url.host;
    }

    this.namingClient = new NacosNamingClient(options);
    await this.namingClient.ready();
    this.debug('Naming client ready');

    return this.namingClient;
  }

  /**
   * 模块销毁时注销服务实例
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (!this.options.configOnly && this.service?.instance) {
        await this.namingClient?.deregisterInstance(this.service.name, this.service.instance);
        this.debug('Service instance deregistered');
      }
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      this.debug(`Failed to deregister service instance: ${originalError.message}`);
      // 在销毁过程中，我们记录错误但不抛出，避免阻止应用关闭
    }

    await super.onModuleDestroy();
  }

  /**
   * 注册服务实例
   * @param name 应用名称
   * @param enable 是否注册，开发环境默认不注册
   */
  async register(name: string, enable = process.env.NODE_ENV !== 'development'): Promise<boolean> {
    // 如果是仅配置模式，不允许注册服务
    if (this.options.configOnly) {
      this.debug('Config-only mode enabled, service registration is disabled');
      return false;
    }

    if (!enable) {
      this.debug('Service registration is disabled');
      return false;
    }

    try {
      const ip = this.getLocalIP();
      const port = await this.getConfig<number>('port');

      const client = await this.getNamingClient();
      const instance: Instance = {
        ip,
        enabled: true,
        healthy: true,
        instanceId: name,
        port,
      };

      await client.registerInstance(name, instance);

      // 更新服务信息
      if (!this.service) {
        this.service = { name };
      }
      this.service.name = name;
      this.service.instance = instance;

      this.debug(`Service registered: ${name} at ${ip}:${port}`);
      return true;
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      this.debug(`Failed to register service: ${originalError.message}`);
      throw ServiceError.registrationFailed(name, originalError);
    }
  }

  /**
   * 获取本地IP地址
   */
  private getLocalIP(): string {
    const networks = networkInterfaces();
    const addresses = Object.values(networks)
      .flat()
      .filter((x) => x?.family === 'IPv4' && !x.internal)
      .map((x) => x?.address)
      .filter(Boolean);

    const ip = addresses[0];
    if (!ip) {
      throw ServiceError.ipResolutionFailed();
    }

    return ip;
  }
}
