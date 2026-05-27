import Link from 'next/link';
import { getSessionUid } from '@/lib/session';
import { PostCard } from '@/components/PostCard';
import { FilterBar } from '@/components/FilterBar';
import { SCENE_TAGS, SKILL_TAGS } from '@/lib/tags';
import { getSkillsMap } from '@/features/skills/queries';
import { listPosts } from '@/features/posts/queries';
import { parsePostFilters } from '@/features/posts/schemas';

type SP = { [k: string]: string | string[] | undefined };

function toURLSearchParams(searchParams: SP) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value) params.set(key, value);
  }
  return params;
}

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const params = toURLSearchParams(searchParams);
  const filters = parsePostFilters(params);
  const uid = await getSessionUid();
  const [{ items }, skillsMap] = await Promise.all([listPosts(filters, uid, 20), getSkillsMap()]);

  const hasActiveFilter =
    !!(filters.scene || filters.industry || filters.assetType || filters.role || filters.time || filters.content.length || filters.q);
  const featuredCells = skillsMap.cells.filter((cell) => cell.count > 0).slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink-300 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">PEVC Skills Map</p>
            <h1 className="mt-1 text-2xl font-bold text-ink-900">按投资工作流发现可复用技能资产</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
              发现 Prompt、Workflow、Agent Skill、模板和脚本，并在每个技能下继续评论、收藏和沉淀实践反馈。
            </p>
          </div>
          <Link href="/skills-map" className="btn-primary w-full sm:w-auto">
            打开 Skills Map
          </Link>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCells.map((cell) => (
            <Link
              key={`${cell.scene}-${cell.assetType}`}
              href={`/?scene=${cell.scene}&assetType=${cell.assetType}`}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm hover:border-brand-500 hover:bg-brand-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink-900">{SKILL_TAGS.find((s) => s.value === cell.assetType)?.label}</span>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">{cell.count}</span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-500">{SCENE_TAGS.find((s) => s.value === cell.scene)?.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">
              {filters.q ? `搜索 "${filters.q}"` : hasActiveFilter ? '筛选结果' : '最新 Skill Assets'}
            </h2>
            <span className="text-sm text-ink-500">{items.length} 条结果</span>
          </div>
          <FilterBar />

          {items.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-12 text-center text-ink-500">
              <span className="text-4xl">🗂️</span>
              <p className="mt-3 text-sm">暂无内容，调整筛选条件或发布第一条 Skill Asset</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={uid} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-2 font-semibold">资产类型</h3>
            <ul className="space-y-1.5 text-sm">
              {SKILL_TAGS.map((skill) => (
                <li key={skill.value}>
                  <Link href={`/?assetType=${skill.value}`} className="text-ink-700 hover:text-brand-600">
                    · {skill.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 font-semibold">热门工作场景</h3>
            <ul className="space-y-1.5 text-sm">
              {SCENE_TAGS.slice(0, 6).map((scene) => (
                <li key={scene.value}>
                  <Link href={`/?scene=${scene.value}`} className="text-ink-700 hover:text-brand-600">
                    · {scene.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4 text-sm text-ink-700">
            <h3 className="mb-2 font-semibold text-ink-900">当前底座</h3>
            <p>Skill Asset 复用社区评论、点赞、收藏与附件能力，并通过四维标签进入 Skills Map。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
