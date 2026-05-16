import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/lib/use-auth"

export default function MarketingHeader() {
  const { user } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white text-sm font-semibold">
            H
          </span>
          <span className="text-xl font-semibold tracking-tight">Hospes</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-ink-secondary md:flex">
          <a href="#features" className="hover:text-ink transition-colors">Platform</a>
          <a href="#packages" className="hover:text-ink transition-colors">Pricing</a>
          <a href="#story" className="hover:text-ink transition-colors">Story</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              to={
                user.role === "SUPER_ADMIN"
                  ? "/super-admin"
                  : user.role === "HOTEL_ADMIN" || user.role === "STAFF"
                    ? "/hotel-admin"
                    : "/"
              }
              className="btn-warm text-sm"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/sign-in" className="text-sm text-ink-secondary hover:text-ink transition-colors">
                Sign in
              </Link>
              <Link to="/apply" className="btn-warm text-sm">
                List your hotel
              </Link>
            </>
          )}
        </div>
        <button type="button" className="md:hidden text-ink-secondary hover:text-ink" onClick={() => setMobileNav((o) => !o)}>
          {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {mobileNav && (
        <div className="border-t border-border bg-surface px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-ink-secondary">
            <a href="#features" className="hover:text-ink" onClick={() => setMobileNav(false)}>Platform</a>
            <a href="#packages" className="hover:text-ink" onClick={() => setMobileNav(false)}>Pricing</a>
            <a href="#story" className="hover:text-ink" onClick={() => setMobileNav(false)}>Story</a>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <Link
                to={
                  user.role === "SUPER_ADMIN"
                    ? "/super-admin"
                    : user.role === "HOTEL_ADMIN" || user.role === "STAFF"
                      ? "/hotel-admin"
                      : "/"
                }
                className="btn-warm text-sm text-center"
                onClick={() => setMobileNav(false)}
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className="text-sm text-ink-secondary hover:text-ink" onClick={() => setMobileNav(false)}>
                  Sign in
                </Link>
                <Link to="/apply" className="btn-warm text-sm text-center" onClick={() => setMobileNav(false)}>
                  List your hotel
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
