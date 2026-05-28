import Link from 'next/link';
import { getSessionUid } from '@/lib/session';
import { fetchFeed, hasAnyFilter, parseFeedQuery } from '@/lib/feed';
import { PostCard } from '@/components/PostCard';
import { FilterBar } from '@/components/FilterBar';
import { Ornament } from '@/components/icons/Ornament';

type SP = { [k: string]: string | string[] | undefined };

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const query = parseFeedQuery(searchParams);
  const uid = await getSessionUid();
  const items = await fetchFeed(query, uid);
  const hasFilter = hasAnyFilter(query);

  return (
    <div className="mx-auto max-w-prose">
      {/* —— 卷首 —— */}
      <header className="text-center mb-10 mt-2">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-3">
          Volume I · The Index
        </p>
        <h1 className="font-serif text-4xl text-ink-brown mb-3">卷宗目录</h1>
        <p className="font-serif italic text-leather">
          按时间倒序排列 · 截至{' '}
          <span className="num-osf">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </p>
        <div className="flex justify-center mt-5 text-leather">
          <Ornament width={64} />
        </div>
      </header>

      {/* —— 筛选 —— */}
      <FilterBar />

      {/* —— 列表 —— */}
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
