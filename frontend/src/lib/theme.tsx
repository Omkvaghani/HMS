import { useEffect, useMemo, useState } from "react"
import { ThemeContext, type Theme } from "./theme-context"

const STORAGE_KEY = "hms.theme"
const THEMES: Theme[] = ["light", "dark", "super-dark"]

function readInitial(): Theme {
  if (typeof window === "undefined") return "light"
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark" || saved === "super-dark") return saved
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readInitial())

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark", "super-dark")
    if (theme === "dark") root.classList.add("dark")
    if (theme === "super-dark") root.classList.add("super-dark")
    root.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggle: () =>
        setThemeState((t) => {
          const idx = THEMES.indexOf(t)
          return THEMES[(idx + 1) % THEMES.length]
        }),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
