import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, getApiErrorMessage } from "@/lib/api"
import { useHotelContext } from "@/lib/hotel-context"
import PageHeader from "@/components/PageHeader"

const ALL_DURATIONS = [
  { code: "1H", label: "1 hour" },
  { code: "2H", label: "2 hours" },
  { code: "3H", label: "3 hours" },
  { code: "12H", label: "12 hours" },
  { code: "NIGHT", label: "Night stay" },
  { code: "DAY", label: "Multi-day stay" },
] as const

type SettingsResponse = {
  hotel_id: number
  name: string
  check_in_time: string | null
  check_out_time: string | null
  currency: string | null
  timezone: string | null
  default_tax_rate: string | null
  tax_mode: "INCLUSIVE" | "EXCLUSIVE" | null
  settings: {
    default_next_day_checkout_time?: string
    enabled_duration_types?: string[]
    auto_confirm_online?: boolean
    advance_booking_max_days?: number
    theme?: "warm" | "light" | "dark"
  }
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { activeHotel, activeHotelId } = useHotelContext()
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "settings", activeHotelId],
    enabled: !!activeHotelId,
    queryFn: async () => (await api.get<SettingsResponse>(`/hotel-admin/hotels/${activeHotelId}/settings`)).data,
  })

  // We hold an "overrides" object that the form mutates. The actual displayed
  // form is the merge of server data + local overrides — this avoids
  // setState-in-effect when `data` first lands.
  const [overrides, setOverrides] = useState<Partial<SettingsResponse>>({})
  const [settingsOverrides, setSettingsOverrides] = useState<SettingsResponse["settings"]>({})
  const form: SettingsResponse | null = data
    ? { ...data, ...overrides, settings: { ...data.settings, ...settingsOverrides } }
    : null
  const setForm = (next: SettingsResponse) => {
    if (!data) return
    setOverrides({
      check_in_time: next.check_in_time,
      check_out_time: next.check_out_time,
      currency: next.currency,
      timezone: next.timezone,
      default_tax_rate: next.default_tax_rate,
      tax_mode: next.tax_mode,
    })
    setSettingsOverrides(next.settings)
  }

  const save = useMutation({
    mutationFn: () => api.put(`/hotel-admin/hotels/${activeHotelId}/settings`, form!),
    onSuccess: () => {
      setSaved("Saved!")
      setTimeout(() => setSaved(null), 1500)
      qc.invalidateQueries({ queryKey: ["hotel-admin", "settings", activeHotelId] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  if (!activeHotel) return null
  if (isLoading || !form) return <div className="text-ink-secondary">Loading…</div>

  const settings = form.settings ?? {}

  const updateSettings = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettingsOverrides({ ...settings, [key]: value })
  }

  const toggleDuration = (code: string) => {
    const current = settings.enabled_duration_types ?? []
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code]
    updateSettings("enabled_duration_types", next)
  }

  return (
    <>
      <PageHeader title="Settings" subtitle={`Global defaults for ${activeHotel.name}.`} />

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-600">{error}</div>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <section className="card-warm p-6">
          <h3 className="text-lg font-semibold">Check-in & checkout</h3>
          <p className="text-sm text-ink-secondary">Default times applied to new bookings.</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label>
              <span className="label-warm">Default check-in</span>
              <input className="input-warm" type="time" value={form.check_in_time ?? ""} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} />
            </label>
            <label>
              <span className="label-warm">Default check-out</span>
              <input className="input-warm" type="time" value={form.check_out_time ?? ""} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} />
            </label>
            <label>
              <span className="label-warm">Default next-day checkout for night stays</span>
              <input
                className="input-warm"
                type="time"
                value={settings.default_next_day_checkout_time ?? "11:00"}
                onChange={(e) => updateSettings("default_next_day_checkout_time", e.target.value)}
              />
              <span className="mt-1 block text-xs text-ink-muted">
                e.g. for 1-night stays we&apos;ll set checkout to this time on the following day.
              </span>
            </label>
            <label>
              <span className="label-warm">Advance booking window (days)</span>
              <input
                className="input-warm"
                type="number"
                min={1}
                max={730}
                value={settings.advance_booking_max_days ?? 365}
                onChange={(e) => updateSettings("advance_booking_max_days", Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="card-warm p-6">
          <h3 className="text-lg font-semibold">Booking duration options</h3>
          <p className="text-sm text-ink-secondary">Pick which stay durations the hotel offers.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_DURATIONS.map((d) => {
              const enabled = (settings.enabled_duration_types ?? []).includes(d.code)
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => toggleDuration(d.code)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition " +
                    (enabled
                      ? "border-primary-500 bg-primary-50 text-ink"
                      : "border-border text-ink-secondary hover:border-border-strong")
                  }
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="card-warm p-6">
          <h3 className="text-lg font-semibold">Booking automation</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.auto_confirm_online ?? true}
                onChange={(e) => updateSettings("auto_confirm_online", e.target.checked)}
              />
              <span>Auto-confirm online bookings (skip pending state when payment succeeds)</span>
            </label>
          </div>
        </section>

        <section className="card-warm p-6">
          <h3 className="text-lg font-semibold">Currency & taxes</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label>
              <span className="label-warm">Currency</span>
              <input className="input-warm" maxLength={3} value={form.currency ?? ""} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </label>
            <label>
              <span className="label-warm">Default tax rate (%)</span>
              <input className="input-warm" type="number" step="0.01" min={0} max={99.99} value={form.default_tax_rate ?? ""} onChange={(e) => setForm({ ...form, default_tax_rate: e.target.value })} />
            </label>
            <label>
              <span className="label-warm">Tax mode</span>
              <select className="input-warm" value={form.tax_mode ?? "EXCLUSIVE"} onChange={(e) => setForm({ ...form, tax_mode: e.target.value as "INCLUSIVE" | "EXCLUSIVE" })}>
                <option value="EXCLUSIVE">Exclusive (added at checkout)</option>
                <option value="INCLUSIVE">Inclusive (already in price)</option>
              </select>
            </label>
            <label>
              <span className="label-warm">Timezone</span>
              <input className="input-warm" value={form.timezone ?? ""} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-success-600">{saved}</span>}
          <button className="btn-warm" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </>
  )
}
