import { createContext } from "react"

export type Role = "SUPER_ADMIN" | "HOTEL_ADMIN" | "STAFF" | "GUEST"

export type AuthUser = {
  id: number
  name: string
  email: string
  role: Role
  tenant_id: string | null
  phone: string | null
  avatar_url: string | null
}

export type AuthCtx = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  registerGuest: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    phone?: string,
  ) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
