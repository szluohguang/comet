import { getBinding } from './binding.js';

interface NotificationOptions {
  projectRoot: string;
  changeName: string;
  question: string;
  options: { label: string; value: string }[];
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

  // 通过 wechat-acp bridge 发送微信消息
  // 目前输出到 stdout 作为桩实现，后续接入 wechat-acp bridge
  console.log(`[WeChat Notify] To: ${binding.nickname} (${binding.userId})`);
  console.log(`[WeChat Notify] Message:\n${message}`);
  console.log(`[WeChat Notify] Sent at: ${new Date().toISOString()}`);

  return true;
}
