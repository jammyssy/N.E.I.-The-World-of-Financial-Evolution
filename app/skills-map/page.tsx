import Link from 'next/link';
import { SCENE_TAGS, SKILL_TAGS, sceneLabel, skillLabel } from '@/lib/tags';
import { getSkillsMap } from '@/features/skills/queries';

export default async function SkillsMapPage() {
  const map = await getSkillsMap();
  const cellByKey = new Map(map.cells.map((cell) => [`${cell.scene}::${cell.assetType}`, cell]));

  const { totalAssets, activeScenes, topAssetType } = map.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-lg border border-ink-300 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">Skills Map</p>
            <h1 className="mt-1 text-2xl font-bold text-ink-900">PEVC 技能资产地图</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
              从投资工作场景出发，快速找到可复用的 Prompt、Workflow、Agent Skill、模板和脚本。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/publish" className="btn-primary">
              发布 Skill Asset
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-5 flex flex-wrap gap-4">
          <StatPill label="Skill Assets" value={totalAssets} />
          <StatPill label="活跃场景" value={activeScenes} />
          {topAssetType && (
            <div className="rounded-md border border-ink-300 px-3 py-1.5 text-sm">
              <span className="text-ink-500">最多资产类型 </span>
              <span className="font-semibold text-ink-900">{topAssetType.label}</span>
              <span className="ml-1 text-ink-500">({topAssetType.count})</span>
            </div>
          )}
        </div>
      </header>

      {/* Desktop: Matrix */}
      <section className="hidden lg:block overflow-x-auto rounded-lg border border-ink-300 bg-white shadow-card">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[220px_repeat(7,minmax(120px,1fr))] border-b border-ink-300 bg-ink-100 text-xs font-medium text-ink-600">
            <div className="px-3 py-3">工作场景</div>
            {SKILL_TAGS.map((skill) => (
              <div key={skill.value} className="px-3 py-3">
                {skill.label}
              </div>
            ))}
          </div>

          {SCENE_TAGS.map((scene) => (
            <div key={scene.value} className="grid grid-cols-[220px_repeat(7,minmax(120px,1fr))] border-b border-ink-300/60 last:border-b-0">
              <div className="bg-white px-3 py-3">
                <div className="text-sm font-medium text-ink-900">{scene.label}</div>
                <div className="mt-1 text-xs leading-5 text-ink-500">{scene.desc}</div>
              </div>
              {SKILL_TAGS.map((skill) => {
                const cell = cellByKey.get(`${scene.value}::${skill.value}`);
                const href = `/?scene=${scene.value}&assetType=${skill.value}`;
                return (
                  <Link
                    key={skill.value}
                    href={href}
                    className={`min-h-[112px] border-l border-ink-300/60 px-3 py-3 text-sm transition ${
                      cell?.count ? 'bg-white hover:bg-brand-50' : 'bg-ink-50 text-ink-400 hover:bg-ink-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cell?.count ? 'font-semibold text-brand-700' : ''}>{cell?.count ?? 0}</span>
                      <span className="text-xs">{cell?.count ? '查看 →' : ''}</span>
                    </div>
                    {cell?.featured ? (
                      <>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-700">{cell.featured.title}</p>
                        <p className="mt-1 text-[11px] text-ink-400">{cell.featured.author.nickname} · {cell.featured.author.role}</p>
                      </>
                    ) : (
                      <p className="mt-2 text-xs leading-5">等待贡献</p>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Mobile: Grouped cards by scene */}
      <div className="lg:hidden space-y-4">
        {SCENE_TAGS.map((scene) => {
          const sceneCells = SKILL_TAGS.map((skill) => ({
            ...skill,
            cell: cellByKey.get(`${scene.value}::${skill.value}`),
          }));
          const hasAny = sceneCells.some((s) => s.cell?.count);
          return (
            <section key={scene.value} className="card p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-ink-900">{scene.label}</h2>
                <p className="text-xs text-ink-500">{scene.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sceneCells.map(({ value, label, cell }) => {
                  const href = `/?scene=${scene.value}&assetType=${value}`;
                  return (
                    <Link
                      key={value}
                      href={href}
                      className={`rounded-md border px-3 py-2.5 text-sm transition ${
                        cell?.count
                          ? 'border-ink-300 bg-white hover:border-brand-500 hover:bg-brand-50'
                          : 'border-dashed border-ink-300 bg-ink-50 text-ink-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium truncate">{label}</span>
                        <span className={`text-xs ${cell?.count ? 'text-brand-700 font-semibold' : 'text-ink-400'}`}>
                          {cell?.count ?? 0}
                        </span>
                      </div>
                      {cell?.featured ? (
                        <p className="mt-1 text-[11px] text-ink-500 truncate">{cell.featured.title}</p>
                      ) : (
                        <p className="mt-1 text-[11px] text-ink-400">等待贡献</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-ink-300 px-3 py-1.5 text-sm">
      <span className="font-semibold text-ink-900">{value}</span>
      <span className="ml-1 text-ink-500">{label}</span>
    </div>
  );
}
