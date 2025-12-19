'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import toast from 'react-hot-toast'

interface ChatInterfaceProps {
  friendId: string
  friendName: string
}

export default function ChatInterface({ friendId, friendName }: ChatInterfaceProps) {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?userId=${friendId}`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (friendId && user) {
      fetchMessages()
    }
  }, [friendId, user])

  useEffect(() => {
    if (!socket) {
      console.warn('Socket not connected, messages may not sync in real-time')
      return
    }

    const handleNewMessage = (message: any) => {
      if (message.senderId === friendId || message.receiverId === friendId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === message.id || (m.content === message.content && m.senderId === message.senderId && Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000))
          if (exists) return prev
          return [...prev, message]
        })
      }
    }

    socket.on('new-message', handleNewMessage)
    socket.on('message-sent', handleNewMessage) // Also listen for sent messages

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('message-sent', handleNewMessage)
    }
  }, [socket, friendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: friendId,
          content: messageContent,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        // Add message to local state immediately
        const newMsg = {
          ...data.message,
          senderId: user.id,
          receiverId: friendId,
          content: messageContent,
        }
        setMessages((prev) => [...prev, newMsg])
        
        // Emit socket event for real-time delivery
        if (socket) {
          socket.emit('chat-message', {
            receiverId: friendId,
            content: messageContent,
          })
        }
      } else {
        toast.error(data.error || 'Failed to send message')
        setNewMessage(messageContent) // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      setNewMessage(messageContent) // Restore message on error
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center h-[600px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {friendName}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}





