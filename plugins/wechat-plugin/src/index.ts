import type { Plugin, PluginConfig } from '../../../src/plugins/sdk.js';
import { WeChatAdapter } from './adapter.js';

export default function createWeChatPlugin(): Plugin {
  return {
    name: () => 'wechat',
    start: async (config: PluginConfig) => {
      if (!config.enabled) return;
      console.log(`WeChat plugin started (enabled: ${config.enabled})`);
    },
    stop: async () => {
      console.log('WeChat plugin stopped');
    },
  };
}
