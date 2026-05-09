import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import MarketingHeader from "@/components/MarketingHeader"
import { CheckCircle2 } from "lucide-react"

type Pkg = { id: number; name: string; monthly_price: string; currency: string }

export default function OnboardingApplyPage() {
  const { data: packages } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => (await api.get<Pkg[]>("/packages")).data,
  })

  const [form, setForm] = useState({
    hotel_name: "",
    legal_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    country: "",
    city: "",
    desired_subdomain: "",
    package_id: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post("/onboarding-requests", {
        ...form,
        desired_subdomain: form.desired_subdomain.toLowerCase(),
        package_id: form.package_id ? Number(form.package_id) : null,
        country: form.country ? form.country.toUpperCase().slice(0, 2) : null,
      })
      setDone(true)
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit application."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="surface-paper relative min-h-screen pb-24">
      <MarketingHeader />

      <div className="mx-auto max-w-3xl px-6 pt-32">
        {done ? (
          <div className="card-warm flex flex-col items-center p-12 text-center">
            <CheckCircle2 className="size-12 text-leaf-600" />
            <h1 className="mt-6 text-3xl">Application received.</h1>
            <p className="mt-3 text-ink-soft">
              Thank you. Our team is reviewing your request and will reach out at{" "}
              <strong className="text-cocoa-800">{form.contact_email}</strong> within 1–2 business
              days.
            </p>
            <Link to="/" className="btn-warm mt-8">
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-balance text-4xl">List your hotel on Hospes.</h1>
            <p className="mt-3 text-ink-soft">
              Tell us about your property. We will provision a private database, set up your
              admin account, and email you a sign-in link.
            </p>

            <form onSubmit={onSubmit} className="card-warm mt-10 grid gap-6 p-8 md:grid-cols-2">
              <Field label="Hotel name *" required>
                <input className="input-warm" required value={form.hotel_name} onChange={update("hotel_name")} />
              </Field>
              <Field label="Legal entity">
                <input className="input-warm" value={form.legal_name} onChange={update("legal_name")} />
              </Field>

              <Field label="Your name *" required>
                <input className="input-warm" required value={form.contact_name} onChange={update("contact_name")} />
              </Field>
              <Field label="Work email *" required>
                <input className="input-warm" required type="email" value={form.contact_email} onChange={update("contact_email")} />
              </Field>

              <Field label="Phone">
                <input className="input-warm" value={form.contact_phone} onChange={update("contact_phone")} />
              </Field>
              <Field label="Country (ISO-2)">
                <input className="input-warm" maxLength={2} placeholder="US" value={form.country} onChange={update("country")} />
              </Field>

              <Field label="City">
                <input className="input-warm" value={form.city} onChange={update("city")} />
              </Field>
              <Field label="Desired subdomain *" required help="lowercase letters, numbers, hyphens">
                <div className="flex items-center">
                  <input
                    className="input-warm rounded-r-none"
                    pattern="[a-z0-9-]+"
                    required
                    value={form.desired_subdomain}
                    onChange={update("desired_subdomain")}
                  />
                  <span className="rounded-r-[10px] border border-l-0 border-cream-200 bg-cream-50 px-3 py-[10px] text-sm text-ink-muted">
                    .hospes.app
                  </span>
                </div>
              </Field>

              <Field label="Plan">
                <select className="input-warm" value={form.package_id} onChange={update("package_id")}>
                  <option value="">Decide later</option>
                  {(packages ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.monthly_price} {p.currency}/mo
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Anything else we should know?" className="md:col-span-2">
                <textarea
                  className="input-warm min-h-24"
                  value={form.message}
                  onChange={update("message")}
                />
              </Field>

              {error && (
                <div className="md:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex items-center justify-between">
                <Link to="/" className="text-sm text-ink-soft hover:text-cocoa-800">
                  ← Back
                </Link>
                <button className="btn-warm" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit application"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  className,
  help,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  className?: string
  help?: string
}) {
  return (
    <label className={className}>
      <span className="label-warm">
        {label}
        {required ? "" : ""}
      </span>
      {children}
      {help && <span className="mt-1 block text-xs text-ink-muted">{help}</span>}
    </label>
  )
}
