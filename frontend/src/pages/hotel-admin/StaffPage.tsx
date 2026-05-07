import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import { useHotelContext } from "@/lib/hotel-context"
import PageHeader from "@/components/PageHeader"
import { formatCurrency } from "@/lib/format"

type Staff = {
  id: number
  hotel_id: number
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  job_title: string | null
  department: string | null
  hired_at: string | null
  monthly_salary: string
  currency: string
  is_active: boolean
  hotel?: { id: number; name: string }
}

type StaffForm = {
  hotel_id?: number
  first_name: string
  last_name: string
  email: string
  phone: string
  job_title: string
  department: string
  hired_at: string
  monthly_salary: string
  currency: string
  is_active: boolean
}

const EMPTY: StaffForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  department: "",
  hired_at: "",
  monthly_salary: "",
  currency: "USD",
  is_active: true,
}

export default function StaffPage() {
  const qc = useQueryClient()
  const { activeHotelId, activeHotel } = useHotelContext()
  const [editing, setEditing] = useState<Staff | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<StaffForm>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "staff", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<{ data: Staff[] }>("/hotel-admin/staff", { params: { hotel_id: activeHotelId, per_page: 100 } })).data,
  })

  const open = (s?: Staff) => {
    setError(null)
    if (s) {
      setEditing(s)
      setForm({
        hotel_id: s.hotel_id,
        first_name: s.first_name,
        last_name: s.last_name ?? "",
        email: s.email,
        phone: s.phone ?? "",
        job_title: s.job_title ?? "",
        department: s.department ?? "",
        hired_at: s.hired_at ?? "",
        monthly_salary: s.monthly_salary ?? "",
        currency: s.currency ?? "USD",
        is_active: s.is_active,
      })
    } else {
      setEditing(null)
      setForm({ ...EMPTY, hotel_id: activeHotelId ?? undefined })
    }
    setShowForm(true)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        hotel_id: editing?.hotel_id ?? activeHotelId,
        hired_at: form.hired_at || null,
        monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : 0,
      }
      return editing
        ? api.put(`/hotel-admin/staff/${editing.id}`, payload)
        : api.post("/hotel-admin/staff", payload)
    },
    onSuccess: () => {
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "staff"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/hotel-admin/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "staff"] }),
  })

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle={
          activeHotel
            ? `Roster, payroll basics, and roles for ${activeHotel.name}.`
            : "Manage your team — staff are scoped to the active hotel."
        }
        actions={
          <button type="button" className="btn-warm" disabled={!activeHotelId} onClick={() => open()}>
            New staff member
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-soft">No staff yet for this hotel. Add receptionists, housekeeping, managers…</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Salary</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-cream-100">
                  <td className="px-5 py-3">
                    <div className="font-medium text-cocoa-900">
                      {s.first_name} {s.last_name ?? ""}
                    </div>
                    {s.hotel && <div className="text-xs text-ink-muted">{s.hotel.name}</div>}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {s.job_title || "—"}
                    <div className="text-xs text-ink-muted">{s.department || ""}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    <div>{s.email}</div>
                    <div className="text-xs text-ink-muted">{s.phone || ""}</div>
                  </td>
                  <td className="px-5 py-3 text-cocoa-900">
                    {Number(s.monthly_salary) > 0 ? `${formatCurrency(s.monthly_salary, s.currency)} / mo` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "pill " + (s.is_active ? "bg-leaf-500/15 text-leaf-600" : "bg-cream-100 text-ink-muted")
                      }
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => open(s)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-sm font-medium text-rose-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Remove ${s.first_name}?`)) remove.mutate(s.id)
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

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-2xl p-6">
            <h3 className="font-display text-2xl">{editing ? "Edit staff member" : "New staff member"}</h3>
            <form
              className="mt-5 grid grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                save.mutate()
              }}
            >
              <Field label="First name *">
                <input className="input-warm" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </Field>
              <Field label="Last name">
                <input className="input-warm" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </Field>
              <Field label="Email *">
                <input className="input-warm" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input-warm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Job title">
                <input className="input-warm" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              </Field>
              <Field label="Department">
                <input className="input-warm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </Field>
              <Field label="Hired at">
                <input className="input-warm" type="date" value={form.hired_at} onChange={(e) => setForm({ ...form, hired_at: e.target.value })} />
              </Field>
              <Field label="Monthly salary">
                <input className="input-warm" type="number" min={0} step="0.01" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} />
              </Field>
              <Field label="Currency">
                <input className="input-warm" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span>Active</span>
              </label>

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Add staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="label-warm">{label}</span>
      {children}
    </label>
  )
}
