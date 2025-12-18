// Admin dashboard with user and message management
'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import ProductForm from '@/components/marketplace/ProductForm'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  displayName: string | null
  profileImage: string | null
  isAdmin: boolean
  createdAt: string
  _count: {
    gamesAsWhite: number
    gamesAsBlack: number
    sentMessages: number
  }
}

interface Message {
  id: string
  content: string
  isFlagged: boolean
  createdAt: string
  sender: {
    id: string
    username: string
    displayName: string | null
  }
  receiver: {
    id: string
    username: string
    displayName: string | null
  }
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'messages' | 'products'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(true)

  // Load users
  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      } else {
        toast.error(data.error || 'Failed to load users')
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Load messages
  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/messages?flagged=${showFlaggedOnly}`)
      const data = await res.json()
      if (res.ok) {
        setMessages(data.messages)
      } else {
        toast.error(data.error || 'Failed to load messages')
      }
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'messages') {
      loadMessages()
    }
  }, [activeTab, showFlaggedOnly])

  // User actions
  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`User ${action} successful`)
        loadUsers()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

  // Message actions
  const handleMessageAction = async (messageId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Message ${action} successful`)
        loadMessages()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

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
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Messages ({messages.length})
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
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
              <button
                onClick={loadUsers}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400">Games</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400">Messages</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400">Admin</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{u.username}</div>
                              {u.displayName && (
                                <div className="text-xs text-gray-500">{u.displayName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          {u._count.gamesAsWhite + u._count.gamesAsBlack}
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          {u._count.sentMessages}
                        </td>
                        <td className="py-3 px-2">
                          {u.isAdmin ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs">
                              ADMIN
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs">
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            {u.isAdmin ? (
                              <button
                                onClick={() => handleUserAction(u.id, 'remove-admin')}
                                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                                disabled={u.id === user.id}
                              >
                                Remove Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(u.id, 'make-admin')}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Make Admin
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Delete user ${u.username}? This cannot be undone.`)) {
                                  handleUserAction(u.id, 'delete')
                                }
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              disabled={u.id === user.id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Message Moderation
              </h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showFlaggedOnly}
                    onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                    className="rounded"
                  />
                  Flagged only
                </label>
                <button
                  onClick={loadMessages}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {showFlaggedOnly ? 'No flagged messages 🎉' : 'No messages found'}
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg border ${
                      msg.isFlagged
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {msg.sender.displayName || msg.sender.username}
                          </span>
                          {' → '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {msg.receiver.displayName || msg.receiver.username}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-900 dark:text-white">{msg.content}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {msg.isFlagged && (
                          <button
                            onClick={() => handleMessageAction(msg.id, 'unflag')}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            ✓ Unflag
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this message?')) {
                              handleMessageAction(msg.id, 'delete')
                            }
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Product Management
            </h2>
            <ProductForm onSuccess={() => toast.success('Product added!')} />
          </div>
        )}
      </div>
    </div>
  )
}
