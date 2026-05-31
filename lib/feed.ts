import { prisma } from '@/lib/db';
import { stripHtml } from '@/lib/validate';
import { POST_STATUS } from '@/lib/status';
import {
  SCENE_TAGS,
  INDUSTRY_TAGS,
  CONTENT_TAGS,
  SKILL_TAGS,
} from '@/lib/tags';
import type { PostCardData } from '@/components/PostCard';

const sceneVals: string[] = SCENE_TAGS.map((t) => t.value);
const industryVals: string[] = INDUSTRY_TAGS.map((t) => t.value);
const contentVals: string[] = CONTENT_TAGS.map((t) => t.value);
const skillVals: string[] = SKILL_TAGS.map((t) => t.value);

export type FeedQuery = {
  scene?: string;
  industry?: string;
  skill?: string;
  role?: string;
  time?: string;
  q?: string;
  contentList?: string[];
  limit?: number;
};

/**
 * 构建 Prisma where 子句（共用）
 */
export function buildFeedWhere(query: Pick<FeedQuery, 'scene' | 'industry' | 'skill' | 'role' | 'time' | 'q'>) {
  const { scene, industry, skill, role, time, q } = query;
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
  return where;
}

/**
 * 获取当前用户对一批 post 的 liked / favorited 状态（共用）
 */
export async function fetchUserLikeFav(uid: number | null, postIds: number[]) {
  if (!uid || postIds.length === 0) {
    return { likedIds: new Set<number>(), favIds: new Set<number>() };
  }
  const [likes, favs] = await Promise.all([
    prisma.postLike.findMany({ where: { userId: uid, postId: { in: postIds } }, select: { postId: true } }),
    prisma.postFavorite.findMany({ where: { userId: uid, postId: { in: postIds } }, select: { postId: true } }),
  ]);
  return {
    likedIds: new Set(likes.map((l) => l.postId)),
    favIds: new Set(favs.map((f) => f.postId)),
  };
}

/**
 * 内存过滤 tagContent 多选（共用）
 */
export function filterByContent(posts: any[], contentList: string[]) {
  if (contentList.length === 0) return posts;
  const v = contentList.filter((c) => contentVals.includes(c));
  if (v.length === 0) return posts;
  return posts.filter((p) => {
    try {
      const arr = JSON.parse(p.tagContent || '[]') as string[];
      return v.every((x) => arr.includes(x));
    } catch {
      return false;
    }
  });
}

/**
 * 从 URL searchParams 提取 FeedQuery
 */
export function parseFeedQuery(searchParams: { [k: string]: string | string[] | undefined }): FeedQuery {
  const scene = typeof searchParams.scene === 'string' ? searchParams.scene : undefined;
  const industry = typeof searchParams.industry === 'string' ? searchParams.industry : undefined;
  const skill = typeof searchParams.skill === 'string' ? searchParams.skill : undefined;
  const role = typeof searchParams.role === 'string' ? searchParams.role : undefined;
  const time = typeof searchParams.time === 'string' ? searchParams.time : undefined;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const contentList = Array.isArray(searchParams.content)
    ? searchParams.content
    : typeof searchParams.content === 'string'
    ? [searchParams.content]
    : [];
  return { scene, industry, skill, role, time, q, contentList };
}

/**
 * fetchFeed —— 首页 / 搜索 / 筛选 共用的数据查询
 * 返回 PostCardData[] 已带 liked / favorited 状态
 */
export async function fetchFeed(query: FeedQuery, uid: number | null): Promise<PostCardData[]> {
  const { contentList = [], limit = 50 } = query;

  const where = buildFeedWhere(query);

  let posts = await prisma.post.findMany({
    where,
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      _count: { select: { comments: true, likes: true, attachments: true } },
      skillAsset: { select: { id: true, assetType: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  posts = filterByContent(posts, contentList);

  const { likedIds, favIds } = await fetchUserLikeFav(uid, posts.map((p) => p.id));

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: stripHtml(p.body).slice(0, 160),
    tagScene: p.tagScene,
    tagIndustry: p.tagIndustry,
    tagContent: (() => {
      try {
        return JSON.parse(p.tagContent || '[]') as string[];
      } catch {
        return [];
      }
    })(),
    tagSkill: p.tagSkill,
    createdAt: p.createdAt.toISOString(),
    author: { id: p.author.id, nickname: p.author.nickname, role: p.author.role },
    counts: {
      comments: p._count.comments,
      likes: p._count.likes,
      attachments: p._count.attachments,
    },
    liked: likedIds.has(p.id),
    favorited: favIds.has(p.id),
    skillAsset: p.skillAsset
      ? { id: p.skillAsset.id, assetType: p.skillAsset.assetType }
      : null,
  }));
}

export function hasAnyFilter(q: FeedQuery): boolean {
  return !!(q.scene || q.industry || q.skill || q.role || q.time || q.contentList?.length || q.q);
}
