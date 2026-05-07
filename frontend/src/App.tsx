import { Navigate, Route, Routes } from "react-router-dom"

import LandingPage from "@/pages/marketing/LandingPage"
import OnboardingApplyPage from "@/pages/marketing/OnboardingApplyPage"
import SignInPage from "@/pages/auth/SignInPage"
import SignUpPage from "@/pages/auth/SignUpPage"

import SuperAdminLayout from "@/pages/super-admin/SuperAdminLayout"
import SuperAdminDashboard from "@/pages/super-admin/DashboardPage"
import SuperAdminOnboardingInbox from "@/pages/super-admin/OnboardingInboxPage"
import SuperAdminPackages from "@/pages/super-admin/PackagesPage"
import SuperAdminTenants from "@/pages/super-admin/TenantsPage"

import HotelAdminLayout from "@/pages/hotel-admin/HotelAdminLayout"
import HotelDashboard from "@/pages/hotel-admin/DashboardPage"
import HotelRooms from "@/pages/hotel-admin/RoomsPage"
import HotelRoomClasses from "@/pages/hotel-admin/RoomClassesPage"
import HotelCustomers from "@/pages/hotel-admin/CustomersPage"
import HotelBookings from "@/pages/hotel-admin/BookingsPage"
import HotelStaff from "@/pages/hotel-admin/StaffPage"
import HotelExpenses from "@/pages/hotel-admin/ExpensesPage"
import HotelCash from "@/pages/hotel-admin/CashPage"
import HotelSettings from "@/pages/hotel-admin/SettingsPage"

import BookingEnginePage from "@/pages/book/BookingEnginePage"

import RequireAuth from "@/components/RequireAuth"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/apply" element={<OnboardingApplyPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      <Route
        path="/super-admin"
        element={
          <RequireAuth roles={["SUPER_ADMIN"]}>
            <SuperAdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="onboarding" element={<SuperAdminOnboardingInbox />} />
        <Route path="packages" element={<SuperAdminPackages />} />
        <Route path="tenants" element={<SuperAdminTenants />} />
      </Route>

      <Route
        path="/hotel-admin"
        element={
          <RequireAuth roles={["HOTEL_ADMIN", "STAFF"]}>
            <HotelAdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HotelDashboard />} />
        <Route path="bookings" element={<HotelBookings />} />
        <Route path="rooms" element={<HotelRooms />} />
        <Route path="room-classes" element={<HotelRoomClasses />} />
        <Route path="customers" element={<HotelCustomers />} />
        <Route path="staff" element={<HotelStaff />} />
        <Route path="expenses" element={<HotelExpenses />} />
        <Route path="cash" element={<HotelCash />} />
        <Route path="settings" element={<HotelSettings />} />
      </Route>

      <Route path="/book/:subdomain" element={<BookingEnginePage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
