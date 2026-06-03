// test/ts/plugin/adapter.test.ts
import { describe, it, expect } from 'vitest';
import { WeChatAdapter } from '../../../plugins/wechat-plugin/src/adapter.js';

describe('WeChatAdapter', () => {
  const adapter = new WeChatAdapter();

  describe('mapToCommand', () => {
    it('parses /comet status', () => {
      const result = adapter.mapToCommand('/comet status');
      expect(result).toEqual({ command: 'status', args: [] });
    });

    it('parses /comet open with arg', () => {
      const result = adapter.mapToCommand('/comet open feature-x');
      expect(result).toEqual({ command: 'open', args: ['feature-x'] });
    });

    it('parses /comet build with args', () => {
      const result = adapter.mapToCommand('/comet build --mode full');
      expect(result).toEqual({ command: 'build', args: ['--mode', 'full'] });
    });

    it('rejects non-/comet messages', () => {
      expect(adapter.mapToCommand('hello world')).toBeNull();
    });

    it('rejects unknown commands', () => {
      expect(adapter.mapToCommand('/comet unknown-cmd')).toBeNull();
    });
  });

  describe('format', () => {
    it('formats output lines', () => {
      const result = adapter.format('line1\nline2\nline3', null);
      expect(result).toEqual(['line1', 'line2', 'line3']);
    });

    it('includes error message', () => {
      const result = adapter.format('', 'something went wrong');
      expect(result[0]).toContain('Error');
    });

    it('defaults to (no output) when empty', () => {
      const result = adapter.format('', null);
      expect(result).toEqual(['(no output)']);
    });
  });
});
