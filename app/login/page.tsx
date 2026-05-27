'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [form, setForm] = useState({ phone: '', password: '', code: '' });
  const [err, setErr] = useState('');
  const [devCode, setDevCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async () => {
    setErr('');
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await res.json();
    if (!res.ok) setErr(data.error);
    else setDevCode(data.devCode);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, mode }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErr(data.error);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-semibold">登录</h1>
        <p className="mb-6 text-sm text-ink-500">欢迎回到 PEVC 知识社区</p>

        <div className="mb-4 flex gap-1 rounded-md bg-ink-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 rounded py-1.5 ${mode === 'password' ? 'bg-white shadow-sm' : 'text-ink-700'}`}
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`flex-1 rounded py-1.5 ${mode === 'code' ? 'bg-white shadow-sm' : 'text-ink-700'}`}
          >
            验证码登录
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">手机号</label>
            <input
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="11 位大陆手机号"
            />
          </div>

          {mode === 'password' ? (
            <div>
              <label className="label">密码</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="8-20 位"
              />
            </div>
          ) : (
            <div>
              <label className="label">短信验证码</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="6 位数字"
                />
                <button type="button" onClick={sendCode} className="btn-secondary whitespace-nowrap">
                  获取验证码
                </button>
              </div>
              {devCode && (
                <p className="mt-1 text-xs text-amber-600">
                  开发模式：验证码为 <code className="font-mono font-semibold">{devCode}</code>
                </p>
              )}
            </div>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-6 border-t border-ink-300/60 pt-4 text-center text-sm text-ink-500">
          还没账号？{' '}
          <Link href="/register" className="text-brand-600 hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
