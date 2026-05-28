import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { sceneLabel, industryLabel, skillLabel, contentLabel, roleColor } from '@/lib/tags';
import { formatBytes, formatTime, fileIcon, truncate } from '@/lib/format';
import { CommentSection } from '@/components/CommentSection';
import { getPostDetail } from '@/features/posts/queries';
import { PostActions } from './PostActions';

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  const me = await getCurrentUser();
  const post = await getPostDetail(id, me?.id ?? null, true);
  if (!post) notFound();

  const isAgentSkill = post.skillAsset?.assetType === 'agent-skill';
  const isApiScript = post.skillAsset?.assetType === 'api-script';

  return (
    <article className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        {/* Header */}
        <header className="card p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {post.skillAsset && (
              <span className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                {skillLabel(post.skillAsset.assetType)}
              </span>
            )}
            <span className="chip">{sceneLabel(post.tags.scene)}</span>
          </div>
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
            <Link href={`/?scene=${post.tags.scene}`}>
              <span className="chip-brand cursor-pointer hover:bg-brand-100">{sceneLabel(post.tags.scene)}</span>
            </Link>
            {post.tags.industry && (
              <Link href={`/?industry=${post.tags.industry}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{industryLabel(post.tags.industry)}</span>
              </Link>
            )}
            {post.skillAsset && (
              <Link href={`/?assetType=${post.skillAsset.assetType}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{skillLabel(post.skillAsset.assetType)}</span>
              </Link>
            )}
            {post.tags.content.map((content) => (
              <Link key={content} href={`/?content=${content}`}>
                <span className="chip cursor-pointer hover:bg-ink-300">{contentLabel(content)}</span>
              </Link>
            ))}
          </div>
        </header>

        {/* Skill Asset Panel */}
        {post.skillAsset && (
          <section className="rounded-lg border-2 border-brand-200 bg-brand-50/30 p-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-ink-900">Skill 资产信息</h2>
              <span className="rounded-md bg-brand-600 px-2 py-0.5 text-[11px] font-medium text-white">
                {skillLabel(post.skillAsset.assetType)}
              </span>
            </div>
            <dl className="space-y-3 text-sm">
              {post.skillAsset.sourceUrl && (
                <div>
                  <dt className="text-xs font-medium text-ink-500">来源链接</dt>
                  <dd>
                    <a href={post.skillAsset.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline break-all">
                      {post.skillAsset.sourceUrl}
                    </a>
                  </dd>
                </div>
              )}
              {post.skillAsset.installHint && (
                <div>
                  <dt className="text-xs font-medium text-ink-500">
                    {isAgentSkill ? 'SKILL.md 安装说明' : isApiScript ? '环境配置 & 安装' : '安装 / 使用前置说明'}
                  </dt>
                  <dd className={`whitespace-pre-wrap text-ink-800 ${isApiScript ? 'rounded-md bg-ink-900 p-3 font-mono text-sm text-green-400' : ''}`}>
                    {post.skillAsset.installHint}
                  </dd>
                </div>
              )}
              {post.skillAsset.usageNotes && (
                <div>
                  <dt className="text-xs font-medium text-ink-500">适用场景 / 使用心得</dt>
                  <dd className={`whitespace-pre-wrap text-ink-800 ${isApiScript ? 'rounded-md bg-ink-900 p-3 font-mono text-sm text-green-400' : ''}`}>
                    {post.skillAsset.usageNotes}
                  </dd>
                </div>
              )}
              {isAgentSkill && !post.skillAsset.installHint && (
                <p className="text-xs text-ink-500">
                  这是一个 Agent Skill 资产。SKILL.md 文件可从下方附件中下载，或通过来源链接获取。
                </p>
              )}
            </dl>
          </section>
        )}

        {/* Body */}
        <div className="card p-6">
          <div className="prose-post" dangerouslySetInnerHTML={{ __html: post.body ?? '' }} />
        </div>

        {/* Attachments */}
        {post.attachments.length > 0 && (
          <section className="card p-6">
            <h3 className="mb-3 text-base font-semibold">
              {post.skillAsset?.assetType === 'template' ? '模板文件' : '资源文件'} ({post.attachments.length})
            </h3>
            <ul className="divide-y divide-ink-300/60">
              {post.attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{fileIcon(attachment.mimeType, attachment.fileName)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={attachment.fileName}>
                      {truncate(attachment.fileName, 60)}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatBytes(attachment.fileSize)} · {attachment.downloadCount} 次下载
                    </p>
                  </div>
                  {me ? (
                    <a href={`/api/files/${attachment.id}/download`} className="btn-secondary" download>
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
          initialLiked={post.viewerState.liked}
          initialFavorited={post.viewerState.favorited}
          initialLikes={post.counts.likes}
          isAuthed={!!me}
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
          <h3 className="mb-3 font-semibold">本资产标签</h3>
          <dl className="space-y-2 text-xs text-ink-500">
            <div>
              <dt className="text-ink-500">工作场景</dt>
              <dd className="text-ink-900">{sceneLabel(post.tags.scene)}</dd>
            </div>
            {post.tags.industry && (
              <div>
                <dt className="text-ink-500">行业赛道</dt>
                <dd className="text-ink-900">{industryLabel(post.tags.industry)}</dd>
              </div>
            )}
            {post.tags.content.length > 0 && (
              <div>
                <dt className="text-ink-500">工作内容</dt>
                <dd className="text-ink-900">{post.tags.content.map(contentLabel).join('、')}</dd>
              </div>
            )}
            {post.skillAsset && (
              <div>
                <dt className="text-ink-500">Skill 类型</dt>
                <dd className="text-ink-900">{skillLabel(post.skillAsset.assetType)}</dd>
              </div>
            )}
          </dl>
        </div>
      </aside>
    </article>
  );
}
