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
    <div className="surface-paper relative min-h-screen">
      <MarketingHeader />

      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 -z-10 bg-[url('https://images.unsplash.com/photo-1455587734955-081b22074882?w=1920&q=70')] bg-cover bg-center opacity-[0.18]" />
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="pill mb-6">
            <Sparkles className="size-3" /> Hospitality OS
          </span>
          <h1 className="text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            Run a hotel like a <em className="font-display italic text-copper-600">grand</em> hotel.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
            Hospes is a multi-tenant property management platform for boutique hotels and groups.
            One warm, calm interface for the front desk, finance, and your direct booking website.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/apply" className="btn-warm">
              List your hotel <ArrowRight className="size-4" />
            </Link>
            <a href="#packages" className="btn-ghost">
              See pricing
            </a>
          </div>

          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {[
              ["120+", "properties live"],
              ["18 mins", "to onboard"],
              ["0%", "booking commission"],
              ["24/7", "operator support"],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center">
                <dt className="font-display text-3xl text-cocoa-900">{n}</dt>
                <dd className="text-sm text-ink-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-balance text-center text-4xl">Everything for the front of house — and the back of it.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
            From the calendar to housekeeping to the public booking site — your team works in one place.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
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

      <section id="packages" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl">Pricing that grows with you.</h2>
          <p className="mt-3 text-center text-ink-soft">
            All plans include the booking engine, calendar, and unlimited bookings.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(packages ?? []).map((p, i) => (
              <article
                key={p.id}
                className={
                  "card-warm flex flex-col p-7 " +
                  (i === 1 ? "border-sand-400 ring-2 ring-sand-400/40" : "")
                }
              >
                {i === 1 && (
                  <span className="pill mb-3 self-start bg-cocoa-800 text-cream-50">Most popular</span>
                )}
                <h3 className="font-display text-2xl">{p.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{p.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl text-cocoa-900">
                    {formatCurrency(p.monthly_price, p.currency)}
                  </span>
                  <span className="text-sm text-ink-muted">/month</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-ink-soft">
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

      <section id="story" className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl">For the people behind the front desk.</h2>
            <p className="mt-4 text-ink-soft">
              Software for hotels has always felt like software written for software. Hospes is
              different. Warm typography, dense data only where it helps, and a workflow shaped by
              the rhythm of the day — arrivals, the lobby, the long quiet of the afternoon, the
              dinner rush, the morning departures.
            </p>
            <p className="mt-3 text-ink-soft">
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

      <footer className="border-t border-cream-200 bg-cocoa-900 px-6 py-12 text-cream-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="font-display text-lg">Hospes</div>
          <div className="text-sm text-cream-100/70">
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
      <div className="grid size-10 place-items-center rounded-full bg-cream-100 text-cocoa-700">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
    </div>
  )
}
