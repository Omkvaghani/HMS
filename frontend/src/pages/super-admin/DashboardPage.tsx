import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import PageHeader from "@/components/PageHeader"

type TenantStats = {
  total: number
  active: number
  pending: number
  suspended: number
  rejected: number
  created_this_month: number
}

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["super-admin", "tenant-stats"],
    queryFn: async () => (await api.get<TenantStats>("/super-admin/tenants/stats")).data,
  })

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform-wide health, tenants, and recent activity." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total tenants" value={stats?.total ?? "—"} />
        <Stat label="Active" value={stats?.active ?? "—"} accent="text-leaf-600" />
        <Stat label="Suspended" value={stats?.suspended ?? "—"} accent="text-rose-600" />
        <Stat label="New this month" value={stats?.created_this_month ?? "—"} />
      </div>

      <section className="card-warm mt-8 p-6">
        <h3 className="font-display text-xl">Quick actions</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Review pending applications and provision new tenant databases.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-warm" href="/super-admin/onboarding">Review onboarding queue</a>
          <a className="btn-ghost" href="/super-admin/tenants">Manage tenants</a>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card-warm p-5">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={"mt-2 font-display text-3xl text-cocoa-900 " + (accent ?? "")}>{value}</div>
    </div>
  )
}
