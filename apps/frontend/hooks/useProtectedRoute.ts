import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseProtectedRouteOptions {
  /** Path to redirect to if not authenticated (default: '/login') */
  redirectTo?: string;
  /** If true, only allow admin users (redirects to /dashboard if not admin) */
  requireAdmin?: boolean;
  /** Custom redirect path for non-admin users (default: '/dashboard') */
  adminRedirectTo?: string;
}

/**
 * Hook to protect routes that require authentication
 * Automatically redirects to login if user is not authenticated
 * Optionally enforces admin-only access
 * Returns auth state for conditional rendering
 *
 * @param options - Configuration options for route protection
 * @returns Auth state object with user, loading, isAuthenticated, and isAdmin
 *
 * @example
 * // Basic protected route
 * function ProtectedPage() {
 *   const { user, loading } = useProtectedRoute();
 *   if (loading) return <PageLoader />;
 *   return <div>Welcome {user?.firstName}</div>;
 * }
 *
 * @example
 * // Admin-only route
 * function AdminPage() {
 *   const { user, loading, isAdmin } = useProtectedRoute({ requireAdmin: true });
 *   if (loading) return <PageLoader />;
 *   return <div>Admin Panel</div>;
 * }
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const {
    redirectTo = '/login',
    requireAdmin = false,
    adminRedirectTo = '/dashboard',
  } = options;

  const { user, isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      // First check authentication
      if (!isAuthenticated) {
        router.push(redirectTo);
      }
      // Then check admin requirement if specified
      else if (requireAdmin && !isAdmin) {
        router.push(adminRedirectTo);
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router, redirectTo, requireAdmin, adminRedirectTo]);

  return {
    user,
    isAuthenticated,
    isAdmin,
    loading: authLoading,
  };
}
