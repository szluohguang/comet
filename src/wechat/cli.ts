import QRCode from 'qrcode';
import {
  getBinding,
  generatePairingCode,
  confirmBinding,
  unbind,
  isBound,
} from './binding.js';
import {
  getPending,
  clearPending,
  hasPendingReply,
  setWeChatReply,
  savePending,
} from './pending.js';
import { sendWeChatNotification } from './notifier.js';

interface CliOptions {
  json?: boolean;
}

export async function wechatBindCommand(projectRoot: string, options: CliOptions): Promise<void> {
  const existing = await getBinding(projectRoot);
  if (existing) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'already_bound', binding: existing }, null, 2));
      return;
    }
    console.log(`已绑定微信用户: ${existing.nickname} (${existing.userId})`);
    console.log(`绑定时间: ${existing.boundAt}`);
    console.log('');
    console.log('如需重新绑定，请先执行: comet wechat unbind');
    return;
  }

  const { code, link, expiresAt } = await generatePairingCode(projectRoot);

  if (options.json) {
    console.log(JSON.stringify({ status: 'pending', pairingCode: code, link, expiresAt }, null, 2));
    return;
  }

  console.log('=== 微信绑定 ===');
  console.log('');

  // 输出二维码
  try {
    const qr = await QRCode.toString(link, { type: 'terminal', small: true });
    console.log(qr);
  } catch {
    // QR 生成失败时跳过
  }

  console.log(`配对码: ${code}`);
  console.log(`链接:   ${link}`);
  console.log('');
  console.log('请选择以上任一方式完成绑定：');
  console.log('  方式一：在微信 ACP 中输入配对码');
  console.log('  方式二：扫描上方二维码');
  console.log('  方式三：在浏览器打开链接');
  console.log(`配对码 ${new Date(expiresAt).toLocaleString()} 过期。`);
}

export async function wechatStatusCommand(projectRoot: string, options: CliOptions): Promise<void> {
  const binding = await getBinding(projectRoot);

  if (options.json) {
    console.log(JSON.stringify({ bound: binding !== null, binding }, null, 2));
    return;
  }

  if (!binding) {
    console.log('未绑定微信用户。');
    console.log('执行 "comet wechat bind" 开始绑定。');
    return;
  }

  console.log(`微信用户: ${binding.nickname} (${binding.userId})`);
  console.log(`绑定时间: ${binding.boundAt}`);
}

export async function wechatUnbindCommand(projectRoot: string, options: CliOptions): Promise<void> {
  const bound = await isBound(projectRoot);
  if (!bound) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'not_bound' }, null, 2));
      return;
    }
    console.log('当前未绑定微信用户。');
    return;
  }

  const binding = await getBinding(projectRoot);
  await unbind(projectRoot);

  if (options.json) {
    console.log(JSON.stringify({ status: 'unbound', previous: binding }, null, 2));
    return;
  }
  console.log(`已解除微信绑定 (${binding?.nickname})。`);
}

export async function wechatNotifyCommand(
  projectRoot: string,
  changeName: string,
  question: string,
  optionsJson: string,
  options: CliOptions,
): Promise<void> {
  const parsedOptions: { label: string; value: string }[] = JSON.parse(optionsJson);

  const pending = await getPending(projectRoot);
  if (pending && pending.wechatReplied) {
    if (options.json) {
      console.log(JSON.stringify({ status: 'already_replied', reply: pending }, null, 2));
      return;
    }
    console.log('该决策已有微信回复，无需重复通知。');
    return;
  }

  await savePending(projectRoot, {
    changeName,
    question,
    options: parsedOptions,
    notifiedAt: new Date().toISOString(),
    wechatReplied: false,
    replyValue: null,
    repliedAt: null,
  });

  const sent = await sendWeChatNotification({
    projectRoot,
    changeName,
    question,
    options: parsedOptions,
  });

  if (options.json) {
    console.log(JSON.stringify({ status: sent ? 'notified' : 'not_bound' }, null, 2));
    return;
  }

  if (sent) {
    console.log('微信通知已发送。');
  } else {
    console.log('未绑定微信用户，跳过通知。');
  }
}

export async function wechatPollCommand(projectRoot: string, options: CliOptions): Promise<void> {
  const hasReply = await hasPendingReply(projectRoot);

  if (options.json) {
    if (hasReply) {
      const pending = await getPending(projectRoot);
      console.log(JSON.stringify({ hasReply: true, pending }, null, 2));
    } else {
      console.log(JSON.stringify({ hasReply: false }, null, 2));
    }
    return;
  }

  if (hasReply) {
    const pending = await getPending(projectRoot);
    console.log(`微信回复: ${pending?.replyValue}`);
    console.log(`问题: ${pending?.question}`);
    await clearPending(projectRoot);
  } else {
    console.log('无待处理的微信回复。');
  }
}

export async function wechatBindConfirmCommand(
  projectRoot: string,
  userId: string,
  nickname: string,
  pairingCode: string,
  options: CliOptions,
): Promise<void> {
  await confirmBinding(projectRoot, userId, nickname, pairingCode);
  if (options.json) {
    console.log(JSON.stringify({ status: 'bound', userId, nickname }, null, 2));
    return;
  }
  console.log(`绑定成功！微信用户: ${nickname}`);
}

export async function wechatReplyCommand(
  projectRoot: string,
  replyValue: string,
  options: CliOptions,
): Promise<void> {
  const ok = await setWeChatReply(projectRoot, replyValue);
  if (options.json) {
    console.log(JSON.stringify({ status: ok ? 'recorded' : 'no_pending' }, null, 2));
    return;
  }
  if (ok) {
    console.log(`回复已记录: ${replyValue}`);
  } else {
    console.log('无待处理的决策。');
  }
}
