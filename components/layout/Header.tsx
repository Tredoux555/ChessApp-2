// Header component with navigation
'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ♟️ Riddick Chess
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Home
            </Link>
            <Link href="/dashboard/game-history" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Game History
            </Link>
            <Link href="/chat" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Chat
            </Link>
            <Link href="/marketplace" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Shop
            </Link>
            <Link href="/settings/board" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
              Settings
            </Link>
            {user?.isAdmin && (
              <Link href="/admin" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">
                Admin
              </Link>
            )}
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          {/* Profile */}
          <Link href="/profile" className="flex items-center space-x-3 hover:opacity-80">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            )}
            {user?.isAdmin && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                ADMIN
              </span>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}





