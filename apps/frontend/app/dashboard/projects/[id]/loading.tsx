import { Skeleton, PageHeaderSkeleton } from '@/components/ui/LoadingSkeleton';

export default function ProjectDetailLoading() {
  return (
    <output className="block p-6 space-y-6" aria-label="Loading project details">
      <PageHeaderSkeleton />

      {/* Project stages */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <div className="flex gap-2 mb-6">
          {['brief', 'design', 'revision', 'approval', 'delivery'].map((stage) => (
            <Skeleton key={`stage-${stage}`} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>

      <span className="sr-only">Loading project details...</span>
    </output>
  );
}
