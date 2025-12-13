'use client'

import { useState } from 'react'
import FriendsList from '@/components/chat/FriendsList'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Chat
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <FriendsList
            onSelectFriend={(id, name) => setSelectedFriend({ id, name })}
          />
        </div>

        <div className="md:col-span-2">
          {selectedFriend ? (
            <ChatInterface
              friendId={selectedFriend.id}
              friendName={selectedFriend.name}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center h-[600px] flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Select a friend to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
