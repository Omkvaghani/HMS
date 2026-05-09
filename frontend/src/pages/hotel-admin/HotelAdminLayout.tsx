import {
  BedDouble,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react"
import AdminShell from "@/components/AdminShell"
import { useHotelContext } from "@/lib/hotel-context"
import { HotelProvider } from "@/lib/hotel-provider"

function HotelAdminShell() {
  const { activeHotel } = useHotelContext()
  const subtitle = activeHotel?.name ?? "Property Management"

  return (
    <AdminShell
      brandName="Hospes"
      brandSubtitle={subtitle}
      showHotelSwitcher
      nav={[
        { to: "/hotel-admin", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, end: true },
        { to: "/hotel-admin/bookings", label: "Bookings", icon: <CalendarDays className="size-4" /> },
        { to: "/hotel-admin/rooms", label: "Rooms", icon: <BedDouble className="size-4" /> },
        { to: "/hotel-admin/room-classes", label: "Room classes", icon: <BookOpen className="size-4" /> },
        { to: "/hotel-admin/customers", label: "Customers", icon: <Users className="size-4" /> },
        { to: "/hotel-admin/staff", label: "Staff", icon: <UserCog className="size-4" /> },
        { to: "/hotel-admin/expenses", label: "Expenses", icon: <Receipt className="size-4" /> },
        { to: "/hotel-admin/cash", label: "Cash", icon: <Wallet className="size-4" /> },
        { to: "/hotel-admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
      ]}
    />
  )
}

export default function HotelAdminLayout() {
  return (
    <HotelProvider>
      <HotelAdminShell />
    </HotelProvider>
  )
}
