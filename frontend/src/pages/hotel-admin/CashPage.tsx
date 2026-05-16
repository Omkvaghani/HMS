import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import { useHotelContext } from "@/lib/hotel-context"
import PageHeader from "@/components/PageHeader"
import { formatCurrency, formatDate } from "@/lib/format"

type CashTxn = {
  id: number
  hotel_id: number
  transaction_date: string
  direction: "IN" | "OUT"
  kind: string
  amount: string
  currency: string
  reference: string | null
  notes: string | null
  booking_id: number | null
  expense_id: number | null
}

type Summary = {
  cash_in: number
  cash_out: number
  balance: number
  by_kind: { kind: string; direction: "IN" | "OUT"; total: string }[]
}

const KINDS = [
  "OPENING_BALANCE",
  "BOOKING_PAYMENT",
  "EXPENSE",
  "STAFF_ADVANCE",
  "BANK_DEPOSIT",
  "PETTY_CASH",
  "CLOSING_BALANCE",
  "OTHER",
]

export default function CashPage() {
  const qc = useQueryClient()
  const { activeHotelId, activeHotel } = useHotelContext()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    direction: "IN" as "IN" | "OUT",
    kind: "PETTY_CASH",
    amount: "",
    currency: "USD",
    transaction_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  })

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "cash", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<{ data: CashTxn[] }>("/hotel-admin/cash", { params: { hotel_id: activeHotelId, per_page: 100 } })).data,
  })

  const { data: summary } = useQuery<Summary>({
    queryKey: ["hotel-admin", "cash", "summary", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<Summary>("/hotel-admin/cash/summary", { params: { hotel_id: activeHotelId } })).data,
  })

  const create = useMutation({
    mutationFn: () =>
      api.post("/hotel-admin/cash", {
        ...form,
        hotel_id: activeHotelId,
        amount: Number(form.amount || 0),
      }),
    onSuccess: () => {
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "cash"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/hotel-admin/cash/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "cash"] }),
  })

  return (
    <>
      <PageHeader
        title="Cash register"
        subtitle={
          activeHotel
            ? `Daily cash in/out, opening & closing balances for ${activeHotel.name}.`
            : "Cash management — opening, booking payments, expenses, closing."
        }
        actions={
          <button type="button" className="btn-warm" disabled={!activeHotelId} onClick={() => setShowForm(true)}>
            New entry
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">{error}</div>
      )}

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SummaryCard label="Cash in" value={summary.cash_in} positive />
          <SummaryCard label="Cash out" value={summary.cash_out} />
          <SummaryCard label="Net balance" value={summary.balance} positive={summary.balance >= 0} />
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-secondary">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-secondary">No cash entries yet. Cash payments on bookings flow in automatically.</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tertiary text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Kind</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Direction</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-5 py-3 text-ink-secondary">{formatDate(t.transaction_date)}</td>
                  <td className="px-5 py-3 font-medium text-ink">
                    {t.kind.replaceAll("_", " ")}
                    {t.notes && <div className="text-xs text-ink-muted">{t.notes}</div>}
                  </td>
                  <td className="px-5 py-3 text-ink-secondary">{t.reference ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "pill " +
                        (t.direction === "IN" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600")
                      }
                    >
                      {t.direction === "IN" ? "Cash in" : "Cash out"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{formatCurrency(t.amount, t.currency)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      className="text-sm font-medium text-danger-600 hover:text-danger-700"
                      onClick={() => {
                        if (confirm("Delete this entry?")) remove.mutate(t.id)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="card-warm w-full max-w-2xl p-6">
            <h3 className="text-xl font-semibold">New cash entry</h3>
            <form
              className="mt-5 grid grid-cols-2 gap-4"
              onSubmit={(ev) => {
                ev.preventDefault()
                create.mutate()
              }}
            >
              <label>
                <span className="label-warm">Direction *</span>
                <select className="input-warm" value={form.direction} onChange={(ev) => setForm({ ...form, direction: ev.target.value as "IN" | "OUT" })}>
                  <option value="IN">Cash in</option>
                  <option value="OUT">Cash out</option>
                </select>
              </label>
              <label>
                <span className="label-warm">Kind *</span>
                <select className="input-warm" value={form.kind} onChange={(ev) => setForm({ ...form, kind: ev.target.value })}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-warm">Date *</span>
                <input className="input-warm" type="date" required value={form.transaction_date} onChange={(ev) => setForm({ ...form, transaction_date: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Amount *</span>
                <input className="input-warm" type="number" min={0} step="0.01" required value={form.amount} onChange={(ev) => setForm({ ...form, amount: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Reference</span>
                <input className="input-warm" value={form.reference} onChange={(ev) => setForm({ ...form, reference: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Currency</span>
                <input className="input-warm" maxLength={3} value={form.currency} onChange={(ev) => setForm({ ...form, currency: ev.target.value.toUpperCase() })} />
              </label>
              <label className="col-span-2">
                <span className="label-warm">Notes</span>
                <textarea className="input-warm min-h-20" value={form.notes} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
              </label>

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Record entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function SummaryCard({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="card-warm p-4">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={"mt-1 text-xl font-semibold " + (positive ? "text-success-600" : "text-danger-600")}>
        {formatCurrency(value)}
      </div>
    </div>
  )
}
