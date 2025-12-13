import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BoardTheme = 'default' | 'blue' | 'green' | 'brown' | 'grey'

interface ThemeState {
  boardTheme: BoardTheme
  setBoardTheme: (theme: BoardTheme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      boardTheme: 'default',
      setBoardTheme: (theme) => set({ boardTheme: theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
)





