// test/ts/plugin/loader.test.ts
import { describe, it, expect } from 'vitest';
import { PluginLoader } from '../../../src/plugin/loader.js';

describe('PluginLoader', () => {
  it('throws for non-existent plugin', async () => {
    const loader = new PluginLoader({ pluginDir: 'plugins' });
    await expect(loader.load('nonexistent')).rejects.toThrow(/not found/);
  });
});
