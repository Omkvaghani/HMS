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
    <div className="grid min-h-screen bg-surface-secondary md:grid-cols-2">
      <div className="hidden md:block">
        <div className="relative h-full w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=70"
            alt="Hotel hallway"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/50" />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-white">
            <span className="text-3xl font-semibold">Hospes</span>
            <p className="mt-2 max-w-sm text-gray-300">
              The hospitality OS. Clean, modern, and quietly powerful.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-ink-secondary hover:text-ink transition-colors">
            ← Back
          </Link>
          <h1 className="mt-6 text-2xl sm:text-3xl font-semibold text-ink">Welcome back.</h1>
          <p className="mt-1 text-sm text-ink-secondary">Sign in to manage your property.</p>

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
              <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">
                {error}
              </div>
            )}

            <button className="btn-warm w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-secondary">
            Want to list your hotel?{" "}
            <Link to="/apply" className="font-medium text-primary-600 hover:text-primary-700">
              Apply for an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
