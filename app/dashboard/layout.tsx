'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'
import MobileNav from '@/components/layout/MobileNav'
import Header from '@/components/layout/Header'
import NotificationListener from '@/components/notifications/NotificationListener'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  useSocket()

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
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}





