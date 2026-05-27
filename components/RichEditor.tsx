'use client';

import { useRef } from 'react';

// 极简富文本：基于 contentEditable + execCommand
// 支持：加粗、斜体、引用、有序/无序列表、标题、链接、图片粘贴
export function RichEditor({
  value,
  onChange,
  placeholder = '在这里撰写正文…',
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt('输入链接 URL');
    if (url) exec('createLink', url);
  };

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="rounded-md border border-ink-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-300/60 px-2 py-1.5 text-sm">
        <ToolBtn onClick={() => exec('bold')} title="加粗">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="斜体">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="下划线">
          <u>U</u>
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-ink-300" />
        <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="标题">
          H2
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="小标题">
          H3
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<blockquote>')} title="引用">
          ❝
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-ink-300" />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="无序列表">
          • —
        </ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="有序列表">
          1.
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-ink-300" />
        <ToolBtn onClick={insertLink} title="插入链接">
          🔗
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<p>')} title="正文">
          ¶
        </ToolBtn>
        <ToolBtn onClick={() => exec('removeFormat')} title="清除格式">
          ✕
        </ToolBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className="prose-post min-h-[280px] px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500/20"
        data-placeholder={placeholder}
      />
      <style jsx>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="rounded px-2 py-1 hover:bg-ink-100"
    >
      {children}
    </button>
  );
}
