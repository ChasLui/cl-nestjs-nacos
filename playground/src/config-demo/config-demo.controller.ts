import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ConfigDemoService } from './config-demo.service';

class SimulateChangeDto {
  dataId: string;
  content: string;
}

@ApiTags('nacos')
@Controller('config')
export class ConfigDemoController {
  constructor(private readonly configDemoService: ConfigDemoService) {}

  @Get()
  @ApiOperation({ summary: '获取所有配置' })
  @ApiResponse({ status: 200, description: '返回所有配置信息' })
  async getAllConfig() {
    return await this.configDemoService.getAllConfig();
  }

  @Get(':key')
  @ApiOperation({ summary: '获取指定配置项' })
  @ApiParam({ name: 'key', description: '配置键名' })
  @ApiResponse({ status: 200, description: '返回指定配置项的值' })
  @ApiResponse({ status: 404, description: '配置项不存在' })
  async getConfigByKey(@Param('key') key: string) {
    return await this.configDemoService.getConfigByKey(key);
  }

  @Post('reload')
  @ApiOperation({ summary: '重新加载配置' })
  @ApiResponse({ status: 200, description: '配置重新加载成功' })
  async reloadConfig() {
    return await this.configDemoService.reloadConfig();
  }

  @Post('simulate-change')
  @ApiOperation({ summary: '模拟配置变更' })
  @ApiBody({
    type: SimulateChangeDto,
    description: '模拟配置变更的数据',
    examples: {
      yaml: {
        summary: 'YAML配置变更示例',
        value: {
          dataId: 'app.yaml',
          content: 'server:\n  port: 4000\n  name: "Updated NestJS App"',
        },
      },
      properties: {
        summary: 'Properties配置变更示例',
        value: {
          dataId: 'common.properties',
          content: 'app.name=Updated App\napp.version=2.0.0',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '配置变更模拟成功' })
  async simulateConfigChange(@Body() body: SimulateChangeDto) {
    return await this.configDemoService.simulateConfigChange(body.dataId, body.content);
  }

  @Get('demo/database')
  @ApiOperation({ summary: '获取数据库配置示例' })
  @ApiResponse({ status: 200, description: '返回数据库配置' })
  async getDatabaseConfig() {
    return await this.configDemoService.getDatabaseConfig();
  }

  @Get('demo/features')
  @ApiOperation({ summary: '获取功能开关配置示例' })
  @ApiResponse({ status: 200, description: '返回功能开关配置' })
  async getFeaturesConfig() {
    return await this.configDemoService.getFeaturesConfig();
  }

  @Get('demo/messages')
  @ApiOperation({ summary: '获取消息配置示例' })
  @ApiResponse({ status: 200, description: '返回消息配置' })
  async getMessagesConfig() {
    return await this.configDemoService.getMessagesConfig();
  }
}
