import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSessionUid } from '@/lib/session';
import { createPostSchema, parsePostFilters } from '@/features/posts/schemas';
import { listPosts } from '@/features/posts/queries';
import { createSkillPost } from '@/features/posts/service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = parsePostFilters(url.searchParams);
  const uid = await getSessionUid();
  const result = await listPosts(filters, uid);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const input = createPostSchema.parse(await req.json());
    const post = await createSkillPost(uid, input);
    return NextResponse.json({ id: post.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? '参数错误' }, { status: 400 });
    }
    throw error;
  }
}
