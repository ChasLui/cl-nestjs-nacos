import { resolve } from 'path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  declaration: true,
  entries: [
    // 主入口
    'src/index',
    // 子模块入口，支持更好的 tree-shaking
    'src/errors/index',
    'src/cache/index',
    'src/base/index',
  ],
  alias: {
    '@': resolve(__dirname, './src'),
    '~': resolve(__dirname, './playground'),
  },
  rollup: {
    emitCJS: true, // 生成 CJS 格式 (.cjs)
    inlineDependencies: false, // 改为 false 以支持更好的 tree-shaking
    dts: {
      respectExternal: true,
    },
    esbuild: {
      // 启用装饰器支持
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'ES2020',
        },
      },
    },
  },
  // 确保生成 ESM 和 CJS 两种格式
  format: ['esm', 'cjs'],
  externals: [
    // NestJS 相关
    '@nestjs/common',
    '@nestjs/core',
    'reflect-metadata',

    // Nacos 客户端
    'nacos',

    // 配置解析相关
    'js-yaml',
    'xml2js',
    'cheerio',
    'properties-reader',
    'json5',
    'jsonc-parser',

    // Node.js 内置模块
    'debug',
    'os',
    'assert',
    'events',
    'util',
    'path',
    'fs',
  ],

  // 优化选项
  clean: true,
  sourcemap: true,

  // 确保 package.json 中的 sideEffects 设置正确
  hooks: {
    'build:done': () => {
      console.log('✅ Build completed with tree-shaking optimization');
    },
  },
});
