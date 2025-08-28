import { describe, it, expect } from 'vitest';
import { NacosError, ConfigError, ServiceError, ValidationError, ConnectionError } from '../src/errors/nacos-errors';

describe('NacosErrors', () => {
  describe('NacosError (base class)', () => {
    it('should create error with message', () => {
      const context = { dataId: 'test.yaml' };
      const error = new ConfigError('Test error', context);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NacosError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigError');
    });

    it('should include context in error', () => {
      const context = { dataId: 'test.yaml', group: 'DEFAULT_GROUP' };
      const error = new ConfigError('Test error', context);
      expect(error.context).toEqual(context);
    });

    it('should be JSON serializable', () => {
      const context = { dataId: 'test.yaml' };
      const error = new ConfigError('Test error', context);

      const json = JSON.parse(JSON.stringify(error));
      expect(json.name).toBe('ConfigError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('CONFIG_ERROR');
      expect(json.context).toEqual(context);
    });
  });

  describe('ConfigError', () => {
    it('should create configNotFound error', () => {
      const error = ConfigError.configNotFound('database.host');
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('database.host');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.context).toEqual({ key: 'database.host' });
    });

    it('should create parseError', () => {
      const content = '{ invalid json }';
      const error = ConfigError.parseError(content, 'json');
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('Failed to parse configuration');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.context).toEqual({
        content: content.substring(0, 200), // Content is truncated
        type: 'json',
      });
    });

    it('should create parseError without type', () => {
      const content = '{ invalid }';
      const error = ConfigError.parseError(content);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.context).toEqual({
        content,
        type: undefined,
      });
    });

    it('should create loadError', () => {
      const originalError = new Error('Network error');
      const error = ConfigError.loadError('app.yaml', 'DEFAULT_GROUP', originalError);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('Failed to load configuration');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.context).toEqual({
        dataId: 'app.yaml',
        group: 'DEFAULT_GROUP',
        originalError: originalError.message,
      });
    });
  });

  describe('ServiceError', () => {
    it('should create registrationFailed error', () => {
      const originalError = new Error('Connection refused');
      const error = ServiceError.registrationFailed('my-service', originalError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.message).toContain('Failed to register service');
      expect(error.message).toContain('my-service');
      expect(error.code).toBe('SERVICE_ERROR');
      expect(error.context).toEqual({
        serviceName: 'my-service',
        originalError: originalError.message,
      });
    });

    it('should create deregistrationFailed error', () => {
      const originalError = new Error('Timeout');
      const error = ServiceError.deregistrationFailed('my-service', originalError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.message).toContain('Failed to deregister service');
      expect(error.message).toContain('my-service');
      expect(error.code).toBe('SERVICE_ERROR');
      expect(error.context).toEqual({
        serviceName: 'my-service',
        originalError: originalError.message,
      });
    });

    it('should create ipResolutionFailed error', () => {
      const error = ServiceError.ipResolutionFailed();
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.message).toContain('Unable to determine local IP address');
      expect(error.code).toBe('SERVICE_ERROR');
      expect(error.context).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create requiredOptionMissing error', () => {
      const error = ValidationError.requiredOptionMissing('server');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Required option is missing');
      expect(error.message).toContain('server');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({ option: 'server' });
    });

    it('should create invalidOptionValue error', () => {
      const error = ValidationError.invalidOptionValue('port', 'invalid', 'number');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('Invalid value for option');
      expect(error.message).toContain('port');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({
        option: 'port',
        value: 'invalid',
        expected: 'number',
      });
    });

    it('should create invalidOptionValue error without expected type', () => {
      const error = ValidationError.invalidOptionValue('timeout', -1);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.context).toEqual({
        option: 'timeout',
        value: -1,
        expected: undefined,
      });
    });
  });

  describe('ConnectionError', () => {
    it('should create clientInitializationFailed error', () => {
      const originalError = new Error('Invalid credentials');
      const error = ConnectionError.clientInitializationFailed(originalError);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.message).toContain('Failed to initialize Nacos client');
      expect(error.code).toBe('CONNECTION_ERROR');
      expect(error.context).toEqual({
        originalError: originalError.message,
      });
    });

    it('should create serverUnreachable error', () => {
      const server = 'nacos.example.com:8848';
      const error = ConnectionError.serverUnreachable(server);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.message).toContain('Nacos server is unreachable');
      expect(error.message).toContain(server);
      expect(error.code).toBe('CONNECTION_ERROR');
      expect(error.context).toEqual({ server });
    });
  });

  describe('Error inheritance and type checking', () => {
    it('should maintain proper inheritance chain', () => {
      const configError = new ConfigError('Config error', { test: 'context' });
      const serviceError = new ServiceError('Service error', { test: 'context' });
      const validationError = new ValidationError('Validation error', { test: 'context' });
      const connectionError = new ConnectionError('Connection error', { test: 'context' });

      // All should be instances of NacosError and Error
      expect(configError).toBeInstanceOf(NacosError);
      expect(configError).toBeInstanceOf(Error);

      expect(serviceError).toBeInstanceOf(NacosError);
      expect(serviceError).toBeInstanceOf(Error);

      expect(validationError).toBeInstanceOf(NacosError);
      expect(validationError).toBeInstanceOf(Error);

      expect(connectionError).toBeInstanceOf(NacosError);
      expect(connectionError).toBeInstanceOf(Error);

      // But not instances of each other
      expect(configError).not.toBeInstanceOf(ServiceError);
      expect(serviceError).not.toBeInstanceOf(ValidationError);
      expect(validationError).not.toBeInstanceOf(ConnectionError);
      expect(connectionError).not.toBeInstanceOf(ConfigError);
    });

    it('should have correct error names', () => {
      expect(new ConfigError('test', 'TEST').name).toBe('ConfigError');
      expect(new ServiceError('test', 'TEST').name).toBe('ServiceError');
      expect(new ValidationError('test', 'TEST').name).toBe('ValidationError');
      expect(new ConnectionError('test', 'TEST').name).toBe('ConnectionError');
    });
  });

  describe('Error context handling', () => {
    it('should handle undefined context', () => {
      const error = new ConfigError('Test error');
      expect(error.context).toBeUndefined();
    });

    it('should handle null context', () => {
      const error = new ConfigError('Test error', null as unknown);
      expect(error.context).toBe(null);
    });

    it('should handle complex context objects', () => {
      const context = {
        nested: {
          property: 'value',
          array: [1, 2, 3],
        },
        timestamp: new Date(),
        metadata: {
          version: '1.0.0',
        },
      };

      const error = new ConfigError('Test error', context);
      expect(error.context).toEqual(context);
    });
  });

  describe('Error stack traces', () => {
    it('should preserve stack traces', () => {
      const error = ConfigError.configNotFound('test.key');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ConfigError');
    });

    it('should include original error stack when available', () => {
      const originalError = new Error('Original error');
      const error = ConfigError.loadError('test.yaml', 'DEFAULT_GROUP', originalError);

      expect(error.stack).toBeDefined();
      expect(error.context.originalError).toBe(originalError.message);
    });
  });
});
