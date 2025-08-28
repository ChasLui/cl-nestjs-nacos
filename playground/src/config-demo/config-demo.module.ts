import { Module } from '@nestjs/common';
import { ConfigDemoController } from './config-demo.controller';
import { ConfigDemoService } from './config-demo.service';
import { MockNacosModule } from '../mocks/mock-nacos.module';

@Module({
  imports: [MockNacosModule],
  controllers: [ConfigDemoController],
  providers: [ConfigDemoService],
})
export class ConfigDemoModule {}
