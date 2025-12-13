'use client'

import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (!user?.isAdmin) return null

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Panel
      </h1>
      <AdminDashboard />
    </div>
  )
}
