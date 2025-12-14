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
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 8000) // 8 second timeout

        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (cancelled) return

        // Handle any response, even if not ok
        let data
        try {
          data = await res.json()
        } catch (e) {
          // If JSON parsing fails, assume no user
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
        
        console.error('Auth check error:', error)
        
        // Always redirect to login on error
        setUser(null)
        router.push('/login')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHasChecked(true)
        }
      }
    }

    // Fallback timeout - if still loading after 10 seconds, force redirect
    const fallbackTimeout = setTimeout(() => {
      if (!hasChecked) {
        console.warn('Auth check taking too long, forcing redirect to login')
        setLoading(false)
        setUser(null)
        router.push('/login')
        setHasChecked(true)
      }
    }, 10000)

    checkAuth()

    return () => {
      cancelled = true
      clearTimeout(fallbackTimeout)
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
