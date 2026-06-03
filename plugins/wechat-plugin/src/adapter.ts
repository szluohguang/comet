import type { CommandMapper, ResponseFormatter } from '../../../src/plugins/sdk.js';

const ALLOWED_COMMANDS = new Set([
  'status',
  'open',
  'design',
  'build',
  'verify',
  'archive',
  'hotfix',
  'tweak',
]);

export class WeChatAdapter implements CommandMapper, ResponseFormatter {
  mapToCommand(platformMsg: string): { command: string; args: string[] } | null {
    const match = platformMsg.match(/^\/comet\s+(\S+)(?:\s+(.*))?$/);
    if (!match) return null;

    const cmd = match[1];
    if (!ALLOWED_COMMANDS.has(cmd)) return null;

    const rest = match[2] ?? '';
    const args = rest ? rest.split(/\s+/) : [];
    return { command: cmd, args };
  }

  format(output: string, error: string | null): string[] {
    const lines: string[] = [];
    if (error) {
      lines.push(`Error: ${error}`);
    }
    if (output) {
      const chunks = output.split('\n').filter(Boolean);
      for (const chunk of chunks) {
        lines.push(chunk);
      }
    }
    return lines.length > 0 ? lines : ['(no output)'];
  }
}
