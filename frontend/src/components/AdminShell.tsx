import { useState } from "react"
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom"
import { Building2, Check, ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react"
import { useAuth } from "@/lib/use-auth"
import { useTheme } from "@/lib/theme-context"
import { useHotelContext } from "@/lib/hotel-context"
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
  showHotelSwitcher = false,
}: {
  brandName: string
  brandSubtitle?: string
  nav: AdminNavItem[]
  showHotelSwitcher?: boolean
}) {
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-cream-50 text-ink">
      <aside className="surface-side flex flex-col border-r border-cream-200 px-4 py-6">
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

        {showHotelSwitcher && <HotelSwitcher />}

        <nav className="mt-6 flex flex-1 flex-col gap-1">
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

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-2 inline-flex items-center justify-between gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm text-ink-soft hover:border-sand-400 hover:text-cocoa-900"
        >
          <span className="inline-flex items-center gap-2">
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {theme === "dark" ? "Dark" : "Light"} theme
          </span>
          <span className="text-xs text-ink-muted">Switch</span>
        </button>

        <div className="mt-3 rounded-xl border border-cream-200 bg-cream-50 p-3">
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

function HotelSwitcher() {
  const { hotels, activeHotel, setActiveHotelId, isLoading } = useHotelContext()
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-cream-200 px-3 py-2 text-xs text-ink-muted">
        Loading hotels…
      </div>
    )
  }

  if (!hotels.length) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-cream-200 px-3 py-2 text-xs text-ink-muted">
        Add a hotel to get started.
      </div>
    )
  }

  return (
    <div className="relative mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-cream-200 px-3 py-2 text-left hover:border-sand-400"
      >
        <span className="inline-flex items-center gap-2 text-sm">
          <Building2 className="size-4 text-copper-500" />
          <span className="font-medium text-cocoa-900">{activeHotel?.name ?? "Select hotel"}</span>
        </span>
        <ChevronsUpDown className="size-4 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-cream-200 bg-[var(--color-surface,white)] py-1 shadow-lg">
          {hotels.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setActiveHotelId(h.id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-cream-100",
                h.id === activeHotel?.id ? "text-cocoa-900" : "text-ink-soft",
              )}
            >
              <span>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-ink-muted">{h.city ?? h.slug}</div>
              </span>
              {h.id === activeHotel?.id && <Check className="size-4 text-leaf-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
