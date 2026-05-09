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
      <div className="min-h-screen grid place-items-center text-ink-soft">
        Loading…
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
