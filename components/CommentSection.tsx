'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatTime } from '@/lib/format';
import { roleColor } from '@/lib/tags';

type Author = { id: number; nickname: string; role: string; avatarUrl: string | null };
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
    if (!confirm('确定删除该评论？')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    refresh();
  };

  const total = items.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section className="card p-5">
      <h3 className="mb-4 text-base font-semibold">评论 {total > 0 && <span className="text-ink-500">({total})</span>}</h3>

      <div className="mb-5">
        {replyTo && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-ink-100 px-2 py-1 text-xs">
            回复 @{replyTo.nickname}
            <button onClick={() => setReplyTo(null)} className="text-ink-500 hover:text-red-600">
              ✕
            </button>
          </div>
        )}
        <textarea
          className="input min-h-[80px]"
          placeholder={currentUser ? '发表评论…（1-1000 字符，可输入 @ 提及他人）' : '登录后参与讨论'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          disabled={!currentUser}
        />
        <div className="mt-2 flex items-center justify-end gap-3 text-xs text-ink-500">
          <span>{text.length}/1000</span>
          <button onClick={submit} disabled={submitting || text.trim().length === 0} className="btn-primary">
            {submitting ? '提交中…' : '发布评论'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-500">加载中…</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">还没有评论，来抢沙发</p>
      ) : (
        <ul className="space-y-5">
          {items.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postAuthorId={postAuthorId}
              currentUser={currentUser}
              onReply={(c) => {
                setReplyTo({ id: c.id, nickname: c.author.nickname });
                setText((t) => (t.startsWith('@') ? t : `@${c.author.nickname} ` + t));
              }}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

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
  const canDelete = currentUser && (currentUser.id === comment.author.id || currentUser.id === postAuthorId);
  return (
    <li>
      <div className="flex gap-3">
        <Link href={`/profile/${comment.author.id}`} className="shrink-0">
          <span className="grid h-9 w-9 place-content-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {comment.author.nickname.slice(0, 1).toUpperCase()}
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/profile/${comment.author.id}`} className="font-medium hover:text-brand-600">
              {comment.author.nickname}
            </Link>
            <span className={`chip ${roleColor(comment.author.role)}`}>{comment.author.role}</span>
            {comment.author.id === postAuthorId && <span className="chip-brand">作者</span>}
            <span className="text-xs text-ink-500">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{comment.body}</p>
          <div className="mt-1.5 flex gap-3 text-xs text-ink-500">
            <button onClick={() => onReply(comment)} className="hover:text-brand-600">
              回复
            </button>
            {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="hover:text-red-600">
                删除
              </button>
            )}
          </div>

          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-3 border-l-2 border-ink-300/60 pl-4">
              {comment.replies.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="grid h-6 w-6 place-content-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {r.author.nickname.slice(0, 1).toUpperCase()}
                    </span>
                    <Link href={`/profile/${r.author.id}`} className="font-medium hover:text-brand-600">
                      {r.author.nickname}
                    </Link>
                    <span className={`chip ${roleColor(r.author.role)}`}>{r.author.role}</span>
                    {r.author.id === postAuthorId && <span className="chip-brand">作者</span>}
                    <span className="text-xs text-ink-500">{formatTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{r.body}</p>
                  <div className="mt-1 flex gap-3 text-xs text-ink-500">
                    <button onClick={() => onReply(r)} className="hover:text-brand-600">
                      回复
                    </button>
                    {currentUser && (currentUser.id === r.author.id || currentUser.id === postAuthorId) && (
                      <button onClick={() => onDelete(r.id)} className="hover:text-red-600">
                        删除
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
