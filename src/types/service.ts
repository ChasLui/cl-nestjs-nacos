/**
 * 服务相关类型定义
 * 包含所有与 Nacos 服务注册发现相关的类型
 */

import type { NacosConfigOptions } from './config';

// ============= 基础服务类型 =============

/** 服务名称品牌类型 */
export type ServiceName = string & { readonly __brand: 'ServiceName' };

/** 服务实例ID品牌类型 */
export type ServiceInstanceId = string & { readonly __brand: 'ServiceInstanceId' };

/** 服务命名空间品牌类型 */
export type ServiceNamespace = string & { readonly __brand: 'ServiceNamespace' };

/** 基础服务实例 */
export interface BaseServiceInstance {
  readonly instanceId: ServiceInstanceId;
  readonly ip: string;
  readonly port: number;
  readonly weight: number;
  readonly enabled: boolean;
  readonly healthy: boolean;
  readonly metadata: Record<string, string>;
}

/** 服务信息 */
export interface ServiceInfo<T = unknown> {
  name: string;
  instance?: T;
}

// ============= Nacos 客户端类型 =============

/** 客户端凭证 */
export interface ClientCredentials {
  serverAddr: string;
  namespace: string;
  accessKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
}

/** Nacos基础选项 */
export interface BaseNacosOptions {
  readonly server: string;
  readonly namespace: string;
  readonly accessKey?: string;
  readonly secretKey?: string;
  readonly username?: string;
  readonly password?: string;
  readonly enableEnvVars?: boolean;
}

/** 完整的Nacos选项 */
export interface NacosOptions extends BaseNacosOptions {
  readonly configOnly?: boolean;
  readonly config?: NacosConfigOptions;
}

/** 仅配置模式的Nacos选项 */
export interface NacosConfigOnlyOptions extends Omit<NacosOptions, 'configOnly'> {
  readonly configOnly: true;
  readonly config: NacosConfigOptions;
}

/** 完整模式的Nacos选项（包含服务注册） */
export interface NacosFullOptions extends Omit<NacosOptions, 'configOnly'> {
  readonly configOnly?: false;
}

// ============= 类型守卫和工具类型 =============

/** 检查是否为仅配置模式 */
export type IsConfigOnly<T extends { configOnly?: boolean }> = T['configOnly'] extends true ? true : false;

/** 根据选项推断服务类型 */
export type InferServiceType<T extends NacosOptions> =
  IsConfigOnly<T> extends true ? 'NacosConfigService' : 'NacosService';

/** 类型守卫：检查是否为仅配置模式 */
export function isConfigOnlyOptions(options: NacosOptions): options is NacosConfigOnlyOptions {
  return options.configOnly === true;
}

/** 类型守卫：检查是否为完整模式 */
export function isFullOptions(options: NacosOptions): options is NacosFullOptions {
  return options.configOnly !== true;
}
