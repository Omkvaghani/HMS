import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency } from "@/lib/format"
import { useHotelContext } from "@/lib/hotel-context"

type RoomClass = {
  id: number
  hotel_id: number
  name: string
  description: string | null
  max_adults: number
  max_children: number
  max_occupancy: number
  bed_count: number
  bed_type: string | null
  base_price: string
  weekend_price: string | null
  duration_prices: Record<string, string> | null
  is_active: boolean
}

const DURATION_FIELDS: Array<{ code: string; label: string }> = [
  { code: "1H", label: "1 hour" },
  { code: "2H", label: "2 hour" },
  { code: "3H", label: "3 hour" },
  { code: "12H", label: "12 hour" },
  { code: "NIGHT", label: "Single night" },
]

export default function RoomClassesPage() {
  const qc = useQueryClient()
  const { activeHotelId } = useHotelContext()
  const hotelId = activeHotelId

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "room-classes", hotelId],
    enabled: !!hotelId,
    queryFn: async () => (await api.get<{ data: RoomClass[] } | RoomClass[]>("/hotel-admin/room-classes", {
      params: { hotel_id: hotelId },
    })).data,
  })

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<RoomClass | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    max_adults: 2,
    max_children: 1,
    max_occupancy: 3,
    bed_count: 1,
    bed_type: "Queen",
    base_price: "100",
    weekend_price: "",
    duration_prices: {} as Record<string, string>,
  })

  const open = (rc?: RoomClass) => {
    setError(null)
    if (rc) {
      setEditing(rc)
      setForm({
        name: rc.name,
        description: rc.description ?? "",
        max_adults: rc.max_adults,
        max_children: rc.max_children,
        max_occupancy: rc.max_occupancy,
        bed_count: rc.bed_count,
        bed_type: rc.bed_type ?? "",
        base_price: rc.base_price,
        weekend_price: rc.weekend_price ?? "",
        duration_prices: (rc.duration_prices as Record<string, string>) ?? {},
      })
    } else {
      setEditing(null)
      setForm({
        name: "",
        description: "",
        max_adults: 2,
        max_children: 1,
        max_occupancy: 3,
        bed_count: 1,
        bed_type: "Queen",
        base_price: "100",
        weekend_price: "",
        duration_prices: {},
      })
    }
    setShowCreate(true)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        hotel_id: hotelId,
        weekend_price: form.weekend_price || null,
        duration_prices: pruneDurations(form.duration_prices),
      }
      return editing
        ? api.put(`/hotel-admin/room-classes/${editing.id}`, payload)
        : api.post("/hotel-admin/room-classes", payload)
    },
    onSuccess: () => {
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "room-classes"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader
        title="Room classes"
        subtitle="Set up room types, capacities, and base nightly rates."
        actions={
          <button type="button" className="btn-warm" disabled={!hotelId} onClick={() => open()}>
            New room class
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-soft">No room classes yet — create one to start accepting bookings.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((rc) => (
            <article key={rc.id} className="card-warm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl">{rc.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{rc.description ?? "—"}</p>
                </div>
                <span className={"pill " + (rc.is_active ? "bg-leaf-500/15 text-leaf-600" : "bg-cream-100 text-ink-muted")}>
                  {rc.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Pair label="Sleeps" value={`${rc.max_adults}A · ${rc.max_children}C (max ${rc.max_occupancy})`} />
                <Pair label="Bedding" value={`${rc.bed_count} × ${rc.bed_type ?? "—"}`} />
                <Pair label="Base / night" value={formatCurrency(rc.base_price)} />
                <Pair label="Weekend / night" value={rc.weekend_price ? formatCurrency(rc.weekend_price) : "Same"} />
              </dl>
              {rc.duration_prices && Object.keys(rc.duration_prices).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(rc.duration_prices).map(([k, v]) => (
                    <span key={k} className="pill bg-cream-100 text-cocoa-700">
                      {k}: {formatCurrency(v)}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => open(rc)}>
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-2xl p-6">
            <h3 className="font-display text-2xl">{editing ? "Edit room class" : "New room class"}</h3>
            <p className="mt-1 text-sm text-ink-soft">Set capacity, base nightly rate, and optional short-stay rates.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveMut.mutate()
              }}
              className="mt-5 grid grid-cols-2 gap-4"
            >
              <Field label="Name *">
                <input className="input-warm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Bed type">
                <input className="input-warm" value={form.bed_type} onChange={(e) => setForm({ ...form, bed_type: e.target.value })} />
              </Field>
              <Field label="Description" className="col-span-2">
                <textarea className="input-warm min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Max adults">
                <input className="input-warm" type="number" min={1} max={20} value={form.max_adults} onChange={(e) => setForm({ ...form, max_adults: Number(e.target.value) })} />
              </Field>
              <Field label="Max children">
                <input className="input-warm" type="number" min={0} max={20} value={form.max_children} onChange={(e) => setForm({ ...form, max_children: Number(e.target.value) })} />
              </Field>
              <Field label="Max occupancy">
                <input className="input-warm" type="number" min={1} max={30} value={form.max_occupancy} onChange={(e) => setForm({ ...form, max_occupancy: Number(e.target.value) })} />
              </Field>
              <Field label="Bed count">
                <input className="input-warm" type="number" min={1} max={10} value={form.bed_count} onChange={(e) => setForm({ ...form, bed_count: Number(e.target.value) })} />
              </Field>
              <Field label="Base price / night *">
                <input className="input-warm" required type="number" min={0} step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
              </Field>
              <Field label="Weekend price / night">
                <input className="input-warm" type="number" min={0} step="0.01" value={form.weekend_price} onChange={(e) => setForm({ ...form, weekend_price: e.target.value })} />
              </Field>

              <div className="col-span-2 rounded-xl border border-cream-200 p-4">
                <div className="font-medium text-cocoa-900">Short-stay & per-duration prices</div>
                <p className="mt-1 text-sm text-ink-soft">Optional. Leave blank to fall back to a percentage of the base price.</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {DURATION_FIELDS.map((d) => (
                    <label key={d.code}>
                      <span className="label-warm">{d.label}</span>
                      <input
                        className="input-warm"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.duration_prices[d.code] ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            duration_prices: { ...form.duration_prices, [d.code]: e.target.value },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2 mt-4 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={saveMut.isPending}>
                  {saveMut.isPending ? "Saving…" : editing ? "Save changes" : "Create room class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function pruneDurations(map: Record<string, string>): Record<string, number> | null {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(map)) {
    const n = Number(v)
    if (v !== "" && Number.isFinite(n) && n > 0) out[k] = n
  }
  return Object.keys(out).length ? out : null
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-cocoa-900">{value}</dd>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <span className="label-warm">{label}</span>
      {children}
    </label>
  )
}
