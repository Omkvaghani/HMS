import { useQuery } from "@tanstack/react-query"
import { BedDouble, BookOpen, CalendarDays, LayoutDashboard, Users } from "lucide-react"
import AdminShell from "@/components/AdminShell"
import { api } from "@/lib/api"

type Hotel = { id: number; name: string }

export default function HotelAdminLayout() {
  const { data } = useQuery({
    queryKey: ["hotel-admin", "hotels-mini"],
    queryFn: async () => (await api.get<Hotel[]>("/hotel-admin/hotels")).data,
  })
  const subtitle = data?.[0]?.name ?? "Property Management"

  return (
    <AdminShell
      brandName="Hospes"
      brandSubtitle={subtitle}
      nav={[
        { to: "/hotel-admin", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, end: true },
        { to: "/hotel-admin/bookings", label: "Bookings", icon: <CalendarDays className="size-4" /> },
        { to: "/hotel-admin/rooms", label: "Rooms", icon: <BedDouble className="size-4" /> },
        { to: "/hotel-admin/room-classes", label: "Room classes", icon: <BookOpen className="size-4" /> },
        { to: "/hotel-admin/customers", label: "Customers", icon: <Users className="size-4" /> },
      ]}
    />
  )
}
