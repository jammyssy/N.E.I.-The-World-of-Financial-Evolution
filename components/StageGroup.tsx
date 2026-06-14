'use client';

import { useState } from 'react';
import { PostCard, type PostCardData } from '@/components/PostCard';

/**
 * 首页「投资流程阶段」分组。
 *
 * 每组默认最多显示 MAX_VISIBLE 个卡片，超出折叠成「查看更多」按钮，
 * 点击展开剩余。避免某个组太长把别的组挤到很下面。
 */
const MAX_VISIBLE = 9;

export function StageGroup({
  label,
  items,
  uid,
}: {
  label: string;
  items: PostCardData[];
  uid: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > MAX_VISIBLE;
  const visible = expanded ? items : items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - MAX_VISIBLE;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-serif text-xl text-ink-brown">{label}</h2>
        <span className="font-mono text-[11px] text-sepia">{items.length}</span>
        <span className="flex-1 h-px bg-paper-edge" />
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((p) => (
          <li key={p.id}>
            <PostCard post={p} currentUserId={uid} variant="compact" />
          </li>
        ))}
      </ol>

      {hasMore && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 h-9 px-5 border border-paper-edge bg-vellum hover:border-ink-brown font-serif text-sm text-leather hover:text-ink-brown rounded-sm transition-colors"
          >
            {expanded ? (
              <>收起</>
            ) : (
              <>
                查看更多
                <span className="font-mono text-[11px] text-sepia">+{hiddenCount}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
