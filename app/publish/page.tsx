import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { Ornament } from '@/components/icons/Ornament';
import { PublishForm } from './PublishForm';

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/publish');

  return (
    <div className="mx-auto max-w-prose">
      {/* —— 卷首 —— */}
      <header className="text-center mb-10 mt-2">
        <p className="font-display tracking-display text-[11px] text-sepia uppercase mb-3">
          Compose · Volume I
        </p>
        <h1 className="font-serif text-4xl text-ink-brown mb-3">撰写新卷</h1>
        <p className="font-serif italic text-leather">
          Lay down a chapter that future readers will return to
        </p>
        <div className="flex justify-center mt-5 text-leather">
          <Ornament width={64} />
        </div>
      </header>

      <PublishForm currentUser={{ id: user.id, role: user.role, nickname: user.nickname }} />
    </div>
  );
}
