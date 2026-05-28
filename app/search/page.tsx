import Link from 'next/link';
import { getSessionUid } from '@/lib/session';
import { fetchFeed, hasAnyFilter, parseFeedQuery } from '@/lib/feed';
import { PostCard } from '@/components/PostCard';
import { FilterBar } from '@/components/FilterBar';
import { Ornament } from '@/components/icons/Ornament';
import { SCENE_TAGS, INDUSTRY_TAGS, SKILL_TAGS } from '@/lib/tags';
import { SearchInput } from './SearchInput';

type SP = { [k: string]: string | string[] | undefined };

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const query = parseFeedQuery(searchParams);
  const uid = await getSessionUid();
  const items = query.q || hasAnyFilter(query) ? await fetchFeed(query, uid) : [];
  const filterOnly = !query.q && hasAnyFilter(query);
  const idle = !query.q && !hasAnyFilter(query);

  return (
    <div className="mx-auto max-w-prose">
      {/* —— 检索 Hero —— */}
      <header className="text-center mb-10 mt-2">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-3">
          Search · The Codex
        </p>
        <h1 className="font-serif text-4xl text-ink-brown mb-3">检索目录</h1>
        <p className="font-serif italic text-leather mb-7">
          A whispered query, an answer in ink
        </p>

        <SearchInput />

        <div className="flex justify-center mt-7 text-leather">
          <Ornament width={64} />
        </div>
      </header>

      {/* —— 筛选 —— */}
      <FilterBar />

      {/* —— 结果 —— */}
      <div className="mt-8">
        {idle ? (
          <IdleBrowse />
        ) : items.length === 0 ? (
          <NoMatch query={query} />
        ) : (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-display tracking-display text-xs text-sepia uppercase">
                Result
              </span>
              <p className="font-serif italic text-leather text-sm">
                {query.q ? (
                  <>
                    围绕 <span className="text-ink-brown">&ldquo;{query.q}&rdquo;</span>{' '}
                    {filterOnly ? '及当前筛选' : ''}
                    检索到{' '}
                    <span className="num-osf text-ink-brown">{items.length}</span> 卷
                  </>
                ) : (
                  <>
                    依当前筛选 · 共{' '}
                    <span className="num-osf text-ink-brown">{items.length}</span> 卷
                  </>
                )}
              </p>
            </div>

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

            <footer className="mt-12 text-center">
              <div className="flex justify-center mb-3 text-leather">
                <Ornament width={48} />
              </div>
              <p className="font-serif italic text-sm text-sepia">
                此次检索至此
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Idle 状态 —— 未输入也未筛选时的引导
   "按维度浏览"的速查链接，避免空白页
   ============================================================ */
function IdleBrowse() {
  const scenes = SCENE_TAGS.slice(0, 6);
  const industries = INDUSTRY_TAGS.slice(0, 6);
  const skills = SKILL_TAGS.slice(0, 4);

  return (
    <section className="border border-paper-edge bg-vellum rounded-md p-8">
      <p className="font-serif italic text-center text-leather mb-6">
        无需输入也可按维度浏览 · 任选其一开始
      </p>

      <div className="grid sm:grid-cols-3 gap-6">
        <BrowseColumn numeral="I" title="工作场景">
          {scenes.map((s) => (
            <Link
              key={s.value}
              href={`/search?scene=${s.value}`}
              className="block font-sans text-sm text-leather hover:text-ink-brown py-0.5"
            >
              · {s.label}
            </Link>
          ))}
        </BrowseColumn>

        <BrowseColumn numeral="II" title="行业赛道">
          {industries.map((s) => (
            <Link
              key={s.value}
              href={`/search?industry=${s.value}`}
              className="block font-sans text-sm text-leather hover:text-ink-brown py-0.5"
            >
              · {s.label}
            </Link>
          ))}
        </BrowseColumn>

        <BrowseColumn numeral="IV" title="Skill 类型">
          {skills.map((s) => (
            <Link
              key={s.value}
              href={`/search?skill=${s.value}`}
              className="block font-sans text-sm text-leather hover:text-ink-brown py-0.5"
            >
              · {s.label}
            </Link>
          ))}
          <Link
            href="/search?content=memo"
            className="block font-sans text-sm text-leather hover:text-ink-brown py-0.5"
          >
            · 更多…
          </Link>
        </BrowseColumn>
      </div>
    </section>
  );
}

function BrowseColumn({
  numeral,
  title,
  children,
}: {
  numeral: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-baseline gap-2 mb-3 pb-2 border-b border-paper-edge">
        <span className="font-display tracking-display text-[11px] text-sepia">
          {numeral}
        </span>
        <span className="font-serif text-base text-ink-brown">{title}</span>
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* —— 无匹配状态 —— */
function NoMatch({ query }: { query: { q?: string } }) {
  return (
    <div className="border border-paper-edge bg-vellum rounded-md py-14 px-8 text-center">
      <div className="flex justify-center mb-5 text-paper-edge">
        <MagnifierIcon />
      </div>
      <p className="font-serif italic text-leather text-lg mb-2">
        {query.q ? (
          <>未寻得与 <span className="text-ink-brown">&ldquo;{query.q}&rdquo;</span> 相关的卷帙</>
        ) : (
          '当前筛选条件之下，目录空无一物'
        )}
      </p>
      <p className="font-sans text-sm text-sepia">
        换一个关键词、放宽筛选，或翻阅其他维度
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/search"
          className="inline-flex items-center h-9 px-4 border border-ink-brown text-ink-brown hover:bg-ink-brown hover:text-vellum font-serif text-sm rounded-sm transition-colors"
        >
          清空 · 重新检索
        </Link>
        <Link
          href="/"
          className="inline-flex items-center h-9 px-4 text-leather hover:text-ink-brown font-serif italic text-sm transition-colors underline underline-offset-4 decoration-paper-edge hover:decoration-ink-brown"
        >
          回到卷宗目录 →
        </Link>
      </div>
    </div>
  );
}

function MagnifierIcon() {
  return (
    <svg width="76" height="60" viewBox="0 0 76 60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" aria-hidden="true">
      {/* 一本翻开的书 */}
      <path d="M4 12 H32 V52 H4 Z" />
      <path d="M32 12 L40 12 L40 52 L32 52" />
      <path d="M8 18 H28" />
      <path d="M8 22 H28" />
      <path d="M8 26 H22" />
      {/* 放大镜 */}
      <circle cx="52" cy="32" r="11" />
      <path d="M60 40 L72 52" strokeLinecap="round" />
    </svg>
  );
}
