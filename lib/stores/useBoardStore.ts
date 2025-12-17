// lib/stores/useBoardStore.ts
import { create } from 'zustand'

interface BoardStore {
  boardTheme: string
  pieceSet: string
  setBoardTheme: (theme: string) => void
  setPieceSet: (pieceSet: string) => void
  loadPreferences: (userId: string) => Promise<void>
  savePreferences: () => Promise<void>
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boardTheme: 'brown',
  pieceSet: 'merida', // Chess.com style pieces by default

  setBoardTheme: (theme: string) => set({ boardTheme: theme }),

  setPieceSet: (pieceSet: string) => set({ pieceSet: pieceSet }),

  loadPreferences: async (userId: string) => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        set({
          boardTheme: data.user.boardTheme || 'brown',
          pieceSet: data.user.pieceSet || 'merida' // Chess.com style pieces by default
        })
      }
    } catch (error) {
      console.error('Failed to load board preferences:', error)
    }
  },

  savePreferences: async () => {
    const { boardTheme, pieceSet } = get()
    try {
      const response = await fetch('/api/user/board-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardTheme, pieceSet })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save board preferences:', error)
      throw error
    }
  }
}))


