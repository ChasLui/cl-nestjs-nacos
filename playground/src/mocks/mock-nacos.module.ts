import { Module } from '@nestjs/common';
import { MockNacosService } from './mock-nacos.service';

@Module({
  providers: [MockNacosService],
  exports: [MockNacosService],
})
export class MockNacosModule {}
