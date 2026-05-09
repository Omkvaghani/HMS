import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/use-auth"
import { getApiErrorMessage } from "@/lib/api"

export default function SignUpPage() {
  const { registerGuest } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await registerGuest(
        form.name,
        form.email,
        form.password,
        form.password_confirmation,
        form.phone || undefined,
      )
      navigate("/", { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, "Sign up failed."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="surface-paper grid min-h-screen place-items-center p-6">
      <div className="card-warm w-full max-w-md p-8">
        <Link to="/" className="text-sm text-ink-soft hover:text-cocoa-800">
          ← Back
        </Link>
        <h1 className="mt-4 text-3xl">Create a guest account.</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Save your details and view past stays. Hotel teams sign in with the credentials we email
          you when your application is approved.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-warm">Full name</label>
            <input className="input-warm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-warm">Email</label>
            <input className="input-warm" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-warm">Phone</label>
            <input className="input-warm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-warm">Password</label>
            <input className="input-warm" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label-warm">Confirm password</label>
            <input className="input-warm" type="password" required minLength={8} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <button className="btn-warm w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  )
}
