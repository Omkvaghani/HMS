import { createContext, useContext } from "react"

export type HotelSummary = {
  id: number
  name: string
  slug: string
  city?: string | null
  is_active?: boolean
}

export type HotelCtx = {
  hotels: HotelSummary[]
  activeHotelId: number | null
  activeHotel: HotelSummary | null
  setActiveHotelId: (id: number) => void
  isLoading: boolean
}

export const HotelContext = createContext<HotelCtx | null>(null)

export function useHotelContext(): HotelCtx {
  const ctx = useContext(HotelContext)
  if (!ctx) throw new Error("useHotelContext must be used inside <HotelProvider>")
  return ctx
}
