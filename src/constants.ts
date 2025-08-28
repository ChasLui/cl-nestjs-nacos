export const NACOS_OPTIONS = 'NACOS_OPTIONS';

// 支持的配置文件类型
export enum ConfigType {
  TEXT = 'text',
  JSON = 'json',
  JSONC = 'jsonc',
  JSON5 = 'json5',
  XML = 'xml',
  YAML = 'yaml',
  HTML = 'html',
  PROPERTIES = 'properties',
}

// 默认配置类型
export const DEFAULT_CONFIG_TYPE = ConfigType.YAML;
