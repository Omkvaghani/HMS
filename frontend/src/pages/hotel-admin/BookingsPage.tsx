import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency, formatDate } from "@/lib/format"
import { useHotelContext } from "@/lib/hotel-context"

type RoomClass = { id: number; name: string; base_price: string; duration_prices?: Record<string, string> | null }

type Booking = {
  id: number
  reference: string
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW"
  payment_status: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED"
  booking_type?: "OFFLINE" | "ONLINE" | "ADVANCE"
  duration_type?: string
  duration_hours?: number | null
  check_in_date: string
  check_out_date: string
  booked_for_date?: string | null
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
  PENDING: "bg-surface-tertiary text-ink-secondary",
  CONFIRMED: "bg-success-50 text-success-600",
  CHECKED_IN: "bg-primary-100 text-primary-700",
  CHECKED_OUT: "bg-gray-200 text-ink-secondary",
  CANCELLED: "bg-danger-50 text-danger-600",
  NO_SHOW: "bg-danger-50 text-danger-600",
}

const DURATION_LABELS: Record<string, string> = {
  "1H": "1 hour stay",
  "2H": "2 hour stay",
  "3H": "3 hour stay",
  "12H": "12 hour stay",
  NIGHT: "Night stay",
  DAY: "Day(s)",
}

type SettingsResponse = {
  settings: {
    enabled_duration_types?: string[]
    default_next_day_checkout_time?: string
    advance_booking_max_days?: number
  }
}

