import { useCallback, useEffect, useMemo, useState } from "react"
import { api, getToken, setToken } from "@/lib/api"
import { AuthContext, type AuthCtx, type AuthUser } from "@/lib/auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(getToken()))

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const { data } = await api.get<{ user: AuthUser }>("/auth/me")
      setUser(data.user)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial token validation on mount; refresh is stable via useCallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const login = useCallback<AuthCtx["login"]>(async (email, password) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
      device_name: navigator.userAgent.slice(0, 100),
    })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const registerGuest = useCallback<AuthCtx["registerGuest"]>(
    async (name, email, password, password_confirmation, phone) => {
      const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/register", {
        name,
        email,
        password,
        password_confirmation,
        phone,
      })
      setToken(data.token)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      /* ignore */
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      registerGuest,
      logout,
      refresh,
    }),
    [user, isLoading, login, registerGuest, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
