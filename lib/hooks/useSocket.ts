// Socket hook for real-time communication
'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSocketStore } from '../stores/useSocketStore'
import { useAuthStore } from '../stores/useAuthStore'

export function useSocket() {
  const { socket, setSocket, setConnected } = useSocketStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    // Use the same origin for socket connection (works in both dev and production)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
    console.log('Initializing socket connection to:', socketUrl)
    
    const socketInstance: Socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setConnected(true)
      socketInstance.emit('authenticate', user.id)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnected(false)
      // Show user-friendly error message after multiple failed attempts
      // Track reconnection attempts manually
      let reconnectCount = 0
      socketInstance.io.on('reconnect_attempt', () => {
        reconnectCount++
        if (reconnectCount >= 3) {
          // Only show error after 3+ failed attempts to avoid spam
          console.warn('Socket connection failed multiple times. Please check your connection.')
        }
      })
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [user, setSocket, setConnected])

  return socket
}





