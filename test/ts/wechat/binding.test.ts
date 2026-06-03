import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import {
  generatePairingCode,
  confirmBinding,
  unbind,
  isBound,
  getBinding,
} from '../../../src/wechat/binding.js';

const TEST_DIR = path.join(os.tmpdir(), 'comet-wechat-test-' + Date.now());

describe('WeChat Binding', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('generates pairing code with correct format', async () => {
    const result = await generatePairingCode(TEST_DIR);
    expect(result.code).toMatch(/^WX-[A-HJ-NP-Z2-9]{6}$/);
    expect(result.link).toContain(result.code);
    expect(result.expiresAt).toBeTruthy();
  });

  it('generates unique pairing codes', async () => {
    const r1 = await generatePairingCode(TEST_DIR);
    const r2 = await generatePairingCode(TEST_DIR);
    expect(r1.code).not.toBe(r2.code);
  });

  it('isBound returns false when not bound', async () => {
    expect(await isBound(TEST_DIR)).toBe(false);
  });

  it('confirmBinding stores binding state', async () => {
    await confirmBinding(TEST_DIR, 'wx_user_123', '测试用户', 'WX-ABC123');
    const bound = await isBound(TEST_DIR);
    expect(bound).toBe(true);
  });

  it('getBinding returns binding state', async () => {
    await confirmBinding(TEST_DIR, 'wx_user_456', '用户A', 'WX-DEF456');
    const state = await getBinding(TEST_DIR);
    expect(state).not.toBeNull();
    expect(state!.userId).toBe('wx_user_456');
    expect(state!.nickname).toBe('用户A');
  });

  it('unbind removes binding state', async () => {
    await confirmBinding(TEST_DIR, 'wx_user_789', '用户B', 'WX-GHI789');
    expect(await isBound(TEST_DIR)).toBe(true);
    await unbind(TEST_DIR);
    expect(await isBound(TEST_DIR)).toBe(false);
  });

  it('unbind is idempotent when not bound', async () => {
    await expect(unbind(TEST_DIR)).resolves.not.toThrow();
  });
});
