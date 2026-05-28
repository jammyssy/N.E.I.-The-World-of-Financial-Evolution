import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import {
  sceneLabel,
  industryLabel,
  contentLabel,
  skillLabel,
} from '@/lib/tags';
import { formatTime } from '@/lib/format';
import { RoleBadge } from '@/components/icons/RoleBadge';
import { Ornament } from '@/components/icons/Ornament';
import {
  SceneChip,
  IndustryChip,
  ContentChip,
  SkillChip,
} from '@/components/ui/Chip';
import { AttachmentList } from '@/components/AttachmentList';
import { CommentSection } from '@/components/CommentSection';
import { PostActions } from './PostActions';

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  // 仅在初次渲染累加阅读 —— 不要 race
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
    <article className="mx-auto max-w-prose">
      {/* 返回 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-serif italic text-sm text-sepia hover:text-ink-brown transition-colors"
        >
          ← 返回卷宗目录
        </Link>
      </div>

      {/* —— 文章卷首 —— */}
      <header className="text-center mb-10">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-4">
          Chapter · {sceneLabel(post.tagScene)}
        </p>
        <h1 className="font-serif text-[28px] sm:text-[40px] leading-tight text-ink-brown mb-6">
          {post.title}
        </h1>

        {/* 作者条 */}
        <div className="flex items-center justify-center gap-3 mb-3 font-sans text-sm text-sepia">
          <Link
            href={`/profile/${post.author.id}`}
            className="flex items-center gap-2 group"
          >
            <RoleBadge role={post.author.role} size={20} />
            <span className="font-serif text-base text-ink-brown group-hover:text-wax-red transition-colors">
              {post.author.nickname}
            </span>
          </Link>
          <span className="text-sepia">·</span>
          <span>{formatTime(post.createdAt)}</span>
          <span className="text-sepia">·</span>
          <span>
            <span className="num-osf">{post.viewCount}</span> 次开卷
          </span>
        </div>

        <div className="flex justify-center text-leather mt-5">
          <Ornament width={80} />
        </div>
      </header>

      {/* —— 文章正文 —— */}
      <div
        className="prose-manuscript drop-cap-article mb-10"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {/* —— 卷末标签 —— */}
      <section className="border-t border-paper-edge pt-6 flex flex-wrap items-center gap-2">
        <span className="font-display tracking-display text-[10px] text-sepia uppercase mr-2">
          Tags
        </span>
        <Link href={`/?scene=${post.tagScene}`}>
          <SceneChip as="a">{sceneLabel(post.tagScene)}</SceneChip>
        </Link>
        {post.tagIndustry && (
          <Link href={`/?industry=${post.tagIndustry}`}>
            <IndustryChip as="a">{industryLabel(post.tagIndustry)}</IndustryChip>
          </Link>
        )}
        {tagContent.map((c) => (
          <Link key={c} href={`/?content=${c}`}>
            <ContentChip as="a">{contentLabel(c)}</ContentChip>
          </Link>
        ))}
        {post.tagSkill && (
          <Link href={`/?skill=${post.tagSkill}`}>
            <SkillChip as="a" skillKey={post.tagSkill}>
              {skillLabel(post.tagSkill)}
            </SkillChip>
          </Link>
        )}
      </section>

      {/* —— 附件 —— */}
      <AttachmentList
        postId={post.id}
        attachments={post.attachments}
        isAuthed={!!uid}
      />

      {/* —— 浮动互动条 —— */}
      <div className="mt-12">
        <PostActions
          postId={id}
          initialLiked={liked}
          initialFavorited={favorited}
          initialLikes={post._count.likes}
          isAuthed={!!uid}
        />
      </div>

      {/* —— 评论 —— */}
      <CommentSection
        postId={id}
        postAuthorId={post.author.id}
        currentUser={me ? { id: me.id, nickname: me.nickname, role: me.role } : null}
      />

      {/* —— 卷尾花体 —— */}
      <footer className="mt-section text-center">
        <div className="flex justify-center mb-3 text-leather">
          <Ornament width={64} />
        </div>
        <p className="font-serif italic text-sm text-sepia">
          End of Chapter · 本卷至此
        </p>
      </footer>
    </article>
  );
}
