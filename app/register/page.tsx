'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLE_TAGS } from '@/lib/tags';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ phone: '', code: '', role: '', nickname: '', password: '' });
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devCode, setDevCode] = useState('');

  const sendCode = async () => {
    setErr('');
    setSending(true);
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) setErr(data.error);
    else setDevCode(data.devCode);
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!/^1[3-9]\d{9}$/.test(form.phone)) return setErr('手机号格式不正确');
    if (!/^\d{6}$/.test(form.code)) return setErr('请输入 6 位验证码');
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErr(data.error);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-semibold">创建账号</h1>
        <p className="mb-6 text-sm text-ink-500">加入 PEVC 知识社区，与 VC / PE / FA 同行共建知识库</p>

        {/* 步骤指示 */}
        <div className="mb-5 flex items-center gap-2 text-xs text-ink-500">
          <span className={step === 1 ? 'text-brand-600 font-medium' : ''}>1. 手机验证</span>
          <span>→</span>
          <span className={step === 2 ? 'text-brand-600 font-medium' : ''}>2. 完善资料</span>
        </div>

        {step === 1 && (
          <form onSubmit={nextStep} className="space-y-4">
            <div>
              <label className="label">手机号</label>
              <input
                className="input"
                type="tel"
                placeholder="11 位大陆手机号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">短信验证码</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="6 位数字"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="btn-secondary whitespace-nowrap"
                >
                  {sending ? '发送中…' : '获取验证码'}
                </button>
              </div>
              {devCode && (
                <p className="mt-1 text-xs text-amber-600">
                  开发模式：验证码为 <code className="font-mono font-semibold">{devCode}</code>
                </p>
              )}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button type="submit" className="btn-primary w-full">
              下一步
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">选择身份</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_TAGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`rounded-md border px-3 py-3 text-left ${
                      form.role === r.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-ink-300 hover:border-brand-500'
                    }`}
                  >
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="mt-1 text-[11px] text-ink-500">{r.desc}</div>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-500">注册后身份不可自助修改</p>
            </div>

            <div>
              <label className="label">昵称</label>
              <input
                className="input"
                placeholder="2-20 字符，全平台唯一"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </div>

            <div>
              <label className="label">登录密码</label>
              <input
                className="input"
                type="password"
                placeholder="8-20 位，含字母和数字"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                上一步
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? '提交中…' : '完成注册'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 border-t border-ink-300/60 pt-4 text-center text-sm text-ink-500">
          已有账号？{' '}
          <Link href="/login" className="text-brand-600 hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
