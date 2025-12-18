'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import SendFriendRequest from './SendFriendRequest'
import toast from 'react-hot-toast'

interface SearchResult {
  id: string
  username: string
  displayName: string | null
  profileImage: string | null
}

export default function UserSearch() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error('Please enter at least 2 characters')
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/friends?search=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      
      if (res.ok) {
        // Filter out the current user from results
        const filteredResults = (data.users || []).filter(
          (u: SearchResult) => u.id !== user?.id
        )
        setResults(filteredResults)
      } else {
        toast.error(data.error || 'Failed to search users')
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search users')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Find Friends
      </h3>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      <div className="space-y-2">
        {isSearching ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Searching...
          </p>
        ) : hasSearched && results.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No users found
          </p>
        ) : (
          results.map((searchUser) => (
            <div
              key={searchUser.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {searchUser.profileImage ? (
                  <img
                    src={searchUser.profileImage}
                    alt={searchUser.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {searchUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {searchUser.displayName || searchUser.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{searchUser.username}
                  </p>
                </div>
              </div>
              <SendFriendRequest
                userId={searchUser.id}
                username={searchUser.username}
                displayName={searchUser.displayName || undefined}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

