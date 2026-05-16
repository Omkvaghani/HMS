import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { api } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatDateTime } from "@/lib/format"

type Customer = {
  id: number
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  id_type: string | null
  id_number: string | null
  created_at: string
}

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "customers", search],
    queryFn: async () =>
      (await api.get<{ data: Customer[] }>("/hotel-admin/customers", {
        params: search ? { search } : {},
      })).data,
  })

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Guest directory with stay history and identity captures."
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              placeholder="Search by name, email, phone…"
              className="input-warm w-72 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="text-ink-secondary">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-secondary">No customers yet. They'll appear here as bookings come in.</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tertiary text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-ink">
                    {c.first_name} {c.last_name ?? ""}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{c.email ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-secondary">{c.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-secondary">
                    {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">
                    {c.id_type ? `${c.id_type}: ${c.id_number ?? "—"}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{formatDateTime(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
