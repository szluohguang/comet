import path from 'path';
import { promises as fs } from 'fs';
import { fileExists, ensureDir } from '../utils/file-system.js';

const PENDING_FILE = '.comet/wechat/pending.json';

export interface PendingOption {
  label: string;
  value: string;
}

export interface PendingDecision {
  changeName: string;
  question: string;
  options: PendingOption[];
  notifiedAt: string;
  wechatReplied: boolean;
  replyValue: string | null;
  repliedAt: string | null;
}

function pendingFilePath(projectRoot: string): string {
  return path.join(projectRoot, PENDING_FILE);
}

export async function savePending(
  projectRoot: string,
  decision: PendingDecision,
): Promise<void> {
  const dir = path.dirname(pendingFilePath(projectRoot));
  await ensureDir(dir);
  await fs.writeFile(pendingFilePath(projectRoot), JSON.stringify(decision, null, 2), 'utf-8');
}

export async function getPending(projectRoot: string): Promise<PendingDecision | null> {
  const filePath = pendingFilePath(projectRoot);
  if (!(await fileExists(filePath))) return null;
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as PendingDecision;
}

export async function clearPending(projectRoot: string): Promise<void> {
  const filePath = pendingFilePath(projectRoot);
  if (await fileExists(filePath)) {
    await fs.unlink(filePath);
  }
}

export async function setWeChatReply(
  projectRoot: string,
  replyValue: string,
): Promise<boolean> {
  const pending = await getPending(projectRoot);
  if (!pending) return false;
  pending.wechatReplied = true;
  pending.replyValue = replyValue;
  pending.repliedAt = new Date().toISOString();
  const dir = path.dirname(pendingFilePath(projectRoot));
  await ensureDir(dir);
  await fs.writeFile(pendingFilePath(projectRoot), JSON.stringify(pending, null, 2), 'utf-8');
  return true;
}

export async function hasPendingReply(projectRoot: string): Promise<boolean> {
  const pending = await getPending(projectRoot);
  return pending !== null && pending.wechatReplied;
}
