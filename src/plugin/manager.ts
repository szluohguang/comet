// src/plugin/manager.ts
import type { Plugin, PluginConfig } from '../../plugins/sdk.js';

interface PluginEntry {
  name: string;
  instance: Plugin;
  running: boolean;
}

export class PluginManager {
  private plugins: Map<string, PluginEntry> = new Map();

  register(plugin: Plugin): void {
    const name = plugin.name();
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' already registered`);
    }
    this.plugins.set(name, { name, instance: plugin, running: false });
  }

  list(): { name: string; running: boolean }[] {
    return Array.from(this.plugins.values()).map((e) => ({
      name: e.name,
      running: e.running,
    }));
  }

  async start(name: string, config: PluginConfig): Promise<void> {
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin '${name}' not found`);
    }
    await entry.instance.start(config);
    entry.running = true;
  }

  async stop(name: string): Promise<void> {
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin '${name}' not found`);
    }
    await entry.instance.stop();
    entry.running = false;
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)?.instance;
  }
}
