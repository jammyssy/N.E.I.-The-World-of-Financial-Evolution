import { prisma } from '@/lib/db';
import { getSessionUid } from '@/lib/session';
import { stripHtml } from '@/lib/validate';
import { PostCard, type PostCardData } from '@/components/PostCard';
import { FilterBar } from '@/components/FilterBar';
import { SCENE_TAGS, INDUSTRY_TAGS, CONTENT_TAGS, SKILL_TAGS } from '@/lib/tags';

const sceneVals: string[] = SCENE_TAGS.map((t) => t.value);
const industryVals: string[] = INDUSTRY_TAGS.map((t) => t.value);
const contentVals: string[] = CONTENT_TAGS.map((t) => t.value);
const skillVals: string[] = SKILL_TAGS.map((t) => t.value);

type SP = { [k: string]: string | string[] | undefined };

export default async function HomePage({ searchParams }: { searchParams: SP }) {
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

  const where: any = { status: 'published' };
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
    take: 50,
  });

  if (contentList.length > 0) {
    const v = contentList.filter((c) => contentVals.includes(c));
    if (v.length > 0) {
      posts = posts.filter((p) => {
        try {
          const arr = JSON.parse(p.tagContent || '[]') as string[];
          return v.every((x) => arr.includes(x));
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
    const ids = posts.map((p) => p.id);
    const [likes, favs] = await Promise.all([
      prisma.postLike.findMany({ where: { userId: uid, postId: { in: ids } }, select: { postId: true } }),
      prisma.postFavorite.findMany({ where: { userId: uid, postId: { in: ids } }, select: { postId: true } }),
    ]);
    likedIds = new Set(likes.map((l) => l.postId));
    favIds = new Set(favs.map((f) => f.postId));
  }

  const items: PostCardData[] = posts.map((p) => ({
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
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">
            {q ? `搜索 "${q}"` : '最新内容'}
          </h1>
          <span className="text-sm text-ink-500">{items.length} 条结果</span>
        </div>
        <FilterBar />

        {items.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-12 text-center text-ink-500">
            <span className="text-4xl">🗂️</span>
            <p className="mt-3 text-sm">暂无内容，调整筛选条件或发布第一条内容</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => (
              <PostCard key={p.id} post={p} currentUserId={uid} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">关于平台</h3>
          <p className="text-sm text-ink-700">
            PEVC 知识平台是面向一级市场（VC / PE / FA）的垂直知识社区。
            围绕投资工作流的 10 个核心场景，沉淀方法论、模板、Prompt 与案例。
          </p>
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">热门工作场景</h3>
          <ul className="space-y-1.5 text-sm">
            {SCENE_TAGS.slice(0, 6).map((s) => (
              <li key={s.value}>
                <a href={`/?scene=${s.value}`} className="text-ink-700 hover:text-brand-600">
                  · {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">四维分类体系</h3>
          <ul className="space-y-1 text-xs text-ink-500">
            <li>📍 工作场景（必填）</li>
            <li>🏷️ 行业赛道</li>
            <li>📦 工作内容（多选）</li>
            <li>🔧 Skill 类型</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
