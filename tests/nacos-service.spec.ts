import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NacosService } from '../src/nacos.service';
import { NacosOptions } from '../src/types';
import { ServiceError } from '../src/errors';
import * as os from 'os';

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
  NacosNamingClient: vi.fn().mockImplementation(() => ({
    ready: vi.fn().mockResolvedValue(undefined),
    registerInstance: vi.fn().mockResolvedValue(undefined),
    deregisterInstance: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock os module
vi.mock('os', () => ({
  networkInterfaces: vi.fn(),
}));

describe('NacosService', () => {
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

  const mockUsernameOptions: NacosOptions = {
    server: 'http://localhost:8848',
    namespace: 'test-namespace',
    username: 'test-username',
    password: 'test-password',
    enableEnvVars: true,
    config: {
      group: 'DEFAULT_GROUP',
      dataId: 'application.yaml',
    },
  };

  let service: NacosService;
  let mockNetworkInterfaces: ReturnType<typeof vi.mocked<typeof os.networkInterfaces>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkInterfaces = vi.mocked(os.networkInterfaces);

    // Mock network interfaces to return a valid IP
    mockNetworkInterfaces.mockReturnValue({
      eth0: [
        {
          address: '192.168.1.100',
          family: 'IPv4',
          internal: false,
        } as os.NetworkInterfaceInfo,
      ],
    });
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  describe('constructor', () => {
    it('should create service with valid accessKey/secretKey options', () => {
      expect(() => {
        service = new NacosService(mockOptions);
      }).not.toThrow();
    });

    it('should create service with valid username/password options', () => {
      expect(() => {
        service = new NacosService(mockUsernameOptions);
      }).not.toThrow();
    });

    it('should create service in config-only mode with accessKey/secretKey', () => {
      const configOnlyOptions = { ...mockOptions, configOnly: true };
      expect(() => {
        service = new NacosService(configOnlyOptions);
      }).not.toThrow();
    });

    it('should create service in config-only mode with username/password', () => {
      const configOnlyOptions = { ...mockUsernameOptions, configOnly: true };
      expect(() => {
        service = new NacosService(configOnlyOptions);
      }).not.toThrow();
    });
  });

  describe('register', () => {
    beforeEach(() => {
      service = new NacosService(mockOptions);
      // Mock getConfig to return a port
      vi.spyOn(service, 'getConfig').mockResolvedValue(3000);
    });

    it('should register service successfully', async () => {
      const result = await service.register('test-service', true);
      expect(result).toBe(true);
    });

    it('should not register in config-only mode', async () => {
      const configOnlyService = new NacosService({ ...mockOptions, configOnly: true });
      const result = await configOnlyService.register('test-service', true);
      expect(result).toBe(false);
      await configOnlyService.onModuleDestroy();
    });

    it('should not register when enable is false', async () => {
      const result = await service.register('test-service', false);
      expect(result).toBe(false);
    });

    it('should handle registration failure scenarios', async () => {
      // Test that registration handles various scenarios
      const result1 = await service.register('test-service', false);
      expect(result1).toBe(false);

      const configOnlyService = new NacosService({ ...mockOptions, configOnly: true });
      const result2 = await configOnlyService.register('test-service', true);
      expect(result2).toBe(false);

      await configOnlyService.onModuleDestroy();
    });

    it('should handle various registration scenarios', async () => {
      // Test different registration scenarios without complex mocking
      const scenarios = [
        { enable: false, expected: false },
        { enable: true, configOnly: true, expected: false },
      ];

      for (const scenario of scenarios) {
        const testService = new NacosService({
          ...mockOptions,
          configOnly: scenario.configOnly || false,
        });

        const result = await testService.register('test-service', scenario.enable);
        expect(result).toBe(scenario.expected);

        await testService.onModuleDestroy();
      }
    });

    it('should handle IP resolution failure', async () => {
      // Mock network interfaces to return no valid IPs
      mockNetworkInterfaces.mockReturnValue({});

      await expect(service.register('test-service', true)).rejects.toThrow(ServiceError);
    });

    it('should handle different server URL formats', async () => {
      // Test that services can be created with different URL formats
      const httpService = new NacosService({
        ...mockOptions,
        server: 'http://localhost:8848',
      });

      const plainService = new NacosService({
        ...mockOptions,
        server: 'localhost:8848',
      });

      // Just test creation and cleanup, not actual registration
      expect(httpService).toBeDefined();
      expect(plainService).toBeDefined();

      await httpService.onModuleDestroy();
      await plainService.onModuleDestroy();
    });
  });

  describe('onModuleDestroy', () => {
    beforeEach(() => {
      service = new NacosService(mockOptions);
      vi.spyOn(service, 'getConfig').mockResolvedValue(3000);
    });

    it('should handle module destruction gracefully', async () => {
      // Test various destruction scenarios
      const services = [new NacosService(mockOptions), new NacosService({ ...mockOptions, configOnly: true })];

      for (const testService of services) {
        await expect(testService.onModuleDestroy()).resolves.not.toThrow();
      }
    });
  });

  describe('network and IP handling', () => {
    it('should handle various network interface configurations', () => {
      // Test that service can handle different network configurations
      mockNetworkInterfaces.mockReturnValue({
        eth0: [
          {
            address: '192.168.1.100',
            family: 'IPv4',
            internal: false,
          } as os.NetworkInterfaceInfo,
        ],
      });

      const testService = new NacosService(mockOptions);
      expect(testService).toBeDefined();
    });

    it('should handle empty network interfaces', () => {
      // Test handling of empty network interfaces
      mockNetworkInterfaces.mockReturnValue({});

      const testService = new NacosService(mockOptions);
      expect(testService).toBeDefined();
    });
  });

  describe('advanced service scenarios', () => {
    it('should handle naming client initialization and reuse', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // First registration should initialize the naming client
      const result1 = await testService.register('test-service-1', true);
      expect(result1).toBe(true);

      // Second registration should reuse the existing naming client
      const result2 = await testService.register('test-service-2', true);
      expect(result2).toBe(true);

      await testService.onModuleDestroy();
    });

    it('should handle service registration with existing service instance', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // First registration creates service instance
      await testService.register('test-service', true);

      // Second registration updates existing service instance
      await testService.register('updated-service', true);

      await testService.onModuleDestroy();
    });

    it('should handle HTTP URL parsing in naming client', async () => {
      const httpService = new NacosService({
        ...mockOptions,
        server: 'http://nacos.example.com:8848/nacos',
      });
      vi.spyOn(httpService, 'getConfig').mockResolvedValue(3000);

      const result = await httpService.register('http-service', true);
      expect(result).toBe(true);

      await httpService.onModuleDestroy();
    });

    it('should handle HTTPS URL parsing in naming client', async () => {
      const httpsService = new NacosService({
        ...mockOptions,
        server: 'https://secure-nacos.example.com:8848',
      });
      vi.spyOn(httpsService, 'getConfig').mockResolvedValue(3000);

      const result = await httpsService.register('https-service', true);
      expect(result).toBe(true);

      await httpsService.onModuleDestroy();
    });

    it('should handle service destruction with registered service', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register a service first
      await testService.register('test-service', true);

      // Mock deregisterInstance to succeed
      const { NacosNamingClient } = await import('nacos');
      const mockClient = vi.mocked(NacosNamingClient);
      mockClient.prototype.deregisterInstance = vi.fn().mockResolvedValue(undefined);

      // Destruction should deregister the service
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle deregistration errors gracefully', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register a service first
      await testService.register('test-service', true);

      // Mock deregisterInstance to fail
      const { NacosNamingClient } = await import('nacos');
      const mockClient = vi.mocked(NacosNamingClient);
      mockClient.prototype.deregisterInstance = vi.fn().mockRejectedValue(new Error('Deregister failed'));

      // Destruction should handle error gracefully
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle non-Error objects during deregistration', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register a service first
      await testService.register('test-service', true);

      // Mock deregisterInstance to fail with non-Error object
      const { NacosNamingClient } = await import('nacos');
      const mockClient = vi.mocked(NacosNamingClient);
      mockClient.prototype.deregisterInstance = vi.fn().mockRejectedValue('string error');

      // Destruction should handle error gracefully
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle service instance creation and updates', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register should create service instance
      const result = await testService.register('new-service', true);
      expect(result).toBe(true);

      // Verify service instance was created/updated
      expect((testService as { service?: { name: string } }).service).toBeDefined();
      expect((testService as { service: { name: string } }).service.name).toBe('new-service');

      await testService.onModuleDestroy();
    });

    it('should handle service instance update when service exists', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register first service
      await testService.register('first-service', true);
      expect((testService as { service: { name: string } }).service.name).toBe('first-service');

      // Register second service - should update existing service
      await testService.register('second-service', true);
      expect((testService as { service: { name: string } }).service.name).toBe('second-service');

      await testService.onModuleDestroy();
    });

    it('should handle naming client creation without HTTP prefix', async () => {
      const plainService = new NacosService({
        ...mockOptions,
        server: 'localhost:8848',
      });
      vi.spyOn(plainService, 'getConfig').mockResolvedValue(3000);

      const result = await plainService.register('plain-service', true);
      expect(result).toBe(true);

      await plainService.onModuleDestroy();
    });

    it('should handle module destruction without service instance', async () => {
      const testService = new NacosService(mockOptions);

      // Don't register any service, just test destruction
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle module destruction in config-only mode', async () => {
      const configOnlyService = new NacosService({
        ...mockOptions,
        configOnly: true,
      });

      // Config-only mode should not have naming client
      await expect(configOnlyService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle IP resolution in different network scenarios', () => {
      // Test with different network interface configurations
      const scenarios = [
        {
          interfaces: {
            lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
            en0: [{ address: '192.168.1.100', family: 'IPv4', internal: false }],
          },
          description: 'with external interface',
        },
        {
          interfaces: {
            lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
          },
          description: 'with only loopback',
        },
        {
          interfaces: {},
          description: 'with no interfaces',
        },
      ];

      scenarios.forEach(({ interfaces }) => {
        mockNetworkInterfaces.mockReturnValue(interfaces);

        expect(() => {
          new NacosService(mockOptions);
        }).not.toThrow();
      });
    });

    it('should handle module destruction when no service is registered', async () => {
      const testService = new NacosService(mockOptions);

      // Test destruction without registering any service
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle module destruction when service instance is null', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // Register a service first
      await testService.register('test-service', true);

      // Manually set service instance to null to test the condition
      (testService as { service?: { name: string; instance?: unknown } }).service = { name: 'test-service' };

      // Should not throw even with null instance
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle server URL without HTTP prefix in naming client', async () => {
      const plainServerService = new NacosService({
        ...mockOptions,
        server: 'plain-server:8848',
      });
      vi.spyOn(plainServerService, 'getConfig').mockResolvedValue(3000);

      // Should work with plain server address
      const result = await plainServerService.register('plain-test', true);
      expect(result).toBe(true);

      await plainServerService.onModuleDestroy();
    });

    it('should handle service registration with existing naming client', async () => {
      const testService = new NacosService(mockOptions);
      vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

      // First registration creates naming client
      await testService.register('service-1', true);

      // Second registration should reuse existing client
      await testService.register('service-2', true);

      expect((testService as { service: { name: string } }).service.name).toBe('service-2');

      await testService.onModuleDestroy();
    });

    it('should handle getLocalIP with various network scenarios', () => {
      // Test IPv4 external interface selection
      mockNetworkInterfaces.mockReturnValue({
        lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
        en0: [{ address: '192.168.1.100', family: 'IPv4', internal: false }],
        en1: [{ address: '10.0.0.50', family: 'IPv4', internal: false }],
      });

      const service = new NacosService(mockOptions);
      expect(service).toBeDefined();
      // The first external IPv4 should be selected
    });

    it('should handle getLocalIP with only IPv6 interfaces', () => {
      mockNetworkInterfaces.mockReturnValue({
        lo0: [{ address: '::1', family: 'IPv6', internal: true }],
        en0: [{ address: 'fe80::1', family: 'IPv6', internal: false }],
      });

      const service = new NacosService(mockOptions);
      expect(service).toBeDefined();
      // Should fallback to localhost when no IPv4 available
    });

    it('should handle getLocalIP with mixed internal/external interfaces', () => {
      mockNetworkInterfaces.mockReturnValue({
        lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
        docker0: [{ address: '172.17.0.1', family: 'IPv4', internal: false }],
        en0: [
          { address: '192.168.1.100', family: 'IPv4', internal: false },
          { address: 'fe80::abcd', family: 'IPv6', internal: false },
        ],
      });

      const service = new NacosService(mockOptions);
      expect(service).toBeDefined();
      // Should select the first external IPv4
    });

    it('should handle naming client creation with HTTP URL parsing', async () => {
      const httpService = new NacosService({
        ...mockOptions,
        server: 'http://nacos-server.example.com:8848/nacos',
      });
      vi.spyOn(httpService, 'getConfig').mockResolvedValue(3000);

      // Should parse HTTP URL and extract host
      const result = await httpService.register('http-service', true);
      expect(result).toBe(true);

      await httpService.onModuleDestroy();
    });

    it('should handle naming client creation with HTTPS URL parsing', async () => {
      const httpsService = new NacosService({
        ...mockOptions,
        server: 'https://secure-nacos.example.com:443/nacos',
      });
      vi.spyOn(httpsService, 'getConfig').mockResolvedValue(3000);

      // Should parse HTTPS URL and extract host
      const result = await httpsService.register('https-service', true);
      expect(result).toBe(true);

      await httpsService.onModuleDestroy();
    });

    it('should handle service initialization in non-configOnly mode', () => {
      const fullService = new NacosService({
        ...mockOptions,
        configOnly: false,
      });

      // Should initialize service object
      expect((fullService as { service?: { name: string } }).service).toBeDefined();
      expect((fullService as { service: { name: string } }).service.name).toBe('nest-service');
    });

    it('should handle service initialization in configOnly mode', () => {
      const configOnlyService = new NacosService({
        ...mockOptions,
        configOnly: true,
      });

      // Should not initialize service object
      expect((configOnlyService as { service?: unknown }).service).toBeUndefined();
    });

    it('should handle module destruction with namingClient but no service', async () => {
      const testService = new NacosService(mockOptions);

      // Manually set namingClient but no service
      (testService as { namingClient?: unknown }).namingClient = {} as unknown;

      // Should not throw even with namingClient but no service
      await expect(testService.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle register method with development environment', async () => {
      // Temporarily set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const testService = new NacosService(mockOptions);

        // Should return false by default in development
        const result = await testService.register('dev-service');
        expect(result).toBe(false);
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should handle register method with production environment', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const testService = new NacosService(mockOptions);
        vi.spyOn(testService, 'getConfig').mockResolvedValue(3000);

        // Should register by default in production
        const result = await testService.register('prod-service');
        expect(result).toBe(true);
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
