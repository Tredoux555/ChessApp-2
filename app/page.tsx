'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  useSocket()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (data.user) {
          setUser(data.user)
          router.push('/dashboard')
        } else {
          setUser(null)
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
