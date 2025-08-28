import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as sinon from 'sinon';
import { NacosModule } from '../src';
import { NacosOptions } from '../src/interface';
import { NacosConfigClient, NacosNamingClient } from 'nacos';
import { ConfigParserFactory } from '../src/config-parser';
import { Util } from '../src/util';

describe('NacosModule - Integration Tests', () => {
  const testOptions: NacosOptions = {
    server: 'localhost:8848',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
    namespace: 'test-namespace',
  };

  beforeEach(() => {
    sinon.stub(NacosConfigClient.prototype, 'getConfig').resolves('{"key": "test-value", "port": 3000}');
    sinon.stub(NacosConfigClient.prototype, 'subscribe').returns({} as Record<string, unknown>);
    sinon.stub(NacosNamingClient.prototype, 'ready').resolves();
    sinon.stub(NacosNamingClient.prototype, 'registerInstance').resolves();
    sinon.stub(NacosNamingClient.prototype, 'deregisterInstance').resolves();
    sinon.stub(ConfigParserFactory, 'autoParseConfig').resolves({ key: 'test-value', port: 3000 });
    sinon.stub(Util, 'replacePlaceholdersWithEnvVars').returnsArg(0);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create module structure', () => {
    const dynamicModule = NacosModule.forRoot(testOptions);
    expect(dynamicModule.module).toBe(NacosModule);
    expect(Array.isArray(dynamicModule.providers)).toBe(true);
  });
});
