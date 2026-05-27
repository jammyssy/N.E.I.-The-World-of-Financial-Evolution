import { NextResponse } from 'next/server';
import { getSessionUid } from '@/lib/session';
import { deletePendingAttachment } from '@/features/attachments/service';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 });

  const result = await deletePendingAttachment(uid, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
