/**
 * 统一的类型导出入口
 * 提供清晰的 API 和良好的开发体验
 */

// ============= 核心工具类型 =============
export type {
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

  // 测试类型
  TestConfigBase,
  TestDatabaseConfig,
  TestNestedConfig,
  TestXmlConfigWrapper,
  TestPropertiesConfig,
  TestHtmlConfig,
  TestTextConfig,
  TestConfigTypeMap,
  InferTestConfig,
} from './core';

// ============= 配置类型系统 =============
export type {
  ConfigPrimitive,
  ConfigValue,
  ConfigObject,
  ConfigArray,
  EnvPlaceholder,
  ConfigTypeMap,
  InferConfigResult,
  BaseConfig,
  NacosConfigOptions,

  // 向后兼容的配置类型别名
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
} from './config';

// ============= 服务类型系统 =============
export type {
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
} from './service';

// ============= 类型守卫函数 =============
export { isConfigOnlyOptions, isFullOptions } from './service';

// ============= 重新导出常量 =============
export { ConfigType } from '../constants';

// ============= 向后兼容性 =============
// 完整的向后兼容类型导出
export * from './compatibility';
