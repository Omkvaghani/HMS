import { useQuery } from "@tanstack/react-query"
import { ArrowDownRight, ArrowUpRight, BedDouble, CalendarCheck, Coins, Users } from "lucide-react"
import { api } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency, formatDateTime } from "@/lib/format"

type Summary = {
  hotels: number
  rooms_total: number
  rooms_occupied: number
  occupancy_rate: number
  arrivals_today: number
  departures_today: number
  revenue_this_month: number
  customers_total: number
  recent_bookings: Array<{
    id: number
    reference: string
    grand_total: string
    currency: string
    status: string
    check_in_date: string
    check_out_date: string
    customer?: { first_name: string; last_name: string | null } | null
    room_class?: { name: string } | null
  }>
}

export default function HotelDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "dashboard"],
    queryFn: async () => (await api.get<Summary>("/hotel-admin/dashboard")).data,
  })

  return (
    <>
      <PageHeader
        title="Today at a glance"
        subtitle="Arrivals, departures, occupancy, and revenue."
      />

      {isLoading ? (
        <div className="text-ink-secondary">Loading…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<ArrowUpRight className="size-4" />} label="Arrivals today" value={data?.arrivals_today ?? "—"} />
            <Stat icon={<ArrowDownRight className="size-4" />} label="Departures today" value={data?.departures_today ?? "—"} />
            <Stat
              icon={<BedDouble className="size-4" />}
              label="Occupancy"
              value={`${data?.occupancy_rate ?? 0}%`}
              hint={`${data?.rooms_occupied ?? 0} of ${data?.rooms_total ?? 0} rooms`}
            />
            <Stat
              icon={<Coins className="size-4" />}
              label="Revenue this month"
              value={formatCurrency(data?.revenue_this_month, "USD")}
            />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <section className="card-warm p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent bookings</h3>
                <a href="/hotel-admin/bookings" className="text-sm text-primary-600 hover:underline">View all</a>
              </div>
              <div className="mt-4 divide-y divide-border">
                {(data?.recent_bookings ?? []).length === 0 ? (
                  <div className="py-8 text-center text-ink-secondary">No bookings yet.</div>
                ) : (
                  (data?.recent_bookings ?? []).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-medium text-ink">
                          {b.customer?.first_name ?? "Guest"} {b.customer?.last_name ?? ""}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {b.reference} · {b.room_class?.name ?? "—"} · {formatDateTime(b.check_in_date)} → {formatDateTime(b.check_out_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="pill">{b.status}</span>
                        <div className="font-medium text-ink">
                          {formatCurrency(b.grand_total, b.currency)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card-warm flex flex-col p-6">
              <h3 className="text-lg font-semibold">Customers</h3>
              <div className="mt-2 flex items-center gap-2 text-ink-secondary">
                <Users className="size-4" />
                {data?.customers_total ?? 0} guests on file
              </div>
              <a href="/hotel-admin/customers" className="btn-ghost mt-auto pt-6 text-sm">
                Open customer directory
              </a>
            </section>

            <section className="card-warm flex flex-col p-6">
              <h3 className="text-lg font-semibold">Quick actions</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a className="btn-warm" href="/hotel-admin/bookings"><CalendarCheck className="size-4" /> New booking</a>
                <a className="btn-ghost" href="/hotel-admin/rooms">Update room status</a>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="card-warm p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  )
}
