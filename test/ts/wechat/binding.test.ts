import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import {
  saveBinding,
  unbind,
  isBound,
  getBinding,
  type BindingState,
} from '../../../src/wechat/binding.js';

const TEST_DIR = path.join(os.tmpdir(), 'comet-wechat-test-' + Date.now());
const sampleBinding: BindingState = {
  token: 'bot_token_abc',
  baseUrl: 'https://ilinkai.weixin.qq.com',
  accountId: 'bot_123',
  userId: 'wx_user_456',
  nickname: '测试用户',
  boundAt: new Date().toISOString(),
};

describe('WeChat Binding', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('isBound returns false when not bound', async () => {
    expect(await isBound(TEST_DIR)).toBe(false);
  });

  it('saveBinding stores binding state', async () => {
    await saveBinding(TEST_DIR, sampleBinding);
    const bound = await isBound(TEST_DIR);
    expect(bound).toBe(true);
  });

  it('getBinding returns binding state', async () => {
    await saveBinding(TEST_DIR, sampleBinding);
    const state = await getBinding(TEST_DIR);
    expect(state).not.toBeNull();
    expect(state!.userId).toBe('wx_user_456');
    expect(state!.nickname).toBe('测试用户');
    expect(state!.token).toBe('bot_token_abc');
  });

  it('unbind removes binding state', async () => {
    await saveBinding(TEST_DIR, sampleBinding);
    expect(await isBound(TEST_DIR)).toBe(true);
    await unbind(TEST_DIR);
    expect(await isBound(TEST_DIR)).toBe(false);
  });

  it('unbind is idempotent when not bound', async () => {
    await expect(unbind(TEST_DIR)).resolves.not.toThrow();
  });
});
