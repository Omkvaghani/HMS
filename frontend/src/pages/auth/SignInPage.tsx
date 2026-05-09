import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/use-auth"
import { getApiErrorMessage } from "@/lib/api"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state: { from?: { pathname: string } } }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await login(email, password)
      const nextPath =
        location.state?.from?.pathname ??
        (user.role === "SUPER_ADMIN"
          ? "/super-admin"
          : user.role === "HOTEL_ADMIN" || user.role === "STAFF"
            ? "/hotel-admin"
            : "/")
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, "Sign in failed."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="surface-paper grid min-h-screen md:grid-cols-2">
      <div className="hidden md:block">
        <div className="relative h-full w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=70"
            alt="Hotel hallway"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-cocoa-900/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-cream-50">
            <span className="font-display text-3xl">Hospes</span>
            <p className="mt-2 max-w-sm text-cream-100/85">
              The hospitality OS. Calm, warm, and quietly powerful.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-ink-soft hover:text-cocoa-800">
            ← Back
          </Link>
          <h1 className="mt-6 text-3xl">Welcome back.</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage your property.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label-warm">Email</label>
              <input
                className="input-warm"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-warm">Password</label>
              <input
                className="input-warm"
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button className="btn-warm w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-soft">
            Want to list your hotel?{" "}
            <Link to="/apply" className="font-medium text-cocoa-800 hover:underline">
              Apply for an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
