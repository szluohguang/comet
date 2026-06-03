import path from 'path';
import { promises as fs } from 'fs';
import { fileExists, ensureDir } from '../utils/file-system.js';

const WECHAT_ACP_DIR = '.comet/wechat';

export interface BindingState {
  token: string;
  baseUrl: string;
  accountId: string;
  userId: string;
  nickname: string;
  boundAt: string;
}

function bindingFilePath(projectRoot: string): string {
  return path.join(projectRoot, WECHAT_ACP_DIR, 'binding.json');
}

export async function getBinding(projectRoot: string): Promise<BindingState | null> {
  const filePath = bindingFilePath(projectRoot);
  if (!(await fileExists(filePath))) return null;
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as BindingState;
}

export async function saveBinding(
  projectRoot: string,
  state: BindingState,
): Promise<void> {
  const dir = path.dirname(bindingFilePath(projectRoot));
  await ensureDir(dir);
  await fs.writeFile(bindingFilePath(projectRoot), JSON.stringify(state, null, 2), 'utf-8');
}

export async function unbind(projectRoot: string): Promise<void> {
  const filePath = bindingFilePath(projectRoot);
  if (await fileExists(filePath)) {
    await fs.unlink(filePath);
  }
}

export async function isBound(projectRoot: string): Promise<boolean> {
  const state = await getBinding(projectRoot);
  return state !== null;
}

/** 调用微信 iLink API 获取 Bot 登录二维码 */
export async function fetchQrCode(): Promise<{ qrcode: string; qrcodeUrl: string }> {
  const resp = await fetch(
    'https://ilinkai.weixin.qq.com/ilink/bot/get_bot_qrcode?bot_type=3',
  );
  if (!resp.ok) {
    throw new Error(`QR code API failed: ${resp.status} ${resp.statusText}`);
  }
  const data = (await resp.json()) as { qrcode: string; qrcode_img_content: string };
  return { qrcode: data.qrcode, qrcodeUrl: data.qrcode_img_content };
}

/** 轮询二维码状态 */
export async function pollQrStatus(qrcode: string): Promise<{
  status: 'wait' | 'scaned' | 'expired' | 'confirmed';
  botToken?: string;
  baseUrl?: string;
  accountId?: string;
  userId?: string;
}> {
  const url = `https://ilinkai.weixin.qq.com/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`QR status API failed: ${resp.status} ${resp.statusText}`);
  }
  const data = (await resp.json()) as {
    status: string;
    bot_token?: string;
    baseurl?: string;
    ilink_bot_id?: string;
    ilink_user_id?: string;
  };
  return {
    status: data.status as 'wait' | 'scaned' | 'expired' | 'confirmed',
    botToken: data.bot_token,
    baseUrl: data.baseurl,
    accountId: data.ilink_bot_id,
    userId: data.ilink_user_id,
  };
}
