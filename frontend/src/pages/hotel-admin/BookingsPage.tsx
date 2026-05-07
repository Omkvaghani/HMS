import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency, formatDate } from "@/lib/format"

type Hotel = { id: number; name: string }
type RoomClass = { id: number; name: string; base_price: string }

type Booking = {
  id: number
  reference: string
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW"
  payment_status: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED"
  check_in_date: string
  check_out_date: string
  adults: number
  children: number
  nights: number
  grand_total: string
  amount_due: string
  currency: string
  customer?: { first_name: string; last_name: string | null; email: string | null }
  room_class?: { name: string }
  room?: { room_number: string }
}

const STATUS_LABEL: Record<Booking["status"], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
}

const STATUS_COLOR: Record<Booking["status"], string> = {
  PENDING: "bg-cream-100 text-cocoa-700",
  CONFIRMED: "bg-leaf-500/15 text-leaf-600",
  CHECKED_IN: "bg-copper-500/20 text-cocoa-700",
  CHECKED_OUT: "bg-ink/10 text-ink-soft",
  CANCELLED: "bg-rose-500/15 text-rose-600",
  NO_SHOW: "bg-rose-500/10 text-rose-600/80",
}

export default function BookingsPage() {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<"" | Booking["status"]>("")

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
    queryKey: ["hotel-admin", "bookings", hotelId, filter],
    enabled: !!hotelId,
    queryFn: async () =>
      (await api.get<{ data: Booking[] }>("/hotel-admin/bookings", {
        params: { hotel_id: hotelId, status: filter || undefined, per_page: 50 },
      })).data,
  })

  const checkIn = useMutation({
    mutationFn: (id: number) => api.post(`/hotel-admin/bookings/${id}/check-in`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "bookings"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })
  const checkOut = useMutation({
    mutationFn: (id: number) => api.post(`/hotel-admin/bookings/${id}/check-out`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "bookings"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const { today, tomorrow } = useMemo(() => {
    const t = new Date()
    const tm = new Date(t.getTime() + 86_400_000)
    return {
      today: t.toISOString().slice(0, 10),
      tomorrow: tm.toISOString().slice(0, 10),
    }
  }, [])
  const [form, setForm] = useState({
    room_class_id: "",
    check_in_date: today,
    check_out_date: tomorrow,
    adults: 2,
    children: 0,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    special_requests: "",
  })

  const create = useMutation({
    mutationFn: () =>
      api.post("/hotel-admin/bookings", {
        hotel_id: hotelId,
        room_class_id: Number(form.room_class_id),
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        adults: form.adults,
        children: form.children,
        special_requests: form.special_requests || null,
        guest: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
        },
      }),
    onSuccess: () => {
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "bookings"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="All reservations across the property. Filter, check guests in/out, and record payments."
        actions={
          <button type="button" className="btn-warm" disabled={!hotelId || classList.length === 0} onClick={() => setShowCreate(true)}>
            New booking
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s as typeof filter)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium " +
              (filter === s
                ? "bg-cocoa-800 text-cream-50"
                : "border border-cream-200 bg-white text-ink-soft hover:border-sand-400")
            }
          >
            {s ? STATUS_LABEL[s as Booking["status"]] : "All"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-soft">No bookings yet. Direct guests to your booking site or add one manually.</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Guest</th>
                <th className="px-5 py-3">Stay</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((b) => (
                <tr key={b.id} className="border-t border-cream-100">
                  <td className="px-5 py-3 font-mono text-xs text-ink-soft">{b.reference}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-cocoa-900">
                      {b.customer?.first_name ?? "Guest"} {b.customer?.last_name ?? ""}
                    </div>
                    <div className="text-xs text-ink-muted">{b.customer?.email}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
                    <div className="text-xs text-ink-muted">{b.nights} night{b.nights === 1 ? "" : "s"} · {b.adults}A {b.children}C</div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{b.room_class?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-cocoa-900">
                    {formatCurrency(b.grand_total, b.currency)}
                    <div className="text-xs text-ink-muted">{b.payment_status} · due {formatCurrency(b.amount_due, b.currency)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={"pill " + STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {b.status === "CONFIRMED" && (
                      <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => checkIn.mutate(b.id)}>
                        Check in
                      </button>
                    )}
                    {b.status === "CHECKED_IN" && (
                      <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => checkOut.mutate(b.id)}>
                        Check out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-3xl p-6">
            <h3 className="font-display text-2xl">New booking</h3>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="mt-4 grid grid-cols-2 gap-4">
              <label>
                <span className="label-warm">Room class *</span>
                <select className="input-warm" required value={form.room_class_id} onChange={(e) => setForm({ ...form, room_class_id: e.target.value })}>
                  <option value="">Select a class…</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — base {formatCurrency(c.base_price)}/night</option>
                  ))}
                </select>
              </label>
              <div />

              <label><span className="label-warm">Check-in *</span><input className="input-warm" type="date" required value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} /></label>
              <label><span className="label-warm">Check-out *</span><input className="input-warm" type="date" required value={form.check_out_date} onChange={(e) => setForm({ ...form, check_out_date: e.target.value })} /></label>
              <label><span className="label-warm">Adults</span><input className="input-warm" type="number" min={1} max={30} value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} /></label>
              <label><span className="label-warm">Children</span><input className="input-warm" type="number" min={0} max={30} value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} /></label>

              <label><span className="label-warm">Guest first name *</span><input className="input-warm" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
              <label><span className="label-warm">Guest last name</span><input className="input-warm" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
              <label><span className="label-warm">Email</span><input className="input-warm" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label><span className="label-warm">Phone</span><input className="input-warm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>

              <label className="col-span-2"><span className="label-warm">Special requests</span><textarea className="input-warm min-h-20" value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} /></label>

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-warm" disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Create booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
