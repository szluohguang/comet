// src/plugin/loader.ts
import path from 'path';
import { fileExists } from '../utils/file-system.js';
import type { Plugin } from '../plugins/sdk.js';

export interface LoaderOptions {
  pluginDir: string;
}

/**
 * PluginLoader — 从文件系统动态加载插件。
 * 通过检查插件目录下的 package.json 确认插件存在，
 * 然后动态 import 获取插件实例。
 */
export class PluginLoader {
  constructor(private options: LoaderOptions) {}

  async load(pluginName: string): Promise<Plugin> {
    const pluginPath = path.resolve(this.options.pluginDir, pluginName);
    const pkgPath = path.join(pluginPath, 'package.json');

    if (!(await fileExists(pkgPath))) {
      throw new Error(`Plugin '${pluginName}' not found at ${pluginPath}`);
    }

    const pluginModule = await import(pluginPath);
    if (!pluginModule.default || typeof pluginModule.default !== 'function') {
      throw new Error(`Plugin '${pluginName}' must export a default factory function`);
    }

    return pluginModule.default() as Plugin;
  }
}
