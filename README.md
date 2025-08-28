<p align="center">
  <a href="http://nestjs.com"><img alt="Nest Logo" src="https://nestjs.com/img/logo-small.svg" width="120"></a>
</p>

<h1 align="center">
  cl-nestjs-nacos
</h1>

[![npm version](https://badge.fury.io/js/cl-nestjs-nacos.svg)](https://badge.fury.io/js/cl-nestjs-nacos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/ChasLui/nest-js-nacos/workflows/Build%20%26%20Test/badge.svg)](https://github.com/ChasLui/nest-js-nacos/actions)
[![Coverage Status](https://coveralls.io/repos/github/ChasLui/nest-js-nacos/badge.svg?branch=main)](https://coveralls.io/github/ChasLui/nest-js-nacos?branch=main)
[![codecov](https://codecov.io/gh/ChasLui/nest-js-nacos/branch/main/graph/badge.svg)](https://codecov.io/gh/ChasLui/nest-js-nacos)

> 基于 NestJS 框架的 Nacos 集成模块，支持服务注册发现和配置管理

## 特性

- 🚀 **双模式支持**: 完整模式（服务注册 + 配置管理）和仅配置模式
- 📦 **双模块格式**: 同时支持 ESM 和 CJS，兼容所有 Node.js 环境
- 📝 **多格式配置**: 支持 JSON、JSONC、JSON5、YAML、XML、Properties、HTML、Text 等格式
- 🔄 **配置热更新**: 支持配置订阅和动态更新
- 🌍 **环境变量**: 支持环境变量占位符和默认值
- 🎯 **类型安全**: 完整的 TypeScript 类型支持和类型守卫
- 🔧 **智能检测**: 自动配置格式检测和降级策略
- 📦 **轻量级**: 最小化依赖，高性能
- 🛡️ **错误处理**: 结构化错误类和详细调试信息
- ⚡ **性能优化**: 内置 LRU 缓存和内存管理
- 🔌 **可扩展**: 插件化架构，支持自定义解析器
- ✅ **全面测试**: 完整的 CI/CD 流程和模块兼容性测试

## 安装

```bash
npm install cl-nestjs-nacos
# 或
yarn add cl-nestjs-nacos
# 或
pnpm add cl-nestjs-nacos
```

### 模块格式支持

此库同时支持 ESM 和 CJS 模块格式，可以在任何 Node.js 环境中使用：

```typescript
// ESM (ES Modules)
import { NacosModule, NacosService } from 'cl-nestjs-nacos';
import { NacosError } from 'cl-nestjs-nacos/errors';

// CJS (CommonJS)
const { NacosModule, NacosService } = require('cl-nestjs-nacos');
const { NacosError } = require('cl-nestjs-nacos/errors');
```

支持的子模块导入路径：

- `cl-nestjs-nacos/errors` - 错误处理类
- `cl-nestjs-nacos/cache` - 缓存功能
- `cl-nestjs-nacos/base` - 基础抽象类

## 快速开始

### 完整模式（服务注册 + 配置管理）

```typescript
import { Module, OnModuleInit, Injectable } from '@nestjs/common';
import { NacosService, NacosModule, ConfigType } from 'cl-nestjs-nacos';

@Module({
  imports: [
    NacosModule.forRoot({
      server: process.env.NACOS_SERVER || 'localhost:8848',
      accessKey: process.env.NACOS_ACCESS_KEY,
      secretKey: process.env.NACOS_SECRET_KEY,
      namespace: process.env.NACOS_NAMESPACE || 'public',
      config: {
        group: process.env.NACOS_GROUP || 'DEFAULT_GROUP',
        dataId: process.env.NACOS_DATA_ID || 'application.yaml',
        type: ConfigType.YAML, // 可选：指定配置文件类型
        subscribe: true, // 启用配置热更新
        commons: [
          // 公共配置文件
          {
            group: 'SHARED_GROUP',
            dataId: 'database.properties',
            type: ConfigType.PROPERTIES,
          },
        ],
      },
    }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  async onModuleInit(): Promise<void> {
    // 注册服务到 Nacos
    await this.nacos.register('my-service');
  }
}

@Injectable()
export class AppService {
  constructor(private readonly nacos: NacosService) {}

  async getAppConfig() {
    // 获取完整配置
    const config = await this.nacos.getConfig();
    return config;
  }

  async getDatabaseConfig() {
    // 获取特定配置项
    const dbConfig = await this.nacos.getConfig<{
      host: string;
      port: number;
      username: string;
      password: string;
    }>('database');
    return dbConfig;
  }
}
```

### 仅配置模式（只获取配置，不注册服务）

```typescript
import { Module, Injectable } from '@nestjs/common';
import { NacosConfigService, NacosModule, ConfigType } from 'cl-nestjs-nacos';

@Module({
  imports: [
    NacosModule.forRoot({
      server: process.env.NACOS_SERVER || 'localhost:8848',
      accessKey: process.env.NACOS_ACCESS_KEY,
      secretKey: process.env.NACOS_SECRET_KEY,
      namespace: process.env.NACOS_NAMESPACE || 'public',
      configOnly: true, // 启用仅配置模式
      config: {
        group: process.env.NACOS_GROUP || 'DEFAULT_GROUP',
        dataId: process.env.NACOS_DATA_ID || 'application.yaml',
        subscribe: true, // 支持配置热更新
        commons: [
          {
            group: 'SHARED_GROUP',
            dataId: 'redis.json',
            type: ConfigType.JSON,
          },
        ],
      },
    }),
  ],
})
export class AppModule {}

@Injectable()
export class ConfigService {
  constructor(private readonly nacosConfig: NacosConfigService) {}

  async getConfig<T = any>(key?: string): Promise<T> {
    return await this.nacosConfig.getConfig<T>(key);
  }

  async getRedisConfig() {
    const config = await this.nacosConfig.getConfig<{
      host: string;
      port: number;
      db: number;
    }>('redis');
    return config;
  }
}
```

## 配置管理

### 支持的配置格式

cl-nestjs-nacos 支持多种配置文件格式的解析：

| 格式           | 扩展名          | 说明                               |
| -------------- | --------------- | ---------------------------------- |
| **JSON**       | `.json`         | 标准 JSON 格式                     |
| **JSONC**      | `.jsonc`        | JSON with Comments                 |
| **JSON5**      | `.json5`        | JSON5 格式                         |
| **YAML**       | `.yaml`, `.yml` | YAML 格式（默认）                  |
| **XML**        | `.xml`          | XML 格式                           |
| **Properties** | `.properties`   | Java Properties 格式               |
| **HTML**       | `.html`, `.htm` | HTML 格式（提取 data-config 属性） |
| **Text**       | `.txt`          | 纯文本格式                         |

### 配置格式使用

#### 1. 明确指定配置类型

```typescript
import { ConfigType } from 'cl-nestjs-nacos';

NacosModule.forRoot({
  // ... 其他配置
  config: {
    group: 'DEFAULT_GROUP',
    dataId: 'config.json',
    type: ConfigType.JSON, // 明确指定为JSON格式
    commons: [
      {
        group: 'SHARED_GROUP',
        dataId: 'database.properties',
        type: ConfigType.PROPERTIES, // 明确指定为Properties格式
      },
    ],
  },
});
```

#### 2. 自动格式检测

系统会根据 `dataId` 的文件扩展名自动检测格式：

```typescript
NacosModule.forRoot({
  // ... 其他配置
  config: {
    group: 'DEFAULT_GROUP',
    dataId: 'config.json', // 自动检测为JSON格式
    commons: [
      {
        group: 'SHARED_GROUP',
        dataId: 'app.yaml', // 自动检测为YAML格式
      },
      {
        group: 'DB_GROUP',
        dataId: 'database.properties', // 自动检测为Properties格式
      },
    ],
  },
});
```

#### 3. 智能内容检测

当无法从文件名推断格式时，系统会根据内容特征自动检测：

- 以 `{` 开头和 `}` 结尾 → JSON 格式
- 以 `<` 开头且包含 `>` → XML 格式
- 包含 `key=value` 或 `key:value` 格式 → Properties 格式
- 其他情况 → YAML 格式（默认）

### 配置格式示例

#### JSON 格式

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "${DB_PASSWORD}"
  },
  "redis": {
    "host": "${REDIS_HOST:redis-server}",
    "port": 6379
  }
}
```

#### YAML 格式

```yaml
database:
  host: localhost
  port: 3306
  username: root
  password: ${DB_PASSWORD}

redis:
  host: ${REDIS_HOST:redis-server}
  port: 6379

app:
  name: ${APP_NAME:my-app}
  version: '1.0.0'
```

#### Properties 格式

```properties
# Database Configuration
database.host=localhost
database.port=3306
database.username=root
database.password=${DB_PASSWORD}

# Redis Configuration
redis.host=${REDIS_HOST:redis-server}
redis.port=6379

# App Configuration
app.name=${APP_NAME:my-app}
app.version=1.0.0
```

#### XML 格式

```xml
<config>
  <database>
    <host>localhost</host>
    <port>3306</port>
    <username>root</username>
    <password>${DB_PASSWORD}</password>
  </database>
  <redis>
    <host>${REDIS_HOST:redis-server}</host>
    <port>6379</port>
  </redis>
</config>
```

#### HTML 格式

```html
<html>
  <body>
    <div data-config="database.host" data-value="localhost">Database Host</div>
    <div data-config="database.port">3306</div>
    <div data-config="database.password">${DB_PASSWORD}</div>

    <!-- 或者使用 script 标签 -->
    <script type="application/json">
      {
        "redis": {
          "host": "${REDIS_HOST:redis-server}",
          "port": 6379
        }
      }
    </script>
  </body>
</html>
```

## 环境变量支持

cl-nestjs-nacos 支持在配置中使用环境变量占位符，提供了灵活的配置管理方式。

### 占位符语法

```typescript
// 基本语法
${VARIABLE_NAME}

// 带默认值的语法
${VARIABLE_NAME:default_value}
```

### 使用示例

```typescript
// 在任何支持的配置格式中使用
{
  "database": {
    "host": "${DB_HOST:localhost}",        // 如果 DB_HOST 未设置，使用 localhost
    "port": "${DB_PORT:3306}",             // 如果 DB_PORT 未设置，使用 3306
    "username": "${DB_USERNAME}",          // 必须设置 DB_USERNAME
    "password": "${DB_PASSWORD}"           // 必须设置 DB_PASSWORD
  },
  "app": {
    "port": "${PORT:8080}",                // 应用端口，默认 8080
    "env": "${NODE_ENV:development}"       // 环境，默认 development
  }
}
```

### 启用/禁用环境变量替换

```typescript
NacosModule.forRoot({
  server: process.env.NACOS_SERVER,
  // ... 其他配置
  enableEnvVars: true, // 默认为 true，启用环境变量替换
  config: {
    // ... 配置选项
  },
});
```

### 环境变量配置示例

```bash
# .env 文件
NACOS_SERVER=nacos.example.com:8848
NACOS_ACCESS_KEY=your_access_key
NACOS_SECRET_KEY=your_secret_key
NACOS_NAMESPACE=production

DB_HOST=prod-db.example.com
DB_PORT=5432
DB_USERNAME=app_user
DB_PASSWORD=secure_password

REDIS_HOST=redis.example.com
APP_NAME=my-production-app
```

## 配置订阅与热更新

支持配置的动态订阅和热更新，无需重启应用即可获取最新配置。

### 启用配置订阅

```typescript
NacosModule.forRoot({
  // ... 其他配置
  config: {
    group: 'DEFAULT_GROUP',
    dataId: 'application.yaml',
    subscribe: true, // 启用配置订阅
    commons: [
      {
        group: 'SHARED_GROUP',
        dataId: 'database.yaml',
        // commons 中的配置不会自动订阅，只有主配置会被订阅
      },
    ],
  },
});
```

### 监听配置变更

```typescript
@Injectable()
export class ConfigWatcherService implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  onModuleInit() {
    // 监听配置准备就绪事件
    this.nacos.on('ready', () => {
      console.log('Nacos 配置已准备就绪');
    });

    // 注意：配置更新是自动的，会直接更新内部配置对象
    // 如果需要在配置更新时执行特定逻辑，可以定期检查配置变化
  }
}
```

## 高级用法

### 多环境配置

```typescript
// 根据环境加载不同配置
const getConfigByEnv = (env: string) => {
  const baseConfig = {
    server: process.env.NACOS_SERVER,
    accessKey: process.env.NACOS_ACCESS_KEY,
    secretKey: process.env.NACOS_SECRET_KEY,
    namespace: process.env.NACOS_NAMESPACE,
  };

  if (env === 'production') {
    return {
      ...baseConfig,
      config: {
        group: 'PROD_GROUP',
        dataId: 'application-prod.yaml',
        subscribe: true,
      },
    };
  } else if (env === 'staging') {
    return {
      ...baseConfig,
      config: {
        group: 'STAGING_GROUP',
        dataId: 'application-staging.yaml',
        subscribe: true,
      },
    };
  } else {
    return {
      ...baseConfig,
      configOnly: true,
      config: {
        group: 'DEV_GROUP',
        dataId: 'application-dev.yaml',
      },
    };
  }
};

@Module({
  imports: [NacosModule.forRoot(getConfigByEnv(process.env.NODE_ENV))],
})
export class AppModule {}
```

### 配置验证

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NacosService } from 'cl-nestjs-nacos';

interface AppConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
  };
}

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  async onModuleInit() {
    try {
      const config = await this.nacos.getConfig<AppConfig>();

      // 验证必需的配置项
      this.validateConfig(config);

      console.log('配置验证通过');
    } catch (error) {
      console.error('配置验证失败:', error.message);
      process.exit(1);
    }
  }

  private validateConfig(config: AppConfig) {
    if (!config.database?.host) {
      throw new Error('数据库主机配置缺失');
    }

    if (!config.database?.port || config.database.port <= 0) {
      throw new Error('数据库端口配置无效');
    }

    // 更多验证逻辑...
  }
}
```

### 动态配置更新处理

```typescript
@Injectable()
export class DynamicConfigService implements OnModuleInit {
  private currentConfig: any;

  constructor(private readonly nacos: NacosService) {}

  async onModuleInit() {
    // 初始化配置
    this.currentConfig = await this.nacos.getConfig();

    // 定期检查配置变化（因为配置订阅会自动更新内部配置）
    setInterval(async () => {
      const newConfig = await this.nacos.getConfig();
      if (JSON.stringify(newConfig) !== JSON.stringify(this.currentConfig)) {
        console.log('检测到配置变更');
        await this.handleConfigChange(this.currentConfig, newConfig);
        this.currentConfig = newConfig;
      }
    }, 5000); // 每5秒检查一次
  }

  private async handleConfigChange(oldConfig: any, newConfig: any) {
    // 处理配置变更逻辑
    console.log('配置已更新:', {
      old: oldConfig,
      new: newConfig,
    });

    // 例如：重新初始化数据库连接、重载缓存等
  }
}
```

### 错误处理

```typescript
import { ConfigError, ServiceError, ValidationError, ConnectionError } from 'cl-nestjs-nacos';

try {
  const config = await this.nacos.getConfig('non-existent-key');
} catch (error) {
  if (error instanceof ConfigError) {
    console.log('配置错误:', error.message, error.context);
  } else if (error instanceof ServiceError) {
    console.log('服务错误:', error.message, error.context);
  }
}
```

## API 参考

### NacosModule

#### `forRoot(options: NacosOptions, global?: boolean): DynamicModule`

创建 Nacos 模块的根模块。

**参数:**

| 参数      | 类型           | 必填 | 默认值 | 说明           |
| --------- | -------------- | ---- | ------ | -------------- |
| `options` | `NacosOptions` | ✅   | -      | Nacos 配置选项 |
| `global`  | `boolean`      | ❌   | `true` | 是否为全局模块 |

### NacosOptions

Nacos 模块配置选项接口。

```typescript
interface NacosOptions {
  server: string; // Nacos 服务器地址
  namespace: string; // 命名空间
  accessKey?: string; // 访问密钥
  secretKey?: string; // 密钥
  enableEnvVars?: boolean; // 是否启用环境变量替换（默认: true）
  configOnly?: boolean; // 是否仅配置模式（默认: false）
  config?: {
    group: string; // 配置分组
    dataId: string; // 配置数据ID
    type?: ConfigType; // 可选：配置文件类型, 如果不传自动识别
    subscribe?: boolean; // 是否订阅配置变更
    commons?: BaseConfig[]; // 公共配置文件
  };
}
```

### NacosService

完整模式下的主要服务类，提供服务注册和配置管理功能。

#### `getConfig<T>(key?: string): Promise<T>`

获取配置数据。

**参数:**

- `key` (可选): 配置键名，如果不提供则返回完整配置对象

**返回值:**

- `Promise<T>`: 配置数据

**示例:**

```typescript
// 获取完整配置
const fullConfig = await nacos.getConfig();

// 获取特定配置项
const dbConfig = await nacos.getConfig<DatabaseConfig>('database');
```

#### `register(name: string, enable?: boolean): Promise<boolean>`

注册服务到 Nacos。

**参数:**

- `name`: 服务名称
- `enable` (可选): 是否启用注册（默认: 非开发环境为 `true`）

**返回值:**

- `Promise<boolean>`: 注册是否成功

**示例:**

```typescript
// 注册服务
await nacos.register('my-service');

// 强制注册（即使在开发环境）
await nacos.register('my-service', true);
```

### NacosConfigService

仅配置模式下的服务类，只提供配置管理功能。

#### 方法

**`getConfig<T>(key?: string): Promise<T>`**

获取配置数据（与 NacosService 中的方法相同）。

### ConfigType 枚举

支持的配置文件类型枚举。

```typescript
enum ConfigType {
  TEXT = 'text',
  JSON = 'json',
  JSONC = 'jsonc',
  JSON5 = 'json5',
  XML = 'xml',
  YAML = 'yaml',
  HTML = 'html',
  PROPERTIES = 'properties',
}
```

### 事件

NacosService 继承自 EventEmitter，支持以下事件：

#### `ready`

配置加载完成并准备就绪时触发。

```typescript
nacos.on('ready', () => {
  console.log('Nacos 配置已准备就绪');
});
```

## 错误处理系统

### 错误类层次

```typescript
NacosError (抽象基类)
├── ConfigError      # 配置相关错误
├── ServiceError     # 服务注册错误
├── ValidationError  # 验证错误
└── ConnectionError  # 连接错误
```

### 错误类详情

#### ConfigError - 配置相关错误

```typescript
class ConfigError extends NacosError {
  static configNotFound(key: string): ConfigError;
  static parseError(content: string, type?: string): ConfigError;
  static loadError(dataId: string, group: string, error: Error): ConfigError;
}
```

#### ServiceError - 服务注册相关错误

```typescript
class ServiceError extends NacosError {
  static registrationFailed(serviceName: string, error: Error): ServiceError;
  static deregistrationFailed(serviceName: string, error: Error): ServiceError;
  static ipResolutionFailed(): ServiceError;
}
```

#### ValidationError - 验证相关错误

```typescript
class ValidationError extends NacosError {
  static requiredOptionMissing(option: string): ValidationError;
  static invalidOptionValue(option: string, value: unknown, expected?: string): ValidationError;
}
```

#### ConnectionError - 连接相关错误

```typescript
class ConnectionError extends NacosError {
  static clientInitializationFailed(error: Error): ConnectionError;
  static serverUnreachable(server: string): ConnectionError;
}
```

### 错误处理特性

- **结构化错误**：包含上下文信息
- **错误代码**：便于程序化处理
- **调试支持**：详细的错误信息
- **JSON 序列化**：支持日志记录

## 缓存系统

### 缓存特性

- **TTL 支持**：可配置过期时间
- **LRU 策略**：最近最少使用淘汰
- **自动清理**：定期清理过期项
- **内存优化**：防止内存泄漏

### 缓存配置

```typescript
interface ConfigCacheOptions {
  defaultTTL?: number; // 默认TTL（毫秒）
  maxSize?: number; // 最大缓存条目数
  cleanupInterval?: number; // 清理间隔（毫秒）
}
```

### 性能优化

#### 1. 缓存策略

- 配置结果缓存
- TTL 和 LRU 结合
- 智能缓存失效

#### 2. 内存管理

- 弱引用使用
- 定期垃圾回收
- 内存泄漏防护

#### 3. 网络优化

- 连接复用
- 请求去重
- 超时控制

## 故障排除

### 常见问题

#### 1. 连接 Nacos 服务器失败

**错误信息:**

```text
Error: connect ECONNREFUSED 127.0.0.1:8848
```

**解决方案:**

- 检查 Nacos 服务器是否正常运行
- 验证服务器地址和端口是否正确
- 检查网络连接和防火墙设置
- 确保 accessKey 和 secretKey 正确

```typescript
// 检查连接配置
NacosModule.forRoot({
  server: 'http://nacos.example.com:8848', // 确保地址正确
  accessKey: process.env.NACOS_ACCESS_KEY,
  secretKey: process.env.NACOS_SECRET_KEY,
  namespace: process.env.NACOS_NAMESPACE,
});
```

#### 2. 配置加载失败

**错误信息:**

```text
Error: config must not be null!dataId:application.yaml,group:DEFAULT_GROUP
```

**解决方案:**

- 检查 dataId 和 group 是否存在于 Nacos 中
- 验证命名空间是否正确
- 确保有读取配置的权限

```typescript
// 添加错误处理
@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  async onModuleInit() {
    try {
      await this.nacos.getConfig();
      console.log('配置加载成功');
    } catch (error) {
      console.error('配置加载失败:', error.message);
      // 可以使用默认配置或退出应用
    }
  }
}
```

#### 3. 环境变量替换不生效

**问题:** 配置中的 `${VARIABLE_NAME}` 没有被替换

**解决方案:**

- 确保 `enableEnvVars` 设置为 `true`（默认值）
- 检查环境变量是否正确设置
- 验证环境变量名称是否匹配

```bash
# 检查环境变量
echo $DB_HOST
echo $DB_PORT

# 或在 Node.js 中
console.log(process.env.DB_HOST);
```

### 调试技巧

#### 1. 启用调试日志

```bash
# 启用 Nacos 相关的调试日志
DEBUG=nacos* npm start

# 或者只启用特定模块的日志
DEBUG=nacos:config-parser npm start
```

#### 2. 检查配置内容

```typescript
@Injectable()
export class DebugService implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  async onModuleInit() {
    // 打印完整配置用于调试
    const config = await this.nacos.getConfig();
    console.log('当前配置:', JSON.stringify(config, null, 2));
  }
}
```

#### 3. 监控配置变更

```typescript
@Injectable()
export class ConfigMonitorService implements OnModuleInit {
  constructor(private readonly nacos: NacosService) {}

  onModuleInit() {
    this.nacos.on('ready', () => {
      console.log('✅ Nacos 配置已加载');
    });

    // 定期检查配置状态
    setInterval(async () => {
      try {
        const config = await this.nacos.getConfig();
        console.log('配置检查正常', Object.keys(config));
      } catch (error) {
        console.error('❌ 配置检查失败:', error.message);
      }
    }, 30000); // 每30秒检查一次
  }
}
```

### 性能优化建议

#### 1. 减少配置获取频率

```typescript
@Injectable()
export class CachedConfigService {
  private configCache = new Map<string, { value: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30秒缓存

  constructor(private readonly nacos: NacosService) {}

  async getConfig<T>(key?: string): Promise<T> {
    const cacheKey = key || 'full';
    const cached = this.configCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const config = await this.nacos.getConfig<T>(key);
    this.configCache.set(cacheKey, {
      value: config,
      timestamp: Date.now(),
    });

    return config;
  }
}
```

#### 2. 延迟加载非关键配置

```typescript
@Injectable()
export class LazyConfigService {
  constructor(private readonly nacos: NacosService) {}

  async getCriticalConfig() {
    // 立即加载关键配置
    return await this.nacos.getConfig('database');
  }

  async getNonCriticalConfig() {
    // 延迟加载非关键配置
    setTimeout(async () => {
      const config = await this.nacos.getConfig('features');
      // 处理非关键配置
    }, 5000);
  }
}
```

## 向后兼容性

- ✅ 现有的 YAML 配置无需修改，继续正常工作
- ✅ 解析失败时会自动回退到 YAML 格式
- ✅ 如果 YAML 也解析失败，会返回原始文本内容
- ✅ 支持渐进式迁移到新的配置格式

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/chaslui/cl-nestjs-nacos.git
cd nestjs-nacos

# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build

# 代码检查
pnpm lint
```

## 许可证

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可证。

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的更新历史。

---

如果您觉得这个项目有用，请给它一个 ⭐️！
