import { Link } from "react-router-dom"
import { useAuth } from "@/lib/use-auth"

export default function MarketingHeader() {
  const { user } = useAuth()
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-cocoa-900">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cocoa-800 text-cream-50 font-display text-lg">
            H
          </span>
          <span className="font-display text-xl tracking-tight">Hospes</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-ink-soft md:flex">
          <a href="#features" className="hover:text-cocoa-800">Platform</a>
          <a href="#packages" className="hover:text-cocoa-800">Pricing</a>
          <a href="#story" className="hover:text-cocoa-800">Story</a>
        </nav>
        <div className="flex items-center gap-3">
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
              <Link to="/sign-in" className="text-sm text-ink-soft hover:text-cocoa-800">
                Sign in
              </Link>
              <Link to="/apply" className="btn-warm text-sm">
                List your hotel
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
