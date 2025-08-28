import { NacosConfigClient } from 'nacos';
import { Inject, OnModuleDestroy } from '@nestjs/common';
import { load } from 'js-yaml';
import { EventEmitter } from 'events';
import { ClientCredentials as ClientOptions, NacosOptions } from '../types';
import Debug from 'debug';
import { NACOS_OPTIONS, ConfigType } from '../constants';
import { Util } from '../util';
import { ConfigParserFactory } from '../config-parser';
import { ValidationError, ConfigError } from '../errors';
import { ConfigCache } from '../cache';

// 导入类型定义
import type { ConfigValue, ConfigObject } from '../types';

/**
 * Nacos客户端抽象基类
 * 提供配置管理的通用功能，消除代码重复
 */
export abstract class AbstractNacosClient extends EventEmitter implements OnModuleDestroy {
  protected config: ConfigObject = {};
  protected isReady = false;
  protected readonly debug: Debug.Debugger;
  protected readonly configClient: NacosConfigClient;
  protected readonly configCache: ConfigCache;

  constructor(
    @Inject(NACOS_OPTIONS) protected readonly options: NacosOptions,
    debugNamespace: string,
  ) {
    super();

    this.debug = Debug(debugNamespace);
    this.validateOptions();
    this.setMaxListeners(0);

    const clientOptions = this.createClientOptions();
    this.configClient = new NacosConfigClient(clientOptions);

    // 初始化配置缓存
    this.configCache = new ConfigCache({
      defaultTTL: 5 * 60 * 1000, // 5分钟默认TTL
      maxSize: 100, // 最多缓存100个配置项
      cleanupInterval: 2 * 60 * 1000, // 2分钟清理一次
    });

    this.initializeConfig();
  }

  /**
   * 验证必需的选项
   */
  private validateOptions(): void {
    if (!this.options.server) {
      throw ValidationError.requiredOptionMissing('server');
    }
    if (!this.options.namespace) {
      throw ValidationError.requiredOptionMissing('namespace');
    }
    if (!this.options.accessKey) {
      throw ValidationError.requiredOptionMissing('accessKey');
    }
    if (!this.options.secretKey) {
      throw ValidationError.requiredOptionMissing('secretKey');
    }
  }

  /**
   * 创建客户端选项
   */
  private createClientOptions(): ClientOptions {
    const options: ClientOptions = {
      serverAddr: this.options.server,
      namespace: this.options.namespace,
      accessKey: this.options.accessKey,
      secretKey: this.options.secretKey,
    };

    // 默认启用环境变量填充
    if (!Object.hasOwn(this.options, 'enableEnvVars')) {
      (this.options as { enableEnvVars?: boolean }).enableEnvVars = true;
    }

    // 处理HTTP格式的服务器地址
    if (/^http/.test(this.options.server)) {
      const url = new globalThis.URL(this.options.server);
      options.serverAddr = url.host;
    }

    return options;
  }

  /**
   * 初始化配置
   */
  private initializeConfig(): void {
    if (this.options.config) {
      this.loadAllConfig().catch((err: Error) => this.debug('Failed to load config:', err.message, err.stack));
    }
  }

  /**
   * 获取配置
   */
  async getConfig<T extends ConfigValue = ConfigObject>(key?: string): Promise<T> {
    if (this.isReady) {
      return this.getConfigData<T>(key);
    }

    return new Promise((resolve, reject) => {
      this.once('ready', () => {
        try {
          const conf = this.getConfigData<T>(key);
          resolve(conf);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * 获取配置数据
   */
  private getConfigData<T extends ConfigValue>(key?: string): T {
    const cacheKey = key || '__root__';

    // 首先尝试从缓存获取
    const cached = this.configCache.get(cacheKey);
    if (cached !== undefined) {
      return cached as T;
    }

    let result: T;
    if (key) {
      if (Object.hasOwn(this.config, key)) {
        result = this.config[key] as T;
      } else {
        throw ConfigError.configNotFound(key);
      }
    } else {
      result = this.config as T;
    }

    // 缓存结果
    this.configCache.set(cacheKey, result);
    return result;
  }

  /**
   * 加载所有配置
   */
  protected async loadAllConfig(): Promise<void> {
    if (!this.options.config) {
      throw ValidationError.requiredOptionMissing('config');
    }

    const { dataId, group, type, commons = [] } = this.options.config;

    // 加载主配置
    await this.loadConfig(dataId, group, type);

    // 加载公共配置
    for (const commonConfig of commons) {
      await this.loadConfig(commonConfig.dataId, commonConfig.group, commonConfig.type as ConfigType);
    }

    // 订阅配置变更
    if (this.options.config.subscribe) {
      this.configClient.subscribe({ dataId, group }, async (content: string) => {
        await this.setConfig(content, dataId, type);
      });
    }

    this.isReady = true;
    this.emit('ready');
  }

  /**
   * 加载单个配置
   */
  protected async loadConfig(dataId: string, group = 'DEFAULT_GROUP', type?: ConfigType): Promise<void> {
    try {
      const content = await this.configClient.getConfig(dataId, group);
      if (!content) {
        throw ConfigError.loadError(dataId, group, new Error('Config content is empty'));
      }
      await this.setConfig(content, dataId, type);
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      const originalError = error instanceof Error ? error : new Error(String(error));
      this.debug(`Failed to load config for dataId: ${dataId}, group: ${group}. Error: ${originalError.message}`);
      throw ConfigError.loadError(dataId, group, originalError);
    }
  }

  /**
   * 设置配置
   */
  protected async setConfig(content: string, dataId?: string, type?: ConfigType): Promise<void> {
    let config: unknown;

    try {
      if (type) {
        // 使用指定的配置类型解析
        config = await ConfigParserFactory.parseConfig(content, type);
        this.debug(`Parsed config using specified type: ${type}`);
      } else {
        // 自动检测配置类型并解析
        config = await ConfigParserFactory.autoParseConfig(content, dataId);
        this.debug(`Auto-detected and parsed config (dataId: ${dataId})`);
      }
    } catch (error) {
      // 如果解析失败，回退到YAML解析（保持向后兼容）
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.debug(`Config parsing failed, falling back to YAML: ${errorMessage}`);

      try {
        config = load(content) as ConfigObject;
      } catch (yamlError) {
        // 如果YAML也解析失败，返回原始文本内容
        const yamlErrorMessage = yamlError instanceof Error ? yamlError.message : String(yamlError);
        this.debug(`YAML parsing also failed, returning raw content: ${yamlErrorMessage}`);
        config = { content };
      }
    }

    // 处理环境变量替换
    if (this.options.enableEnvVars && typeof config === 'object' && config !== null) {
      config = Util.replacePlaceholdersWithEnvVars(config as ConfigObject);
    }

    // 合并配置
    this.config = Object.assign(this.config || {}, config);

    // 清除相关缓存
    this.configCache.clear();

    this.debug(`Config loaded: ${JSON.stringify(config, null, 2)}`);
  }

  /**
   * 模块销毁时的清理工作
   */
  async onModuleDestroy(): Promise<void> {
    // 清理缓存
    this.configCache.destroy();

    // 子类可以重写此方法来添加额外的清理逻辑
    this.debug('Module destroying');
  }
}
