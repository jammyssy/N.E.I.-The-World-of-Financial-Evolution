import { prisma } from '@/lib/db';
import { removeKey, saveBuffer } from '@/lib/storage';

export const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXT = new Set([
  'pdf',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'pptx',
  'ppt',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'mp4',
  'zip',
  'md',
  'txt',
]);

export async function createPendingAttachment(userId: number, file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_ATTACHMENT_EXT.has(ext)) {
    return { error: '不支持的文件类型' as const };
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return { error: '单文件不能超过 100 MB' as const };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const key = await saveBuffer(buf, file.name);

  try {
    const attachment = await prisma.attachment.create({
      data: {
        postId: null,
        uploaderId: userId,
        fileName: file.name,
        storageKey: key,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      },
    });
    return { attachment };
  } catch (error) {
    await removeKey(key);
    throw error;
  }
}

export async function deletePendingAttachment(userId: number, id: number) {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment || attachment.uploaderId !== userId) return { error: '无权限' as const, status: 403 };
  if (attachment.postId !== null) {
    return { error: '已发布的附件请通过编辑帖子删除' as const, status: 400 };
  }

  await removeKey(attachment.storageKey);
  await prisma.attachment.delete({ where: { id } });
  return { ok: true };
}

export async function recordDownload(userId: number, attachmentId: number) {
  await prisma.$transaction([
    prisma.attachment.update({
      where: { id: attachmentId },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.downloadEvent.create({
      data: { userId, attachmentId },
    }),
  ]);
}
