import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL ?? "/api/v1"

export const api = axios.create({
  baseURL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
})

const TOKEN_KEY = "hms.token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      setToken(null)
      // soft redirect — let the AuthProvider re-render
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/sign-in")) {
        window.location.href = "/sign-in"
      }
    }
    return Promise.reject(error)
  },
)

export type ApiError = {
  message?: string
  errors?: Record<string, string[]>
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined
    if (data?.errors) {
      return Object.values(data.errors).flat().join(" ")
    }
    if (data?.message) return data.message
    return err.message
  }
  return fallback
}
