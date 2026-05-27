'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCount, formatTime } from '@/lib/format';
import { sceneLabel, industryLabel, skillLabel, contentLabel, roleColor } from '@/lib/tags';

export type PostCardData = {
  id: number;
  title: string;
  excerpt: string;
  tags: {
    scene: string;
    industry: string | null;
    content: string[];
  };
  skillAsset: {
    assetType: string;
  } | null;
  createdAt: string;
  author: { id: number; nickname: string; role: string };
  counts: { comments: number; likes: number; attachments: number };
  viewerState: { liked: boolean; favorited: boolean };
};

export function PostCard({ post, currentUserId }: { post: PostCardData; currentUserId: number | null }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.viewerState.liked);
  const [likes, setLikes] = useState(post.counts.likes);
  const [fav, setFav] = useState(post.viewerState.favorited);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push(`/login?next=/posts/${post.id}`);
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  };

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push(`/login?next=/posts/${post.id}`);
      return;
    }
    const next = !fav;
    setFav(next);
    const res = await fetch(`/api/posts/${post.id}/favorite`, { method: 'POST' });
    if (!res.ok) setFav(!next);
  };

  return (
    <Link href={`/posts/${post.id}`} className="card block p-5 transition hover:shadow-md">
      <div className="mb-3 flex items-center gap-2 text-xs text-ink-500">
        <span className="grid h-7 w-7 place-content-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {post.author.nickname.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-medium text-ink-900">{post.author.nickname}</span>
        <span className={`chip ${roleColor(post.author.role)}`}>{post.author.role}</span>
        <span>·</span>
        <span>{formatTime(post.createdAt)}</span>
      </div>

      <h2 className="mb-2 text-lg font-semibold leading-snug text-ink-900">{post.title}</h2>
      <p className="mb-3 line-clamp-2 text-sm text-ink-700">{post.excerpt}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="chip-brand">{sceneLabel(post.tags.scene)}</span>
        {post.tags.industry && <span className="chip">{industryLabel(post.tags.industry)}</span>}
        {post.skillAsset && <span className="chip">{skillLabel(post.skillAsset.assetType)}</span>}
        {post.tags.content.map((c) => (
          <span key={c} className="chip">
            {contentLabel(c)}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-ink-500">
        <button onClick={toggleLike} className={`flex items-center gap-1 hover:text-brand-600 ${liked ? 'text-brand-600' : ''}`}>
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{formatCount(likes)}</span>
        </button>
        <span className="flex items-center gap-1">
          <span>💬</span>
          <span>{formatCount(post.counts.comments)}</span>
        </span>
        {post.counts.attachments > 0 && (
          <span className="flex items-center gap-1">
            <span>📎</span>
            <span>{post.counts.attachments}</span>
          </span>
        )}
        <button onClick={toggleFav} className={`ml-auto hover:text-brand-600 ${fav ? 'text-amber-500' : ''}`}>
          {fav ? '⭐ 已收藏' : '☆ 收藏'}
        </button>
      </div>
    </Link>
  );
}
