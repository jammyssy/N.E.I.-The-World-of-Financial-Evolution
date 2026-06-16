import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * 文件存储抽象层。
 *
 * 生产环境（Vercel）用 Cloudflare R2（S3 兼容）——serverless 重启后文件不丢。
 * 本地开发（没配 R2 环境变量）自动 fallback 到本地 uploads/ 目录。
 *
 * 4 个函数签名不变，调用方（upload API、download API、AI 转写、import 脚本）零改动。
 */

// —— R2 配置 ——
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 如 https://pub-xxx.r2.dev

// 是否启用 R2（4 个核心配置都有才启用）
const useR2 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

// 本地 fallback
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// R2 client（懒加载）
let _s3: S3Client | null = null;
function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

/**
 * 生成存储 key（共用）
 */
function generateKey(originalName: string): string {
  const ext = path.extname(originalName).slice(0, 16);
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

// ============================================================
// 公共 API（签名与旧版完全一致）
// ============================================================

export async function ensureUploadDir() {
  if (useR2) return; // R2 不需要建目录
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveBuffer(buf: Buffer, originalName: string): Promise<string> {
  const key = generateKey(originalName);

  if (useR2) {
    await s3().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buf,
      }),
    );
    return key;
  }

  // 本地 fallback
  await ensureUploadDir();
  await fs.writeFile(path.join(UPLOAD_DIR, key), buf);
  return key;
}

export async function readFileByKey(key: string): Promise<Buffer> {
  const safe = path.basename(key); // 防穿越

  if (useR2) {
    const res = await s3().send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: safe,
      }),
    );
    // S3 Body 是 Readable，转 Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  // 本地 fallback
  return fs.readFile(path.join(UPLOAD_DIR, safe));
}

export async function removeKey(key: string): Promise<void> {
  const safe = path.basename(key);

  if (useR2) {
    try {
      await s3().send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: safe,
        }),
      );
    } catch {
      /* ignore */
    }
    return;
  }

  // 本地 fallback
  try {
    await fs.unlink(path.join(UPLOAD_DIR, safe));
  } catch {
    /* ignore */
  }
}

/**
 * 获取文件的公开访问 URL（R2 公开读用，本地不需要）。
 * 目前下载走 API 接口流式返回，这个函数预留给前端直链场景。
 */
export function getPublicUrl(key: string): string | null {
  if (!useR2 || !R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${path.basename(key)}`;
}
