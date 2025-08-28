import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { NacosService } from './nacos.service';
import { NacosConfigService } from './nacos-config.service';
import { NacosOptions } from './types';
import { NACOS_OPTIONS } from './constants';

@Module({})
export class NacosModule {
  static forRoot(options: NacosOptions, global = true): DynamicModule {
    const providers: Provider[] = [
      {
        provide: NACOS_OPTIONS,
        useValue: options,
      },
    ];

    const exports: (string | symbol | Type<unknown> | Provider)[] = [];

    // 根据配置决定提供哪个服务
    if (options.configOnly) {
      // 仅配置模式，只提供配置服务
      providers.push(NacosConfigService);
      exports.push(NacosConfigService);
    } else {
      // 完整模式，提供完整的Nacos服务（包含配置和服务注册）
      providers.push(NacosService);
      exports.push(NacosService);
    }

    return {
      global,
      module: NacosModule,
      providers,
      exports,
    };
  }
}
