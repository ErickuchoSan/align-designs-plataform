import { memo } from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = memo(function Skeleton({ className = '' }: Readonly<SkeletonProps>) {
  return <div className={`animate-pulse bg-[#F5F4F0] rounded ${className}`} />;
});

export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-[#F5F4F0] rounded-lg">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => `table-row-${i}`).map((key) => (
        <div key={key} className="flex gap-4 p-4 bg-white border border-[#D0C5B2]/20 rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
});

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white border border-[#D0C5B2]/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
});

export const ProjectCardSkeleton = memo(function ProjectCardSkeleton() {
  return (
    <div className="bg-white border border-[#D0C5B2]/20 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
});

export const PageHeaderSkeleton = memo(function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
});

interface PageLoadingProps {
  title?: string;
}

export default memo(function PageLoading({ title }: Readonly<PageLoadingProps>) {
  return (
    <output className="block p-6 space-y-6" aria-label={title ? `Loading ${title}` : 'Loading'}>
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
      <span className="sr-only">Loading...</span>
    </output>
  );
});
