import { Injectable, Inject } from '@nestjs/common';
import { AbstractNacosClient } from './base/abstract-nacos-client';
import { NacosOptions } from './types';
import { NACOS_OPTIONS } from './constants';

/**
 * Nacos配置服务
 * 专门用于配置管理，不包含服务注册功能
 */
@Injectable()
export class NacosConfigService extends AbstractNacosClient {
  constructor(@Inject(NACOS_OPTIONS) options: NacosOptions) {
    super(options, 'nacos-config');
  }
}
