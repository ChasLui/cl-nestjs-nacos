import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigDemoModule } from './config-demo/config-demo.module';
import { MockNacosModule } from './mocks/mock-nacos.module';

// 引入我们的Nacos模块
// 注意：在实际项目中，这里应该是从 'cl-nestjs-nacos' 导入
// 但在playground中，我们直接从源码导入
import { NacosModule } from 'cl-nestjs-nacos';
import { ConfigType } from 'cl-nestjs-nacos';

// 根据环境变量决定使用真实的Nacos还是Mock
const useMock = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_NACOS === 'true';

console.log(`🔧 Playground模式: ${useMock ? 'Mock Nacos' : 'Real Nacos'}`);

@Module({
  imports: [
    // 根据环境选择使用Mock还是真实的Nacos
    ...(useMock
      ? [MockNacosModule]
      : [
          NacosModule.forRoot({
            server: 'http://localhost:8848',
            namespace: 'demo-namespace',
            accessKey: 'demo-access-key',
            secretKey: 'demo-secret-key',
            config: {
              dataId: 'app.yaml',
              group: 'DEFAULT_GROUP',
              type: ConfigType.YAML,
              subscribe: true,
              commons: [
                {
                  dataId: 'common.properties',
                  group: 'DEFAULT_GROUP',
                  type: ConfigType.PROPERTIES,
                },
                {
                  dataId: 'microservice.json',
                  group: 'DEFAULT_GROUP',
                  type: ConfigType.JSON,
                },
              ],
            },
            enableEnvVars: true,
          }),
        ]),

    // 配置演示模块
    ConfigDemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
