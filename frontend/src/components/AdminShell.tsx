import { useState } from "react"
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom"
import { Building2, Check, ChevronsUpDown, LogOut, Menu, Monitor, Moon, Sun, X } from "lucide-react"
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

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  "super-dark": Monitor,
} as const

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  "super-dark": "Super Dark",
} as const

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const ThemeIcon = THEME_ICONS[theme]

  const sidebar = (
    <>
      <Link to="/" className="flex items-center gap-3 px-2" onClick={() => setMobileOpen(false)}>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white text-sm font-semibold">
          H
        </span>
        <div>
          <div className="text-base font-semibold leading-none text-ink">{brandName}</div>
          {brandSubtitle && (
            <div className="mt-1 text-xs text-ink-muted">{brandSubtitle}</div>
          )}
        </div>
      </Link>

      {showHotelSwitcher && <HotelSwitcher />}

      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-ink-secondary hover:bg-surface-tertiary hover:text-ink",
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
        className="mt-2 inline-flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink-secondary hover:border-border-strong hover:text-ink transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <ThemeIcon className="size-4" />
          {THEME_LABELS[theme]}
        </span>
        <span className="text-xs text-ink-muted">Toggle</span>
      </button>

      <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-3">
        <div className="text-sm font-medium text-ink">{user?.name}</div>
        <div className="truncate text-xs text-ink-muted">{user?.email}</div>
        <button
          type="button"
          onClick={async () => {
            await logout()
            navigate("/sign-in", { replace: true })
          }}
          className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-danger-600 hover:text-danger-700"
        >
          <LogOut className="size-3.5" /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-surface-secondary text-ink">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} className="text-ink-secondary hover:text-ink">
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold text-ink">{brandName}</span>
        <button type="button" onClick={toggleTheme} className="text-ink-secondary hover:text-ink">
          <ThemeIcon className="size-5" />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface px-4 py-6 shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 text-ink-muted hover:text-ink"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-surface lg:px-4 lg:py-6 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          {sidebar}
        </aside>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function HotelSwitcher() {
  const { hotels, activeHotel, setActiveHotelId, isLoading } = useHotelContext()
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="mt-6 rounded-lg border border-border px-3 py-2 text-xs text-ink-muted">
        Loading hotels…
      </div>
    )
  }

  if (!hotels.length) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-ink-muted">
        Add a hotel to get started.
      </div>
    )
  }

  return (
    <div className="relative mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left hover:border-border-strong transition-colors"
      >
        <span className="inline-flex items-center gap-2 text-sm">
          <Building2 className="size-4 text-primary-500" />
          <span className="font-medium text-ink">{activeHotel?.name ?? "Select hotel"}</span>
        </span>
        <ChevronsUpDown className="size-4 text-ink-muted" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
          {hotels.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setActiveHotelId(h.id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-tertiary transition-colors",
                h.id === activeHotel?.id ? "text-ink" : "text-ink-secondary",
              )}
            >
              <span>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-ink-muted">{h.city ?? h.slug}</div>
              </span>
              {h.id === activeHotel?.id && <Check className="size-4 text-success-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
