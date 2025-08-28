import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'cl-nestjs-nacos Playground',
      description: 'NestJS Nacos集成库的演示应用',
      version: '1.0.0',
      features: [
        '🔧 Nacos配置中心集成',
        '⚡ 自动配置加载和缓存',
        '🔄 实时配置变更订阅',
        '🎯 类型安全的配置访问',
        '🛡️ 环境变量替换',
        '📝 多种配置格式支持 (YAML, JSON, Properties)',
      ],
      endpoints: {
        config: '/config - 配置管理接口',
        health: '/health - 健康检查',
        docs: '/api - API文档',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
