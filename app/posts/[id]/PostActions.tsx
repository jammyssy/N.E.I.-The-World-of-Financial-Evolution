'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCount } from '@/lib/format';

export function PostActions({
  postId,
  initialLiked,
  initialFavorited,
  initialLikes,
  isAuthed,
}: {
  postId: number;
  initialLiked: boolean;
  initialFavorited: boolean;
  initialLikes: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [fav, setFav] = useState(initialFavorited);

  const requireAuth = () => {
    if (!isAuthed) {
      router.push(`/login?next=/posts/${postId}`);
      return false;
    }
    return true;
  };

  const onLike = async () => {
    if (!requireAuth()) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    if (!res.ok) {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } else {
      const data = await res.json();
      if (typeof data.count === 'number') setLikes(data.count);
    }
  };

  const onFav = async () => {
    if (!requireAuth()) return;
    const next = !fav;
    setFav(next);
    const res = await fetch(`/api/posts/${postId}/favorite`, { method: 'POST' });
    if (!res.ok) setFav(!next);
  };

  return (
    <div className="sticky bottom-4 z-10 flex justify-center">
      <div className="card flex items-center gap-2 px-3 py-2">
        <button
          onClick={onLike}
          className={`btn ${liked ? 'bg-brand-50 text-brand-700' : 'bg-white text-ink-700 hover:bg-ink-100'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{formatCount(likes)}</span>
        </button>
        <button
          onClick={onFav}
          className={`btn ${fav ? 'bg-amber-50 text-amber-700' : 'bg-white text-ink-700 hover:bg-ink-100'}`}
        >
          <span>{fav ? '⭐' : '☆'}</span>
          <span>{fav ? '已收藏' : '收藏'}</span>
        </button>
      </div>
    </div>
  );
}
