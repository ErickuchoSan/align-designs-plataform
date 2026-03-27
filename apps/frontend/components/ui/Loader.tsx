interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'navy';
  text?: string;
}

export default function Loader({ size = 'md', color = 'blue', text }: Readonly<LoaderProps>) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-10 h-10 border-2',
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    navy: 'border-[#1B1C1A] border-t-transparent',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }: Readonly<{ text?: string }>) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="lg" text={text} />
    </div>
  );
}

export function ButtonLoader() {
  return <Loader size="sm" color="white" />;
}

/**
 * Inline spinner for content areas - uses navy color by default
 * Use this instead of duplicating spinner styles
 */
export function InlineSpinner({ label = 'Loading' }: Readonly<{ label?: string }>) {
  return (
    <output className="flex items-center justify-center py-12" aria-label={label}>
      <Loader size="xl" color="navy" />
    </output>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="h-6 bg-[#F5F4F0] rounded w-3/4"></div>
          <div className="flex gap-2 ml-2">
            <div className="w-9 h-9 bg-[#F5F4F0] rounded-lg"></div>
            <div className="w-9 h-9 bg-[#F5F4F0] rounded-lg"></div>
          </div>
        </div>
        <div className="h-4 bg-[#F5F4F0] rounded w-full mt-2"></div>
        <div className="h-4 bg-[#F5F4F0] rounded w-2/3 mt-1"></div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F5F4F0] rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-[#F5F4F0] rounded w-1/2"></div>
            <div className="h-3 bg-[#F5F4F0] rounded w-2/3 mt-1"></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#D0C5B2]/20 flex items-center justify-between">
          <div className="h-6 bg-[#F5F4F0] rounded-full w-20"></div>
          <div className="h-4 bg-[#F5F4F0] rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-[#F5F4F0] rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[#F5F4F0] rounded w-48"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[#F5F4F0] rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-[#F5F4F0] rounded-full w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-[#F5F4F0] rounded-full w-11"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[#F5F4F0] rounded w-24"></div>
      </td>
    </tr>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-[#D0C5B2]/20 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-[#F5F4F0] rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-[#F5F4F0] rounded w-3/4"></div>
            <div className="h-3 bg-[#F5F4F0] rounded w-1/2 mt-2"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-[#F5F4F0] rounded"></div>
          <div className="w-8 h-8 bg-[#F5F4F0] rounded"></div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#D0C5B2]/20">
        <div className="h-3 bg-[#F5F4F0] rounded w-1/3"></div>
      </div>
    </div>
  );
}
