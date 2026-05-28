import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Ornament } from '@/components/icons/Ornament';

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-prose">
      <header className="text-center mb-10 mt-2">
        <Skeleton className="h-3 w-28 mx-auto mb-4" />
        <Skeleton className="h-9 w-40 mx-auto mb-3" />
        <Skeleton className="h-3 w-60 mx-auto mb-7" />
        <Skeleton bordered className="h-12 mx-auto max-w-md" />
        <div className="flex justify-center mt-7 text-paper-edge">
          <Ornament width={64} />
        </div>
      </header>

      <Skeleton bordered className="h-12 mb-8" />

      <ol className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <SkeletonCard />
          </li>
        ))}
      </ol>
    </div>
  );
}
