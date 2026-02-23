/**
 * Root Loading Component
 * Provides instant loading feedback during navigation (PE)
 *
 * This is a Server Component that shows immediately
 * while the page's data is being fetched.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
      <div className="text-center">
        <div
          className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-navy-800 border-r-transparent"
          role="status"
          aria-label="Loading page"
        />
        <p className="mt-4 text-sm text-stone-600" aria-live="polite">
          Loading...
        </p>
      </div>
    </div>
  );
}
