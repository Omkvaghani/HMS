import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CalendarRange, CheckCircle2, MapPin, Users } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import { formatCurrency } from "@/lib/format"

type Branding = {
  hotel: {
    id: number
    name: string
    description: string | null
    city: string | null
    country: string | null
    phone: string | null
    email: string | null
    logo_url: string | null
    cover_image_url: string | null
    check_in_time: string | null
    check_out_time: string | null
    currency: string
  }
  config: {
    primary_color: string | null
    accent_color: string | null
    headline: string | null
    subheadline: string | null
    cancellation_policy: string | null
  } | null
  addons: Array<{
    id: number
    name: string
    description: string | null
    price: string
    charge_type: "PER_STAY" | "PER_NIGHT" | "PER_PERSON" | "PER_PERSON_PER_NIGHT"
  }>
}

type AvailabilityResult = {
  currency: string
  results: Array<{
    room_class: {
      id: number
      name: string
      description: string | null
      max_adults: number
      max_children: number
      max_occupancy: number
      bed_count: number
      bed_type: string | null
      amenities: string[] | null
      image_urls: string[] | null
      size_sqft: number | null
      base_price: string
    }
    available_count: number
    quote: {
      nights: number
      room_subtotal: number
      addons_subtotal: number
      tax_total: number
      grand_total: number
    } | null
  }>
}

