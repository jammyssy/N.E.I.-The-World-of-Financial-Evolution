'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type Mode = 'password' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [mode, setMode] = useState<Mode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);

  const sendCode = async () => {
    setErr(null);
    setDevCode(null);
    setSending(true);
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) setErr(data.error || '发送失败');
    else setDevCode(data.devCode);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, code, mode }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErr(data.error || '登录失败');
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <AuthFrame
      eyebrow="Sign In · Volume I"
      title="重启卷宗"
      subtitle="Continue the codex you've been writing"
      footer={
        <>
          初次到访？
          <Link
            href="/register"
            className="ml-1 underline underline-offset-4 decoration-paper-edge hover:text-ink-brown hover:decoration-ink-brown"
          >
            创建身份
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        {/* —— 模式切换 —— */}
        <div className="flex items-center justify-center gap-0 border-b border-paper-edge -mt-2 mb-2">
          <ModeTab active={mode === 'password'} onClick={() => setMode('password')}>
            密码
          </ModeTab>
          <span className="w-px h-4 bg-paper-edge" />
          <ModeTab active={mode === 'code'} onClick={() => setMode('code')}>
            短信验证码
          </ModeTab>
        </div>

        <Input
          label="手机号"
          type="tel"
          placeholder="11 位大陆手机号"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
        />

        {mode === 'password' ? (
          <Input
            label="密码"
            type="password"
            placeholder="8-20 位，含字母与数字"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : (
          <div>
            <label className="mb-1.5 block font-serif text-sm text-ink-brown">
              短信验证码
            </label>
            <div className="flex gap-2">
              <input
                className="block w-full rounded-sm border border-paper-edge bg-vellum px-3 py-2 text-sm font-sans text-ink-brown placeholder:text-sepia/70 focus:border-ink-brown focus:outline-none"
                placeholder="6 位数字"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={sendCode}
                disabled={sending || !/^1[3-9]\d{9}$/.test(phone)}
                className="whitespace-nowrap"
              >
                {sending ? '发送中…' : '获取验证码'}
              </Button>
            </div>
            {devCode && (
              <p className="mt-1.5 text-xs font-sans text-gilded">
                开发模式 · 验证码：
                <span className="font-serif num-osf ml-1 text-sm">{devCode}</span>
              </p>
            )}
          </div>
        )}

        {err && (
          <p className="text-sm font-sans text-wax-red border-l border-wax-red pl-3">
            {err}
          </p>
        )}

        <Button type="submit" block size="lg" disabled={submitting}>
          {submitting ? '验证中…' : mode === 'password' ? '进入卷宗' : '验证并进入'}
        </Button>

        {mode === 'password' && (
          <p className="text-center text-xs font-sans text-sepia">
            忘记密码？请改用
            <button
              type="button"
              onClick={() => setMode('code')}
              className="ml-1 underline underline-offset-4 decoration-paper-edge hover:text-ink-brown hover:decoration-ink-brown"
            >
              验证码登录
            </button>
          </p>
        )}
      </form>
    </AuthFrame>
  );
}

function ModeTab({
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
        'relative px-5 py-2.5 font-serif text-sm transition-colors',
        active ? 'text-ink-brown' : 'text-sepia hover:text-leather',
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-px left-3 right-3 h-px bg-ink-brown" />
      )}
    </button>
  );
}
