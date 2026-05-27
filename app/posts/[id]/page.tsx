import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser, getSessionUid } from '@/lib/session';
import { sceneLabel, industryLabel, skillLabel, contentLabel, roleColor } from '@/lib/tags';
import { formatBytes, formatTime, fileIcon, truncate } from '@/lib/format';
import { CommentSection } from '@/components/CommentSection';
import { PostActions } from './PostActions';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      attachments: { orderBy: { createdAt: 'asc' } },
      _count: { select: { comments: true, likes: true, favorites: true } },
    },
  });
  if (!post || post.status !== 'published') notFound();

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const me = await getCurrentUser();
  const uid = me?.id ?? null;
  let liked = false;
  let favorited = false;
  if (uid) {
    const [l, f] = await Promise.all([
      prisma.postLike.findUnique({ where: { userId_postId: { userId: uid, postId: id } } }),
      prisma.postFavorite.findUnique({ where: { userId_postId: { userId: uid, postId: id } } }),
    ]);
    liked = !!l;
    favorited = !!f;
  }

  const tagContent: string[] = (() => {
    try {
      return JSON.parse(post.tagContent || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <article className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <header className="card p-6">
          <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:text-brand-600">
              <span className="grid h-9 w-9 place-content-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {post.author.nickname.slice(0, 1).toUpperCase()}
              </span>
              <span className="font-medium">{post.author.nickname}</span>
            </Link>
            <span className={`chip ${roleColor(post.author.role)}`}>{post.author.role}</span>
            <span className="text-ink-500">·</span>
            <span className="text-ink-500">{formatTime(post.createdAt)}</span>
            <span className="text-ink-500">·</span>
            <span className="text-ink-500">{post.viewCount} 次阅读</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Link href={`/?scene=${post.tagScene}`}>
              <span className="chip-brand cursor-pointer hover:bg-brand-100">{sceneLabel(post.tagScene)}</span>
            </Link>
            {post.tagIndustry && (
              <Link href={`/?industry=${post.tagIndustry}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{industryLabel(post.tagIndustry)}</span>
              </Link>
            )}
            {post.tagSkill && (
              <Link href={`/?skill=${post.tagSkill}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{skillLabel(post.tagSkill)}</span>
              </Link>
            )}
            {tagContent.map((c) => (
              <Link key={c} href={`/?content=${c}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{contentLabel(c)}</span>
              </Link>
            ))}
          </div>
        </header>

        <div className="card p-6">
          <div className="prose-post" dangerouslySetInnerHTML={{ __html: post.body }} />
        </div>

        {post.attachments.length > 0 && (
          <section className="card p-6">
            <h3 className="mb-3 text-base font-semibold">📎 附件 ({post.attachments.length})</h3>
            <ul className="divide-y divide-ink-300/60">
              {post.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{fileIcon(a.mimeType, a.fileName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={a.fileName}>
                      {truncate(a.fileName, 60)}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatBytes(a.fileSize)} · {a.downloadCount} 次下载
                    </p>
                  </div>
                  {uid ? (
                    <a
                      href={`/api/files/${a.id}/download`}
                      className="btn-secondary"
                      download
                    >
                      下载
                    </a>
                  ) : (
                    <Link href={`/login?next=/posts/${id}`} className="btn-secondary">
                      登录下载
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <PostActions
          postId={id}
          initialLiked={liked}
          initialFavorited={favorited}
          initialLikes={post._count.likes}
          isAuthed={!!uid}
        />

        <CommentSection
          postId={id}
          postAuthorId={post.author.id}
          currentUser={me ? { id: me.id, nickname: me.nickname, role: me.role } : null}
        />
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">作者</h3>
          <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:text-brand-600">
            <span className="grid h-12 w-12 place-content-center rounded-full bg-brand-600 text-lg font-bold text-white">
              {post.author.nickname.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="font-medium">{post.author.nickname}</div>
              <span className={`chip mt-1 ${roleColor(post.author.role)}`}>{post.author.role}</span>
            </div>
          </Link>
        </div>
        <div className="card p-4 text-sm">
          <h3 className="mb-3 font-semibold">本帖标签</h3>
          <dl className="space-y-2 text-xs text-ink-500">
            <div>
              <dt className="text-ink-500">工作场景</dt>
              <dd className="text-ink-900">{sceneLabel(post.tagScene)}</dd>
            </div>
            {post.tagIndustry && (
              <div>
                <dt className="text-ink-500">行业赛道</dt>
                <dd className="text-ink-900">{industryLabel(post.tagIndustry)}</dd>
              </div>
            )}
            {tagContent.length > 0 && (
              <div>
                <dt className="text-ink-500">工作内容</dt>
                <dd className="text-ink-900">{tagContent.map(contentLabel).join('、')}</dd>
              </div>
            )}
            {post.tagSkill && (
              <div>
                <dt className="text-ink-500">Skill 类型</dt>
                <dd className="text-ink-900">{skillLabel(post.tagSkill)}</dd>
              </div>
            )}
          </dl>
        </div>
      </aside>
    </article>
  );
}
