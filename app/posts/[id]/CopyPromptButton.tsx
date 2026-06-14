'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * 提示词「一键复制」按钮。
 *
 * 行为：
 * - 未登录 → 跳登录页（提示词全文免费看，但复制要登录，引导注册）
 * - 已登录 → 复制正文纯文本到剪贴板，显示「已复制」反馈
 *
 * 正文以 <pre> 包裹存入 DB（见 PublishForm 提示词分支），
 * 这里把 HTML 标签剥掉、还原换行，得到干净的提示词文本。
 */
export function CopyPromptButton({
  bodyHtml,
  postId,
  isAuthed,
}: {
  bodyHtml: string;
  postId: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!isAuthed) {
      router.push(`/login?next=/posts/${postId}`);
      return;
    }
    // <pre> 内容 → 纯文本：去标签、&lt;/&gt;/&amp; 还原
    const text = bodyHtml
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板 API 失败（老浏览器 / 非 HTTPS）—— 退化用临时 textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-3 text-xs font-sans rounded-sm border transition-colors',
        copied
          ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
          : 'border-ink-brown text-ink-brown hover:bg-ink-brown hover:text-vellum',
      )}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 6.5 L5 9.5 L10 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <rect x="3.5" y="3.5" width="6" height="6" rx="0.5" />
            <path d="M2 7.5 V2 H7.5" strokeLinecap="round" />
          </svg>
          {isAuthed ? '复制提示词' : '登录后复制'}
        </>
      )}
    </button>
  );
}
