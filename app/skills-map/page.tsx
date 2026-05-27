import Link from 'next/link';
import { SCENE_TAGS, SKILL_TAGS } from '@/lib/tags';
import { getSkillsMap } from '@/features/skills/queries';

export default async function SkillsMapPage() {
  const map = await getSkillsMap();
  const cellByKey = new Map(map.cells.map((cell) => [`${cell.scene}::${cell.assetType}`, cell]));

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-ink-300 bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-brand-600">Skills Map</p>
        <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">PEVC 技能资产地图</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
              从投资工作场景出发，快速找到可复用的 Prompt、Workflow、Agent Skill、模板和脚本。
            </p>
          </div>
          <div className="text-sm text-ink-500">已收录 {map.totalAssets} 个 Skill Asset</div>
        </div>
      </header>

      <section className="overflow-x-auto rounded-lg border border-ink-300 bg-white shadow-card">
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
                      <span className="text-xs">查看</span>
                    </div>
                    {cell?.featured ? (
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-700">{cell.featured.title}</p>
                    ) : (
                      <p className="mt-2 text-xs leading-5">等待第一份资产</p>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
