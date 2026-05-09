import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency } from "@/lib/format"

type Pkg = {
  id: number
  name: string
  slug: string
  description: string | null
  monthly_price: string
  yearly_price: string | null
  currency: string
  max_hotels: number
  max_rooms: number
  max_staff: number
  features: string[] | null
  is_public: boolean
  is_active: boolean
  sort_order: number
}

type Form = {
  name: string
  slug: string
  description: string
  monthly_price: string
  yearly_price: string
  currency: string
  max_hotels: number
  max_rooms: number
  max_staff: number
  features: string
  is_public: boolean
  is_active: boolean
  sort_order: number
}

const EMPTY_FORM: Form = {
  name: "",
  slug: "",
  description: "",
  monthly_price: "0",
  yearly_price: "",
  currency: "USD",
  max_hotels: 1,
  max_rooms: 25,
  max_staff: 10,
  features: "",
  is_public: true,
  is_active: true,
  sort_order: 0,
}

export default function PackagesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Pkg | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "packages"],
    queryFn: async () => (await api.get<{ data: Pkg[] }>("/super-admin/packages")).data,
  })

  const open = (p?: Pkg) => {
    setError(null)
    if (p) {
      setEditing(p)
      setForm({
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        monthly_price: p.monthly_price,
        yearly_price: p.yearly_price ?? "",
        currency: p.currency,
        max_hotels: p.max_hotels,
        max_rooms: p.max_rooms,
        max_staff: p.max_staff,
        features: (p.features ?? []).join("\n"),
        is_public: p.is_public,
        is_active: p.is_active,
        sort_order: p.sort_order ?? 0,
      })
    } else {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
    setShowModal(true)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        description: form.description || null,
        yearly_price: form.yearly_price || null,
        features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      }
      return editing
        ? api.put(`/super-admin/packages/${editing.id}`, payload)
        : api.post("/super-admin/packages", payload)
    },
    onSuccess: () => {
      setShowModal(false)
      qc.invalidateQueries({ queryKey: ["super-admin", "packages"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/super-admin/packages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-admin", "packages"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="SaaS subscription tiers shown on the public marketing site."
        actions={
          <button type="button" className="btn-warm" onClick={() => open()}>
            New package
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Monthly</th>
                <th className="px-5 py-3">Yearly</th>
                <th className="px-5 py-3">Limits</th>
                <th className="px-5 py-3">Visibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-cream-100">
                  <td className="px-5 py-3">
                    <div className="font-medium text-cocoa-900">{p.name}</div>
                    <div className="text-xs text-ink-muted">{p.slug}</div>
                  </td>
                  <td className="px-5 py-3 text-cocoa-900">
                    {formatCurrency(p.monthly_price, p.currency)}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {p.yearly_price ? formatCurrency(p.yearly_price, p.currency) : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    <span className="font-medium text-cocoa-900">{p.max_hotels}</span> hotels ·{" "}
                    <span className="font-medium text-cocoa-900">{p.max_rooms}</span> rooms ·{" "}
                    <span className="font-medium text-cocoa-900">{p.max_staff}</span> staff
                  </td>
                  <td className="px-5 py-3">
                    <span className={"pill " + (p.is_public ? "bg-leaf-500/15 text-leaf-600" : "bg-cream-100 text-ink-muted")}>
                      {p.is_public ? "Public" : "Internal"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => open(p)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-sm font-medium text-rose-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Delete package "${p.name}"?`)) remove.mutate(p.id)
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-3xl p-6">
            <h3 className="font-display text-2xl">{editing ? "Edit package" : "New package"}</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Set pricing and limits. The hotel limit caps how many properties a tenant on this plan can run.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
              className="mt-5 grid grid-cols-2 gap-4"
            >
              <label>
                <span className="label-warm">Name *</span>
                <input className="input-warm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                <span className="label-warm">Slug</span>
                <input className="input-warm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
              </label>

              <label className="col-span-2">
                <span className="label-warm">Description</span>
                <textarea className="input-warm min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <label>
                <span className="label-warm">Monthly price *</span>
                <input className="input-warm" type="number" min={0} step="0.01" required value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
              </label>
              <label>
                <span className="label-warm">Yearly price</span>
                <input className="input-warm" type="number" min={0} step="0.01" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} />
              </label>

              <label>
                <span className="label-warm">Currency</span>
                <input className="input-warm" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </label>
              <label>
                <span className="label-warm">Sort order</span>
                <input className="input-warm" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </label>

              <label>
                <span className="label-warm">Max hotels *</span>
                <input className="input-warm" type="number" min={1} required value={form.max_hotels} onChange={(e) => setForm({ ...form, max_hotels: Number(e.target.value) })} />
              </label>
              <label>
                <span className="label-warm">Max rooms *</span>
                <input className="input-warm" type="number" min={1} required value={form.max_rooms} onChange={(e) => setForm({ ...form, max_rooms: Number(e.target.value) })} />
              </label>
              <label>
                <span className="label-warm">Max staff *</span>
                <input className="input-warm" type="number" min={1} required value={form.max_staff} onChange={(e) => setForm({ ...form, max_staff: Number(e.target.value) })} />
              </label>
              <div />

              <label className="col-span-2">
                <span className="label-warm">Features (one per line)</span>
                <textarea className="input-warm min-h-24" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Booking engine\nMulti-property\nHousekeeping"} />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                Show on public pricing page
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (available for new signups)
              </label>

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Create package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
