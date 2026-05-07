import { NavLink, Outlet, Link, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useAuth } from "@/lib/use-auth"
import { cn } from "@/lib/cn"

export type AdminNavItem = {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

export default function AdminShell({
  brandName,
  brandSubtitle,
  nav,
}: {
  brandName: string
  brandSubtitle?: string
  nav: AdminNavItem[]
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-cream-50">
      <aside className="flex flex-col border-r border-cream-200 bg-white px-4 py-6">
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cocoa-800 text-cream-50 font-display">
            H
          </span>
          <div>
            <div className="font-display text-lg leading-none text-cocoa-900">{brandName}</div>
            {brandSubtitle && (
              <div className="mt-1 text-xs text-ink-muted">{brandSubtitle}</div>
            )}
          </div>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-cocoa-800 text-cream-50"
                    : "text-ink-soft hover:bg-cream-100 hover:text-cocoa-900",
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-3">
          <div className="text-sm font-medium text-cocoa-900">{user?.name}</div>
          <div className="truncate text-xs text-ink-muted">{user?.email}</div>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate("/sign-in", { replace: true })
            }}
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-cocoa-800 hover:underline"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
