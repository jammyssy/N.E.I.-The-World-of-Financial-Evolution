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

  return (
    <div className="space-y-6">
      {/* Hero: Product Identity */}
      <section className="rounded-lg border border-ink-300 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink-900">PEVC Skills Map</h1>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Community</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
              一级市场从业者的技能资产社区。按投资工作流发现 Prompt、Agent Skill、Workflow、模板和脚本，
              并在每条资产下评论、收藏、下载和沉淀实践反馈。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/skills-map" className="btn-primary w-full sm:w-auto">
              探索 Skills Map
            </Link>
            <Link href="/publish" className="btn-secondary w-full sm:w-auto">
              发布 Skill Asset
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-md border border-ink-300 px-3 py-1.5 text-sm">
            <span className="font-semibold text-ink-900">{skillsMap.stats.totalAssets}</span>
            <span className="ml-1 text-ink-500">Skill Assets</span>
          </div>
          <div className="rounded-md border border-ink-300 px-3 py-1.5 text-sm">
            <span className="font-semibold text-ink-900">{skillsMap.stats.activeScenes}</span>
            <span className="ml-1 text-ink-500">工作场景</span>
          </div>
          {skillsMap.stats.topAssetType && (
            <div className="rounded-md border border-ink-300 px-3 py-1.5 text-sm">
              <span className="text-ink-500">最多 </span>
              <span className="font-semibold text-ink-900">{skillsMap.stats.topAssetType.label}</span>
            </div>
          )}
        </div>

        {/* Featured cells */}
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {skillsMap.cells.filter((cell) => cell.count > 0).slice(0, 8).map((cell) => (
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

      {/* Feed */}
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
              <Link href="/publish" className="btn-primary mt-4">发布 Skill Asset</Link>
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
            <h3 className="mb-2 font-semibold text-ink-900">关于平台</h3>
            <p>PEVC Skills Map 是面向 VC / PE / FA 从业者的技能资产分享社区。每条资产都是围绕投资工作流的可复用单元。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
