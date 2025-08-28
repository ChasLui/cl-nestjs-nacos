// ============= 核心服务导出 =============
export { NacosService } from './nacos.service';
export { NacosConfigService } from './nacos-config.service';
export { NacosModule } from './nacos.module';

// ============= 工具类导出 =============
export { Util } from './util';

// ============= 常量导出 =============
export { NACOS_OPTIONS, ConfigType, DEFAULT_CONFIG_TYPE } from './constants';

// ============= 配置解析器导出 =============
export {
  type IConfigParser,
  JsonConfigParser,
  YamlConfigParser,
  XmlConfigParser,
  HtmlConfigParser,
  PropertiesConfigParser,
  TextConfigParser,
  ConfigParserFactory,
} from './config-parser';

// ============= 统一类型系统导出 =============
export type {
  // 核心工具类型
  Dict,
  Nullable,
  Optional,
  Maybe,
  DeepReadonly,
  DeepPartial,
  DeepRequired,
  BrandedType,
  ConfigKey,
  ConfigPath,

  // 配置类型系统
  ConfigPrimitive,
  ConfigValue,
  ConfigObject,
  ConfigArray,
  EnvPlaceholder,
  ConfigTypeMap,
  InferConfigResult,
  BaseConfig,
  NacosConfigOptions,

  // 服务类型系统
  ServiceName,
  ServiceInstanceId,
  ServiceNamespace,
  BaseServiceInstance,
  ServiceInfo,
  ClientCredentials,
  BaseNacosOptions,
  NacosOptions,
  NacosConfigOnlyOptions,
  NacosFullOptions,
  IsConfigOnly,
  InferServiceType,

  // 测试类型系统
  TestConfigBase,
  TestDatabaseConfig,
  TestNestedConfig,
  TestXmlConfigWrapper,
  TestPropertiesConfig,
  TestHtmlConfig,
  TestTextConfig,
  TestConfigTypeMap,
  InferTestConfig,

  // 向后兼容的类型别名
  ParsedConfigObject,
  ParsedConfigValue,
  ConfigParserResult,
  JsonConfig,
  JsoncConfig,
  Json5Config,
  YamlConfig,
  XmlConfig,
  PropertiesConfig,
  HtmlConfig,
  TextConfig,
  ConfigParseResult,
} from './types';

// ============= 类型守卫函数导出 =============
export { isConfigOnlyOptions, isFullOptions } from './types';

// ============= 客户端选项类型别名 =============
export type { ClientCredentials as ClientOptions } from './types';

// ============= 错误类导出 =============
export { NacosError, ConfigError, ServiceError, ConnectionError, ValidationError } from './errors';
