'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { SCENE_TAGS, SKILL_TAGS } from '@/lib/tags';
import { SkillIcon } from '@/components/icons/SkillIcon';

/**
 * FilterStrip · 首页目录头条
 *
 * 永远展开的分类条（区别于 FilterBar 的折叠/展开）。放在首页 Hero 下方，
 * 把"快速找某个场景/类型的 skill"这个最高频动作前置到内容流上方。
 *
 * 不动 FilterBar（/search 还在用），这里是独立的紧凑实现。
 * URL 联动方式与 FilterBar 一致（useSearchParams + router.push）。
 */
export function FilterStrip() {
  const router = useRouter();
  const params = useSearchParams();

  const scene = params.get('scene') || '';
  const skill = params.get('skill') || '';
  const role = params.get('role') || '';
  const time = params.get('time') || '';
  const sort = params.get('sort') === 'latest' ? 'latest' : 'popular';

  const setParam = useCallback(
    (key: string, value: string) => {
      const u = new URLSearchParams(params.toString());
      if (value) u.set(key, value);
      else u.delete(key);
      router.push(`/?${u.toString()}`);
    },
    [params, router],
  );

  return (
    <section className="border-y border-paper-edge py-4 mb-6">
      {/* —— 第 1 行：场景 chip（高频）—— */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <FilterLabel>场景</FilterLabel>
        <SealChip active={scene === ''} onClick={() => setParam('scene', '')}>
          全部
        </SealChip>
        {SCENE_TAGS.map((t) => (
          <SealChip key={t.value} active={scene === t.value} onClick={() => setParam('scene', t.value)}>
            {t.label}
          </SealChip>
        ))}
      </div>

      {/* —— 第 2 行：类型 + 身份 + 时间 | 排序 —— */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* 类型 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterLabel>类型</FilterLabel>
          <BadgeChip active={skill === ''} onClick={() => setParam('skill', '')}>
            全部
          </BadgeChip>
          {SKILL_TAGS.map((t) => (
            <BadgeChip key={t.value} active={skill === t.value} onClick={() => setParam('skill', t.value)}>
              <SkillIcon skill={t.value} className="h-3 w-3" />
              {t.label}
            </BadgeChip>
          ))}
        </div>

        <Divider />

        {/* 身份 */}
        <div className="flex items-center gap-1.5">
          <FilterLabel>身份</FilterLabel>
          {(['VC', 'PE', 'FA'] as const).map((r) => (
            <TabChip key={r} active={role === r} onClick={() => setParam('role', role === r ? '' : r)}>
              {r}
            </TabChip>
          ))}
        </div>

        <Divider />

        {/* 时间 */}
        <div className="flex items-center gap-1.5">
          <FilterLabel>时间</FilterLabel>
          {TIME_OPTIONS.map((o) => (
            <TabChip key={o.value} active={time === o.value} onClick={() => setParam('time', time === o.value ? '' : o.value)}>
              {o.label}
            </TabChip>
          ))}
        </div>

        {/* 排序（右侧） */}
        <div className="ml-auto flex items-center gap-1.5">
          <FilterLabel>排序</FilterLabel>
          <div className="inline-flex border border-paper-edge rounded-sm overflow-hidden">
            <SegTab active={sort === 'popular'} onClick={() => setParam('sort', 'popular')}>
              热门
            </SegTab>
            <SegTab active={sort === 'latest'} onClick={() => setParam('sort', 'latest')}>
              最新
            </SegTab>
          </div>
        </div>
      </div>
    </section>
  );
}

const TIME_OPTIONS = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
] as const;

/* ============================================================
   局部小组件
   ============================================================ */
function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display tracking-display text-[10px] text-sepia uppercase mr-0.5 select-none">
      {children}
    </span>
  );
}

function Divider() {
  return <span className="hidden md:inline-block w-px h-4 bg-paper-edge" />;
}

function SealChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 h-6 text-xs font-serif uppercase tracking-wide transition-colors',
        active
          ? 'border border-ink-brown bg-ink-brown text-vellum'
          : 'border border-paper-edge text-leather hover:border-ink-brown hover:text-ink-brown',
      )}
    >
      {children}
    </button>
  );
}

function BadgeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 h-6 text-xs font-sans rounded-full transition-colors',
        active
          ? 'bg-gilded/15 border border-gilded text-ink-brown'
          : 'bg-vellum border border-gilded/40 text-leather hover:border-gilded',
      )}
    >
      {children}
    </button>
  );
}

function TabChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 h-6 text-xs font-sans transition-colors border-b-2',
        active
          ? 'border-wax-red text-ink-brown'
          : 'border-transparent text-sepia hover:text-ink-brown',
      )}
    >
      {children}
    </button>
  );
}

function SegTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 h-7 text-xs font-sans transition-colors',
        active ? 'bg-ink-brown text-vellum' : 'bg-vellum text-leather hover:text-ink-brown',
      )}
    >
      {children}
    </button>
  );
}
