// components/chess/GameChatBox.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useFriendsStore } from '@/lib/stores/useFriendsStore'
import toast from 'react-hot-toast'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

interface GameChatBoxProps {
  gameId: string
  opponentId: string
  opponentName: string
}

export default function GameChatBox({
  gameId,
  opponentId,
  opponentName
}: GameChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isFriend, setIsFriend] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  const { friends } = useFriendsStore()

  // For in-game chat, allow chatting regardless of friendship status
  // Players in a game together should be able to chat
  useEffect(() => {
    // Always allow chat in-game (players are in the same game)
    setIsFriend(true)
  }, [])

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {

      try {
        const response = await fetch(`/api/messages?gameId=${gameId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [gameId])

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return

    socket.on('game-chat-message', (data: any) => {
      if (data.gameId === gameId) {
        setMessages(prev => [...prev, data.message])
      }
    })

    return () => {
      socket.off('game-chat-message')
    }
  }, [socket, gameId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: opponentId,
          content: newMessage.trim(),
          gameId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        
        // Emit socket event
        socket?.emit('game-chat-message', {
          gameId,
          message: data.message
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Send message error:', error)
      toast.error('Failed to send message')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-500 text-center">Loading chat...</p>
      </div>
    )
  }


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col h-96">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
        Chat with {opponentName}
      </h3>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-2 border border-gray-200 dark:border-gray-700 rounded p-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No messages yet. Say hi!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.senderId === user?.id
                  ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                  : 'bg-gray-100 dark:bg-gray-700 mr-8'
              }`}
            >
              <p className="text-sm text-gray-900 dark:text-white break-words">
                {msg.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}



