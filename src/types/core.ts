/**
 * 核心基础工具类型
 * 提供通用的工具类型和品牌类型
 */

// ============= 基础工具类型 =============

/** 通用字典类型 */
export type Dict<T = unknown> = Record<string, T>;

/** 可能为空的类型 */
export type Nullable<T> = T | null;

/** 可能为undefined的类型 */
export type Optional<T> = T | undefined;

/** 可能为null或undefined的类型 */
export type Maybe<T> = T | null | undefined;

/** 深度只读类型 - 简化版 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

/** 深度可选类型 - 简化版 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P];
};

/** 深度必需类型 - 简化版 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P];
};

/** 品牌类型 */
export type BrandedType<B extends string, T = string> = T & { readonly __brand: B };

// ============= 特殊品牌类型 =============

/** 配置键品牌类型 */
export type ConfigKey = BrandedType<'ConfigKey'>;

/** 配置路径品牌类型 */
export type ConfigPath = BrandedType<'ConfigPath'>;

// ============= 测试类型系统 =============

import { ConfigType } from '../constants';
import type { ConfigObject } from './config';

/** 测试配置基础接口 */
export interface TestConfigBase {
  name: string;
  port: number;
  enabled?: boolean;
}

/** 测试数据库配置 */
export interface TestDatabaseConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/** 嵌套测试配置 */
export interface TestNestedConfig extends TestConfigBase {
  database?: TestDatabaseConfig;
}

/** XML测试配置包装器 */
export interface TestXmlConfigWrapper {
  config: TestNestedConfig;
}

/** Properties测试配置 */
export interface TestPropertiesConfig {
  'app.name': string;
  'app.port': number;
  'app.debug': boolean;
  'db.host': string;
  'db.port': number;
  'db.enabled': boolean;
}

/** HTML测试配置 */
export interface TestHtmlConfig {
  appName: string;
  port: number;
  config: { debug: boolean };
}

/** 文本测试配置 */
export interface TestTextConfig {
  content: string;
}

/** 测试配置类型映射 */
export type TestConfigTypeMap = {
  [ConfigType.JSON]: TestNestedConfig;
  [ConfigType.JSONC]: TestNestedConfig;
  [ConfigType.JSON5]: TestNestedConfig;
  [ConfigType.YAML]: TestNestedConfig;
  [ConfigType.XML]: TestXmlConfigWrapper;
  [ConfigType.PROPERTIES]: TestPropertiesConfig;
  [ConfigType.HTML]: TestHtmlConfig;
  [ConfigType.TEXT]: TestTextConfig;
};

/** 根据配置类型推断测试配置 */
export type InferTestConfig<T extends ConfigType> = T extends keyof TestConfigTypeMap
  ? TestConfigTypeMap[T]
  : ConfigObject;
