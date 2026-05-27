'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SCENE_TAGS, INDUSTRY_TAGS, CONTENT_TAGS, SKILL_TAGS } from '@/lib/tags';

const TIME_OPTIONS = [
  { value: '', label: '全部时间' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
];

const ROLE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'VC', label: 'VC' },
  { value: 'PE', label: 'PE' },
  { value: 'FA', label: 'FA' },
];

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const scene = params.get('scene') || '';
  const industry = params.get('industry') || '';
  const skill = params.get('skill') || '';
  const role = params.get('role') || '';
  const time = params.get('time') || '';
  const contentSet = new Set(params.getAll('content'));
  const q = params.get('q') || '';

  const update = useCallback(
    (key: string, value: string) => {
      const u = new URLSearchParams(params.toString());
      if (value) u.set(key, value);
      else u.delete(key);
      router.push(`/?${u.toString()}`);
    },
    [params, router]
  );

  const toggleContent = (v: string) => {
    const u = new URLSearchParams(params.toString());
    const current = u.getAll('content');
    u.delete('content');
    let next: string[];
    if (current.includes(v)) {
      next = current.filter((x) => x !== v);
    } else {
      if (current.length >= 3) return; // 最多 3 个
      next = [...current, v];
    }
    next.forEach((x) => u.append('content', x));
    router.push(`/?${u.toString()}`);
  };

  const reset = () => router.push('/');
  const hasFilter = !!(scene || industry || skill || role || time || contentSet.size || q);

  const [showContent, setShowContent] = useState(false);

  return (
    <div className="card mb-4 p-4 text-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">工作场景</label>
          <select className="input" value={scene} onChange={(e) => update('scene', e.target.value)}>
            <option value="">全部</option>
            {SCENE_TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">行业赛道</label>
          <select className="input" value={industry} onChange={(e) => update('industry', e.target.value)}>
            <option value="">全部</option>
            {INDUSTRY_TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Skill 类型</label>
          <select className="input" value={skill} onChange={(e) => update('skill', e.target.value)}>
            <option value="">全部</option>
            {SKILL_TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">时间范围</label>
          <select className="input" value={time} onChange={(e) => update('time', e.target.value)}>
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-500">发布者：</span>
        <div className="flex gap-1 rounded-md bg-ink-100 p-1 text-xs">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => update('role', o.value)}
              className={`rounded px-3 py-1 ${role === o.value ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-700'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowContent((v) => !v)}
          className="ml-3 text-xs text-brand-600 hover:underline"
        >
          {showContent ? '收起' : '展开'}工作内容标签 {contentSet.size > 0 && `(${contentSet.size})`}
        </button>
        {hasFilter && (
          <button onClick={reset} className="ml-auto text-xs text-ink-500 hover:text-red-600">
            清空筛选
          </button>
        )}
      </div>

      {showContent && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CONTENT_TAGS.map((t) => {
            const on = contentSet.has(t.value);
            return (
              <button
                key={t.value}
                onClick={() => toggleContent(t.value)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-300 text-ink-700 hover:border-brand-500'
                }`}
              >
                {t.label}
              </button>
            );
          })}
          <span className="ml-2 self-center text-xs text-ink-500">最多选 3 个</span>
        </div>
      )}
    </div>
  );
}
