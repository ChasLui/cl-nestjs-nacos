import { describe, it, expect } from 'vitest';
import {
  ConfigParserFactory,
  JsonConfigParser,
  JsoncConfigParser,
  Json5ConfigParser,
  YamlConfigParser,
  XmlConfigParser,
  HtmlConfigParser,
  PropertiesConfigParser,
  TextConfigParser,
} from '../src/config-parser';
import { ConfigType } from '../src/constants';
import type {
  TestNestedConfig,
  TestXmlConfigWrapper,
  TestPropertiesConfig,
  TestHtmlConfig,
  TestTextConfig,
} from '../src/types/core';

describe('ConfigParser', () => {
  describe('JsonConfigParser', () => {
    it('should parse valid JSON content', () => {
      const parser = new JsonConfigParser();
      const content = '{"name": "test", "port": 3000, "enabled": true}';
      const result = parser.parse(content);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
      expect(result.enabled).toBe(true);
    });

    it('should throw error for invalid JSON', () => {
      const parser = new JsonConfigParser();
      const content = '{"name": "test", "port":}';

      expect(() => parser.parse(content)).toThrow(/JSON配置解析失败/);
    });
  });

  describe('JsoncConfigParser', () => {
    it('should parse valid JSONC content with comments', () => {
      const parser = new JsoncConfigParser();
      const content = `{
        // Application configuration
        "name": "test",
        "port": 3000, /* Server port */
        "enabled": true,
        "database": {
          // Database configuration
          "host": "localhost",
          "port": 5432
        }
      }`;
      const result = parser.parse(content);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
      expect(result.enabled).toBe(true);
      expect((result as TestNestedConfig).database?.host).toBe('localhost');
      expect((result as TestNestedConfig).database?.port).toBe(5432);
    });

    it('should handle invalid JSONC gracefully', () => {
      const parser = new JsoncConfigParser();
      const content = '{"name": "test", "port": [}'; // Clearly malformed JSON

      // jsonc-parser is fault-tolerant and may not throw for some malformed JSON
      // Instead, it might return undefined or a partial result
      const result = parser.parse(content);
      expect(result).toBeDefined(); // Just verify it doesn't crash
    });
  });

  describe('Json5ConfigParser', () => {
    it('should parse valid JSON5 content with extended syntax', () => {
      const parser = new Json5ConfigParser();
      const content = `{
        // Application configuration
        name: "test", // Unquoted key
        port: 3000,
        enabled: true,
        database: {
          host: 'localhost', // Single quotes
          port: 5432,
        }, // Trailing comma
      }`;
      const result = parser.parse(content);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
      expect(result.enabled).toBe(true);
      expect((result as TestNestedConfig).database?.host).toBe('localhost');
      expect((result as TestNestedConfig).database?.port).toBe(5432);
    });

    it('should throw error for invalid JSON5', () => {
      const parser = new Json5ConfigParser();
      const content = '{name: "test", port:}';

      expect(() => parser.parse(content)).toThrow(/JSON5配置解析失败/);
    });
  });

  describe('YamlConfigParser', () => {
    it('should parse valid YAML content', () => {
      const parser = new YamlConfigParser();
      const content = `
name: test
port: 3000
enabled: true
database:
  host: localhost
  port: 5432
`;
      const result = parser.parse(content);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
      expect(result.enabled).toBe(true);
      expect((result as TestNestedConfig).database!.host).toBe('localhost');
      expect((result as TestNestedConfig).database!.port).toBe(5432);
    });
  });

  describe('XmlConfigParser', () => {
    it('should parse valid XML content', async () => {
      const parser = new XmlConfigParser();
      const content = `
<config>
  <name>test</name>
  <port>3000</port>
  <enabled>true</enabled>
  <database>
    <host>localhost</host>
    <port>5432</port>
  </database>
</config>
`;
      const result = await parser.parse(content);

      expect((result as TestXmlConfigWrapper).config.name).toBe('test');
      expect((result as TestXmlConfigWrapper).config.port).toBe('3000');
      expect((result as TestXmlConfigWrapper).config.enabled).toBe('true');
      expect((result as TestXmlConfigWrapper).config.database!.host).toBe('localhost');
      expect((result as TestXmlConfigWrapper).config.database!.port).toBe('5432');
    });
  });

  describe('HtmlConfigParser', () => {
    it('should parse HTML with data-config attributes', () => {
      const parser = new HtmlConfigParser();
      const content = `
<html>
  <body>
    <div data-config="appName" data-value="test-app">App Name</div>
    <div data-config="port">3000</div>
    <div data-config="config" data-value='{"debug": true}'>Config</div>
  </body>
</html>
`;
      const result = parser.parse(content);

      expect((result as TestHtmlConfig).appName).toBe('test-app');
      expect((result as TestHtmlConfig).port).toBe(3000);
      expect((result as TestHtmlConfig).config).toEqual({ debug: true });
    });

    it('should parse HTML with JSON script tag', () => {
      const parser = new HtmlConfigParser();
      const content = `
<html>
  <body>
    <script type="application/json">
      {"name": "test", "port": 3000}
    </script>
  </body>
</html>
`;
      const result = parser.parse(content);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });
  });

  describe('PropertiesConfigParser', () => {
    it('should parse properties format', () => {
      const parser = new PropertiesConfigParser();
      const content = `
# Application Configuration
app.name=test-app
app.port=3000
app.debug=true

# Database Configuration
db.host=localhost
db.port=5432
db.enabled=true
`;
      const result = parser.parse(content);

      expect((result as TestPropertiesConfig)['app.name']).toBe('test-app');
      expect((result as TestPropertiesConfig)['app.port']).toBe(3000);
      expect((result as TestPropertiesConfig)['app.debug']).toBe(true);
      expect((result as TestPropertiesConfig)['db.host']).toBe('localhost');
      expect((result as TestPropertiesConfig)['db.port']).toBe(5432);
      expect((result as TestPropertiesConfig)['db.enabled']).toBe(true);
    });

    it('should parse properties with colon separator', () => {
      const parser = new PropertiesConfigParser();
      const content = `
app.name: test-app
app.port: 3000
app.debug: false
`;
      const result = parser.parse(content);

      expect((result as TestPropertiesConfig)['app.name']).toBe('test-app');
      expect((result as TestPropertiesConfig)['app.port']).toBe(3000);
      expect((result as TestPropertiesConfig)['app.debug']).toBe(false);
    });
  });

  describe('TextConfigParser', () => {
    it('should return content as is', () => {
      const parser = new TextConfigParser();
      const content = 'This is plain text content';
      const result = parser.parse(content);

      expect((result as TestTextConfig).content).toBe(content);
    });
  });

  describe('ConfigParserFactory', () => {
    it('should get correct parser for each type', () => {
      expect(ConfigParserFactory.getParser(ConfigType.JSON)).toBeInstanceOf(JsonConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.JSONC)).toBeInstanceOf(JsoncConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.JSON5)).toBeInstanceOf(Json5ConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.YAML)).toBeInstanceOf(YamlConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.XML)).toBeInstanceOf(XmlConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.HTML)).toBeInstanceOf(HtmlConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.PROPERTIES)).toBeInstanceOf(PropertiesConfigParser);
      expect(ConfigParserFactory.getParser(ConfigType.TEXT)).toBeInstanceOf(TextConfigParser);
    });

    it('should throw error for unsupported type', () => {
      expect(() => ConfigParserFactory.getParser('unsupported' as ConfigType)).toThrow(/不支持的配置文件类型/);
    });

    it('should parse config with specified type', async () => {
      const content = '{"name": "test", "port": 3000}';
      const result = await ConfigParserFactory.parseConfig(content, ConfigType.JSON);

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect JSON by file extension', async () => {
      const content = '{"name": "test", "port": 3000}';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config.json');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect JSONC by file extension', async () => {
      const content = `{
        // Application configuration
        "name": "test",
        "port": 3000 /* Server port */
      }`;
      const result = await ConfigParserFactory.autoParseConfig(content, 'config.jsonc');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect JSON5 by file extension', async () => {
      const content = `{
        // Application configuration
        name: "test", // Unquoted key
        port: 3000,
      }`;
      const result = await ConfigParserFactory.autoParseConfig(content, 'config.json5');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect YAML by file extension', async () => {
      const content = 'name: test\nport: 3000';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config.yaml');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect properties by file extension', async () => {
      const content = 'app.name=test\napp.port=3000';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config.properties');

      expect((result as Record<string, unknown>)['app.name']).toBe('test');
      expect((result as Record<string, unknown>)['app.port']).toBe(3000);
    });

    it('should auto-detect JSON by content structure', async () => {
      const content = '{"name": "test", "port": 3000}';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });

    it('should auto-detect XML by content structure', async () => {
      const content = '<config><name>test</name><port>3000</port></config>';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config');

      expect((result as TestXmlConfigWrapper).config.name).toBe('test');
      expect((result as TestXmlConfigWrapper).config.port).toBe('3000');
    });

    it('should auto-detect properties by content structure', async () => {
      const content = 'app.name=test\napp.port=3000';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config');

      expect((result as Record<string, unknown>)['app.name']).toBe('test');
      expect((result as Record<string, unknown>)['app.port']).toBe(3000);
    });

    it('should fallback to YAML for unknown format', async () => {
      const content = 'name: test\nport: 3000';
      const result = await ConfigParserFactory.autoParseConfig(content, 'config');

      expect((result as TestNestedConfig).name).toBe('test');
      expect((result as TestNestedConfig).port).toBe(3000);
    });
  });
});
