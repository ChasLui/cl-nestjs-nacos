# cl-nestjs-nacos Playground

这是一个完整的 NestJS 应用示例，演示如何使用 `cl-nestjs-nacos` 库进行 Nacos 配置中心集成。

## 🚀 快速开始

### 安装依赖

```bash
cd playground
npm install
```

### 启动应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

应用启动后，访问：

- 主页: http://localhost:3000
- API文档: http://localhost:3000/api
- 健康检查: http://localhost:3000/health

## 📋 功能演示

### 1. 基本配置获取

```bash
# 获取所有配置
curl http://localhost:3000/config

# 获取指定配置项
curl http://localhost:3000/config/server
curl http://localhost:3000/config/database
curl http://localhost:3000/config/features
```

### 2. 配置管理

```bash
# 重新加载配置
curl -X POST http://localhost:3000/config/reload

# 模拟配置变更
curl -X POST http://localhost:3000/config/simulate-change \
  -H "Content-Type: application/json" \
  -d '{
    "dataId": "app.yaml",
    "content": "server:\n  port: 4000\n  name: \"Updated App\""
  }'
```

### 3. 专门的配置示例

```bash
# 数据库配置示例
curl http://localhost:3000/config/demo/database

# 功能开关配置示例
curl http://localhost:3000/config/demo/features

# 消息配置示例
curl http://localhost:3000/config/demo/messages
```

## 🏗️ 项目结构

```
playground/
├── src/
│   ├── mocks/
│   │   └── nacos-mock.service.ts    # Mock Nacos 服务
│   ├── config-demo/
│   │   ├── config-demo.module.ts    # 配置演示模块
│   │   ├── config-demo.controller.ts # 配置相关接口
│   │   └── config-demo.service.ts   # 配置业务逻辑
│   ├── app.module.ts               # 主模块（集成Nacos）
│   ├── app.controller.ts           # 主控制器
│   ├── app.service.ts              # 主服务
│   └── main.ts                     # 应用入口
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## 🔧 配置说明

### Nacos模块配置

在 `app.module.ts` 中，我们这样配置 Nacos 模块：

```typescript
NacosModule.forRoot({
  server: 'http://localhost:8848',
  namespace: 'demo-namespace',
  accessKey: 'demo-access-key',
  secretKey: 'demo-secret-key',
  config: {
    dataId: 'app.yaml',
    group: 'DEFAULT_GROUP',
    type: 'yaml',
    subscribe: true,
    commons: [
      {
        dataId: 'common.properties',
        group: 'DEFAULT_GROUP',
        type: 'properties',
      },
      {
        dataId: 'microservice.json',
        group: 'DEFAULT_GROUP',
        type: 'json',
      },
    ],
  },
  enableEnvVars: true,
});
```

### Mock配置数据

Mock服务提供了以下配置：

1. **app.yaml** - 主配置文件（YAML格式）
   - 服务器配置
   - 数据库配置
   - Redis配置
   - 功能开关
   - 消息配置

2. **common.properties** - 公共配置（Properties格式）
   - 应用基本信息
   - 日志配置
   - 缓存配置

3. **microservice.json** - 微服务配置（JSON格式）
   - 服务信息
   - 端点配置
   - 超时和重试配置

## 🎯 使用示例

### 在Service中使用

```typescript
import { Injectable } from '@nestjs/common';
import { NacosService } from 'cl-nestjs-nacos';

@Injectable()
export class YourService {
  constructor(private readonly nacosService: NacosService) {}

  async getServerConfig() {
    // 获取服务器配置
    const serverConfig = await this.nacosService.getConfig('server');
    return serverConfig;
  }

  async getDatabaseConfig() {
    // 获取数据库配置
    const dbConfig = await this.nacosService.getConfig('database');
    return dbConfig;
  }

  async getAllConfig() {
    // 获取所有配置
    const allConfig = await this.nacosService.getConfig();
    return allConfig;
  }
}
```

### 监听配置变更

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NacosService } from 'cl-nestjs-nacos';

@Injectable()
export class ConfigListener implements OnModuleInit {
  constructor(private readonly nacosService: NacosService) {}

  onModuleInit() {
    // 监听配置就绪事件
    this.nacosService.on('ready', () => {
      console.log('配置已准备就绪');
    });

    // 可以监听配置变更事件（如果库支持）
    // this.nacosService.on('configChanged', (config) => {
    //   console.log('配置已更新:', config);
    // });
  }
}
```

## 🔍 API 文档

启动应用后，访问 http://localhost:3000/api 查看完整的 Swagger API 文档。

## 🧪 测试

```bash
# 运行测试
npm run test

# 运行测试并查看覆盖率
npm run test:cov

# 运行e2e测试
npm run test:e2e
```

## 📝 注意事项

1. **Mock服务**: 这个示例使用了Mock的Nacos服务，不需要真实的Nacos服务器
2. **配置格式**: 支持YAML、JSON、Properties等多种配置格式
3. **环境变量**: 启用了环境变量替换功能
4. **类型安全**: 所有配置访问都是类型安全的
5. **缓存机制**: 内置配置缓存，提高性能

## 🚀 部署

```bash
# 构建应用
npm run build

# 启动生产环境
npm run start:prod
```

## 📚 更多信息

- [cl-nestjs-nacos 文档](../README.md)
- [NestJS 官方文档](https://nestjs.com/)
- [Nacos 官方文档](https://nacos.io/)
