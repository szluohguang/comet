// src/commands/plugin.ts
import { PluginManager } from '../plugin/manager.js';
import { PluginLoader } from '../plugin/loader.js';

interface PluginOptions {
  json?: boolean;
}

export async function pluginListCommand(pluginDir: string, options: PluginOptions): Promise<void> {
  // placeholder — will be integrated with PluginManager
  console.log('Plugin list (not yet integrated)');
}

export async function pluginRegisterCommand(
  pluginDir: string,
  pluginName: string,
  options: PluginOptions,
): Promise<void> {
  const loader = new PluginLoader({ pluginDir });
  const manager = new PluginManager();
  const plugin = await loader.load(pluginName);
  manager.register(plugin);
  console.log(`Plugin '${pluginName}' registered.`);
}
