'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { formatTime, formatCount } from '@/lib/format';
import {
  sceneLabel,
  industryLabel,
  contentLabel,
  skillLabel,
} from '@/lib/tags';
import { RoleBadge } from '@/components/icons/RoleBadge';
import {
  SceneChip,
  IndustryChip,
  ContentChip,
  SkillChip,
} from '@/components/ui/Chip';

export type PostCardData = {
  id: number;
  title: string;
  excerpt: string;
  tagScene: string;
  tagIndustry: string | null;
  tagContent: string[];
  tagSkill: string | null;
  createdAt: string;
  author: { id: number; nickname: string; role: string };
  counts: { comments: number; likes: number; attachments: number };
  liked: boolean;
  favorited: boolean;
};

/**
 * PostCard · 卷宗条目
 * vellum 底、paper-edge 描边、hover 转 sepia、无阴影
 * 不要 transform、不要 emoji
 */
export function PostCard({
  post,
  currentUserId,
}: {
  post: PostCardData;
  currentUserId: number | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.counts.likes);
  const [fav, setFav] = useState(post.favorited);

  const requireAuth = () => {
    if (!currentUserId) {
      router.push(`/login?next=/posts/${post.id}`);
      return false;
    }
    return true;
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
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
    if (!requireAuth()) return;
    const next = !fav;
    setFav(next);
    const res = await fetch(`/api/posts/${post.id}/favorite`, { method: 'POST' });
    if (!res.ok) setFav(!next);
  };

  return (
    <article className="group relative">
      <Link href={`/posts/${post.id}`} className="block">
        <div
          className={cn(
            'relative border border-paper-edge bg-vellum rounded-md',
            'transition-colors duration-150',
            'group-hover:border-sepia',
            'p-6 sm:p-7',
          )}
        >
          {/* —— 作者条 —— */}
          <div className="flex items-center gap-2 mb-3 font-sans text-xs text-sepia">
            <RoleBadge role={post.author.role} size={16} />
            <span className="text-ink-brown">{post.author.nickname}</span>
            <DotSep />
            <span>{formatTime(post.createdAt)}</span>
            {post.counts.attachments > 0 && (
              <>
                <DotSep />
                <span className="inline-flex items-center gap-1">
                  <PaperclipIcon />
                  附 {post.counts.attachments}
                </span>
              </>
            )}
          </div>

          {/* —— 标题 —— */}
          <h2 className="font-serif text-[22px] leading-snug text-ink-brown mb-2.5 group-hover:text-wax-red transition-colors">
            {post.title}
          </h2>

          {/* —— 摘要 —— */}
          <p
            className="font-sans text-sm text-leather leading-relaxed mb-5"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.excerpt}
          </p>

          {/* —— 四维标签 —— */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <SceneChip>{sceneLabel(post.tagScene)}</SceneChip>
            {post.tagIndustry && (
              <IndustryChip>{industryLabel(post.tagIndustry)}</IndustryChip>
            )}
            {post.tagContent.slice(0, 2).map((c) => (
              <ContentChip key={c}>{contentLabel(c)}</ContentChip>
            ))}
            {post.tagContent.length > 2 && (
              <span className="font-sans text-[11px] text-sepia">
                +{post.tagContent.length - 2}
              </span>
            )}
            {post.tagSkill && (
              <SkillChip skillKey={post.tagSkill}>
                {skillLabel(post.tagSkill)}
              </SkillChip>
            )}
          </div>

          {/* —— 互动条 —— */}
          <div className="pt-4 border-t border-paper-edge flex items-center gap-5 font-sans text-xs">
            <CardAction
              onClick={toggleLike}
              active={liked}
              icon={<HeartIcon filled={liked} />}
            >
              {formatCount(likes)}
            </CardAction>
            <CardAction icon={<CommentIcon />}>
              {formatCount(post.counts.comments)}
            </CardAction>
            <div className="ml-auto">
              <CardAction
                onClick={toggleFav}
                active={fav}
                icon={<BookmarkIcon filled={fav} />}
              >
                {fav ? '已封缄' : '收藏'}
              </CardAction>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ============================================================
   局部小组件
   ============================================================ */
function DotSep() {
  return <span className="text-sepia/60">·</span>;
}

function CardAction({
  onClick,
  active,
  icon,
  children,
}: {
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        active ? 'text-wax-red' : 'text-sepia',
        interactive && 'hover:text-ink-brown cursor-pointer',
        !interactive && 'cursor-default',
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/* —— 极简线性图标 —— */
function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M8 14 C4 11, 1.5 8.5, 1.5 6 C1.5 4, 3 2.5, 5 2.5 C6.5 2.5, 7.5 3.3, 8 4.5 C8.5 3.3, 9.5 2.5, 11 2.5 C13 2.5, 14.5 4, 14.5 6 C14.5 8.5, 12 11, 8 14 Z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M2.5 4 H13.5 V11 H8.5 L5.5 13.5 V11 H2.5 Z" strokeLinejoin="round" />
    </svg>
  );
}
function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M4 2.5 H12 V14 L8 11 L4 14 Z" strokeLinejoin="round" />
    </svg>
  );
}
function PaperclipIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <path d="M11 4 L5.5 9.5 C4.5 10.5, 4.5 12, 5.5 13 C6.5 14, 8 14, 9 13 L13 9 C14.5 7.5, 14.5 5, 13 3.5 C11.5 2, 9 2, 7.5 3.5 L3.5 7.5" strokeLinecap="round" />
    </svg>
  );
}
