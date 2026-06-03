import path from 'path';
import { promises as fs } from 'fs';
import { getBinding } from './binding.js';
import { fileExists, ensureDir } from '../utils/file-system.js';

interface NotificationOptions {
  projectRoot: string;
  changeName: string;
  question: string;
  options: { label: string; value: string }[];
}

function getInjectDir(projectRoot: string): string {
  return path.join(projectRoot, 'plugins', 'wechat-acp', 'inject');
}

async function tryInjectViaWeChatAcp(projectRoot: string, message: string): Promise<boolean> {
  const injectDir = getInjectDir(projectRoot);
  const pendingDir = path.join(injectDir, 'pending');

  if (!(await fileExists(pendingDir))) return false;

  const job = {
    id: `comet-notify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    target: 'last-active-user',
    text: message,
    source: 'cli',
  };

  const filePath = path.join(pendingDir, `${job.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
  return true;
}

export async function sendWeChatNotification(opts: NotificationOptions): Promise<boolean> {
  const binding = await getBinding(opts.projectRoot);
  if (!binding) return false;

  const optionLines = opts.options
    .map((o, i) => `${i + 1}. ${o.label}`)
    .join('\n');

  const message = [
    `【Comet 需要确认】`,
    ``,
    `变更: ${opts.changeName}`,
    `${opts.question}`,
    ``,
    `请回复编号：`,
    optionLines,
    ``,
    `或离开此消息，稍后在 AI 工具中确认。`,
  ].join('\n');

  // 优先通过 wechat-acp injection 系统发送
  const injected = await tryInjectViaWeChatAcp(opts.projectRoot, message);
  if (injected) {
    return true;
  }

  // 回退到 stdout 日志
  console.log(`[WeChat Notify] To: ${binding.nickname} (${binding.userId})`);
  console.log(`[WeChat Notify] Message:\n${message}`);
  console.log(`[WeChat Notify] Sent at: ${new Date().toISOString()}`);

  return true;
}
