'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (res.ok && data.user) {
          setUser(data.user)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [router])

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user?.isAdmin) return null

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Panel
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Admin dashboard coming soon...
      </p>
    </div>
  )
}
