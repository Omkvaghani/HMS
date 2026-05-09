import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import { useHotelContext } from "@/lib/hotel-context"
import PageHeader from "@/components/PageHeader"
import { formatCurrency, formatDate } from "@/lib/format"

type Expense = {
  id: number
  hotel_id: number
  category: string
  vendor: string | null
  expense_date: string
  amount: string
  currency: string
  payment_method: string | null
  notes: string | null
}

type Summary = {
  total: number
  by_category: { category: string; total: string }[]
}

type ExpenseForm = {
  category: string
  vendor: string
  expense_date: string
  amount: string
  currency: string
  payment_method: string
  notes: string
  record_in_cash: boolean
}

const EMPTY: ExpenseForm = {
  category: "Utilities",
  vendor: "",
  expense_date: new Date().toISOString().slice(0, 10),
  amount: "",
  currency: "USD",
  payment_method: "CASH",
  notes: "",
  record_in_cash: true,
}

const CATEGORIES = [
  "Utilities",
  "Maintenance",
  "Supplies",
  "Salaries",
  "Marketing",
  "Tax",
  "Rent",
  "Other",
]

export default function ExpensesPage() {
  const qc = useQueryClient()
  const { activeHotelId, activeHotel } = useHotelContext()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "expenses", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<{ data: Expense[] }>("/hotel-admin/expenses", { params: { hotel_id: activeHotelId, per_page: 100 } })).data,
  })

  const { data: summary } = useQuery<Summary>({
    queryKey: ["hotel-admin", "expenses", "summary", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () =>
      (await api.get<Summary>("/hotel-admin/expenses/summary", { params: { hotel_id: activeHotelId } })).data,
  })

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        hotel_id: activeHotelId,
        amount: Number(form.amount || 0),
      }
      return editing
        ? api.put(`/hotel-admin/expenses/${editing.id}`, payload)
        : api.post("/hotel-admin/expenses", payload)
    },
    onSuccess: () => {
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "expenses"] })
      qc.invalidateQueries({ queryKey: ["hotel-admin", "cash"] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/hotel-admin/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotel-admin", "expenses"] }),
  })

  const open = (e?: Expense) => {
    setError(null)
    if (e) {
      setEditing(e)
      setForm({
        category: e.category,
        vendor: e.vendor ?? "",
        expense_date: e.expense_date.slice(0, 10),
        amount: e.amount,
        currency: e.currency,
        payment_method: e.payment_method ?? "CASH",
        notes: e.notes ?? "",
        record_in_cash: false,
      })
    } else {
      setEditing(null)
      setForm({ ...EMPTY })
    }
    setShowForm(true)
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={
          activeHotel
            ? `Track operating costs for ${activeHotel.name}.`
            : "Track operating costs."
        }
        actions={
          <button type="button" className="btn-warm" disabled={!activeHotelId} onClick={() => open()}>
            New expense
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-600">{error}</div>
      )}

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="card-warm p-4">
            <div className="text-xs uppercase tracking-wide text-ink-muted">Total spent</div>
            <div className="mt-1 font-display text-2xl text-cocoa-900">{formatCurrency(summary.total)}</div>
          </div>
          {summary.by_category.slice(0, 3).map((row) => (
            <div key={row.category} className="card-warm p-4">
              <div className="text-xs uppercase tracking-wide text-ink-muted">{row.category}</div>
              <div className="mt-1 font-display text-2xl text-cocoa-900">{formatCurrency(row.total)}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-ink-soft">Loading…</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card-warm flex flex-col items-center justify-center p-16 text-center">
          <p className="text-ink-soft">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="card-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((e) => (
                <tr key={e.id} className="border-t border-cream-100">
                  <td className="px-5 py-3 text-ink-soft">{formatDate(e.expense_date)}</td>
                  <td className="px-5 py-3 font-medium text-cocoa-900">{e.category}</td>
                  <td className="px-5 py-3 text-ink-soft">{e.vendor ?? "—"}</td>
                  <td className="px-5 py-3 text-cocoa-900">{formatCurrency(e.amount, e.currency)}</td>
                  <td className="px-5 py-3 text-ink-soft">{e.payment_method ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="text-sm font-medium text-cocoa-800 hover:underline" onClick={() => open(e)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-sm font-medium text-rose-600 hover:underline"
                      onClick={() => {
                        if (confirm("Delete this expense?")) remove.mutate(e.id)
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa-900/50 p-4">
          <div className="card-warm w-full max-w-2xl p-6">
            <h3 className="font-display text-2xl">{editing ? "Edit expense" : "New expense"}</h3>
            <form
              className="mt-5 grid grid-cols-2 gap-4"
              onSubmit={(ev) => {
                ev.preventDefault()
                save.mutate()
              }}
            >
              <label>
                <span className="label-warm">Category *</span>
                <select
                  className="input-warm"
                  value={form.category}
                  onChange={(ev) => setForm({ ...form, category: ev.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-warm">Date *</span>
                <input className="input-warm" type="date" required value={form.expense_date} onChange={(ev) => setForm({ ...form, expense_date: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Vendor</span>
                <input className="input-warm" value={form.vendor} onChange={(ev) => setForm({ ...form, vendor: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Amount *</span>
                <input className="input-warm" type="number" min={0} step="0.01" required value={form.amount} onChange={(ev) => setForm({ ...form, amount: ev.target.value })} />
              </label>
              <label>
                <span className="label-warm">Currency</span>
                <input className="input-warm" maxLength={3} value={form.currency} onChange={(ev) => setForm({ ...form, currency: ev.target.value.toUpperCase() })} />
              </label>
              <label>
                <span className="label-warm">Payment method</span>
                <select className="input-warm" value={form.payment_method} onChange={(ev) => setForm({ ...form, payment_method: ev.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className="label-warm">Notes</span>
                <textarea className="input-warm min-h-20" value={form.notes} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
              </label>
              {!editing && (
                <label className="col-span-2 inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.record_in_cash} onChange={(ev) => setForm({ ...form, record_in_cash: ev.target.checked })} />
                  <span>Also record this as a cash-out entry in the cash register</span>
                </label>
              )}

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="btn-warm" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Add expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
