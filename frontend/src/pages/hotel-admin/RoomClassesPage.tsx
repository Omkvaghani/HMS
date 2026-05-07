import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency } from "@/lib/format"

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
  is_active: boolean
}

type Hotel = { id: number; name: string }

export default function RoomClassesPage() {
  const qc = useQueryClient()
  const { data: hotels } = useQuery({
    queryKey: ["hotel-admin", "hotels"],
    queryFn: async () => (await api.get<Hotel[]>("/hotel-admin/hotels")).data,
  })
  const hotelId = hotels?.[0]?.id

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
  })

  const createMut = useMutation({
    mutationFn: () =>
      api.post("/hotel-admin/room-classes", {
        ...form,
        hotel_id: hotelId,
        weekend_price: form.weekend_price || null,
      }),
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
          <button type="button" className="btn-warm" disabled={!hotelId} onClick={() => setShowCreate(true)}>
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
            </article>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-2xl p-6">
            <h3 className="font-display text-2xl">New room class</h3>
            <p className="mt-1 text-sm text-ink-soft">Define a room type. You can add individual rooms after.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMut.mutate()
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

              <div className="col-span-2 mt-4 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={createMut.isPending}>
                  {createMut.isPending ? "Saving…" : "Create room class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
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
