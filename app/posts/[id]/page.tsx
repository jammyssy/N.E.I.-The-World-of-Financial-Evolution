import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { cn } from '@/lib/cn';
import { getCurrentUser } from '@/lib/session';
import {
  sceneLabel,
  industryLabel,
  contentLabel,
  skillLabel,
  HOW_TO_USE,
} from '@/lib/tags';
import { formatTime } from '@/lib/format';
import { POST_STATUS } from '@/lib/status';
import { RoleBadge } from '@/components/icons/RoleBadge';
import { Ornament } from '@/components/icons/Ornament';
import { SkillIcon } from '@/components/icons/SkillIcon';
import {
  SceneChip,
  IndustryChip,
  ContentChip,
  SkillChip,
} from '@/components/ui/Chip';
import { AttachmentList } from '@/components/AttachmentList';
import { CommentSection } from '@/components/CommentSection';
import { PostActions } from './PostActions';
import { CopyPromptButton } from './CopyPromptButton';

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
      skillAsset: true,
      _count: { select: { comments: true, likes: true, favorites: true } },
    },
  });
  if (!post || post.status !== POST_STATUS.PUBLISHED) notFound();

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

  // 资产类型 → 「怎么用」固定说明（给不懂技术的读者一句下一步动作）
  const assetType = post.skillAsset?.assetType ?? null;
  const howToUse = assetType ? HOW_TO_USE[assetType] : null;
  const isPrompt = assetType === 'prompt';

  return (
    <article className="mx-auto max-w-prose">
      {/* 返回 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-serif italic text-sm text-sepia hover:text-ink-brown transition-colors"
        >
          ← 返回首页
        </Link>
      </div>

      {/* —— 文章卷首 —— */}
      <header className="text-center mb-10">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-4">
          {sceneLabel(post.tagScene)}
        </p>
        <h1 className="font-serif text-[28px] sm:text-[40px] leading-tight text-ink-brown mb-6">
          {post.title}
        </h1>

        {/* Skill Asset type badge */}
        {post.skillAsset && (
          <span className="inline-flex items-center gap-1.5 rounded bg-wax-red px-2.5 py-1 text-xs font-semibold text-white">
            <SkillIcon skill={post.skillAsset.assetType} className="h-3.5 w-3.5" />
            {skillLabel(post.skillAsset.assetType)}
          </span>
        )}

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
            <span className="num-osf">{post.viewCount}</span> 次浏览
          </span>
        </div>

        <div className="flex justify-center text-leather mt-5">
          <Ornament width={80} />
        </div>
      </header>

      {/* —— 「怎么用」固定说明条（给不懂技术的读者）—— */}
      {howToUse && (
        <section className="mb-8 rounded-lg border border-gilded/40 bg-gilded/5 p-4 flex gap-3">
          <span className="shrink-0 mt-0.5 text-gilded" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M8 1.5 a6.5 6.5 0 0 1 0 13 a6.5 6.5 0 0 1 0 -13 Z" />
              <path d="M8 5 V8.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
          </span>
          <div className="text-sm">
            <p className="font-serif text-ink-brown mb-0.5">怎么用这个{isPrompt ? '提示词' : skillLabel(assetType) || '东西'}</p>
            <p className="font-sans text-[13px] text-leather leading-relaxed">{howToUse}</p>
          </div>
        </section>
      )}

      {/* —— Skill 资产信息面板（补充说明，作者填了才显示）—— */}
      {post.skillAsset && (post.skillAsset.sourceUrl || post.skillAsset.installHint || post.skillAsset.usageNotes) && (
        <section className="rounded-lg border-2 border-wax-red/20 bg-vellum/50 p-6 mb-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink-brown">补充说明</h2>
            <span className="rounded bg-wax-red px-2 py-0.5 text-[11px] font-medium text-white">
              {skillLabel(post.skillAsset.assetType)}
            </span>
          </div>
          <dl className="space-y-3 text-sm">
            {post.skillAsset.sourceUrl && (
              <div>
                <dt className="text-xs font-medium text-sepia">来源链接</dt>
                <dd>
                  <a href={post.skillAsset.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-leather hover:underline break-all">
                    {post.skillAsset.sourceUrl}
                  </a>
                </dd>
              </div>
            )}
            {post.skillAsset.installHint && (
              <div>
                <dt className="text-xs font-medium text-sepia">
                  {post.skillAsset.assetType === 'agent-skill' ? 'SKILL.md 安装说明' : post.skillAsset.assetType === 'api-script' ? '环境配置 & 安装' : '安装 / 使用前置说明'}
                </dt>
                <dd className={`whitespace-pre-wrap text-ink-brown ${post.skillAsset.assetType === 'api-script' ? 'rounded bg-ink-brown p-3 font-mono text-sm text-sepia' : ''}`}>
                  {post.skillAsset.installHint}
                </dd>
              </div>
            )}
            {post.skillAsset.usageNotes && (
              <div>
                <dt className="text-xs font-medium text-sepia">适用场景 / 使用心得</dt>
                <dd className={`whitespace-pre-wrap text-ink-brown ${post.skillAsset.assetType === 'api-script' ? 'rounded bg-ink-brown p-3 font-mono text-sm text-sepia' : ''}`}>
                  {post.skillAsset.usageNotes}
                </dd>
              </div>
            )}
            {post.skillAsset.assetType === 'agent-skill' && !post.skillAsset.installHint && (
              <p className="text-xs text-sepia">
                这是个 SKILL.md 文件，可以从下方附件下载，或通过来源链接获取。
              </p>
            )}
          </dl>
        </section>
      )}

      {/* —— 文章正文（提示词类型带复制按钮）—— */}
      <div className="mb-10">
        {isPrompt && (
          <div className="flex justify-end mb-2">
            <CopyPromptButton
              bodyHtml={post.body}
              postId={post.id}
              isAuthed={!!uid}
            />
          </div>
        )}
        <div
          className={cn(
            'prose-manuscript drop-cap-article',
            // 提示词用 <pre> 存，改成等宽 + 换行保留的呈现
            isPrompt && 'font-mono text-sm bg-vellum/40 border border-paper-edge rounded p-4 not-italic',
          )}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </div>

      {/* —— 标签 —— */}
      <section className="border-t border-paper-edge pt-6 flex flex-wrap items-center gap-2">
        <span className="font-display tracking-display text-[10px] text-sepia uppercase mr-2">
          标签
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
        headerTitle="配套文件"
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

      {/* —— 页尾 —— */}
      <footer className="mt-section text-center">
        <div className="flex justify-center mb-3 text-leather">
          <Ornament width={64} />
        </div>
        <p className="font-serif italic text-sm text-sepia">到这里就结束啦</p>
      </footer>
    </article>
  );
}
