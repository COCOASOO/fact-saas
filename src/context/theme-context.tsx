"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "@/lib/hooks/useLocalStorage"

type FontSize = "small" | "medium" | "large"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultContrast?: boolean
  defaultFontSize?: FontSize
  defaultCompactMode?: boolean
}

interface ThemeContextType {
  contrast: boolean
  fontSize: FontSize
  compactMode: boolean
  setContrast: (contrast: boolean) => void
  setFontSize: (size: FontSize) => void
  setCompactMode: (compact: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultContrast = false,
  defaultFontSize = "medium",
  defaultCompactMode = false,
}: ThemeProviderProps) {
  const [contrast, setContrast] = useLocalStorage<boolean>("ui-contrast", defaultContrast)
  const [fontSize, setFontSize] = useLocalStorage<FontSize>("ui-font-size", defaultFontSize)
  const [compactMode, setCompactMode] = useLocalStorage<boolean>("ui-compact-mode", defaultCompactMode)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Aplicar contraste
    if (contrast) {
      root.classList.add("contrast-more")
    } else {
      root.classList.remove("contrast-more")
    }
    
    // Aplicar tamaño de fuente
    root.classList.remove("text-sm", "text-base", "text-lg")
    switch (fontSize) {
      case "small":
        root.classList.add("text-sm")
        break
      case "medium":
        root.classList.add("text-base")
        break
      case "large":
        root.classList.add("text-lg")
        break
    }
    
    // Aplicar modo compacto
    if (compactMode) {
      root.classList.add("ui-compact")
    } else {
      root.classList.remove("ui-compact")
    }
  }, [contrast, fontSize, compactMode])

  const value = {
    contrast,
    fontSize,
    compactMode,
    setContrast,
    setFontSize,
    setCompactMode,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
} 