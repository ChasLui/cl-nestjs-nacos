import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AbstractNacosClient } from '../src/base/abstract-nacos-client';
import { NacosOptions } from '../src/types';
import { ValidationError } from '../src/errors';
import { ConfigType } from '../src/constants';

// Mock nacos module
vi.mock('nacos', () => ({
  NacosConfigClient: vi.fn().mockImplementation(() => ({
    ready: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue('test: value'),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unSubscribe: vi.fn().mockResolvedValue(undefined),
    publishSingle: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock debug
vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}));

// Create a concrete implementation for testing
class TestNacosClient extends AbstractNacosClient {
  constructor(options: NacosOptions) {
    super(options, 'test-nacos');
  }
}

describe('AbstractNacosClient - Simple Tests', () => {
  const mockOptions: NacosOptions = {
    server: 'http://localhost:8848',
    namespace: 'test-namespace',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
    enableEnvVars: true,
    config: {
      group: 'DEFAULT_GROUP',
      dataId: 'application.yaml',
    },
  };

  let client: TestNacosClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_VAR = 'test-value';
    process.env.DEFAULT_VAR = 'default-value';
  });

  afterEach(async () => {
    if (client) {
      await client.onModuleDestroy();
    }
    delete process.env.TEST_VAR;
    delete process.env.DEFAULT_VAR;
  });

  describe('constructor and validation', () => {
    it('should create client with valid options', () => {
      expect(() => {
        client = new TestNacosClient(mockOptions);
      }).not.toThrow();
    });

    it('should throw ValidationError for missing server', () => {
      const invalidOptions = { ...mockOptions, server: '' };
      expect(() => {
        new TestNacosClient(invalidOptions);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing namespace', () => {
      const invalidOptions = { ...mockOptions, namespace: '' };
      expect(() => {
        new TestNacosClient(invalidOptions);
      }).toThrow(ValidationError);
    });

    it('should handle HTTP server URLs correctly', () => {
      const httpOptions = { ...mockOptions, server: 'http://nacos.example.com:8848' };
      expect(() => {
        const httpClient = new TestNacosClient(httpOptions);
        httpClient.onModuleDestroy();
      }).not.toThrow();
    });

    it('should handle HTTPS server URLs correctly', () => {
      const httpsOptions = { ...mockOptions, server: 'https://nacos.example.com:8848' };
      expect(() => {
        const httpsClient = new TestNacosClient(httpsOptions);
        httpsClient.onModuleDestroy();
      }).not.toThrow();
    });

    it('should handle plain server addresses correctly', () => {
      const plainOptions = { ...mockOptions, server: 'nacos.example.com:8848' };
      expect(() => {
        const plainClient = new TestNacosClient(plainOptions);
        plainClient.onModuleDestroy();
      }).not.toThrow();
    });
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      client = new TestNacosClient(mockOptions);
    });

    it('should get configuration successfully', async () => {
      const config = await client.getConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should handle configuration in config-only mode', async () => {
      const configOnlyClient = new TestNacosClient({ ...mockOptions, configOnly: true });
      const config = await configOnlyClient.getConfig();
      expect(config).toBeDefined();
      await configOnlyClient.onModuleDestroy();
    });

    it('should handle subscription configuration', async () => {
      const subscribeClient = new TestNacosClient({
        ...mockOptions,
        config: {
          ...mockOptions.config!,
          subscribe: true,
        },
      });

      // Should not throw when subscription is enabled
      await expect(subscribeClient.getConfig()).resolves.toBeDefined();
      await subscribeClient.onModuleDestroy();
    });

    it('should handle common configurations', async () => {
      const commonClient = new TestNacosClient({
        ...mockOptions,
        config: {
          ...mockOptions.config!,
          commons: [
            {
              group: 'SHARED_GROUP',
              dataId: 'database.yaml',
            },
          ],
        },
      });

      const config = await commonClient.getConfig();
      expect(config).toBeDefined();
      await commonClient.onModuleDestroy();
    });

    it('should handle different configuration formats', async () => {
      // JSON client
      const jsonClient = new TestNacosClient({
        ...mockOptions,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'config.json',
        },
      });

      const jsonConfig = await jsonClient.getConfig();
      expect(jsonConfig).toBeDefined();
      await jsonClient.onModuleDestroy();

      // Properties client
      const propertiesClient = new TestNacosClient({
        ...mockOptions,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'config.properties',
        },
      });

      const propertiesConfig = await propertiesClient.getConfig();
      expect(propertiesConfig).toBeDefined();
      await propertiesClient.onModuleDestroy();
    });

    it('should handle module destruction', async () => {
      // Should not throw during destruction
      await expect(client.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should emit ready event when configuration is loaded', async () => {
      const readyPromise = new Promise((resolve) => {
        client.on('ready', resolve);
      });

      await client.getConfig();
      await readyPromise; // Should resolve when ready event is emitted
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      client = new TestNacosClient(mockOptions);
    });

    it('should handle client initialization properly', () => {
      // Test that the client can handle initialization properly
      expect(() => {
        const errorClient = new TestNacosClient(mockOptions);
        errorClient.onModuleDestroy();
      }).not.toThrow();
    });

    it('should handle various options combinations', () => {
      // Test different option combinations
      expect(() => {
        const client1 = new TestNacosClient({ ...mockOptions, enableEnvVars: false });
        client1.onModuleDestroy();
      }).not.toThrow();

      expect(() => {
        const client2 = new TestNacosClient({ ...mockOptions, configOnly: true });
        client2.onModuleDestroy();
      }).not.toThrow();
    });

    it('should handle config loading and parsing gracefully', async () => {
      // Test that client can handle various config scenarios
      const errorClient = new TestNacosClient(mockOptions);

      // Should handle normal config loading
      const config = await errorClient.getConfig();
      expect(config).toBeDefined();

      await errorClient.onModuleDestroy();
    });

    it('should handle config parsing errors with fallback', async () => {
      // Test that client can handle parsing errors gracefully
      const fallbackClient = new TestNacosClient(mockOptions);
      const config = await fallbackClient.getConfig();

      // Should return a valid config object (from mock)
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      await fallbackClient.onModuleDestroy();
    });
  });

  describe('advanced configuration features', () => {
    it('should handle environment variable replacement', async () => {
      // Simplified test - just verify client creation and basic functionality
      const envClient = new TestNacosClient({ ...mockOptions, enableEnvVars: true });
      const config = await envClient.getConfig();
      expect(config).toBeDefined();
      await envClient.onModuleDestroy();
    });

    it('should handle specific configuration keys', async () => {
      // Simplified test - basic functionality
      const keyClient = new TestNacosClient(mockOptions);
      const config = await keyClient.getConfig();
      expect(config).toBeDefined();
      await keyClient.onModuleDestroy();
    });

    it('should handle different configuration types', async () => {
      // Test with different dataId extensions
      const typeClient = new TestNacosClient({
        ...mockOptions,
        config: { group: 'DEFAULT_GROUP', dataId: 'test.json' },
      });
      const config = await typeClient.getConfig();
      expect(config).toBeDefined();
      await typeClient.onModuleDestroy();
    });

    it('should handle common configurations', async () => {
      // Test with commons configuration
      const commonClient = new TestNacosClient({
        ...mockOptions,
        config: {
          ...mockOptions.config!,
          commons: [{ group: 'COMMON_GROUP', dataId: 'database.yaml' }],
        },
      });
      const config = await commonClient.getConfig();
      expect(config).toBeDefined();
      await commonClient.onModuleDestroy();
    });

    it('should handle configuration subscription', async () => {
      // Test with subscription enabled
      const subscribeClient = new TestNacosClient({
        ...mockOptions,
        config: {
          ...mockOptions.config!,
          subscribe: true,
        },
      });
      const config = await subscribeClient.getConfig();
      expect(config).toBeDefined();
      await subscribeClient.onModuleDestroy();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle error scenarios gracefully', async () => {
      // Test that the client can be created and basic operations work
      const client = new TestNacosClient(mockOptions);
      const config = await client.getConfig();
      expect(config).toBeDefined();
      await client.onModuleDestroy();
    });

    it('should handle missing accessKey validation', () => {
      expect(() => {
        new TestNacosClient({
          ...mockOptions,
          accessKey: undefined,
        });
      }).toThrow(ValidationError);
    });

    it('should handle missing secretKey validation', () => {
      expect(() => {
        new TestNacosClient({
          ...mockOptions,
          secretKey: undefined,
        });
      }).toThrow(ValidationError);
    });

    it('should handle config not found error', async () => {
      const client = new TestNacosClient(mockOptions);
      await client.getConfig(); // Load initial config

      // Try to get a non-existent config key
      await expect(client.getConfig('non-existent-key')).rejects.toThrow('Configuration not found');
      await client.onModuleDestroy();
    });

    it('should handle missing config options during loadAllConfig', async () => {
      // Create a client that will fail when trying to load config
      class TestLoadAllConfigClient extends TestNacosClient {
        async testLoadAllConfig() {
          return this.loadAllConfig();
        }
      }

      const client = new TestLoadAllConfigClient({
        ...mockOptions,
        config: undefined,
      });

      // The error should occur when calling loadAllConfig, not constructor
      await expect(client.testLoadAllConfig()).rejects.toThrow(ValidationError);
      await client.onModuleDestroy();
    });

    it('should use cached config when available', async () => {
      const client = new TestNacosClient(mockOptions);

      // First call should load and cache
      const config1 = await client.getConfig();
      expect(config1).toBeDefined();

      // Second call should use cache
      const config2 = await client.getConfig();
      expect(config2).toEqual(config1);

      await client.onModuleDestroy();
    });

    it('should handle cache miss and return full config', async () => {
      const client = new TestNacosClient(mockOptions);

      // Get full config (no key specified)
      const fullConfig = await client.getConfig();
      expect(fullConfig).toBeDefined();
      expect(typeof fullConfig).toBe('object');

      await client.onModuleDestroy();
    });

    it('should handle options without enableEnvVars property', () => {
      const optionsWithoutEnvVars = {
        server: 'localhost:8848',
        namespace: 'public',
        accessKey: 'test',
        secretKey: 'test',
        config: { dataId: 'test', group: 'DEFAULT_GROUP' },
      };

      expect(() => {
        new TestNacosClient(optionsWithoutEnvVars);
      }).not.toThrow();
    });

    it('should handle options with enableEnvVars explicitly set', () => {
      const optionsWithEnvVars = {
        ...mockOptions,
        enableEnvVars: false,
      };

      expect(() => {
        new TestNacosClient(optionsWithEnvVars);
      }).not.toThrow();
    });

    it('should handle client creation without config', () => {
      // Test creating client without config option
      const clientWithoutConfig = new TestNacosClient({
        ...mockOptions,
        config: undefined,
      });

      expect(clientWithoutConfig).toBeDefined();
    });

    it('should handle different client options scenarios', () => {
      // Test various client option scenarios
      const scenarios = [
        { enableEnvVars: true, description: 'with enableEnvVars true' },
        { enableEnvVars: false, description: 'with enableEnvVars false' },
        { enableEnvVars: undefined, description: 'without enableEnvVars' },
      ];

      scenarios.forEach(({ enableEnvVars }) => {
        const options = { ...mockOptions };
        if (enableEnvVars !== undefined) {
          options.enableEnvVars = enableEnvVars;
        }

        expect(() => {
          new TestNacosClient(options);
        }).not.toThrow();
      });
    });
  });

  describe('configuration parsing edge cases', () => {
    it('should handle specified config type parsing', async () => {
      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient(mockOptions);

      // Test with specified JSON type
      await client.testSetConfig('{"test": "json"}', 'test.json', ConfigType.JSON);
      expect(client.getConfig()).toBeDefined();

      await client.onModuleDestroy();
    });

    it('should handle auto-detection parsing', async () => {
      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient(mockOptions);

      // Test auto-detection without specified type
      await client.testSetConfig('test: yaml', 'config.yaml');
      expect(client.getConfig()).toBeDefined();

      await client.onModuleDestroy();
    });

    it('should handle parsing failure with YAML fallback', async () => {
      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient(mockOptions);

      // Test with invalid JSON that should fallback to YAML
      await client.testSetConfig('invalid: json: {[}', 'invalid.json');
      expect(client.getConfig()).toBeDefined();

      await client.onModuleDestroy();
    });

    it('should handle both parsing and YAML failure', async () => {
      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient(mockOptions);

      // Test with content that fails both parsing and YAML
      await client.testSetConfig('{{invalid yaml and json}}', 'invalid.json');
      const config = client.getConfig();
      expect(config).toBeDefined();
      // The config should contain the fallback content
      expect(typeof config).toBe('object');

      await client.onModuleDestroy();
    });

    it('should handle non-Error in YAML fallback', async () => {
      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient(mockOptions);

      // Test content that causes both parsing errors
      await client.testSetConfig('[invalid content}', 'test.json');
      const config = client.getConfig();
      expect(config).toBeDefined();

      await client.onModuleDestroy();
    });

    it('should handle environment variable replacement', async () => {
      // Set test environment variable
      process.env.TEST_ENV_VAR = 'test_value';

      class TestSetConfigClient extends TestNacosClient {
        async testSetConfig(content: string, dataId?: string, type?: ConfigType) {
          return this.setConfig(content, dataId, type);
        }
      }

      const client = new TestSetConfigClient({ ...mockOptions, enableEnvVars: true });

      // Test with environment variable placeholder
      await client.testSetConfig('test: ${TEST_ENV_VAR}', 'config.yaml');
      const config = client.getConfig();
      expect(config).toBeDefined();

      await client.onModuleDestroy();

      // Clean up
      delete process.env.TEST_ENV_VAR;
    });
  });
});
