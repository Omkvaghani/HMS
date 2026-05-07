import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"

type Hotel = { id: number; name: string }
type RoomClass = { id: number; name: string }

type Room = {
  id: number
  room_number: string
  floor: string | null
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "OUT_OF_ORDER"
  housekeeping_status: "CLEAN" | "DIRTY" | "INSPECTED" | null
  room_class_id: number
  room_class?: { name: string; base_price: string }
}

const STATUS_COLORS: Record<Room["status"], string> = {
  AVAILABLE: "bg-leaf-500/15 text-leaf-600",
  OCCUPIED: "bg-copper-500/20 text-cocoa-700",
  CLEANING: "bg-sand-300/40 text-cocoa-800",
  MAINTENANCE: "bg-rose-500/15 text-rose-600",
  OUT_OF_ORDER: "bg-ink/10 text-ink-soft",
}

export default function RoomsPage() {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const { data: hotels } = useQuery({
    queryKey: ["hotel-admin", "hotels"],
    queryFn: async () => (await api.get<Hotel[]>("/hotel-admin/hotels")).data,
  })
  const hotelId = hotels?.[0]?.id

  const { data: classes } = useQuery({
    queryKey: ["hotel-admin", "room-classes", hotelId],
    enabled: !!hotelId,
    queryFn: async () => (await api.get<RoomClass[] | { data: RoomClass[] }>("/hotel-admin/room-classes", { params: { hotel_id: hotelId } })).data,
  })
  const classList = Array.isArray(classes) ? classes : (classes?.data ?? [])

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "rooms", hotelId],
    enabled: !!hotelId,
    queryFn: async () =>
      (await api.get<{ data: Room[] }>("/hotel-admin/rooms", { params: { hotel_id: hotelId, per_page: 200 } })).data,
  })
  const items = data?.data ?? []

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Room["status"] }) =>
      api.patch(`/hotel-admin/rooms/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "rooms"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const [form, setForm] = useState({ room_number: "", floor: "", room_class_id: "" })
  const create = useMutation({
    mutationFn: () =>
      api.post("/hotel-admin/rooms", {
        hotel_id: hotelId,
        room_number: form.room_number,
        floor: form.floor || null,
        room_class_id: Number(form.room_class_id),
      }),
    onSuccess: () => {
      setShowCreate(false)
      setForm({ room_number: "", floor: "", room_class_id: "" })
      qc.invalidateQueries({ queryKey: ["hotel-admin", "rooms"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Live room status — tap a room to update."
        actions={
          <button type="button" className="btn-warm" disabled={!hotelId || classList.length === 0} onClick={() => setShowCreate(true)}>
            New room
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-soft">No rooms yet — create a room class first, then add rooms.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((r) => (
            <div key={r.id} className="card-warm p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-2xl text-cocoa-900">{r.room_number}</div>
                {r.floor && <div className="text-xs text-ink-muted">Fl {r.floor}</div>}
              </div>
              <div className="mt-1 truncate text-xs text-ink-muted">{r.room_class?.name ?? "—"}</div>
              <span className={"pill mt-3 inline-flex " + STATUS_COLORS[r.status]}>
                {r.status.replaceAll("_", " ")}
              </span>
              <select
                className="input-warm mt-3 text-xs"
                value={r.status}
                onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value as Room["status"] })}
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_ORDER">Out of order</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-md p-6">
            <h3 className="font-display text-2xl">New room</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                create.mutate()
              }}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <label>
                <span className="label-warm">Room number *</span>
                <input className="input-warm" required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
              </label>
              <label>
                <span className="label-warm">Floor</span>
                <input className="input-warm" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </label>
              <label className="col-span-2">
                <span className="label-warm">Room class *</span>
                <select className="input-warm" required value={form.room_class_id} onChange={(e) => setForm({ ...form, room_class_id: e.target.value })}>
                  <option value="">Choose a class…</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <div className="col-span-2 mt-4 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-warm" disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Create room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
