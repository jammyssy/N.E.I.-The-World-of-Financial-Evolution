'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { RoleBadge } from '@/components/icons/RoleBadge';
import { Ornament } from '@/components/icons/Ornament';

type Author = {
  id: number;
  nickname: string;
  role: string;
  avatarUrl: string | null;
};
type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  body: string;
  likeCount: number;
  createdAt: string;
  author: Author;
  replies: Comment[];
};

/**
 * CommentSection · 卷末批注
 * 评论：左侧细线纵向边 + 衬线人名 + 无衬线正文
 * 回复：再缩进一级，左线变得更浅
 * 输入框：衬线斜体 placeholder，像在书边写批注
 */
export function CommentSection({
  postId,
  postAuthorId,
  currentUser,
}: {
  postId: number;
  postAuthorId: number;
  currentUser: { id: number; nickname: string; role: string } | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const data = await res.json();
    setItems(data.items);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [postId]);

  const submit = async () => {
    if (!currentUser) {
      router.push(`/login?next=/posts/${postId}`);
      return;
    }
    const body = text.trim();
    if (body.length < 1 || body.length > 1000) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parentId: replyTo?.id ?? null }),
    });
    setSubmitting(false);
    if (res.ok) {
      setText('');
      setReplyTo(null);
      refresh();
    }
  };

  const remove = async (id: number) => {
    if (!confirm('确定删除这则批注？')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    refresh();
  };

  const total = items.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="mt-12">
      {/* 章节小标题 */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="font-display tracking-display text-xs text-sepia uppercase">
          Marginalia
        </span>
        <h3 className="font-serif text-xl text-ink-brown">卷末批注 · 评论</h3>
        {total > 0 && (
          <span className="font-serif italic text-sm text-sepia">
            共 <span className="num-osf">{total}</span> 则
          </span>
        )}
      </div>

      {/* 输入区 */}
      <div className="border border-paper-edge bg-vellum rounded-md p-5 mb-8">
        {replyTo && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-paper-edge font-sans text-xs">
            <span className="text-sepia">回复</span>
            <span className="font-serif italic text-ink-brown">@{replyTo.nickname}</span>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-auto text-sepia hover:text-wax-red"
              aria-label="取消回复"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1 L9 9 M9 1 L1 9" />
              </svg>
            </button>
          </div>
        )}

        <Textarea
          rows={3}
          maxLength={1000}
          placeholder={
            currentUser
              ? '在此页空白处写下你的批注…（1-1000 字符，可用 @ 提及）'
              : '登录后方可批注'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!currentUser}
        />

        <div className="mt-3 flex items-center justify-between font-sans text-xs">
          <span className="text-sepia num-osf">
            {text.length}/1000
          </span>
          {currentUser ? (
            <Button
              size="sm"
              onClick={submit}
              disabled={submitting || text.trim().length === 0}
            >
              {submitting ? '落墨中…' : '落墨'}
            </Button>
          ) : (
            <Link
              href={`/login?next=/posts/${postId}`}
              className="font-serif italic text-sepia hover:text-ink-brown underline underline-offset-4 decoration-paper-edge hover:decoration-ink-brown"
            >
              登录以批注
            </Link>
          )}
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <p className="text-center font-serif italic text-sm text-sepia py-6">
          正在翻阅批注…
        </p>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-3 text-paper-edge">
            <Ornament width={56} />
          </div>
          <p className="font-serif italic text-leather">
            尚无批注 · 期待第一笔留墨
          </p>
        </div>
      ) : (
        <ul className="space-y-7">
          {items.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postAuthorId={postAuthorId}
              currentUser={currentUser}
              onReply={(target) => {
                setReplyTo({ id: target.id, nickname: target.author.nickname });
                if (!text.startsWith('@')) setText(`@${target.author.nickname} ` + text);
              }}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ============================================================
   单条批注
   ============================================================ */
function CommentItem({
  comment,
  postAuthorId,
  currentUser,
  onReply,
  onDelete,
}: {
  comment: Comment;
  postAuthorId: number;
  currentUser: { id: number } | null;
  onReply: (c: Comment) => void;
  onDelete: (id: number) => void;
}) {
  const isAuthor = comment.author.id === postAuthorId;
  const canDelete =
    currentUser && (currentUser.id === comment.author.id || currentUser.id === postAuthorId);

  return (
    <li className="relative">
      {/* 顶层评论 —— 左侧细线 */}
      <div className="border-l border-paper-edge pl-5">
        <CommentHead author={comment.author} isAuthor={isAuthor} createdAt={comment.createdAt} />
        <p className="mt-2 font-sans text-sm text-ink-brown leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
        <CommentActions
          onReply={() => onReply(comment)}
          canDelete={!!canDelete}
          onDelete={() => onDelete(comment.id)}
        />
      </div>

      {/* 二级回复 */}
      {comment.replies.length > 0 && (
        <ul className="mt-4 ml-5 space-y-4">
          {comment.replies.map((r) => (
            <li key={r.id} className="border-l border-paper-edge/70 pl-5">
              <CommentHead
                author={r.author}
                isAuthor={r.author.id === postAuthorId}
                createdAt={r.createdAt}
                small
              />
              <p className="mt-1.5 font-sans text-sm text-ink-brown leading-relaxed whitespace-pre-wrap">
                {r.body}
              </p>
              <CommentActions
                onReply={() => onReply(r)}
                canDelete={
                  !!currentUser &&
                  (currentUser.id === r.author.id || currentUser.id === postAuthorId)
                }
                onDelete={() => onDelete(r.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function CommentHead({
  author,
  isAuthor,
  createdAt,
  small,
}: {
  author: Author;
  isAuthor: boolean;
  createdAt: string;
  small?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2 font-sans', small ? 'text-[11px]' : 'text-xs')}>
      <RoleBadge role={author.role} size={small ? 13 : 15} />
      <Link
        href={`/profile/${author.id}`}
        className="font-serif text-base text-ink-brown hover:text-wax-red transition-colors"
        style={{ fontSize: small ? '14px' : '15px' }}
      >
        {author.nickname}
      </Link>
      {isAuthor && (
        <span className="px-1.5 border border-gilded/60 text-gilded font-serif text-[10px] tracking-wide">
          原作
        </span>
      )}
      <span className="text-sepia">·</span>
      <span className="text-sepia">{formatTime(createdAt)}</span>
    </div>
  );
}

function CommentActions({
  onReply,
  canDelete,
  onDelete,
}: {
  onReply: () => void;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-4 font-sans text-xs text-sepia">
      <button onClick={onReply} className="hover:text-ink-brown transition-colors">
        回复
      </button>
      {canDelete && (
        <button onClick={onDelete} className="hover:text-wax-red transition-colors">
          删除
        </button>
      )}
    </div>
  );
}
