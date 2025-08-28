import { describe, it, expect } from 'vitest';
import { isConfigOnlyOptions, isFullOptions } from '../src/types/service';
import type { NacosOptions, NacosConfigOnlyOptions, NacosFullOptions } from '../src/types';

describe('Types Module', () => {
  describe('Type Guards', () => {
    it('should correctly identify config-only options', () => {
      const configOnlyOptions: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        configOnly: true,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'application.yaml',
        },
      };

      expect(isConfigOnlyOptions(configOnlyOptions)).toBe(true);
      expect(isFullOptions(configOnlyOptions)).toBe(false);
    });

    it('should correctly identify full options', () => {
      const fullOptions: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        configOnly: false,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'application.yaml',
        },
      };

      expect(isFullOptions(fullOptions)).toBe(true);
      expect(isConfigOnlyOptions(fullOptions)).toBe(false);
    });

    it('should treat undefined configOnly as full options', () => {
      const undefinedOptions: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        // configOnly is undefined
      };

      expect(isFullOptions(undefinedOptions)).toBe(true);
      expect(isConfigOnlyOptions(undefinedOptions)).toBe(false);
    });

    it('should handle options with optional fields', () => {
      const optionsWithOptionals: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        accessKey: 'test-key',
        secretKey: 'test-secret',
        enableEnvVars: true,
        configOnly: true,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'application.yaml',
          subscribe: true,
          commons: [
            {
              group: 'COMMON_GROUP',
              dataId: 'common.yaml',
            },
          ],
        },
      };

      expect(isConfigOnlyOptions(optionsWithOptionals)).toBe(true);
      expect(isFullOptions(optionsWithOptionals)).toBe(false);
    });

    it('should work with type narrowing', () => {
      const options: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        configOnly: true,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'application.yaml',
        },
      };

      if (isConfigOnlyOptions(options)) {
        // TypeScript should narrow the type to NacosConfigOnlyOptions
        expect(options.configOnly).toBe(true);
        expect(options.config).toBeDefined();
      }

      if (isFullOptions(options)) {
        // This shouldn't execute for config-only options
        expect(true).toBe(false);
      }
    });

    it('should handle edge cases', () => {
      const minimalOptions: NacosOptions = {
        server: 'localhost:8848',
        namespace: 'test',
      };

      // No configOnly specified should be treated as full options
      expect(isFullOptions(minimalOptions)).toBe(true);
      expect(isConfigOnlyOptions(minimalOptions)).toBe(false);
    });
  });

  describe('Type Compatibility', () => {
    it('should ensure type compatibility between interfaces', () => {
      // Test that NacosConfigOnlyOptions is compatible with NacosOptions
      const configOnly: NacosConfigOnlyOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        configOnly: true,
        config: {
          group: 'DEFAULT_GROUP',
          dataId: 'application.yaml',
        },
      };

      const asNacosOptions: NacosOptions = configOnly;
      expect(asNacosOptions.configOnly).toBe(true);
    });

    it('should ensure NacosFullOptions compatibility', () => {
      // Test that NacosFullOptions is compatible with NacosOptions
      const fullOptions: NacosFullOptions = {
        server: 'localhost:8848',
        namespace: 'test',
        configOnly: false,
      };

      const asNacosOptions: NacosOptions = fullOptions;
      expect(asNacosOptions.configOnly).toBe(false);
    });
  });
});
