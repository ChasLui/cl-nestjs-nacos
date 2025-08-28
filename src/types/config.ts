/**
 * 配置相关类型定义
 * 包含所有与 Nacos 配置管理相关的类型
 */

import { ConfigType } from '../constants';

// ============= 基础配置类型 =============

/** 配置原始值类型 */
export type ConfigPrimitive = string | number | boolean | null | undefined;

/** 配置值类型 - 使用递归类型 */
export type ConfigValue = ConfigPrimitive | { [key: string]: ConfigValue } | ConfigValue[];

/** 配置对象类型 */
export type ConfigObject = Record<string, ConfigValue>;

/** 配置数组类型 */
export type ConfigArray = ConfigValue[];

/** 环境变量占位符 */
export type EnvPlaceholder<T extends string = string> = `\${${T}}`;

// ============= Nacos 配置选项 =============

/** 基础配置项 */
export interface BaseConfig {
  /** 配置组 */
  group: string;
  /** 配置数据ID */
  dataId: string;
  /** 配置类型 */
  type?: ConfigType;
}

/** Nacos 配置选项 */
export interface NacosConfigOptions {
  /** 配置组，默认为DEFAULT_GROUP */
  readonly group: string;
  /** 配置数据ID */
  readonly dataId: string;
  /** 配置文件类型，支持自动检测 */
  readonly type?: ConfigType;
  /** 是否订阅配置变更，默认为false */
  readonly subscribe?: boolean;
  /** 公共配置列表 */
  readonly commons?: readonly BaseConfig[];
}

// ============= 配置类型映射 =============

/** 配置类型映射 */
export type ConfigTypeMap = {
  [ConfigType.JSON]: ConfigObject;
  [ConfigType.JSONC]: ConfigObject;
  [ConfigType.JSON5]: ConfigObject;
  [ConfigType.YAML]: ConfigObject;
  [ConfigType.XML]: ConfigObject;
  [ConfigType.PROPERTIES]: Record<string, ConfigPrimitive>;
  [ConfigType.HTML]: ConfigObject;
  [ConfigType.TEXT]: { content: string };
};

/** 根据配置类型推断解析结果 */
export type InferConfigResult<T extends ConfigType> = T extends keyof ConfigTypeMap ? ConfigTypeMap[T] : ConfigObject;

// ============= 向后兼容的类型别名 =============

/** @deprecated 使用 ConfigObject 替代 */
export type ParsedConfigObject = ConfigObject;

/** @deprecated 使用 ConfigValue 替代 */
export type ParsedConfigValue = ConfigValue;

/** @deprecated 使用 InferConfigResult 替代 */
export type ConfigParserResult<T extends ConfigType> = InferConfigResult<T>;

/** @deprecated 使用统一的 ConfigValue 替代 */
export type JsonConfig = ConfigObject;
export type JsoncConfig = ConfigObject;
export type Json5Config = ConfigObject;
export type YamlConfig = ConfigObject;
export type XmlConfig = ConfigObject;
export type PropertiesConfig = Record<string, ConfigPrimitive>;
export type HtmlConfig = ConfigObject;
export type TextConfig = { content: string };

/** @deprecated 使用 ConfigValue 替代 */
export type ConfigParseResult = ConfigValue;
