'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'
import MobileNav from '@/components/layout/MobileNav'
import Header from '@/components/layout/Header'
import NotificationListener from '@/components/notifications/NotificationListener'

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  useSocket()

  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        try {
          setLoading(true)
          const res = await fetch('/api/auth/me', { credentials: 'include' })
          const data = await res.json()
          if (res.ok && data.user) {
            setUser(data.user)
          } else {
            setLoading(false)
            router.push('/login')
          }
        } catch (error) {
          console.error('Error loading user:', error)
          setLoading(false)
          router.push('/login')
        }
      } else {
        setLoading(false)
      }
    }
    loadUser()
  }, [user, setUser, setLoading, router])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <NotificationListener />
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 mb-20 md:mb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}


