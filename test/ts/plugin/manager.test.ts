// test/ts/plugin/manager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PluginManager } from '../../../src/plugin/manager.js';
import type { Plugin, PluginConfig } from '../../../src/plugins/sdk.js';

describe('PluginManager', () => {
  it('starts with empty registry', () => {
    const mgr = new PluginManager();
    expect(mgr.list()).toEqual([]);
  });

  it('registers a plugin', () => {
    const mgr = new PluginManager();
    const plugin: Plugin = {
      name: () => 'test',
      start: vi.fn(),
      stop: vi.fn(),
    };
    mgr.register(plugin);
    expect(mgr.list()).toHaveLength(1);
    expect(mgr.list()[0].name).toBe('test');
  });

  it('rejects duplicate registration', () => {
    const mgr = new PluginManager();
    const plugin: Plugin = {
      name: () => 'test',
      start: vi.fn(),
      stop: vi.fn(),
    };
    mgr.register(plugin);
    expect(() => mgr.register(plugin)).toThrow(/already registered/);
  });

  it('starts a registered plugin', async () => {
    const mgr = new PluginManager();
    const start = vi.fn();
    const plugin: Plugin = { name: () => 'test', start, stop: vi.fn() };
    mgr.register(plugin);
    await mgr.start('test', { name: 'test', enabled: true });
    expect(start).toHaveBeenCalledOnce();
  });

  it('stops a started plugin', async () => {
    const mgr = new PluginManager();
    const stop = vi.fn();
    const plugin: Plugin = { name: () => 'test', start: vi.fn(), stop };
    mgr.register(plugin);
    await mgr.start('test', { name: 'test', enabled: true });
    await mgr.stop('test');
    expect(stop).toHaveBeenCalledOnce();
  });

  it('throws on start of unregistered plugin', async () => {
    const mgr = new PluginManager();
    await expect(mgr.start('nonexistent', { name: 'nonexistent', enabled: true })).rejects.toThrow(
      /not found/,
    );
  });
});
