import { PluginManager } from '../plugin/manager.js';
import { PluginLoader } from '../plugin/loader.js';

interface PluginOptions {
  json?: boolean;
}

const manager = new PluginManager();
const loader = new PluginLoader({ pluginDir: 'plugins' });

export async function pluginListCommand(
  _pluginDir: string,
  options: PluginOptions,
): Promise<void> {
  const plugins = manager.list();
  if (options.json) {
    console.log(JSON.stringify(plugins, null, 2));
    return;
  }
  if (plugins.length === 0) {
    console.log('No plugins registered.');
    return;
  }
  console.log('Registered plugins:');
  for (const p of plugins) {
    console.log(`  ${p.name} (${p.running ? 'running' : 'stopped'})`);
  }
}

export async function pluginRegisterCommand(
  pluginDir: string,
  pluginName: string,
  options: PluginOptions,
): Promise<void> {
  try {
    const plugin = await loader.load(pluginName);
    manager.register(plugin);
    if (options.json) {
      console.log(JSON.stringify({ status: 'registered', name: pluginName }, null, 2));
      return;
    }
    console.log(`Plugin '${pluginName}' registered.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ status: 'error', message }, null, 2));
      return;
    }
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

export async function pluginStartCommand(
  pluginName: string,
  options: PluginOptions,
): Promise<void> {
  try {
    await manager.start(pluginName, { name: pluginName, enabled: true });
    if (options.json) {
      console.log(JSON.stringify({ status: 'started', name: pluginName }, null, 2));
      return;
    }
    console.log(`Plugin '${pluginName}' started.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

export async function pluginStopCommand(
  pluginName: string,
  options: PluginOptions,
): Promise<void> {
  try {
    await manager.stop(pluginName);
    if (options.json) {
      console.log(JSON.stringify({ status: 'stopped', name: pluginName }, null, 2));
      return;
    }
    console.log(`Plugin '${pluginName}' stopped.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}
