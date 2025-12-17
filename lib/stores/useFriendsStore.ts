// lib/stores/useFriendsStore.ts
import { create } from 'zustand'

interface Friend {
  id: string
  username: string
  displayName: string | null
  profileImage: string | null
  isOnline: boolean
  lastSeenAt: Date | null
}

interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: string
  createdAt: Date
  sender: {
    id: string
    username: string
    displayName: string | null
    profileImage: string | null
    isOnline: boolean
  }
}

interface FriendsStore {
  friends: Friend[]
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  isLoading: boolean
  loadFriends: () => Promise<void>
  loadPendingRequests: () => Promise<void>
  addFriend: (userId: string) => Promise<void>
  acceptRequest: (friendshipId: string) => Promise<void>
  rejectRequest: (friendshipId: string) => Promise<void>
  removeFriend: (friendshipId: string) => Promise<void>
  updateFriendOnlineStatus: (userId: string, isOnline: boolean) => void
}

export const useFriendsStore = create<FriendsStore>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,

  loadFriends: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/friends')
      if (response.ok) {
        const data = await response.json()
        set({ friends: data.friends || [] })
      }
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadPendingRequests: async () => {
    try {
      const response = await fetch('/api/friends?status=pending')
      if (response.ok) {
        const data = await response.json()
        set({ 
          pendingRequests: data.received || [],
          sentRequests: data.sent || []
        })
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error)
    }
  },

  addFriend: async (userId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      })
      
      if (response.ok) {
        await get().loadPendingRequests()
      }
    } catch (error) {
      console.error('Failed to send friend request:', error)
      throw error
    }
  },

  acceptRequest: async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status: 'accepted' })
      })
      
      if (response.ok) {
        await get().loadFriends()
        await get().loadPendingRequests()
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      throw error
    }
  },

  rejectRequest: async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status: 'rejected' })
      })
      
      if (response.ok) {
        await get().loadPendingRequests()
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      throw error
    }
  },

  removeFriend: async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await get().loadFriends()
      }
    } catch (error) {
      console.error('Failed to remove friend:', error)
      throw error
    }
  },

  updateFriendOnlineStatus: (userId: string, isOnline: boolean) => {
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === userId ? { ...friend, isOnline } : friend
      )
    }))
  }
}))