export default function BookingsPage() {
  const qc = useQueryClient()
  const { activeHotelId } = useHotelContext()
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<"" | Booking["status"]>("")

  const { data: classes } = useQuery({
    queryKey: ["hotel-admin", "room-classes", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<RoomClass[] | { data: RoomClass[] }>("/hotel-admin/room-classes", { params: { hotel_id: activeHotelId } })).data,
  })
  const classList = Array.isArray(classes) ? classes : (classes?.data ?? [])

  const { data: settings } = useQuery({
    queryKey: ["hotel-admin", "settings", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<SettingsResponse>(`/hotel-admin/hotels/${activeHotelId}/settings`)).data,
  })
  const enabledDurations = settings?.settings.enabled_duration_types ?? ["1H", "2H", "3H", "12H", "NIGHT", "DAY"]
  const nextDayTime = settings?.settings.default_next_day_checkout_time ?? "11:00"

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "bookings", activeHotelId, filter],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<{ data: Booking[] }>("/hotel-admin/bookings", {
        params: { hotel_id: activeHotelId, status: filter || undefined, per_page: 50 },
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
    booking_type: "OFFLINE" as "OFFLINE" | "ONLINE" | "ADVANCE",
    duration_type: "DAY" as "1H" | "2H" | "3H" | "12H" | "NIGHT" | "DAY",
    check_in_date: today,
    check_out_date: tomorrow,
    booked_for_date: "",
    adults: 2,
    children: 0,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    special_requests: "",
  })

  // The effective check-out date depends on duration_type — for short stays
  // we use the check-in date itself, for NIGHT it's the next day. We compute
  // it inline rather than syncing with an effect.
  const effectiveCheckOut = (() => {
    if (form.duration_type === "DAY") return form.check_out_date
    if (form.duration_type === "NIGHT") {
      const next = new Date(form.check_in_date)
      next.setDate(next.getDate() + 1)
      return next.toISOString().slice(0, 10)
    }
    return form.check_in_date
  })()

  const create = useMutation({
    mutationFn: () =>
      api.post("/hotel-admin/bookings", {
        hotel_id: activeHotelId,
        room_class_id: Number(form.room_class_id),
        booking_type: form.booking_type,
        duration_type: form.duration_type,
        check_in_date: form.check_in_date,
        check_out_date: effectiveCheckOut,
        booked_for_date: form.booking_type === "ADVANCE" ? form.booked_for_date || null : null,
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

  const selectedClass = classList.find((c) => String(c.id) === form.room_class_id)
  const previewPrice =
    form.duration_type === "DAY"
      ? null
      : selectedClass?.duration_prices?.[form.duration_type] ??
        (selectedClass ? Number(selectedClass.base_price) * fallbackMultiplier(form.duration_type) : null)

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Reservations across the property — offline, online, and advance bookings."
        actions={
          <button type="button" className="btn-warm" disabled={!activeHotelId || classList.length === 0} onClick={() => setShowCreate(true)}>
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
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors " +
              (filter === s
                ? "bg-primary-600 text-white"
                : "border border-border text-ink-secondary hover:border-border-strong bg-surface")
            }
          >
            {s ? STATUS_LABEL[s as Booking["status"]] : "All"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">{error}</div>
      )}

      {isLoading ? (
        <div className="text-ink-secondary">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-secondary">No bookings yet. Direct guests to your booking site or add one manually.</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tertiary text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Guest</th>
                <th className="px-5 py-3">Stay</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-5 py-3 font-mono text-xs text-ink-secondary">{b.reference}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">
                      {b.customer?.first_name ?? "Guest"} {b.customer?.last_name ?? ""}
                    </div>
                    <div className="text-xs text-ink-muted">{b.customer?.email}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">
                    {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
                    <div className="text-xs text-ink-muted">
                      {b.duration_type ? DURATION_LABELS[b.duration_type] ?? b.duration_type : `${b.nights} night${b.nights === 1 ? "" : "s"}`} · {b.adults}A {b.children}C
                    </div>
                    {b.booked_for_date && (
                      <div className="text-xs text-primary-500">Booked for {formatDate(b.booked_for_date)}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">
                    <span className="pill bg-surface-tertiary text-ink-secondary">{b.booking_type ?? "OFFLINE"}</span>
                    <div className="mt-1 text-xs text-ink-muted">{b.room_class?.name ?? ""}</div>
                  </td>
                  <td className="px-5 py-3 text-ink">
                    {formatCurrency(b.grand_total, b.currency)}
                    <div className="text-xs text-ink-muted">{b.payment_status} · due {formatCurrency(b.amount_due, b.currency)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={"pill " + STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                      <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => checkIn.mutate(b.id)}>
                        Check in
                      </button>
                    )}
                    {b.status === "CHECKED_IN" && (
                      <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => checkOut.mutate(b.id)}>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="card-warm w-full max-w-3xl p-6">
            <h3 className="text-xl font-semibold">New booking</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["OFFLINE", "ONLINE", "ADVANCE"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, booking_type: t })}
                  className={
                    "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors " +
                    (form.booking_type === t
                      ? "bg-primary-600 text-white"
                      : "border border-border text-ink-secondary hover:border-border-strong")
                  }
                >
                  {t === "OFFLINE" ? "Offline / Walk-in" : t === "ONLINE" ? "Online" : "Advance reservation"}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {enabledDurations.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setForm({ ...form, duration_type: d as typeof form.duration_type })}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium " +
                    (form.duration_type === d
                      ? "bg-primary-600 text-white"
                      : "border border-border text-ink-secondary hover:border-border-strong")
                  }
                >
                  {DURATION_LABELS[d] ?? d}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="mt-4 grid grid-cols-2 gap-4">
              <label className="col-span-2">
                <span className="label-warm">Room class *</span>
                <select className="input-warm" required value={form.room_class_id} onChange={(e) => setForm({ ...form, room_class_id: e.target.value })}>
                  <option value="">Select a class…</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — base {formatCurrency(c.base_price)}/night
                    </option>
                  ))}
                </select>
                {previewPrice != null && (
                  <span className="mt-1 block text-xs text-primary-500">
                    Estimated price for {DURATION_LABELS[form.duration_type]}: {formatCurrency(previewPrice)}
                  </span>
                )}
              </label>

              <label>
                <span className="label-warm">{form.duration_type === "DAY" ? "Check-in *" : "Stay date *"}</span>
                <input className="input-warm" type="date" required value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} />
              </label>
              <label>
                <span className="label-warm">{form.duration_type === "DAY" ? "Check-out *" : "End date"}</span>
                <input
                  className="input-warm"
                  type="date"
                  required
                  value={form.duration_type === "DAY" ? form.check_out_date : effectiveCheckOut}
                  disabled={form.duration_type !== "DAY"}
                  onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                />
                {form.duration_type === "NIGHT" && (
                  <span className="mt-1 block text-xs text-ink-muted">Default checkout next day at {nextDayTime}</span>
                )}
              </label>

              {form.booking_type === "ADVANCE" && (
                <label className="col-span-2">
                  <span className="label-warm">Booked for (future arrival date) *</span>
                  <input className="input-warm" type="date" required value={form.booked_for_date} onChange={(e) => setForm({ ...form, booked_for_date: e.target.value })} />
                </label>
              )}

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

function fallbackMultiplier(d: string): number {
  switch (d) {
    case "1H":
      return 0.2
    case "2H":
      return 0.3
    case "3H":
      return 0.4
    case "12H":
      return 0.7
    case "NIGHT":
      return 0.85
    default:
      return 1
  }
}
