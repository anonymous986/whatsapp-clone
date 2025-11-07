import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved preference from localStorage
    const saved = localStorage.getItem('whatsapp-clone-theme') as Theme
    if (saved && (saved === 'dark' || saved === 'light')) {
      setThemeState(saved)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setThemeState('light')
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('whatsapp-clone-theme', newTheme)

    // Update document classes and attributes
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(newTheme)
    root.setAttribute('data-theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)

    // Update CSS custom properties for theme colors
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#111b21')
      root.style.setProperty('--bg-secondary', '#202c33')
      root.style.setProperty('--bg-tertiary', '#2a3942')
      root.style.setProperty('--text-primary', '#e9edef')
      root.style.setProperty('--text-secondary', '#8796a1')
      root.style.setProperty('--text-tertiary', '#667781')
      root.style.setProperty('--border-color', '#2a3942')
      root.style.setProperty('--message-sent', '#005c4b')
      root.style.setProperty('--message-received', '#202c33')
    } else {
      root.style.setProperty('--bg-primary', '#f0f2f5')
      root.style.setProperty('--bg-secondary', '#ffffff')
      root.style.setProperty('--bg-tertiary', '#f9f9f9')
      root.style.setProperty('--text-primary', '#111b21')
      root.style.setProperty('--text-secondary', '#667781')
      root.style.setProperty('--text-tertiary', '#8696a6')
      root.style.setProperty('--border-color', '#d1d9db')
      root.style.setProperty('--message-sent', '#dcf8c6')
      root.style.setProperty('--message-received', '#ffffff')
    }
  }, [theme, mounted])

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}