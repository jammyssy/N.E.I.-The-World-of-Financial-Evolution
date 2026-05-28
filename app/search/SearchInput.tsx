'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * 大检索输入 —— /search 页 Hero 内
 * 单条衬线下划线式输入框，无外框；Enter 提交、清空 q 时回到 /search
 */
export function SearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // q 变化时同步（如清空筛选后）
  useEffect(() => setQ(params.get('q') ?? ''), [params]);

  // 进入页面无 q 时自动聚焦
  useEffect(() => {
    if (!params.get('q')) inputRef.current?.focus();
  }, [params]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    const u = new URLSearchParams(params.toString());
    if (v) u.set('q', v);
    else u.delete('q');
    router.push(`/search${u.toString() ? '?' + u.toString() : ''}`);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md">
      <label className="block">
        <div className="flex items-end gap-3 border-b-2 border-ink-brown pb-2">
          <span className="text-leather mb-1.5" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="key word, author, or phrase…"
            className="flex-1 bg-transparent border-0 outline-none font-serif italic text-xl text-ink-brown placeholder:text-sepia/60 py-1.5"
          />
          <button
            type="submit"
            className="font-serif text-sm text-ink-brown hover:text-wax-red transition-colors mb-1.5"
          >
            检索 →
          </button>
        </div>
      </label>
      <p className="mt-3 text-center font-sans text-[11px] text-sepia">
        检索范围 · 标题 · 正文 · 作者昵称
      </p>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M12 12 L16 16" strokeLinecap="round" />
    </svg>
  );
}
