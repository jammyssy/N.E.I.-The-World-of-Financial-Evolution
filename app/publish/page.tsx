import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { PublishForm } from './PublishForm';

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/publish');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">发布 Skill Asset</h1>
      <p className="mb-6 text-sm text-ink-500">分享可复用的 Prompt、Workflow、Agent Skill、模板、脚本或案例，并沉淀到 PEVC Skills Map。</p>
      <PublishForm />
    </div>
  );
}
