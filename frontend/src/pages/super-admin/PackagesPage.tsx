import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatCurrency } from "@/lib/format"

type Pkg = {
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
  is_public: boolean
  is_active: boolean
}

export default function PackagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "packages"],
    queryFn: async () => (await api.get<{ data: Pkg[] }>("/super-admin/packages")).data,
  })

  return (
    <>
      <PageHeader
        title="Packages"
        subtitle="SaaS subscription tiers shown on the public marketing site."
      />

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Monthly</th>
                <th className="px-5 py-3">Yearly</th>
                <th className="px-5 py-3">Limits</th>
                <th className="px-5 py-3">Visibility</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-cream-100">
                  <td className="px-5 py-3">
                    <div className="font-medium text-cocoa-900">{p.name}</div>
                    <div className="text-xs text-ink-muted">{p.slug}</div>
                  </td>
                  <td className="px-5 py-3 text-cocoa-900">
                    {formatCurrency(p.monthly_price, p.currency)}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {p.yearly_price ? formatCurrency(p.yearly_price, p.currency) : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {p.max_hotels} hotels · {p.max_rooms} rooms · {p.max_staff} staff
                  </td>
                  <td className="px-5 py-3">
                    <span className={"pill " + (p.is_public ? "bg-leaf-500/15 text-leaf-600" : "bg-cream-100 text-ink-muted")}>
                      {p.is_public ? "Public" : "Internal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