export default function BookingEnginePage() {
  const { subdomain = "" } = useParams()

  const { today, tomorrow } = useMemo(() => {
    const t = new Date()
    const tm = new Date(t.getTime() + 86_400_000)
    return {
      today: t.toISOString().slice(0, 10),
      tomorrow: tm.toISOString().slice(0, 10),
    }
  }, [])

  const [search, setSearch] = useState({
    from: today,
    to: tomorrow,
    adults: 2,
    children: 0,
  })
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState<AvailabilityResult["results"][number] | null>(null)
  const [confirmation, setConfirmation] = useState<{ reference: string } | null>(null)

  const { data: branding, isLoading: brandingLoading, error: brandingError } = useQuery({
    queryKey: ["public", subdomain, "branding"],
    queryFn: async () => (await api.get<Branding>(`/public/${subdomain}/branding`)).data,
    enabled: !!subdomain,
  })

  const { data: availability, isFetching: availLoading, refetch } = useQuery({
    queryKey: ["public", subdomain, "availability", search],
    queryFn: async () =>
      (await api.get<AvailabilityResult>(`/public/${subdomain}/availability`, {
        params: search,
      })).data,
    enabled: submitted && !!subdomain,
  })

  if (brandingLoading) {
    return <div className="grid min-h-screen place-items-center text-ink-secondary">Loading…</div>
  }

  if (brandingError || !branding) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-3xl">Hotel not found.</h1>
          <p className="mt-3 text-ink-secondary">
            We couldn't find a hotel at <code className="font-mono">/book/{subdomain}</code>.
          </p>
        </div>
      </div>
    )
  }

  const themeStyle: React.CSSProperties = {
    "--theme-primary": branding.config?.primary_color || "#4a2f17",
    "--theme-accent": branding.config?.accent_color || "#c5a064",
  } as React.CSSProperties

  const cover =
    branding.hotel.cover_image_url ??
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=70"

  return (
    <div style={themeStyle} className="surface-paper relative min-h-screen">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            {branding.hotel.logo_url ? (
              <img src={branding.hotel.logo_url} alt="" className="h-10" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-600 text-white font-semibold">
                {branding.hotel.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-xl font-semibold text-white">{branding.hotel.name}</div>
              {branding.hotel.city && (
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="size-3" />
                  {[branding.hotel.city, branding.hotel.country].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="hidden text-right text-xs text-white/80 md:block">
            {branding.hotel.email && <div>{branding.hotel.email}</div>}
            {branding.hotel.phone && <div>{branding.hotel.phone}</div>}
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden bg-cover bg-center pt-28 pb-32"
        style={{ backgroundImage: `linear-gradient(rgba(28,18,10,0.5), rgba(28,18,10,0.7)), url(${cover})` }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center text-white">
          <h1 className="text-balance text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
            {branding.config?.headline || `Stay at ${branding.hotel.name}`}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            {branding.config?.subheadline ||
              branding.hotel.description ||
              "Book directly with us — best rate, no commissions, the warmest welcome."}
          </p>

          <form
            className="card-warm mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 p-6 text-left text-ink md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
              void refetch()
            }}
          >
            <label className="md:col-span-1">
              <span className="label-warm">Check-in</span>
              <input className="input-warm" type="date" required value={search.from} onChange={(e) => setSearch({ ...search, from: e.target.value })} />
            </label>
            <label className="md:col-span-1">
              <span className="label-warm">Check-out</span>
              <input className="input-warm" type="date" required value={search.to} onChange={(e) => setSearch({ ...search, to: e.target.value })} />
            </label>
            <label className="md:col-span-1">
              <span className="label-warm">Adults</span>
              <input className="input-warm" type="number" min={1} max={20} value={search.adults} onChange={(e) => setSearch({ ...search, adults: Number(e.target.value) })} />
            </label>
            <label className="md:col-span-1">
              <span className="label-warm">Children</span>
              <input className="input-warm" type="number" min={0} max={20} value={search.children} onChange={(e) => setSearch({ ...search, children: Number(e.target.value) })} />
            </label>
            <button className="btn-warm md:col-span-1 md:self-end">
              <CalendarRange className="size-4" /> Search
            </button>
          </form>
        </div>
      </section>

      {submitted && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Available rooms</h2>
            <p className="mt-1 text-ink-secondary">
              {search.adults} adult{search.adults === 1 ? "" : "s"}{search.children ? `, ${search.children} children` : ""} ·{" "}
              {search.from} → {search.to}
            </p>

            {availLoading ? (
              <div className="mt-8 text-ink-secondary">Checking availability…</div>
            ) : (
              <div className="mt-8 space-y-4">
                {(availability?.results ?? []).filter((r) => r.available_count > 0).length === 0 ? (
                  <div className="card-warm p-12 text-center text-ink-secondary">
                    No rooms available for those dates. Try different ones.
                  </div>
                ) : (
                  (availability?.results ?? [])
                    .filter((r) => r.available_count > 0)
                    .map((r) => (
                      <article key={r.room_class.id} className="card-warm grid gap-6 p-6 md:grid-cols-[200px_1fr_auto]">
                        <div className="overflow-hidden rounded-xl bg-surface-tertiary">
                          <img
                            src={r.room_class.image_urls?.[0] ?? "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=70"}
                            alt={r.room_class.name}
                            className="h-40 w-full object-cover md:h-full"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-ink">{r.room_class.name}</h3>
                          <p className="mt-1 text-sm text-ink-secondary">{r.room_class.description ?? ""}</p>
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink-secondary">
                            <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Up to {r.room_class.max_occupancy} guests</span>
                            <span>{r.room_class.bed_count} × {r.room_class.bed_type ?? "bed"}</span>
                            {r.room_class.size_sqft && <span>{r.room_class.size_sqft} sq ft</span>}
                          </div>
                          <div className="mt-3 text-xs text-ink-muted">
                            {r.available_count} room{r.available_count === 1 ? "" : "s"} left at this rate.
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-semibold text-ink">
                              {r.quote ? formatCurrency(r.quote.grand_total, availability!.currency) : formatCurrency(r.room_class.base_price, availability!.currency)}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {r.quote ? `total · ${r.quote.nights} night${r.quote.nights === 1 ? "" : "s"} (incl. tax)` : "from / night"}
                            </div>
                          </div>
                          <button type="button" className="btn-warm" onClick={() => setSelected(r)}>
                            Book this room
                          </button>
                        </div>
                      </article>
                    ))
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {selected && (
        <BookingDialog
          subdomain={subdomain}
          search={search}
          item={selected}
          onClose={() => setSelected(null)}
          onSuccess={(ref) => {
            setSelected(null)
            setConfirmation({ reference: ref })
          }}
          currency={availability?.currency ?? branding.hotel.currency}
        />
      )}

      {confirmation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="card-warm w-full max-w-md p-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-success-600" />
            <h3 className="mt-4 text-2xl font-semibold text-ink">Booking confirmed.</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Your confirmation reference is{" "}
              <strong className="font-mono text-ink">{confirmation.reference}</strong>.
              We've sent a copy to your email.
            </p>
            <button className="btn-warm mt-6" onClick={() => setConfirmation(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-border bg-gray-900 px-6 py-10 text-gray-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <div>© {new Date().getFullYear()} {branding.hotel.name}</div>
          <div>Powered by Hospes</div>
        </div>
      </footer>
    </div>
  )
}

function BookingDialog({
  subdomain,
  search,
  item,
  onClose,
  onSuccess,
  currency,
}: {
  subdomain: string
  search: { from: string; to: string; adults: number; children: number }
  item: AvailabilityResult["results"][number]
  onClose: () => void
  onSuccess: (ref: string) => void
  currency: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    special_requests: "",
  })

  const submit = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/public/${subdomain}/book`, {
        room_class_id: item.room_class.id,
        check_in_date: search.from,
        check_out_date: search.to,
        adults: search.adults,
        children: search.children,
        guest: form,
        special_requests: form.special_requests || null,
      })
      return data as { booking: { reference: string } }
    },
    onSuccess: (data) => onSuccess(data.booking.reference),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="card-warm w-full max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">Confirm your stay</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              {item.room_class.name} · {search.from} → {search.to} ·{" "}
              {item.quote ? formatCurrency(item.quote.grand_total, currency) : "—"} total
            </p>
          </div>
          <button type="button" className="text-sm text-ink-secondary hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          className="mt-5 grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate()
          }}
        >
          <label><span className="label-warm">First name *</span><input className="input-warm" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
          <label><span className="label-warm">Last name</span><input className="input-warm" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
          <label><span className="label-warm">Email *</span><input className="input-warm" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span className="label-warm">Phone *</span><input className="input-warm" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="col-span-2"><span className="label-warm">Special requests</span><textarea className="input-warm min-h-20" value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} /></label>

          {error && (
            <div className="col-span-2 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">
              {error}
            </div>
          )}

          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-warm" disabled={submit.isPending}>
              {submit.isPending ? "Booking…" : `Confirm — ${item.quote ? formatCurrency(item.quote.grand_total, currency) : "Book"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
