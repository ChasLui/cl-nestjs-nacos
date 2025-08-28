import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as sinon from 'sinon';
import { NacosConfigService } from '../src/nacos-config.service';
import { NacosOptions } from '../src/interface';
import { NacosConfigClient } from 'nacos';
import { ConfigParserFactory } from '../src/config-parser';
import { Util } from '../src/util';

describe('NacosConfigService', () => {
  const mockOptions: NacosOptions = {
    server: 'http://localhost:8848',
    namespace: 'test-namespace',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
    enableEnvVars: true,
  };

  beforeEach(() => {
    sinon.stub(NacosConfigClient.prototype, 'getConfig').resolves('{"key": "value"}');
    sinon.stub(NacosConfigClient.prototype, 'subscribe').returns({} as Record<string, unknown>);
    sinon.stub(ConfigParserFactory, 'autoParseConfig').resolves({ key: 'value' });
    sinon.stub(Util, 'replacePlaceholdersWithEnvVars').returnsArg(0);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should create service with valid options', () => {
      // 简化为同步测试，仅验证构造函数
      expect(() => {
        new NacosConfigService(mockOptions);
      }).not.toThrow();
    });

    it('should throw error when server is missing', () => {
      const invalidOptions = { ...mockOptions, server: '' };
      expect(() => {
        new NacosConfigService(invalidOptions);
      }).toThrow(/Required option is missing: server/);
    });

    it('should throw error when namespace is missing', () => {
      const invalidOptions = { ...mockOptions, namespace: '' };
      expect(() => {
        new NacosConfigService(invalidOptions);
      }).toThrow(/Required option is missing: namespace/);
    });
  });
});
