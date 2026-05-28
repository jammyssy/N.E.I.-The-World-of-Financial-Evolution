import Link from 'next/link';
import { Ornament } from '@/components/icons/Ornament';

/**
 * 详情页 404 · 该卷不存在或未发布
 */
export default function PostNotFound() {
  return (
    <div className="mx-auto max-w-prose pt-12 text-center">
      <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-4">
        Chapter Missing
      </p>
      <h1 className="font-serif text-3xl text-ink-brown mb-3">
        此卷已不在卷架上
      </h1>
      <p className="font-serif italic text-leather mb-6">
        或许尚未启封 · 或许已被作者撤回
      </p>

      <div className="flex justify-center mb-6 text-leather">
        <Ornament width={64} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center h-9 px-4 bg-ink-brown text-vellum hover:bg-wax-red font-serif text-sm rounded-sm transition-colors"
        >
          回到目录
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center h-9 px-4 border border-ink-brown text-ink-brown hover:bg-ink-brown hover:text-vellum font-serif text-sm rounded-sm transition-colors"
        >
          检索其他
        </Link>
      </div>
    </div>
  );
}
