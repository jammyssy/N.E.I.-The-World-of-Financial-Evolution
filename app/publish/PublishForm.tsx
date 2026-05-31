'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { RichEditor } from '@/components/RichEditor';
import {
  AttachmentUploader,
  type UploadedFile,
} from '@/components/AttachmentUploader';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/icons/RoleBadge';
import {
  SCENE_TAGS,
  INDUSTRY_TAGS,
  CONTENT_TAGS,
  SKILL_TAGS,
  ASSET_TYPE_HELPERS,
} from '@/lib/tags';
import { SkillIcon } from '@/components/icons/SkillIcon';

type CurrentUser = { id: number; role: string; nickname: string };

export function PublishForm({ currentUser }: { currentUser: CurrentUser }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assetType, setAssetType] = useState('');
  const [scene, setScene] = useState('');
  const [industry, setIndustry] = useState('');
  const [contents, setContents] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [installHint, setInstallHint] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleContent = (v: string) => {
    if (contents.includes(v)) setContents(contents.filter((x) => x !== v));
    else if (contents.length < 3) setContents([...contents, v]);
  };

  const assetHelper = assetType ? ASSET_TYPE_HELPERS[assetType] : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    // Validation
    if (!assetType) return setErr('请选择 Skill 类型');
    if (title.trim().length < 5) return setErr('标题至少 5 字符');
    if (title.length > 100) return setErr('标题最多 100 字符');
    if (!body || body.replace(/<[^>]*>/g, '').trim().length === 0)
      return setErr('请书写正文');
    if (!scene) return setErr('请为本卷指定工作场景');
    if (sourceUrl.trim() && !/^https?:\/\/.+/.test(sourceUrl.trim()))
      return setErr('来源链接须以 http:// 或 https:// 开头');

    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        body,
        tagScene: scene,
        tagIndustry: industry || null,
        tagContent: contents,
        tagSkill: assetType,
        attachmentIds: files.map((f) => f.id),
        sourceUrl: sourceUrl.trim() || null,
        installHint: installHint.trim() || null,
        usageNotes: usageNotes.trim() || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setErr(data.error || '落印失败');
      return;
    }
    router.push(`/posts/${data.id}`);
    router.refresh();
  };

  // Attachment hint based on asset type
  const attachmentHint = (() => {
    if (!assetType) return '选填 · 最多 5 件 · 单件 ≤ 100 MB';
    if (assetType === 'template') return '建议上传模板文件 · 最多 5 件 · 单件 ≤ 100 MB';
    if (assetType === 'api-script') return '建议将脚本文件上传 · 最多 5 件 · 单件 ≤ 100 MB';
    return '选填 · 最多 5 件 · 单件 ≤ 100 MB';
  })();

  return (
    <form onSubmit={submit} className="space-y-section">
      {/* —— 作者条 —— */}
      <div className="flex items-center gap-3 pb-5 border-b border-paper-edge">
        <RoleBadge role={currentUser.role} size={22} />
        <div>
          <p className="font-display tracking-display text-[10px] text-sepia uppercase">
            Author
          </p>
          <p className="font-serif text-base text-ink-brown">
            {currentUser.nickname}
          </p>
        </div>
        <p className="ml-auto font-serif italic text-xs text-sepia">
          作者一经落印不可更改
        </p>
      </div>

      {/* ===== Section I · Skill 类型 ===== */}
      <Section numeral="I" title="Skill 类型" hint="必填 · 选择后将自动设置 Skill 标签">
        <Dimension label="资产类型" required hint="单选 · 必填">
          <ChipSet>
            {SKILL_TAGS.map((t) => (
              <BadgeChip
                key={t.value}
                active={assetType === t.value}
                onClick={() => setAssetType(t.value)}
                icon={<SkillIcon skill={t.value} size={11} />}
              >
                {t.label}
              </BadgeChip>
            ))}
          </ChipSet>
        </Dimension>
      </Section>

      {/* ===== Section II · 标题 + 正文 ===== */}
      <Section numeral="II" title="标题" hint="5-100 字符 · 一句话概括所要传达">
        <input
          className={cn(
            'w-full bg-transparent border-0 border-b border-paper-edge',
            'font-serif text-2xl sm:text-3xl text-ink-brown placeholder:text-sepia/60 italic',
            'focus:border-ink-brown focus:outline-none transition-colors',
            'py-3',
          )}
          placeholder="此处书写卷名…"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="mt-1 font-sans text-[11px] text-sepia text-right num-osf">
          {title.length}/100
        </p>
      </Section>

      <Section numeral="II-a" title="正文" hint="衬线排版 · 可加粗 · 引文 · 列表 · 链接">
        {assetHelper && (
          <div className="bg-vellum/50 border border-paper-edge rounded px-3 py-2 text-xs text-leather mb-3">
            {assetHelper.body}
          </div>
        )}
        <RichEditor value={body} onChange={setBody} placeholder="此处书写正文…" />
      </Section>

      {/* ===== Section III · 分类标签 ===== */}
      <Section numeral="III" title="分类标签" hint="为本卷打上分类印章，便于他人检索">
        {/* 工作场景 */}
        <Dimension label="工作场景" required hint="单选 · 必填">
          <ChipSet>
            {SCENE_TAGS.map((t) => (
              <SealChip
                key={t.value}
                active={scene === t.value}
                onClick={() => setScene(t.value)}
              >
                {t.label}
              </SealChip>
            ))}
          </ChipSet>
        </Dimension>

        {/* 行业赛道 */}
        <Dimension label="行业赛道" hint="单选 · 选填">
          <ChipSet>
            <PillChip active={industry === ''} onClick={() => setIndustry('')}>
              不指定
            </PillChip>
            {INDUSTRY_TAGS.map((t) => (
              <PillChip
                key={t.value}
                active={industry === t.value}
                onClick={() => setIndustry(t.value)}
              >
                {t.label}
              </PillChip>
            ))}
          </ChipSet>
        </Dimension>

        {/* 工作内容 */}
        <Dimension
          label="工作内容"
          hint={`多选 · 最多 3 个 · 已选 ${contents.length}`}
        >
          <ChipSet>
            {CONTENT_TAGS.map((t) => (
              <FoldChip
                key={t.value}
                active={contents.includes(t.value)}
                disabled={!contents.includes(t.value) && contents.length >= 3}
                onClick={() => toggleContent(t.value)}
              >
                {t.label}
              </FoldChip>
            ))}
          </ChipSet>
        </Dimension>
      </Section>

      {/* ===== Section IV · Skill 资产信息 ===== */}
      <Section numeral="IV" title="Skill 资产信息" hint="选填 · 帮助他人快速上手使用">
        {/* 来源链接 */}
        <Dimension label="来源链接" hint="选填 · 原始出处或下载地址">
          <input
            type="url"
            className={cn(
              'w-full bg-transparent border border-paper-edge rounded px-3 py-2',
              'font-sans text-sm text-ink-brown placeholder:text-sepia/60',
              'focus:border-ink-brown focus:outline-none transition-colors',
            )}
            placeholder="https://example.com/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </Dimension>

        {/* 安装/使用说明 */}
        <Dimension label="安装 / 使用说明" hint="选填 · 最多 2000 字符">
          {assetHelper && (
            <p className="mb-1.5 text-[10px] text-leather">{assetHelper.installHint}</p>
          )}
          <textarea
            className={cn(
              'w-full bg-transparent border border-paper-edge rounded px-3 py-2',
              'font-sans text-sm text-ink-brown placeholder:text-sepia/60',
              'focus:border-ink-brown focus:outline-none transition-colors',
              'resize-y min-h-[80px]',
            )}
            placeholder="描述安装步骤或使用前提条件…"
            maxLength={2000}
            value={installHint}
            onChange={(e) => setInstallHint(e.target.value)}
          />
          <p className="mt-1 font-sans text-[11px] text-sepia text-right num-osf">
            {installHint.length}/2000
          </p>
        </Dimension>

        {/* 适用场景 / 使用心得 */}
        <Dimension label="适用场景 / 使用心得" hint="选填 · 最多 2000 字符">
          {assetHelper && (
            <p className="mb-1.5 text-[10px] text-leather">{assetHelper.usageNotes}</p>
          )}
          <textarea
            className={cn(
              'w-full bg-transparent border border-paper-edge rounded px-3 py-2',
              'font-sans text-sm text-ink-brown placeholder:text-sepia/60',
              'focus:border-ink-brown focus:outline-none transition-colors',
              'resize-y min-h-[80px]',
            )}
            placeholder="描述适合的场景和使用经验…"
            maxLength={2000}
            value={usageNotes}
            onChange={(e) => setUsageNotes(e.target.value)}
          />
          <p className="mt-1 font-sans text-[11px] text-sepia text-right num-osf">
            {usageNotes.length}/2000
          </p>
        </Dimension>
      </Section>

      {/* ===== Section V · 附件 ===== */}
      <Section numeral="V" title="附件" hint={attachmentHint}>
        <AttachmentUploader files={files} onChange={setFiles} />
      </Section>

      {/* ===== 错误 + 提交 ===== */}
      {err && (
        <p className="font-sans text-sm text-wax-red border-l border-wax-red pl-3">
          {err}
        </p>
      )}

      <div className="border-t border-paper-edge pt-6 flex items-center justify-between gap-3">
        <p className="font-serif italic text-xs text-sepia hidden sm:block">
          落印之后即对社群可见
        </p>
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            搁笔
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? '正在落印…' : '落印 · 发布'}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ============================================================
   Section · 章节式分组
   ============================================================ */
