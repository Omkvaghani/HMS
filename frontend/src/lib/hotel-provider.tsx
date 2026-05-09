import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { HotelContext, type HotelSummary } from "@/lib/hotel-context"

const STORAGE_KEY = "hms.activeHotelId"

function readStoredId(): number | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function HotelProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hotel-admin", "hotels-context"],
    queryFn: async () => (await api.get<HotelSummary[]>("/hotel-admin/hotels")).data,
    staleTime: 60_000,
  })

  const hotels = useMemo<HotelSummary[]>(() => data ?? [], [data])

  const [chosenId, setChosenId] = useState<number | null>(() => readStoredId())

  // The "effective" active hotel is the chosen one if it's still in the list,
  // otherwise the first one. This is computed inline (no setState in effect).
  const activeHotelId =
    chosenId != null && hotels.some((h) => h.id === chosenId)
      ? chosenId
      : (hotels[0]?.id ?? null)

  useEffect(() => {
    if (activeHotelId != null) {
      window.localStorage.setItem(STORAGE_KEY, String(activeHotelId))
    }
  }, [activeHotelId])

  const value = useMemo(
    () => ({
      hotels,
      activeHotelId,
      activeHotel: hotels.find((h) => h.id === activeHotelId) ?? null,
      setActiveHotelId: setChosenId,
      isLoading,
    }),
    [hotels, activeHotelId, isLoading],
  )

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
}
