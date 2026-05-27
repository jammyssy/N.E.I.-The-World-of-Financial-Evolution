'use client';

import { useRef, useState } from 'react';
import { formatBytes, fileIcon, truncate } from '@/lib/format';

export type UploadedFile = {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

const ACCEPT = '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.mp4,.zip,.md,.txt';
const MAX_FILES = 5;
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export function AttachmentUploader({
  files,
  onChange,
}: {
  files: UploadedFile[];
  onChange: (next: UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; pct: number } | null>(null);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);

  const upload = async (fileList: FileList) => {
    setErr('');
    const arr = Array.from(fileList);
    if (files.length + arr.length > MAX_FILES) {
      setErr(`单帖最多 ${MAX_FILES} 个附件`);
      return;
    }
    let nextFiles = files;
    for (const f of arr) {
      if (f.size > MAX_SIZE) {
        setErr(`${f.name} 超过 100 MB`);
        continue;
      }
      setProgress({ name: f.name, pct: 10 });
      const fd = new FormData();
      fd.append('file', f);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        setProgress({ name: f.name, pct: 80 });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error || '上传失败');
          continue;
        }
        nextFiles = [...nextFiles, data];
        onChange(nextFiles);
        setProgress({ name: f.name, pct: 100 });
      } catch {
        setErr('网络错误');
      }
    }
    setProgress(null);
  };

  const remove = async (id: number) => {
    await fetch(`/api/upload/${id}`, { method: 'DELETE' });
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition ${
          drag ? 'border-brand-500 bg-brand-50' : 'border-ink-300 hover:border-brand-500'
        }`}
      >
        <div className="text-2xl">📎</div>
        <p className="mt-2 text-sm text-ink-700">
          点击或拖拽上传附件
        </p>
        <p className="mt-1 text-xs text-ink-500">
          支持 PDF / DOCX / XLSX / PPTX / 图片 / MP4 / ZIP / MD · 单文件 ≤ 100MB · 最多 {MAX_FILES} 个
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {progress && (
        <div className="mt-2 rounded-md bg-ink-100 px-3 py-2 text-xs">
          上传中：{progress.name}
          <div className="mt-1 h-1 w-full overflow-hidden rounded bg-white">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-md border border-ink-300 px-3 py-2 text-sm"
            >
              <span className="text-lg">{fileIcon(f.mimeType, f.fileName)}</span>
              <span className="flex-1 truncate" title={f.fileName}>
                {truncate(f.fileName, 40)}
              </span>
              <span className="text-xs text-ink-500">{formatBytes(f.fileSize)}</span>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="text-ink-500 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
