import { Building2, Inbox, LayoutDashboard, Package } from "lucide-react"
import AdminShell from "@/components/AdminShell"

export default function SuperAdminLayout() {
  return (
    <AdminShell
      brandName="Hospes"
      brandSubtitle="Platform · Super Admin"
      nav={[
        { to: "/super-admin", label: "Overview", icon: <LayoutDashboard className="size-4" />, end: true },
        { to: "/super-admin/onboarding", label: "Onboarding", icon: <Inbox className="size-4" /> },
        { to: "/super-admin/tenants", label: "Tenants", icon: <Building2 className="size-4" /> },
        { to: "/super-admin/packages", label: "Packages", icon: <Package className="size-4" /> },
      ]}
    />
  )
}
