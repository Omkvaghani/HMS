import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Calendar, Hotel, Sparkles, Users } from "lucide-react"
import MarketingHeader from "@/components/MarketingHeader"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/format"

type PublicPackage = {
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
  sort_order: number
}

export default function LandingPage() {
  const { data: packages } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => (await api.get<PublicPackage[]>("/packages")).data,
  })

  return (
    <div className="relative min-h-screen bg-surface-secondary">
      <MarketingHeader />

      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 -z-10 bg-[url('https://images.unsplash.com/photo-1455587734955-081b22074882?w=1920&q=70')] bg-cover bg-center opacity-[0.08]" />
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="pill mb-6">
            <Sparkles className="size-3" /> Hospitality OS
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl text-ink">
            Run a hotel like a <em className="not-italic text-primary-600">grand</em> hotel.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-ink-secondary">
            Hospes is a multi-tenant property management platform for boutique hotels and groups.
            One clean interface for the front desk, finance, and your direct booking website.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/apply" className="btn-warm">
              List your hotel <ArrowRight className="size-4" />
            </Link>
            <a href="#packages" className="btn-ghost">
              See pricing
            </a>
          </div>

          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {[
              ["120+", "properties live"],
              ["18 mins", "to onboard"],
              ["0%", "booking commission"],
              ["24/7", "operator support"],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center">
                <dt className="text-3xl font-semibold text-ink">{n}</dt>
                <dd className="text-sm text-ink-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-3xl sm:text-4xl font-semibold text-ink">Everything for the front of house — and the back of it.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-secondary">
            From the calendar to housekeeping to the public booking site — your team works in one place.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <Feature
              icon={<Calendar className="size-5" />}
              title="Property Management"
              body="Reservation calendar, check-in/out, room status, housekeeping. Made for the desk."
            />
            <Feature
              icon={<Hotel className="size-5" />}
              title="Direct Booking Engine"
              body="Your hotel, your URL, your brand — guests book directly. No commissions."
            />
            <Feature
              icon={<Users className="size-5" />}
              title="Multi-Tenant by Design"
              body="Each hotel gets its own database. Safe isolation, easy operations, calm scaling."
            />
          </div>
        </div>
      </section>

      <section id="packages" className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl sm:text-4xl font-semibold text-ink">Pricing that grows with you.</h2>
          <p className="mt-3 text-center text-ink-secondary">
            All plans include the booking engine, calendar, and unlimited bookings.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {(packages ?? []).map((p, i) => (
              <article
                key={p.id}
                className={
                  "card-warm flex flex-col p-6 sm:p-7 " +
                  (i === 1 ? "border-primary-500 ring-2 ring-primary-500/20" : "")
                }
              >
                {i === 1 && (
                  <span className="pill mb-3 self-start bg-primary-600 text-white">Most popular</span>
                )}
                <h3 className="text-xl font-semibold text-ink">{p.name}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{p.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-semibold text-ink">
                    {formatCurrency(p.monthly_price, p.currency)}
                  </span>
                  <span className="text-sm text-ink-muted">/month</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-ink-secondary">
                  <li>Up to {p.max_hotels} {p.max_hotels === 1 ? "property" : "properties"}</li>
                  <li>Up to {p.max_rooms} rooms</li>
                  <li>Up to {p.max_staff} staff seats</li>
                  {(p.features ?? []).map((f) => <li key={f}>· {f}</li>)}
                </ul>
                <Link to="/apply" className="btn-warm mt-7 self-start">
                  Apply with {p.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="story" className="px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink">For the people behind the front desk.</h2>
            <p className="mt-4 text-ink-secondary">
              Software for hotels has always felt like software written for software. Hospes is
              different. Clean design, dense data only where it helps, and a workflow shaped by
              the rhythm of the day — arrivals, the lobby, the long quiet of the afternoon, the
              dinner rush, the morning departures.
            </p>
            <p className="mt-3 text-ink-secondary">
              We support boutique hotels, hostels, resorts, and the occasional thoughtful chain.
            </p>
          </div>
          <div className="card-warm overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=70"
              alt="Boutique hotel lobby"
              className="h-80 w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-gray-900 px-6 py-12 text-gray-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-lg font-semibold text-white">Hospes</div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Hospes Hotels. Multi-tenant SaaS.
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-warm p-6">
      <div className="grid size-10 place-items-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-secondary">{body}</p>
    </div>
  )
}
