import Link from 'next/link';
import { getSessionUid } from '@/lib/session';
import { fetchFeed, hasAnyFilter, parseFeedQuery } from '@/lib/feed';
import { getSkillsMap } from '@/lib/skills-map';
import { sceneLabel, skillLabel } from '@/lib/tags';
import { PostCard } from '@/components/PostCard';
import { FilterBar } from '@/components/FilterBar';
import { Ornament } from '@/components/icons/Ornament';
import { SkillIcon } from '@/components/icons/SkillIcon';

type SP = { [k: string]: string | string[] | undefined };

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const query = parseFeedQuery(searchParams);
  const uid = await getSessionUid();

  const [items, { cells, stats }] = await Promise.all([
    fetchFeed(query, uid),
    getSkillsMap(),
  ]);

  const hasFilter = hasAnyFilter(query);

  // Pick up to 8 non-empty cells for featured section
  const featuredCells = cells.filter((c) => c.count > 0).slice(0, 8);

  return (
    <div className="mx-auto max-w-page px-4 sm:px-6">
      {/* —— Hero section —— */}
      <header className="text-center pt-6 pb-10">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-3">
          Volume I · The Index
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink-brown mb-3">
          PEVC Skills Map
        </h1>
        <p className="font-serif italic text-leather max-w-xl mx-auto mb-6">
          按 AI Skill Asset 类型与投资工作场景交叉检索，快速发现可复用的 Prompt、Agent Skill、Workflow 与工具组合。
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Link
            href="/skills-map"
            className="inline-flex items-center h-10 px-5 border border-ink-brown text-ink-brown hover:bg-ink-brown hover:text-vellum font-serif text-sm rounded-sm transition-colors"
          >
            探索 Skills Map
          </Link>
          <Link
            href="/publish"
            className="inline-flex items-center h-10 px-5 bg-ink-brown text-vellum hover:bg-wax-red font-serif text-sm rounded-sm transition-colors"
          >
            发布 Skill Asset
          </Link>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center items-center gap-3">
          <StatPill label="资产总量" value={String(stats.totalAssets)} />
          <StatPill label="活跃场景" value={String(stats.activeScenes)} />
          {stats.topAssetType && (
            <StatPill
              label="最多类型"
              value={`${stats.topAssetType.label}`}
            />
          )}
        </div>
      </header>

      {/* —— Featured cells (quick discovery) —— */}
      {featuredCells.length > 0 && !hasFilter && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-display tracking-display text-[10px] text-sepia uppercase">
              Featured
            </span>
            <span className="h-3 w-px bg-paper-edge" />
            <span className="font-serif text-sm text-ink-brown">
              快速发现
            </span>
            <Link
              href="/skills-map"
              className="ml-auto font-sans text-xs text-sepia hover:text-wax-red transition-colors"
            >
              查看完整地图 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featuredCells.map((cell) => (
              <Link
                key={`${cell.scene}-${cell.assetType}`}
                href={`/?scene=${cell.scene}&skill=${cell.assetType}`}
                className="border border-paper-edge bg-vellum hover:bg-linen rounded-md p-4 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid place-content-center w-5 h-5 rounded-full bg-parchment text-gilded">
                    <SkillIcon skill={cell.assetType} size={12} className="text-gilded" />
                  </span>
                  <span className="font-sans text-xs text-leather">
                    {skillLabel(cell.assetType)}
                  </span>
                  <span className="ml-auto font-sans text-sm font-semibold text-wax-red num-osf">
                    {cell.count}
                  </span>
                </div>
                <p className="font-serif text-xs text-sepia mb-1">
                  {sceneLabel(cell.scene)}
                </p>
                {cell.featured && (
                  <p
                    className="font-serif text-sm text-ink-brown truncate group-hover:text-wax-red transition-colors"
                    title={cell.featured.title}
                  >
                    {cell.featured.title}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* —— Feed section —— */}
      <section className="mx-auto max-w-prose">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-serif text-2xl text-ink-brown">
            最新 Skill Assets
          </h2>
          <div className="flex justify-center text-leather">
            <Ornament width={48} />
          </div>
        </div>

        {/* Filter */}
        <FilterBar />

        {/* List */}
        <div className="mt-8">
          {items.length === 0 ? (
            <EmptyState filtered={hasFilter} />
          ) : (
            <ol className="space-y-5">
              {items.map((p, idx) => (
                <li key={p.id} className="relative">
                  <span
                    className="hidden lg:block absolute -left-12 top-7 font-display tracking-display text-xs text-sepia num-osf"
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <PostCard post={p} currentUserId={uid} />
                </li>
              ))}
            </ol>
          )}
        </div>

        {items.length > 0 && (
          <footer className="mt-12 text-center">
            <div className="flex justify-center mb-3 text-leather">
              <Ornament width={48} />
            </div>
            <p className="font-serif italic text-sm text-sepia">
              本卷至此 · 共 <span className="num-osf">{items.length}</span> 条
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
        {filtered ? '当前条件之下，目录空无一物' : '此处尚无任何记录'}
      </p>
      <p className="font-sans text-sm text-sepia">
        {filtered
          ? '尝试调整或清空筛选，重新翻阅卷宗'
          : '如未启封的信笺，等待第一位作者落印'}
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
            撰写第一卷
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 h-8 px-3 border border-paper-edge bg-vellum rounded-sm">
      <span className="font-sans text-[10px] text-sepia uppercase tracking-wide">
        {label}
      </span>
      <span className="font-sans text-sm font-semibold text-ink-brown num-osf">
        {value}
      </span>
    </span>
  );
}
