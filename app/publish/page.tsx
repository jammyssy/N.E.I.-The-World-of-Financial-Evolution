import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { PublishForm } from './PublishForm';

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/publish');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">发布内容</h1>
      <p className="mb-6 text-sm text-ink-500">分享你的方法论、模板、Prompt 或案例。打上准确的分类标签，让同行更容易找到。</p>
      <PublishForm />
    </div>
  );
}
