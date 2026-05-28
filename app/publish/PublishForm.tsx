'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RichEditor } from '@/components/RichEditor';
import { AttachmentUploader, type UploadedFile } from '@/components/AttachmentUploader';
import { SCENE_TAGS, INDUSTRY_TAGS, CONTENT_TAGS, SKILL_TAGS, ASSET_TYPE_HELPERS } from '@/lib/tags';

export function PublishForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assetType, setAssetType] = useState('');
  const [scene, setScene] = useState('');
  const [industry, setIndustry] = useState('');
  const [content, setContent] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [installHint, setInstallHint] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const helpers = useMemo(() => ASSET_TYPE_HELPERS[assetType] ?? null, [assetType]);

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

    if (!assetType) return setErr('请选择 Skill 类型');
    if (title.trim().length < 5) return setErr('标题至少 5 字符');
    if (title.length > 100) return setErr('标题最多 100 字符');
    if (!body || body.replace(/<[^>]*>/g, '').trim().length === 0) return setErr('请输入正文');
    if (!scene) return setErr('请选择工作场景标签');

    if (sourceUrl && !/^https?:\/\//.test(sourceUrl.trim())) return setErr('来源链接需以 http:// 或 https:// 开头');

    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        body,
        assetType,
        tags: {
          scene,
          industry: industry || null,
          content,
        },
        sourceUrl: sourceUrl || null,
        installHint: installHint || null,
        usageNotes: usageNotes || null,
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
      {/* Asset Type Selection - Prominent */}
      <div className="card p-5">
        <label className="label">
          Skill 类型 <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SKILL_TAGS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setAssetType(t.value)}
              className={`rounded-md border px-3 py-2.5 text-left text-sm transition ${
                assetType === t.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                  : 'border-ink-300 hover:border-brand-500'
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-[11px] text-ink-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
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

      {/* Body */}
      <div className="card p-5">
        <label className="label">正文 <span className="text-red-500">*</span></label>
        {helpers && (
          <p className="mb-2 rounded-md bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-700">
            {helpers.body}
          </p>
        )}
        <RichEditor value={body} onChange={setBody} />
      </div>

      {/* Tags */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">分类标签</h3>

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
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
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

        <div>
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
      </div>

      {/* Skill Asset Metadata */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">Skill 资产信息</h3>
        <div className="grid gap-4">
          <div>
            <label className="label">来源链接</label>
            <input
              className="input"
              placeholder="https://github.com/... 或工具文档链接"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="label">安装 / 使用前置说明</label>
            {helpers && (
              <p className="mb-1 text-xs text-ink-500">{helpers.installHint}</p>
            )}
            <textarea
              className="input min-h-[80px]"
              placeholder="例如需要的工具、环境变量、文件放置位置等"
              value={installHint}
              maxLength={2000}
              onChange={(e) => setInstallHint(e.target.value)}
            />
          </div>
          <div>
            <label className="label">适用场景 / 使用心得</label>
            {helpers && (
              <p className="mb-1 text-xs text-ink-500">{helpers.usageNotes}</p>
            )}
            <textarea
              className="input min-h-[80px]"
              placeholder="说明这个资产适合谁、何时使用、有什么注意事项"
              value={usageNotes}
              maxLength={2000}
              onChange={(e) => setUsageNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold">附件</h3>
        <p className="mb-3 text-xs text-ink-500">
          {assetType === 'template'
            ? '建议上传模板文件（Word / Excel / PPT / Markdown 等），方便他人直接使用。'
            : assetType === 'api-script'
            ? '建议将脚本文件作为附件上传，方便他人下载运行。'
            : '上传相关的参考文件、模板或代码片段。'}
        </p>
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
