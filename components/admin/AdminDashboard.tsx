'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import ProductForm from '@/components/marketplace/ProductForm'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'messages' | 'products'>('users')

  if (!user?.isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Access denied. Admin only.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Flagged Messages
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Products
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              User management features coming soon. Connect to /api/admin/users API.
            </p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Flagged Messages
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Message moderation features coming soon. Connect to /api/admin/messages API.
            </p>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Product Management
            </h2>
            <ProductForm onSuccess={() => setActiveTab('products')} />
          </div>
        )}
      </div>
    </div>
  )
}





