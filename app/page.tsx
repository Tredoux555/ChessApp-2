'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  const [hasChecked, setHasChecked] = useState(false)
  useSocket()

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      if (hasChecked) return
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // Reduced to 5 seconds

        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        if (cancelled) return

        let data
        try {
          data = await res.json()
        } catch (e) {
          data = { user: null }
        }
        
        if (cancelled) return

        if (data.user) {
          setUser(data.user)
          router.push('/dashboard')
        } else {
          setUser(null)
          router.push('/login')
        }
      } catch (error: any) {
        if (cancelled) return
        // On error, redirect to login
        setUser(null)
        router.push('/login')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasChecked(true)
        }
      }
    }

    // Single timeout for both auth check and fallback
    const timeout = setTimeout(() => {
      if (!hasChecked && !cancelled) {
        setLoading(false)
        setUser(null)
        router.push('/login')
        setHasChecked(true)
      }
    }, 6000) // 6 second total timeout

    checkAuth()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [setUser, setLoading, router, hasChecked])

  if (isLoading && !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">If this takes too long, check your database connection</p>
        </div>
      </div>
    )
  }

  return null
}
