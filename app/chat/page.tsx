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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center h-[600px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No friend selected
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a friend from the list to start chatting
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Don't have friends yet? Use the "+ Add" button to find and add friends!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
