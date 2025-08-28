import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as sinon from 'sinon';
import { NacosModule } from '../src/nacos.module';
import { NacosService } from '../src/nacos.service';
import { NacosConfigService } from '../src/nacos-config.service';
import { NacosOptions } from '../src/interface';
import { NacosConfigClient, NacosNamingClient } from 'nacos';
import { ConfigParserFactory } from '../src/config-parser';
import { Util } from '../src/util';

describe('NacosModule', () => {
  const mockOptions: NacosOptions = {
    server: 'localhost:8848',
    namespace: 'test-namespace',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  };

  beforeEach(() => {
    // 全面模拟所有外部依赖
    sinon.stub(NacosConfigClient.prototype, 'getConfig').resolves('{"key": "value"}');
    sinon.stub(NacosConfigClient.prototype, 'subscribe').returns({} as Record<string, unknown>);
    sinon.stub(NacosNamingClient.prototype, 'ready').resolves();
    sinon.stub(NacosNamingClient.prototype, 'registerInstance').resolves();
    sinon.stub(NacosNamingClient.prototype, 'deregisterInstance').resolves();
    sinon.stub(ConfigParserFactory, 'autoParseConfig').resolves({ key: 'value' });
    sinon.stub(Util, 'replacePlaceholdersWithEnvVars').returnsArg(0);
    // 移除对 os.networkInterfaces 的 stub，因为它是不可配置的
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('forRoot', () => {
    it('should create module with correct structure', () => {
      const dynamicModule = NacosModule.forRoot(mockOptions);

      expect(dynamicModule.module).toBe(NacosModule);
      expect(dynamicModule.global).toBe(true);
      expect(Array.isArray(dynamicModule.providers)).toBe(true);
      expect(Array.isArray(dynamicModule.exports)).toBe(true);
    });

    it('should default to full service when configOnly is not specified', () => {
      const dynamicModule = NacosModule.forRoot(mockOptions);

      // 默认应该提供完整的 NacosService
      expect(dynamicModule.exports!.includes(NacosService)).toBe(true);
    });

    it('should create config-only module when configOnly is true', () => {
      const configOnlyOptions = { ...mockOptions, configOnly: true };
      const dynamicModule = NacosModule.forRoot(configOnlyOptions);

      // 应该提供 NacosConfigService
      expect(dynamicModule.exports!.includes(NacosConfigService)).toBe(true);
    });
  });
});
