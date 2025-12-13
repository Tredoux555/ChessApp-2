import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '@/types/socket'

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...')

    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    })

    // Store active games and their timers
    const activeGames = new Map<string, NodeJS.Timeout>()
    const connectedUsers = new Map<string, string>() // socketId -> userId

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      // User authentication
      socket.on('authenticate', (userId: string) => {
        connectedUsers.set(socket.id, userId)
        socket.join(`user:${userId}`)
        console.log(`User ${userId} authenticated on socket ${socket.id}`)
      })

      // Join game room
      socket.on('join-game', (gameId: string) => {
        socket.join(`game:${gameId}`)
        console.log(`Socket ${socket.id} joined game ${gameId}`)
      })

      // Leave game room
      socket.on('leave-game', (gameId: string) => {
        socket.leave(`game:${gameId}`)
        console.log(`Socket ${socket.id} left game ${gameId}`)
      })

      // Chess move made
      socket.on('move', (data: { gameId: string; move: any; fen: string; pgn: string; whiteTimeLeft?: number; blackTimeLeft?: number }) => {
        io.to(`game:${data.gameId}`).emit('move-made', {
          ...data,
          whiteTimeLeft: data.whiteTimeLeft,
          blackTimeLeft: data.blackTimeLeft,
        })
      })

      // Game state update
      socket.on('game-update', (data: { gameId: string; state: any }) => {
        io.to(`game:${data.gameId}`).emit('game-updated', data)
      })

      // Draw offer
      socket.on('draw-offer', (data: { gameId: string; offererId: string }) => {
        io.to(`game:${data.gameId}`).emit('draw-offered', data)
      })

      // Draw response
      socket.on('draw-response', (data: { gameId: string; accepted: boolean }) => {
        io.to(`game:${data.gameId}`).emit('draw-responded', data)
      })

      // Resign
      socket.on('resign', (data: { gameId: string; resignerId: string }) => {
        io.to(`game:${data.gameId}`).emit('player-resigned', data)
      })

      // Chat message
      socket.on('chat-message', (data: { 
        senderId: string
        receiverId: string
        content: string
        messageId: string
      }) => {
        // Send to receiver
        io.to(`user:${data.receiverId}`).emit('new-message', data)
        // Send back to sender for confirmation
        io.to(`user:${data.senderId}`).emit('message-sent', data)
      })

      // Typing indicator
      socket.on('typing', (data: { senderId: string; receiverId: string }) => {
        io.to(`user:${data.receiverId}`).emit('user-typing', data)
      })

      // Friend request
      socket.on('friend-request', (data: { receiverId: string; sender: any }) => {
        io.to(`user:${data.receiverId}`).emit('new-friend-request', data)
      })

      // Friend request accepted
      socket.on('friend-accepted', (data: { userId: string; friend: any }) => {
        io.to(`user:${data.userId}`).emit('friend-request-accepted', data)
      })

      // Spectate game
      socket.on('spectate-game', (data: { gameId: string; userId: string }) => {
        socket.join(`game:${data.gameId}`)
        io.to(`game:${data.gameId}`).emit('spectator-joined', data)
      })

      // Tournament update
      socket.on('tournament-update', (tournamentId: string) => {
        io.emit('tournament-updated', { tournamentId })
      })

      // Game challenge notification
      socket.on('game-challenge', (data: {
        gameId: string
        opponentId: string
        challenger: { id: string; username: string; displayName?: string }
        timeControl: number
      }) => {
        io.to(`user:${data.opponentId}`).emit('game-challenge', {
          gameId: data.gameId,
          challenger: data.challenger,
          timeControl: data.timeControl,
        })
      })

      // Move notification (notify opponent it's their turn)
      socket.on('move-notification', (data: { gameId: string; opponentId: string; playerName: string }) => {
        io.to(`user:${data.opponentId}`).emit('move-notification', {
          gameId: data.gameId,
          playerName: data.playerName,
        })
      })

      // Disconnect
      socket.on('disconnect', () => {
        const userId = connectedUsers.get(socket.id)
        if (userId) {
          connectedUsers.delete(socket.id)
          console.log(`User ${userId} disconnected`)
        }
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  } else {
    console.log('Socket.io server already running')
  }
  res.end()
}

export default ioHandler
