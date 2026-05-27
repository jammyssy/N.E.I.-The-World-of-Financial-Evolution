import { NextResponse } from 'next/server';
import { getSessionUid } from '@/lib/session';
import { getPostDetail } from '@/features/posts/queries';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 });

  const uid = await getSessionUid();
  const post = await getPostDetail(id, uid, true);
  if (!post) return NextResponse.json({ error: '内容不存在或未发布' }, { status: 404 });

  return NextResponse.json(post);
}
