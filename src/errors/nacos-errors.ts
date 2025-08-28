/**
 * Nacos相关错误类定义
 * 提供更好的错误处理和调试信息
 */

/**
 * Nacos基础错误类
 */
export abstract class NacosError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * 配置相关错误
 */
export class ConfigError extends NacosError {
  readonly code = 'CONFIG_ERROR';

  static configNotFound(key: string): ConfigError {
    return new ConfigError(`Configuration not found: ${key}`, { key });
  }

  static parseError(content: string, type?: string): ConfigError {
    return new ConfigError(`Failed to parse configuration${type ? ` as ${type}` : ''}`, {
      content: content.substring(0, 200),
      type,
    });
  }

  static loadError(dataId: string, group: string, error: Error): ConfigError {
    return new ConfigError(`Failed to load configuration: ${dataId}@${group}`, {
      dataId,
      group,
      originalError: error.message,
    });
  }
}

/**
 * 服务注册相关错误
 */
export class ServiceError extends NacosError {
  readonly code = 'SERVICE_ERROR';

  static registrationFailed(serviceName: string, error: Error): ServiceError {
    return new ServiceError(`Failed to register service: ${serviceName}`, {
      serviceName,
      originalError: error.message,
    });
  }

  static deregistrationFailed(serviceName: string, error: Error): ServiceError {
    return new ServiceError(`Failed to deregister service: ${serviceName}`, {
      serviceName,
      originalError: error.message,
    });
  }

  static ipResolutionFailed(): ServiceError {
    return new ServiceError('Unable to determine local IP address for service registration');
  }
}

/**
 * 连接相关错误
 */
export class ConnectionError extends NacosError {
  readonly code = 'CONNECTION_ERROR';

  static clientInitializationFailed(error: Error): ConnectionError {
    return new ConnectionError('Failed to initialize Nacos client', {
      originalError: error.message,
    });
  }

  static serverUnreachable(server: string): ConnectionError {
    return new ConnectionError(`Nacos server is unreachable: ${server}`, { server });
  }
}

/**
 * 验证相关错误
 */
export class ValidationError extends NacosError {
  readonly code = 'VALIDATION_ERROR';

  static requiredOptionMissing(option: string): ValidationError {
    return new ValidationError(`Required option is missing: ${option}`, { option });
  }

  static invalidOptionValue(option: string, value: unknown, expected?: string): ValidationError {
    return new ValidationError(
      `Invalid value for option ${option}: ${value}${expected ? `, expected: ${expected}` : ''}`,
      { option, value, expected },
    );
  }
}
