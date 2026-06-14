import Link from 'next/link';
import { getSessionUid } from '@/lib/session';
import { fetchFeed, hasAnyFilter, parseFeedQuery } from '@/lib/feed';
import { prisma } from '@/lib/db';
import { POST_STATUS } from '@/lib/status';
import { PostCard } from '@/components/PostCard';
import { FilterStrip } from '@/components/FilterStrip';

type SP = { [k: string]: string | string[] | undefined };

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const query = parseFeedQuery(searchParams);
  const uid = await getSessionUid();

  // 并行：Feed 列表 + 已收录 Skill 总数（一个 count 查询，零额外往返）
  const [items, totalSkills] = await Promise.all([
    fetchFeed(query, uid),
    prisma.post.count({
      where: { status: POST_STATUS.PUBLISHED, skillAsset: { isNot: null } },
    }),
  ]);
  const hasFilter = hasAnyFilter(query);

  return (
    <div className="mx-auto max-w-page px-4 sm:px-6">
      {/* —— 小目录头（压缩版 Hero）—— */}
      <header className="flex items-end justify-between gap-4 pt-6 pb-5 border-b border-paper-edge">
        <div className="min-w-0">
          <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-1.5">
            PEVC Skill 档案馆
          </p>
          <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
            <h1 className="font-serif text-3xl sm:text-4xl text-ink-brown">
              发现能用的 Skill
            </h1>
            <p className="font-serif text-3xl sm:text-4xl">
              <span className="num-osf text-wax-red">{totalSkills}</span>
              <span className="text-ink-brown"> 个已收录</span>
            </p>
          </div>
          <p className="font-serif italic text-sm text-leather line-clamp-1">
            PE/VC/FA 从业者的 AI 提示词、模板、工作流 · 找到就能直接用
          </p>
        </div>
        <Link
          href="/publish"
          className="shrink-0 inline-flex items-center h-10 px-5 bg-ink-brown text-vellum hover:bg-wax-red font-serif text-sm rounded-sm transition-colors"
        >
          分享一个
        </Link>
      </header>

      {/* —— 分类条（目录头条）—— */}
      <FilterStrip />

      {/* —— Feed 网格 —— */}
      <section>
        {items.length === 0 ? (
          <EmptyState filtered={hasFilter} />
        ) : (
          <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((p) => (
              <li key={p.id}>
                <PostCard post={p} currentUserId={uid} variant="compact" />
              </li>
            ))}
          </ol>
        )}

        {items.length > 0 && (
          <footer className="mt-10 pb-6 text-center">
            <p className="font-serif italic text-sm text-sepia">
              共 <span className="num-osf">{items.length}</span> 条
            </p>
          </footer>
        )}
      </section>
    </div>
  );
}

/* —— 空状态 —— */
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="border border-paper-edge bg-vellum rounded-md py-16 px-8 text-center">
      <div className="flex justify-center mb-6 text-paper-edge">
        <EnvelopeSeal />
      </div>
      <p className="font-serif italic text-leather text-lg mb-2">
        {filtered ? '当前条件下没有内容' : '这里还没有内容'}
      </p>
      <p className="font-sans text-sm text-sepia">
        {filtered ? '试试调整或清空筛选' : '来分享第一个 Skill 吧'}
      </p>
      <div className="mt-6">
        {filtered ? (
          <Link
            href="/"
            className="inline-flex items-center h-9 px-4 border border-ink-brown text-ink-brown hover:bg-ink-brown hover:text-vellum font-serif text-sm rounded-sm transition-colors"
          >
            清空筛选 · 显示全部
          </Link>
        ) : (
          <Link
            href="/publish"
            className="inline-flex items-center h-9 px-4 bg-ink-brown text-vellum hover:bg-wax-red font-serif text-sm rounded-sm transition-colors"
          >
            分享第一个
          </Link>
        )}
      </div>
    </div>
  );
}

function EnvelopeSeal() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="10" width="68" height="44" />
      <path d="M6 10 L40 36 L74 10" />
      <circle cx="40" cy="42" r="7" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="40" cy="42" r="3" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}
