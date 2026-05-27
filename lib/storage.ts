import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveBuffer(buf: Buffer, originalName: string) {
  await ensureUploadDir();
  const ext = path.extname(originalName).slice(0, 16);
  const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, key);
  await fs.writeFile(fullPath, buf);
  return key;
}

export async function readFileByKey(key: string) {
  const safe = path.basename(key); // 防穿越
  return fs.readFile(path.join(UPLOAD_DIR, safe));
}

export async function removeKey(key: string) {
  const safe = path.basename(key);
  try {
    await fs.unlink(path.join(UPLOAD_DIR, safe));
  } catch {
    /* ignore */
  }
}
