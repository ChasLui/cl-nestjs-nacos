import { describe, it, expect } from 'vitest';
import { NacosService } from '../src/nacos.service';
import { NacosOptions } from '../src/interface';

describe('NacosService', () => {
  const mockOptions: NacosOptions = {
    server: 'http://localhost:8848',
    namespace: 'test-namespace',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
    enableEnvVars: true,
  };

  describe('constructor', () => {
    it('should throw error when server is missing', () => {
      const invalidOptions = { ...mockOptions, server: '' };
      expect(() => {
        new NacosService(invalidOptions);
      }).toThrow(/Required option is missing: server/);
    });
  });
});
