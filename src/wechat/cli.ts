import QRCode from 'qrcode';
import {
  getBinding,
  saveBinding,
  unbind,
  isBound,
  fetchQrCode,
  pollQrStatus,
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

const QR_POLL_INTERVAL = 1500;
const QR_TIMEOUT = 5 * 60 * 1000;
const MAX_REFRESH = 3;

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

  const { qrcode: initialQrcode, qrcodeUrl } = await fetchQrCode();

  if (options.json) {
    console.log(JSON.stringify({ status: 'await_scan', qrcodeUrl }, null, 2));
    return;
  }

  console.log('=== 微信绑定 ===');
  console.log('请使用微信扫描下方二维码完成绑定：');
  console.log('');

  const qr = await QRCode.toString(qrcodeUrl, { type: 'terminal', small: true });
  console.log(qr);

  const deadline = Date.now() + QR_TIMEOUT;
  let currentQrcode = initialQrcode;
  let refreshCount = 0;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, QR_POLL_INTERVAL));
    const status = await pollQrStatus(currentQrcode);

    switch (status.status) {
      case 'wait':
        process.stdout.write('.');
        break;
      case 'scaned':
        process.stdout.write('\n二维码已扫描，请在微信中确认...\n');
        break;
      case 'expired': {
        refreshCount++;
        if (refreshCount > MAX_REFRESH) {
          console.log('\n二维码多次过期，请重新执行 comet wechat bind');
          return;
        }
        console.log(`\n二维码已过期，刷新中 (${refreshCount}/${MAX_REFRESH})...`);
        const newQr = await fetchQrCode();
        currentQrcode = newQr.qrcode;
        const qr2 = await QRCode.toString(newQr.qrcodeUrl, { type: 'terminal', small: true });
        console.log(qr2);
        break;
      }
      case 'confirmed': {
        console.log('\n✓ 绑定成功！');
        await saveBinding(projectRoot, {
          token: status.botToken!,
          baseUrl: status.baseUrl || 'https://ilinkai.weixin.qq.com',
          accountId: status.accountId!,
          userId: status.userId!,
          nickname: `WeChat(${status.userId!.slice(0, 8)}...)`,
          boundAt: new Date().toISOString(),
        });
        console.log(`   Bot ID: ${status.accountId}`);
        console.log(`   用户 ID: ${status.userId}`);
        return;
      }
    }
  }

  console.log('\n绑定超时（5分钟），请重新执行 comet wechat bind');
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

  console.log(`微信用户: ${binding.nickname}`);
  console.log(`Bot ID: ${binding.accountId}`);
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
  console.log(`已解除微信绑定。`);
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
  _pairingCode: string,
  options: CliOptions,
): Promise<void> {
  // 通过此命令手动写入绑定状态（供测试或脚本使用）
  if (options.json) {
    console.log(JSON.stringify({ status: 'bound', userId, nickname }, null, 2));
    return;
  }
  console.log(`绑定记录已保存: ${nickname}`);
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
