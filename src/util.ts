// 导入类型定义
import type { ConfigObject } from './types';

export class Util {
  // 使用类型体操中的EnvReplacer类型约束，并增强类型安全性
  static replacePlaceholdersWithEnvVars<T extends ConfigObject>(obj: T): T {
    const rex = /\$\{([A-Z_]+)}/g;

    function replaceValue<V>(value: V): V {
      if (typeof value === 'string') {
        return value.replace(rex, (match, envVar) => {
          return process.env[envVar] ?? match;
        }) as V;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const result = {} as V;
        for (const k in value) {
          if (Object.hasOwn(value, k)) {
            (result as Record<string, unknown>)[k] = replaceValue((value as Record<string, unknown>)[k]);
          }
        }
        return result;
      } else if (Array.isArray(value)) {
        return value.map((item) => replaceValue(item)) as V;
      }

      return value;
    }

    return replaceValue(obj);
  }
}
