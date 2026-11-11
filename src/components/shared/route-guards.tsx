import { AccessDenied } from "@/components/shared/access-denied";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts";
import { hasAnyRole } from "@/utils/roles";
import { Navigate, Outlet, useLocation } from "react-router";

interface RedirectState {
  from?: string;
}

function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-gray-900">
      <Spinner className="size-8 text-brand-500" />
    </div>
  );
}

/** Renders child routes only for signed-in users; otherwise redirects to /signin. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;

  if (status === "unauthenticated") {
    const state: RedirectState = {
      from: `${location.pathname}${location.search}${location.hash}`,
    };
    return <Navigate to="/signin" replace state={state} />;
  }

  return <Outlet />;
}

/**
 * Renders child routes only when the signed-in user has one of `roles`;
 * otherwise shows an access-denied message inside the current layout.
 * Use inside `ProtectedRoute`.
 */
export function RoleRoute({ roles }: { roles: readonly string[] }) {
  const { user } = useAuth();
  if (!hasAnyRole(user?.roles, roles)) return <AccessDenied />;
  return <Outlet />;
}

/** Renders child routes only for signed-out users; otherwise returns them where they came from. */
export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;

  if (status === "authenticated") {
    const from = (location.state as RedirectState | null)?.from;
    const target = from?.startsWith("/") && !from.startsWith("//") ? from : "/";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
