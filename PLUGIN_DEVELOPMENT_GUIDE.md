# Plugin Development Guide

## Overview

Comet supports a plugin system for integrating with external messaging platforms (WeChat, Telegram, Slack, etc.). Each plugin implements the core SDK interfaces and is loaded dynamically at runtime.

## Architecture

```
comet/src/
├── plugins/sdk.ts       # Core interfaces (Plugin, CommandMapper, ResponseFormatter)
├── plugin/
│   ├── manager.ts       # Plugin lifecycle management
│   └── loader.ts        # Dynamic plugin loading
└── commands/plugin.ts   # CLI subcommand (comet plugin register/list/start/stop)
```

## Creating a Plugin

### 1. Define your plugin package

Create a directory under `plugins/` with a `package.json`:

```
plugins/my-plugin/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # Plugin entry point (default factory export)
    └── adapter.ts        # Optional: platform adapter
```

### 2. Implement the Plugin interface

```typescript
// plugins/my-plugin/src/index.ts
import type { Plugin, PluginConfig } from '../../src/plugins/sdk.js';

export default function createMyPlugin(): Plugin {
  return {
    name: () => 'my-plugin',

    start: async (config: PluginConfig) => {
      if (!config.enabled) return;
      // Initialize connection, start polling, etc.
    },

    stop: async () => {
      // Cleanup: close connections, stop timers
    },
  };
}
```

### 3. Implement adapters (optional)

For message platform integration, implement `CommandMapper` and `ResponseFormatter`:

```typescript
// plugins/my-plugin/src/adapter.ts
import type { CommandMapper, ResponseFormatter } from '../../../src/plugins/sdk.js';

const ALLOWED_COMMANDS = new Set([
  'status', 'open', 'design', 'build',
  'verify', 'archive', 'hotfix', 'tweak',
]);

export class MyAdapter implements CommandMapper, ResponseFormatter {
  mapToCommand(platformMsg: string): { command: string; args: string[] } | null {
    // Parse platform message → comet command
    const match = platformMsg.match(/^\/comet\s+(\S+)(?:\s+(.*))?$/);
    if (!match) return null;
    const cmd = match[1];
    if (!ALLOWED_COMMANDS.has(cmd)) return null;
    const rest = match[2] ?? '';
    const args = rest ? rest.split(/\s+/) : [];
    return { command: cmd, args };
  }

  format(output: string, error: string | null): string[] {
    // Format comet output → platform message
    const lines: string[] = [];
    if (error) lines.push(`Error: ${error}`);
    if (output) lines.push(...output.split('\n').filter(Boolean));
    return lines.length > 0 ? lines : ['(no output)'];
  }
}
```

### 4. Register and start the plugin

```bash
comet plugin register my-plugin
comet plugin start my-plugin
```

## WeChat Binding

Comet supports binding a WeChat user account for receiving decision notifications.

### Bind a WeChat user

```bash
comet wechat bind
```

Outputs both a pairing code and a link. Use either in WeChat ACP to complete binding.

### Check binding status

```bash
comet wechat status
```

### Unbind

```bash
comet wechat unbind
```

### Internal commands (for agent integration)

```bash
# Send a notification to the bound WeChat user
comet wechat notify <change-name> "<question>" '[{"label":"Yes","value":"yes"}]'

# Check for pending WeChat replies
comet wechat poll

# Record a WeChat reply
comet wechat reply <value>
```

## Security

- Command mapping must use a whitelist (`ALLOWED_COMMANDS`). Unknown commands are rejected.
- Plugin output is limited through formatted `ResponseFormatter.format()`.
- Plugins run in the same process as the comet CLI.

## Best Practices

- **Whitelist commands**: Only allow comet commands that are safe to expose.
- **Graceful start/stop**: Handle connection interruptions; clean up on stop.
- **Config-driven**: Use `PluginConfig` for all configurable settings.
- **Error tolerance**: Never let plugin errors crash the comet CLI.
