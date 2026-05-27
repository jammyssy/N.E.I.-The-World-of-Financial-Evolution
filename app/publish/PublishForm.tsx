'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichEditor } from '@/components/RichEditor';
import { AttachmentUploader, type UploadedFile } from '@/components/AttachmentUploader';
import { SCENE_TAGS, INDUSTRY_TAGS, CONTENT_TAGS, SKILL_TAGS } from '@/lib/tags';

export function PublishForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scene, setScene] = useState('');
  const [industry, setIndustry] = useState('');
  const [content, setContent] = useState<string[]>([]);
  const [skill, setSkill] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleContent = (v: string) => {
    if (content.includes(v)) {
      setContent(content.filter((x) => x !== v));
    } else if (content.length < 3) {
      setContent([...content, v]);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (title.trim().length < 5) return setErr('标题至少 5 字符');
    if (title.length > 100) return setErr('标题最多 100 字符');
    if (!body || body.replace(/<[^>]*>/g, '').trim().length === 0) return setErr('请输入正文');
    if (!scene) return setErr('请选择工作场景标签');

    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        body,
        tagScene: scene,
        tagIndustry: industry || null,
        tagContent: content,
        tagSkill: skill || null,
        attachmentIds: files.map((f) => f.id),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErr(data.error || '发布失败');
      return;
    }
    router.push(`/posts/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="card p-5">
        <label className="label">标题 <span className="text-red-500">*</span></label>
        <input
          className="input text-lg"
          placeholder="一句话概括你要分享的内容（5-100 字符）"
          value={title}
          maxLength={100}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-ink-500">{title.length}/100</p>
      </div>

      <div className="card p-5">
        <label className="label">正文 <span className="text-red-500">*</span></label>
        <RichEditor value={body} onChange={setBody} />
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">📍 分类标签</h3>

        <div className="mb-4">
          <label className="label">
            工作场景 <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-ink-500 font-normal">单选必填</span>
          </label>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {SCENE_TAGS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setScene(t.value)}
                className={`rounded-md border px-3 py-2 text-left text-sm ${
                  scene === t.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-300 hover:border-brand-500'
                }`}
              >
                <div className="font-medium">{t.label}</div>
                <div className="text-[11px] text-ink-500">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="label">
            行业赛道 <span className="ml-2 text-xs text-ink-500 font-normal">单选可选</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <ChipBtn active={industry === ''} onClick={() => setIndustry('')}>
              不选
            </ChipBtn>
            {INDUSTRY_TAGS.map((t) => (
              <ChipBtn key={t.value} active={industry === t.value} onClick={() => setIndustry(t.value)}>
                {t.label}
              </ChipBtn>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="label">
            工作内容 <span className="ml-2 text-xs text-ink-500 font-normal">多选，最多 3 个</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TAGS.map((t) => (
              <ChipBtn key={t.value} active={content.includes(t.value)} onClick={() => toggleContent(t.value)}>
                {t.label}
              </ChipBtn>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Skill 类型 <span className="ml-2 text-xs text-ink-500 font-normal">单选可选</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <ChipBtn active={skill === ''} onClick={() => setSkill('')}>
              不选
            </ChipBtn>
            {SKILL_TAGS.map((t) => (
              <ChipBtn key={t.value} active={skill === t.value} onClick={() => setSkill(t.value)}>
                {t.label}
              </ChipBtn>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">📎 附件</h3>
        <AttachmentUploader files={files} onChange={setFiles} />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          取消
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? '发布中…' : '发布'}
        </button>
      </div>
    </form>
  );
}

function ChipBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${
        active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-300 text-ink-700 hover:border-brand-500'
      }`}
    >
      {children}
    </button>
  );
}
