import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import {
  savePending,
  getPending,
  clearPending,
  setWeChatReply,
  hasPendingReply,
  type PendingDecision,
} from '../../../src/wechat/pending.js';

const TEST_DIR = path.join(os.tmpdir(), 'comet-wechat-pending-test-' + Date.now());

describe('WeChat Pending Decisions', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  const samplePending: PendingDecision = {
    changeName: 'test-change',
    question: '是否继续？',
    options: [
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' },
    ],
    notifiedAt: new Date().toISOString(),
    wechatReplied: false,
    replyValue: null,
    repliedAt: null,
  };

  it('savePending and getPending', async () => {
    await savePending(TEST_DIR, samplePending);
    const result = await getPending(TEST_DIR);
    expect(result).not.toBeNull();
    expect(result!.changeName).toBe('test-change');
    expect(result!.question).toBe('是否继续？');
    expect(result!.options).toHaveLength(2);
  });

  it('getPending returns null when no pending', async () => {
    const result = await getPending(TEST_DIR);
    expect(result).toBeNull();
  });

  it('clearPending removes pending decision', async () => {
    await savePending(TEST_DIR, samplePending);
    expect(await getPending(TEST_DIR)).not.toBeNull();
    await clearPending(TEST_DIR);
    expect(await getPending(TEST_DIR)).toBeNull();
  });

  it('hasPendingReply returns false when no reply', async () => {
    await savePending(TEST_DIR, samplePending);
    expect(await hasPendingReply(TEST_DIR)).toBe(false);
  });

  it('setWeChatReply records reply', async () => {
    await savePending(TEST_DIR, samplePending);
    const ok = await setWeChatReply(TEST_DIR, 'yes');
    expect(ok).toBe(true);
    expect(await hasPendingReply(TEST_DIR)).toBe(true);
    const pending = await getPending(TEST_DIR);
    expect(pending!.wechatReplied).toBe(true);
    expect(pending!.replyValue).toBe('yes');
    expect(pending!.repliedAt).not.toBeNull();
  });

  it('setWeChatReply returns false when no pending', async () => {
    const ok = await setWeChatReply(TEST_DIR, 'yes');
    expect(ok).toBe(false);
  });
});
