import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { fileExists, ensureDir } from '../utils/file-system.js';

const BINDING_FILE = '.comet/wechat/binding.json';
const PAIRING_CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 10;

export interface BindingState {
  userId: string;
  nickname: string;
  pairingCode: string;
  codeExpiresAt: string;
  boundAt: string;
}

function createPairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(PAIRING_CODE_LENGTH);
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `WX-${code}`;
}

function bindingFilePath(projectRoot: string): string {
  return path.join(projectRoot, BINDING_FILE);
}

export async function getBinding(projectRoot: string): Promise<BindingState | null> {
  const filePath = bindingFilePath(projectRoot);
  if (!(await fileExists(filePath))) return null;
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as BindingState;
}

export async function generatePairingCode(_projectRoot: string): Promise<{
  code: string;
  link: string;
  expiresAt: string;
}> {
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const code = createPairingCode();
  const link = `https://wechat-bind.example.com/bind?code=${code}`;
  return { code, link, expiresAt };
}

export async function confirmBinding(
  projectRoot: string,
  userId: string,
  nickname: string,
  pairingCode: string,
): Promise<void> {
  const dir = path.dirname(bindingFilePath(projectRoot));
  await ensureDir(dir);

  const state: BindingState = {
    userId,
    nickname,
    pairingCode,
    codeExpiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    boundAt: new Date().toISOString(),
  };

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
