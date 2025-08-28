import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { Util } from '../src/util';

describe('Util', () => {
  describe('replacePlaceholdersWithEnvVars', () => {
    beforeEach(() => {
      // 设置测试环境变量
      process.env.TEST_ENV = 'development';
      process.env.DB_HOST = 'localhost';
      process.env.PORT = '3000';
    });

    afterEach(() => {
      // 清理测试环境变量
      delete process.env.TEST_ENV;
      delete process.env.DB_HOST;
      delete process.env.PORT;
    });

    it('should replace environment variables in string values', () => {
      const config = {
        host: 'mysql-${TEST_ENV}.svc',
        database: 'app_${TEST_ENV}',
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.host).toBe('mysql-development.svc');
      expect(result.database).toBe('app_development');
    });

    it('should replace environment variables in nested objects', () => {
      const config = {
        database: {
          host: '${DB_HOST}',
          port: '${PORT}',
          name: 'app_${TEST_ENV}',
        },
        services: {
          api: {
            url: 'http://${DB_HOST}:${PORT}',
          },
        },
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.database.host).toBe('localhost');
      expect(result.database.port).toBe('3000');
      expect(result.database.name).toBe('app_development');
      expect(result.services.api.url).toBe('http://localhost:3000');
    });

    it('should replace environment variables in arrays', () => {
      const config = {
        hosts: ['${DB_HOST}', 'mysql-${TEST_ENV}.svc'],
        services: [
          {
            name: 'service-${TEST_ENV}',
            url: 'http://${DB_HOST}:${PORT}',
          },
        ],
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.hosts).toEqual(['localhost', 'mysql-development.svc']);
      expect(result.services[0].name).toBe('service-development');
      expect(result.services[0].url).toBe('http://localhost:3000');
    });

    it('should keep placeholder when environment variable is not set', () => {
      const config = {
        host: 'mysql-${UNDEFINED_ENV}.svc',
        port: '${UNDEFINED_PORT}',
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.host).toBe('mysql-${UNDEFINED_ENV}.svc');
      expect(result.port).toBe('${UNDEFINED_PORT}');
    });

    it('should handle non-string values correctly', () => {
      const config = {
        port: 3000,
        enabled: true,
        timeout: null,
        data: undefined,
        host: '${DB_HOST}',
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.port).toBe(3000);
      expect(result.enabled).toBe(true);
      expect(result.timeout).toBe(null);
      expect(result.data).toBe(undefined);
      expect(result.host).toBe('localhost');
    });

    it('should handle empty objects and arrays', () => {
      const config = {
        emptyObj: {},
        emptyArray: [],
        host: '${DB_HOST}',
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.emptyObj).toEqual({});
      expect(result.emptyArray).toEqual([]);
      expect(result.host).toBe('localhost');
    });

    it('should handle complex nested structures', () => {
      const config = {
        app: {
          name: 'myapp-${TEST_ENV}',
          config: {
            database: {
              connections: [
                {
                  host: '${DB_HOST}',
                  port: '${PORT}',
                  ssl: true,
                },
              ],
            },
          },
        },
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.app.name).toBe('myapp-development');
      expect(result.app.config.database.connections[0].host).toBe('localhost');
      expect(result.app.config.database.connections[0].port).toBe('3000');
      expect(result.app.config.database.connections[0].ssl).toBe(true);
    });

    it('should handle multiple placeholders in single string', () => {
      const config = {
        connectionString: 'mongodb://${DB_HOST}:${PORT}/app_${TEST_ENV}',
      };
      const result = Util.replacePlaceholdersWithEnvVars(config);

      expect(result.connectionString).toBe('mongodb://localhost:3000/app_development');
    });
  });
});
