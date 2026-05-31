import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUid } from '@/lib/session';
import { sanitizeHtml, stripHtml } from '@/lib/validate';
import { POST_STATUS } from '@/lib/status';
import { SCENE_TAGS, INDUSTRY_TAGS, CONTENT_TAGS, SKILL_TAGS } from '@/lib/tags';

const sceneVals: string[] = SCENE_TAGS.map((t) => t.value);
const industryVals: string[] = INDUSTRY_TAGS.map((t) => t.value);
const contentVals: string[] = CONTENT_TAGS.map((t) => t.value);
const skillVals: string[] = SKILL_TAGS.map((t) => t.value);

// GET /api/posts?scene=&industry=&content=&skill=&role=&time=&q=&page=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scene = url.searchParams.get('scene') || undefined;
  const industry = url.searchParams.get('industry') || undefined;
  const contentList = url.searchParams.getAll('content');
  const skill = url.searchParams.get('skill') || undefined;
  const role = url.searchParams.get('role') || undefined;
  const time = url.searchParams.get('time') || undefined;
  const q = url.searchParams.get('q')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = 20;

  const where: any = { status: POST_STATUS.PUBLISHED };
  if (scene && sceneVals.includes(scene)) where.tagScene = scene;
  if (industry && industryVals.includes(industry)) where.tagIndustry = industry;
  if (skill && skillVals.includes(skill)) where.tagSkill = skill;
  if (role && ['VC', 'PE', 'FA'].includes(role)) where.author = { role };

  if (time) {
    const days = time === '7d' ? 7 : time === '30d' ? 30 : time === '90d' ? 90 : 0;
    if (days > 0) where.createdAt = { gte: new Date(Date.now() - days * 86400000) };
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
      { author: { nickname: { contains: q } } },
    ];
  }

  let posts = await prisma.post.findMany({
    where,
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      _count: { select: { comments: true, likes: true, attachments: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // tag_content 多选过滤（DB 是 JSON 字符串，MVP 在内存过滤）
  if (contentList.length > 0) {
    const validContent = contentList.filter((c) => contentVals.includes(c));
    if (validContent.length > 0) {
      posts = posts.filter((p) => {
        try {
          const arr = JSON.parse(p.tagContent || '[]') as string[];
          return validContent.every((v) => arr.includes(v));
        } catch {
          return false;
        }
      });
    }
  }

  const uid = await getSessionUid();
  let likedIds = new Set<number>();
  let favIds = new Set<number>();
  if (uid && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const [likes, favs] = await Promise.all([
      prisma.postLike.findMany({ where: { userId: uid, postId: { in: postIds } }, select: { postId: true } }),
      prisma.postFavorite.findMany({ where: { userId: uid, postId: { in: postIds } }, select: { postId: true } }),
    ]);
    likedIds = new Set(likes.map((l) => l.postId));
    favIds = new Set(favs.map((f) => f.postId));
  }

  return NextResponse.json({
    items: posts.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: stripHtml(p.body).slice(0, 160),
      tagScene: p.tagScene,
      tagIndustry: p.tagIndustry,
      tagContent: JSON.parse(p.tagContent || '[]'),
      tagSkill: p.tagSkill,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      author: p.author,
      counts: {
        comments: p._count.comments,
        likes: p._count.likes,
        attachments: p._count.attachments,
      },
      liked: likedIds.has(p.id),
      favorited: favIds.has(p.id),
    })),
    page,
    hasMore: posts.length === pageSize,
  });
}

// POST /api/posts —— 发布
export async function POST(req: Request) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const data = await req.json();
  const title = String(data.title || '').trim();
  const body = String(data.body || '').trim();
  const tagScene = String(data.tagScene || '');
  const tagIndustry = data.tagIndustry ? String(data.tagIndustry) : null;
  const tagContentArr: string[] = Array.isArray(data.tagContent) ? data.tagContent.filter(Boolean) : [];
  const tagSkill = data.tagSkill ? String(data.tagSkill) : null;
  const attachmentIds: number[] = Array.isArray(data.attachmentIds) ? data.attachmentIds : [];

  if (title.length < 5 || title.length > 100) {
    return NextResponse.json({ error: '标题需 5-100 字符' }, { status: 400 });
  }
  if (body.length < 1 || body.length > 50000) {
    return NextResponse.json({ error: '正文长度需 1-50000 字符' }, { status: 400 });
  }
  if (!sceneVals.includes(tagScene)) {
    return NextResponse.json({ error: '请选择工作场景标签' }, { status: 400 });
  }
  if (tagIndustry && !industryVals.includes(tagIndustry)) {
    return NextResponse.json({ error: '行业标签无效' }, { status: 400 });
  }
  if (tagSkill && !skillVals.includes(tagSkill)) {
    return NextResponse.json({ error: 'Skill 标签无效' }, { status: 400 });
  }
  if (tagContentArr.length > 3) {
    return NextResponse.json({ error: '工作内容标签最多 3 个' }, { status: 400 });
  }
  const cleanContent = tagContentArr.filter((c) => contentVals.includes(c));

  const safeBody = sanitizeHtml(body);
  const post = await prisma.post.create({
    data: {
      userId: uid,
      title,
      body: safeBody,
      tagScene,
      tagIndustry,
      tagContent: JSON.stringify(cleanContent),
      tagSkill,
      status: POST_STATUS.PUBLISHED, // MVP 跳过人工审核
    },
  });

  if (attachmentIds.length > 0) {
    await prisma.attachment.updateMany({
      where: { id: { in: attachmentIds }, uploaderId: uid, postId: 0 },
      data: { postId: post.id },
    });
  }

  return NextResponse.json({ id: post.id });
}
