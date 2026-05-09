import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CheckCircle2, Clock, Mail, X } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import PageHeader from "@/components/PageHeader"
import { formatDateTime } from "@/lib/format"

type OnboardingRequest = {
  id: number
  hotel_name: string
  legal_name: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  desired_subdomain: string
  city: string | null
  country: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  created_at: string
  package?: { id: number; name: string } | null
}

export default function OnboardingInboxPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "">("PENDING")
  const [approvalCreds, setApprovalCreds] = useState<{ email: string; password: string; subdomain: string } | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", "onboarding", filter],
    queryFn: async () =>
      (await api.get<{ data: OnboardingRequest[] }>("/super-admin/onboarding-requests", {
        params: filter ? { status: filter } : {},
      })).data,
  })

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/super-admin/onboarding-requests/${id}/approve`),
    onSuccess: (resp) => {
      const d = resp.data as { admin_user: { email: string }; temporary_password: string; tenant: { id: string; name: string } }
      setApprovalCreds({
        email: d.admin_user.email,
        password: d.temporary_password,
        subdomain: data?.data.find((r) => r.contact_email === d.admin_user.email)?.desired_subdomain ?? "",
      })
      qc.invalidateQueries({ queryKey: ["super-admin"] })
    },
    onError: (err) => setFeedback(getApiErrorMessage(err)),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/super-admin/onboarding-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      setRejectingId(null)
      setRejectReason("")
      qc.invalidateQueries({ queryKey: ["super-admin", "onboarding"] })
    },
    onError: (err) => setFeedback(getApiErrorMessage(err)),
  })

  const items = data?.data ?? []

  return (
    <>
      <PageHeader
        title="Onboarding inbox"
        subtitle="Review pending hotel applications, approve to provision a tenant database, or reject with a reason."
      />

      <div className="mb-4 flex gap-2">
        {([
          { key: "PENDING", label: "Pending" },
          { key: "APPROVED", label: "Approved" },
          { key: "REJECTED", label: "Rejected" },
          { key: "", label: "All" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as typeof filter)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium " +
              (filter === tab.key
                ? "bg-cocoa-800 text-cream-50"
                : "bg-white text-ink-soft border border-cream-200 hover:border-sand-400")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">
          {feedback}
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <Building2 className="size-10 text-ink-muted" />
          <p className="mt-4 text-ink-soft">No applications {filter ? `with status ${filter}` : ""}.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((req) => (
            <article key={req.id} className="card-warm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl">{req.hotel_name}</h3>
                  <div className="mt-1 text-sm text-ink-soft">
                    {[req.city, req.country].filter(Boolean).join(", ")}
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Pair label="Contact" value={req.contact_name} />
                <Pair label="Email" value={req.contact_email} icon={<Mail className="size-3.5" />} />
                <Pair label="Phone" value={req.contact_phone ?? "—"} />
                <Pair label="Subdomain" value={`${req.desired_subdomain}.hospes.app`} />
                <Pair label="Plan" value={req.package?.name ?? "—"} />
                <Pair label="Submitted" value={formatDateTime(req.created_at)} icon={<Clock className="size-3.5" />} />
              </dl>

              {req.status === "PENDING" && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-warm text-sm"
                    onClick={() => approve.mutate(req.id)}
                    disabled={approve.isPending}
                  >
                    <CheckCircle2 className="size-4" />
                    {approve.isPending ? "Provisioning…" : "Approve & provision"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => setRejectingId(req.id)}
                  >
                    <X className="size-4" /> Reject
                  </button>
                </div>
              )}

              {rejectingId === req.id && (
                <div className="mt-4 space-y-2 rounded-xl bg-cream-50 p-4">
                  <textarea
                    placeholder="Reason for rejection"
                    className="input-warm min-h-20"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-ghost text-sm" onClick={() => setRejectingId(null)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-warm text-sm"
                      disabled={!rejectReason.trim() || reject.isPending}
                      onClick={() => reject.mutate({ id: req.id, reason: rejectReason.trim() })}
                    >
                      {reject.isPending ? "Rejecting…" : "Confirm rejection"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {approvalCreds && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-md p-6">
            <h3 className="font-display text-2xl">Tenant provisioned.</h3>
            <p className="mt-2 text-sm text-ink-soft">
              The hotel admin can now sign in. Please share these credentials securely:
            </p>
            <dl className="mt-4 space-y-2 rounded-lg bg-cream-50 p-4 text-sm">
              <div>
                <dt className="text-ink-muted">Sign-in email</dt>
                <dd className="font-mono text-cocoa-900">{approvalCreds.email}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Temporary password</dt>
                <dd className="font-mono text-cocoa-900">{approvalCreds.password}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Booking site</dt>
                <dd className="font-mono text-cocoa-900">/book/{approvalCreds.subdomain}</dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end">
              <button type="button" className="btn-warm" onClick={() => setApprovalCreds(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Pair({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-cocoa-900">{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: OnboardingRequest["status"] }) {
  const cfg = {
    PENDING: { className: "bg-cream-100 text-cocoa-700", label: "Pending" },
    APPROVED: { className: "bg-leaf-500/15 text-leaf-600", label: "Approved" },
    REJECTED: { className: "bg-rose-500/15 text-rose-600", label: "Rejected" },
  }[status]
  return (
    <span className={"pill " + cfg.className}>{cfg.label}</span>
  )
}
