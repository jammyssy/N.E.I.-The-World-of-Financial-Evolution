import { NextResponse } from 'next/server';
import { getSessionUid } from '@/lib/session';
import { createPendingAttachment } from '@/features/attachments/service';

export async function POST(req: Request) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '未提交文件' }, { status: 400 });
  }

  const result = await createPendingAttachment(uid, file);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    id: result.attachment.id,
    fileName: result.attachment.fileName,
    fileSize: result.attachment.fileSize,
    mimeType: result.attachment.mimeType,
  });
}
