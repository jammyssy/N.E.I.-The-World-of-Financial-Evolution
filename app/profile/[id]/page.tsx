import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { stripHtml } from '@/lib/validate';
import { PostCard, type PostCardData } from '@/components/PostCard';
import { roleColor } from '@/lib/tags';
import { formatTime } from '@/lib/format';

type SP = { tab?: string };

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SP;
}) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const me = await getCurrentUser();
  const isOwner = me?.id === id;
  const tab = searchParams.tab ?? 'posts';

  // 非本人只能看「我的发布」
  if (!isOwner && tab !== 'posts') redirect(`/profile/${id}`);

  const [postCount, likeCount, favCount] = await Promise.all([
    prisma.post.count({ where: { userId: id, status: 'published' } }),
    isOwner ? prisma.postLike.count({ where: { userId: id } }) : Promise.resolve(0),
    isOwner ? prisma.postFavorite.count({ where: { userId: id } }) : Promise.resolve(0),
  ]);

  // 取该 Tab 对应的内容
  let posts: any[] = [];
  if (tab === 'posts') {
    const where = isOwner ? { userId: id } : { userId: id, status: 'published' };
    posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } else if (tab === 'likes') {
    const likes = await prisma.postLike.findMany({
      where: { userId: id },
      include: {
        post: {
          include: {
            author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
            _count: { select: { comments: true, likes: true, attachments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    posts = likes.filter((l) => l.post.status === 'published').map((l) => l.post);
  } else if (tab === 'favorites') {
    const favs = await prisma.postFavorite.findMany({
      where: { userId: id },
      include: {
        post: {
          include: {
            author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
            _count: { select: { comments: true, likes: true, attachments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    posts = favs.filter((f) => f.post.status === 'published').map((f) => f.post);
  }

  const myLikedIds = me
    ? new Set(
        (
          await prisma.postLike.findMany({
            where: { userId: me.id, postId: { in: posts.map((p) => p.id) } },
            select: { postId: true },
          })
        ).map((l) => l.postId)
      )
    : new Set<number>();
  const myFavIds = me
    ? new Set(
        (
          await prisma.postFavorite.findMany({
            where: { userId: me.id, postId: { in: posts.map((p) => p.id) } },
            select: { postId: true },
          })
        ).map((f) => f.postId)
      )
    : new Set<number>();

  const items: PostCardData[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: stripHtml(p.body).slice(0, 160),
    tagScene: p.tagScene,
    tagIndustry: p.tagIndustry,
    tagContent: (() => {
      try {
        return JSON.parse(p.tagContent || '[]');
      } catch {
        return [];
      }
    })(),
    tagSkill: p.tagSkill,
    createdAt: p.createdAt.toISOString(),
    author: { id: p.author.id, nickname: p.author.nickname, role: p.author.role },
    counts: { comments: p._count.comments, likes: p._count.likes, attachments: p._count.attachments },
    liked: myLikedIds.has(p.id),
    favorited: myFavIds.has(p.id),
  }));

  return (
    <div>
      <header className="card mb-5 flex items-center gap-4 p-6">
        <span className="grid h-16 w-16 place-content-center rounded-full bg-brand-600 text-xl font-bold text-white">
          {user.nickname.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            {user.nickname}
            <span className={`chip ${roleColor(user.role)}`}>{user.role}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">加入于 {formatTime(user.createdAt)}</p>
        </div>
      </header>

      <div className="card mb-5 flex border-b border-ink-300/60">
        <TabLink href={`/profile/${id}?tab=posts`} active={tab === 'posts'} count={postCount}>
          我的发布
        </TabLink>
        {isOwner && (
          <>
            <TabLink href={`/profile/${id}?tab=likes`} active={tab === 'likes'} count={likeCount}>
              我的点赞
            </TabLink>
            <TabLink href={`/profile/${id}?tab=favorites`} active={tab === 'favorites'} count={favCount}>
              我的收藏
            </TabLink>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center text-ink-500">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-sm">
            {tab === 'posts' && '还没有发布内容'}
            {tab === 'likes' && '还没有点赞过任何内容'}
            {tab === 'favorites' && '收藏夹空空如也'}
          </p>
          {tab === 'posts' && isOwner && (
            <Link href="/publish" className="btn-primary mt-4">
              发布第一篇
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={me?.id ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative px-5 py-3 text-sm ${
        active ? 'text-brand-600 font-semibold' : 'text-ink-700 hover:text-brand-600'
      }`}
    >
      {children}
      <span className="ml-1 text-xs text-ink-500">({count})</span>
      {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-600" />}
    </Link>
  );
}
