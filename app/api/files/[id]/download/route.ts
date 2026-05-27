import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUid } from '@/lib/session';
import { readFileByKey } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att || att.postId === 0) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFileByKey(att.storageKey);
  } catch {
    return NextResponse.json({ error: '文件已丢失' }, { status: 410 });
  }

  await prisma.attachment.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  // RFC 5987 编码非 ASCII 文件名
  const ascii = att.fileName.replace(/[^\x20-\x7e]/g, '_');
  const utf8 = encodeURIComponent(att.fileName);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': att.mimeType || 'application/octet-stream',
      'Content-Length': String(buf.length),
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
    },
  });
}
