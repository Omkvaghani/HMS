import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatDateTime } from "@/lib/format"

type Tenant = {
  id: string
  name: string
  contact_email: string | null
  city: string | null
  country: string | null
  status: "ACTIVE" | "SUSPENDED" | "PENDING" | "REJECTED"
  created_at: string
  domains: { domain: string }[]
  package?: { id: number; name: string } | null
}

export default function TenantsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "tenants", search],
    queryFn: async () =>
      (await api.get<{ data: Tenant[] }>("/super-admin/tenants", { params: search ? { search } : {} })).data,
  })

  const suspend = useMutation({
    mutationFn: (id: string) => api.post(`/super-admin/tenants/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-admin", "tenants"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })
  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/super-admin/tenants/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-admin", "tenants"] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="All hotels with provisioned databases. Suspend to block sign-in immediately."
        actions={
          <input
            placeholder="Search tenants…"
            className="input-warm w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-secondary">Loading…</div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tertiary text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Hotel</th>
                <th className="px-5 py-3">Subdomain</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{t.name}</div>
                    <div className="text-xs text-ink-muted">{t.contact_email}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-secondary">
                    {t.domains?.[0]?.domain ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{t.package?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Status status={t.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{formatDateTime(t.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    {t.status === "SUSPENDED" ? (
                      <button
                        type="button"
                        className="text-sm font-medium text-success-600 hover:text-success-700"
                        onClick={() => activate.mutate(t.id)}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-sm font-medium text-danger-600 hover:text-danger-700"
                        onClick={() => suspend.mutate(t.id)}
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.data ?? []).length === 0 && (
            <div className="px-5 py-12 text-center text-ink-secondary">No tenants yet.</div>
          )}
        </div>
      )}
    </>
  )
}

function Status({ status }: { status: Tenant["status"] }) {
  const map = {
    ACTIVE: "bg-success-50 text-success-600",
    PENDING: "bg-warning-50 text-warning-600",
    SUSPENDED: "bg-danger-50 text-danger-600",
    REJECTED: "bg-danger-50 text-danger-600",
  } as const
  return <span className={"pill " + map[status]}>{status}</span>
}
