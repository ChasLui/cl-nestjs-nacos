import { load as parseYaml } from 'js-yaml';
import * as cheerio from 'cheerio';
import { parse as parseJsonc } from 'jsonc-parser';
import JSON5 from 'json5';
import { ConfigType } from './constants';
import Debug from 'debug';

// 第三方库类型声明
interface XmlParseOptions {
  explicitArray?: boolean;
  ignoreAttrs?: boolean;
}

// 使用动态 import 替代 require
let parseXmlFunction:
  | ((xml: string, options: XmlParseOptions, callback: (err: Error | null, result: unknown) => void) => void)
  | null = null;

async function getXmlParser() {
  if (!parseXmlFunction) {
    // 使用类型断言避免类型检查问题
    const xml2js = (await import('xml2js' as string)) as { parseString: typeof parseXmlFunction };
    parseXmlFunction = xml2js.parseString;
  }
  if (!parseXmlFunction) {
    throw new Error('XML解析器加载失败');
  }
  return parseXmlFunction;
}

// 导入类型定义
import type {
  ConfigParseResult,
  ConfigParserResult,
  JsonConfig,
  JsoncConfig,
  Json5Config,
  YamlConfig,
  XmlConfig,
  PropertiesConfig,
  HtmlConfig,
  TextConfig,
  ParsedConfigObject,
} from './types';

const debug = Debug('nacos:config-parser');

/**
 * 配置解析器接口
 */
export interface IConfigParser {
  /**
   * 解析配置内容
   * @param content 配置内容字符串
   * @returns 解析后的配置对象
   */
  parse(content: string): Promise<ConfigParseResult> | ConfigParseResult;
}

/**
 * JSON配置解析器
 */
