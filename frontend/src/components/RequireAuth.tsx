import { Navigate, useLocation } from "react-router-dom"
import { type Role } from "@/lib/auth-context"
import { useAuth } from "@/lib/use-auth"

export default function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Role[]
}) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <span className="text-sm text-ink-muted">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    const fallback =
      user.role === "SUPER_ADMIN"
        ? "/super-admin"
        : user.role === "HOTEL_ADMIN" || user.role === "STAFF"
          ? "/hotel-admin"
          : "/"
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
