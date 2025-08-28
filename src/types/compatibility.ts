/**
 * 向后兼容类型定义
 * 保持与旧版本 API 的兼容性
 * @deprecated 这些类型将在未来版本中移除，请使用新的类型系统
 */

// 重新导出所有新类型以保持兼容性
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

export type {
  // 配置类型
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

export type {
  // 服务类型
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

// 导出类型守卫函数
export { isConfigOnlyOptions, isFullOptions } from './service';