export class JsonConfigParser implements IConfigParser {
  parse(content: string): JsonConfig {
    try {
      return JSON.parse(content);
    } catch (error) {
      debug('JSON解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`JSON配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * JSONC配置解析器 (JSON with Comments)
 */
export class JsoncConfigParser implements IConfigParser {
  parse(content: string): JsoncConfig {
    try {
      return parseJsonc(content) as JsoncConfig;
    } catch (error) {
      debug('JSONC解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`JSONC配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * JSON5配置解析器
 */
export class Json5ConfigParser implements IConfigParser {
  parse(content: string): Json5Config {
    try {
      return JSON5.parse(content) as Json5Config;
    } catch (error) {
      debug('JSON5解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`JSON5配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * YAML配置解析器
 */
export class YamlConfigParser implements IConfigParser {
  parse(content: string): YamlConfig {
    try {
      return parseYaml(content) as YamlConfig;
    } catch (error) {
      debug('YAML解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`YAML配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * XML配置解析器
 */
export class XmlConfigParser implements IConfigParser {
  async parse(content: string): Promise<XmlConfig> {
    try {
      const parseXml = await getXmlParser();
      return new Promise((resolve, reject) => {
        parseXml(content, { explicitArray: false, ignoreAttrs: false }, (err: Error | null, result: unknown) => {
          if (err) {
            debug('XML解析失败:', err);
            reject(new Error(`XML配置解析失败: ${err.message}`));
          } else {
            resolve(result as XmlConfig);
          }
        });
      });
    } catch (error) {
      debug('XML解析器加载失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`XML解析器加载失败: ${errorMessage}`);
    }
  }
}

/**
 * HTML配置解析器 - 提取data属性或文本内容
 */
export class HtmlConfigParser implements IConfigParser {
  parse(content: string): HtmlConfig {
    try {
      const $ = cheerio.load(content);
      const config: ParsedConfigObject = {};

      // 提取所有带有data-config属性的元素
      $('[data-config]').each((_, element) => {
        const key = $(element).attr('data-config');
        const dataValue = $(element).attr('data-value');
        const textValue = $(element).text().trim();
        const value = dataValue || textValue;

        if (key && value !== undefined && value !== '') {
          // 尝试解析JSON格式的值
          try {
            config[key] = JSON.parse(value);
          } catch {
            config[key] = value;
          }
        }
      });

      // 如果没有找到data-config属性，尝试提取script标签中的配置
      if (Object.keys(config).length === 0) {
        $("script[type='application/json']").each((_, element) => {
          const scriptContent = $(element).html();
          if (scriptContent) {
            try {
              const jsonConfig = JSON.parse(scriptContent);
              Object.assign(config, jsonConfig);
            } catch (error) {
              debug('HTML中的JSON解析失败:', error);
            }
          }
        });
      }

      return Object.keys(config).length > 0 ? config : { content };
    } catch (error) {
      debug('HTML解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`HTML配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * Properties配置解析器
 */
export class PropertiesConfigParser implements IConfigParser {
  parse(content: string): PropertiesConfig {
    try {
      // 将字符串内容转换为Buffer，然后使用properties-reader解析
      const lines = content.split('\n');
      const config: ParsedConfigObject = {};

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('!')) {
          const equalIndex = trimmedLine.indexOf('=');
          const colonIndex = trimmedLine.indexOf(':');
          let separatorIndex = -1;

          if (equalIndex !== -1 && colonIndex !== -1) {
            separatorIndex = Math.min(equalIndex, colonIndex);
          } else if (equalIndex !== -1) {
            separatorIndex = equalIndex;
          } else if (colonIndex !== -1) {
            separatorIndex = colonIndex;
          }

          if (separatorIndex !== -1) {
            const key = trimmedLine.substring(0, separatorIndex).trim();
            const value = trimmedLine.substring(separatorIndex + 1).trim();

            // 尝试转换数据类型
            if (value === 'true' || value === 'false') {
              config[key] = value === 'true';
            } else if (!isNaN(Number(value)) && value !== '') {
              config[key] = Number(value);
            } else {
              config[key] = value;
            }
          }
        }
      }

      return config as PropertiesConfig;
    } catch (error) {
      debug('Properties解析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Properties配置解析失败: ${errorMessage}`);
    }
  }
}

/**
 * 纯文本配置解析器 - 返回原始文本内容
 */
export class TextConfigParser implements IConfigParser {
  parse(content: string): TextConfig {
    return { content };
  }
}

/**
 * 配置解析器工厂类
 */
export class ConfigParserFactory {
  private static parsers: Map<ConfigType, IConfigParser> = new Map<ConfigType, IConfigParser>([
    [ConfigType.JSON, new JsonConfigParser()],
    [ConfigType.JSONC, new JsoncConfigParser()],
    [ConfigType.JSON5, new Json5ConfigParser()],
    [ConfigType.YAML, new YamlConfigParser()],
    [ConfigType.XML, new XmlConfigParser()],
    [ConfigType.HTML, new HtmlConfigParser()],
    [ConfigType.PROPERTIES, new PropertiesConfigParser()],
    [ConfigType.TEXT, new TextConfigParser()],
  ]);

  /**
   * 获取指定类型的配置解析器
   * @param type 配置文件类型
   * @returns 配置解析器实例
   */
  static getParser(type: ConfigType): IConfigParser {
    const parser = this.parsers.get(type);
    if (!parser) {
      throw new Error(`不支持的配置文件类型: ${type}`);
    }
    return parser;
  }

  /**
   * 根据配置类型解析配置内容
   * @param content 配置内容
   * @param type 配置类型
   * @returns 解析后的配置对象
   */
  static async parseConfig<T extends ConfigType>(content: string, type: T): Promise<ConfigParserResult<T>> {
    const parser = this.getParser(type);
    const result = await parser.parse(content);
    return result as ConfigParserResult<T>;
  }

  /**
   * 自动检测配置类型并解析
   * @param content 配置内容
   * @param dataId 数据ID，用于类型推断
   * @returns 解析后的配置对象
   */
  static async autoParseConfig(content: string, dataId?: string): Promise<ConfigParseResult> {
    // 根据dataId后缀推断类型
    let detectedType = ConfigType.YAML; // 默认类型

    if (dataId) {
      const extension = dataId.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'json':
          detectedType = ConfigType.JSON;
          break;
        case 'jsonc':
          detectedType = ConfigType.JSONC;
          break;
        case 'json5':
          detectedType = ConfigType.JSON5;
          break;
        case 'xml':
          detectedType = ConfigType.XML;
          break;
        case 'yaml':
        case 'yml':
          detectedType = ConfigType.YAML;
          break;
        case 'html':
        case 'htm':
          detectedType = ConfigType.HTML;
          break;
        case 'properties':
          detectedType = ConfigType.PROPERTIES;
          break;
        case 'txt':
          detectedType = ConfigType.TEXT;
          break;
      }
    }

    // 如果无法从文件名推断，尝试根据内容特征推断
    if (detectedType === ConfigType.YAML && dataId && !dataId.includes('.')) {
      const trimmedContent = content.trim();
      if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
        detectedType = ConfigType.JSON;
      } else if (trimmedContent.startsWith('<') && trimmedContent.includes('>')) {
        detectedType = ConfigType.XML;
      } else if (trimmedContent.includes('=') || trimmedContent.includes(':')) {
        // 简单的properties格式检测
        const lines = trimmedContent.split('\n');
        const hasPropertyFormat = lines.some((line) => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('#') && (trimmed.includes('=') || trimmed.includes(':'));
        });
        if (hasPropertyFormat) {
          detectedType = ConfigType.PROPERTIES;
        }
      }
    }

    debug(`自动检测配置类型: ${detectedType} (dataId: ${dataId})`);
    return await this.parseConfig(content, detectedType);
  }
}