function Section({
  numeral,
  title,
  hint,
  children,
}: {
  numeral: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display tracking-display text-xs text-sepia">
          {numeral}
        </span>
        <h2 className="font-serif text-2xl text-ink-brown">{title}</h2>
        {hint && (
          <span className="font-serif italic text-xs text-sepia ml-1">
            · {hint}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Dimension({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="font-serif text-sm text-ink-brown">{label}</span>
        {required && (
          <span className="font-sans text-[10px] text-wax-red tracking-wide uppercase">
            Required
          </span>
        )}
        {hint && <span className="font-sans text-[10px] text-sepia tracking-wide">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipSet({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

/* —— 四种 Chip 形态（与 FilterBar 一致） —— */
function SealChip({
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
        'inline-flex items-center px-2.5 h-6 text-xs font-serif uppercase tracking-wide transition-colors',
        active
          ? 'border border-ink-brown bg-ink-brown text-vellum'
          : 'border border-paper-edge text-leather hover:border-ink-brown hover:text-ink-brown',
      )}
    >
      {children}
    </button>
  );
}
function PillChip({
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
        'inline-flex items-center px-3 h-6 text-xs font-sans rounded-full transition-colors',
        active ? 'bg-leather text-vellum' : 'bg-linen text-leather hover:bg-paper-edge',
      )}
    >
      {children}
    </button>
  );
}
function FoldChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center px-2.5 h-6 text-xs font-sans transition-colors',
        active
          ? 'border border-ink-brown bg-parchment text-ink-brown'
          : 'border border-paper-edge bg-parchment text-leather hover:border-sepia',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}
function BadgeChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 pl-1.5 pr-3 h-6 text-xs font-sans rounded-full transition-colors',
        active
          ? 'bg-gilded/15 border border-gilded text-ink-brown'
          : 'bg-vellum border border-gilded/40 text-leather hover:border-gilded',
      )}
    >
      {icon && (
        <span className="grid place-content-center w-4 h-4 rounded-full bg-parchment text-gilded">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
