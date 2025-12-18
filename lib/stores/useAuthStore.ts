// Auth store for user authentication state
import { create } from 'zustand'

interface User {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  profileImage: string | null
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null }),
}))





