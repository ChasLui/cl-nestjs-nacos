import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());

  // 启用CORS
  app.enableCors();

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('cl-nestjs-nacos Playground')
    .setDescription('NestJS Nacos集成示例应用')
    .setVersion('1.0')
    .addTag('nacos', 'Nacos配置管理相关接口')
    .addTag('demo', '演示接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('🚀 cl-nestjs-nacos Playground 启动成功!');
  console.log(`📝 应用运行在: http://localhost:${port}`);
  console.log(`📚 API文档地址: http://localhost:${port}/api`);
  console.log('');
  console.log('🎯 可用的演示接口:');
  console.log('  GET  /           - 应用信息');
  console.log('  GET  /config     - 获取所有配置');
  console.log('  GET  /config/:key - 获取指定配置');
  console.log('  POST /config/reload - 重新加载配置');
  console.log('  POST /config/simulate-change - 模拟配置变更');
  console.log('  GET  /health     - 健康检查');
}

bootstrap();
