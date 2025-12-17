const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Store active games and their timers
  const activeGames = new Map()
  const connectedUsers = new Map() // socketId -> userId

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    // User authentication
    socket.on('authenticate', async (data) => {
      const userId = typeof data === 'string' ? data : data?.userId
      if (userId) {
        connectedUsers.set(socket.id, userId)
        socket.data.userId = userId
        socket.join(`user:${userId}`)
        console.log(`User ${userId} authenticated on socket ${socket.id}`)
        
        // Mark user online
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: true }
          })
          
          // Get user's friends and notify them
          const friendships = await prisma.friendship.findMany({
            where: {
              status: 'accepted',
              OR: [
                { senderId: userId },
                { receiverId: userId }
              ]
            }
          })
          
          friendships.forEach(friendship => {
            const friendId = friendship.senderId === userId 
              ? friendship.receiverId 
              : friendship.senderId
            
            io.to(`user:${friendId}`).emit('user-online', { userId })
          })
        } catch (error) {
          console.error('Authenticate error:', error)
        }
      }
    })

    // Join game room
    socket.on('join-game', (gameId) => {
      socket.join(`game:${gameId}`)
      const userId = connectedUsers.get(socket.id) || 'unknown'
      console.log(`[JOIN] Socket ${socket.id} (user ${userId}) joined game ${gameId}`)
      
      // Verify room membership
      const room = io.sockets.adapter.rooms.get(`game:${gameId}`)
      const roomSize = room ? room.size : 0
      console.log(`[JOIN] Game ${gameId} now has ${roomSize} socket(s)`)
    })

    // Leave game room
    socket.on('leave-game', (gameId) => {
      socket.leave(`game:${gameId}`)
      console.log(`Socket ${socket.id} left game ${gameId}`)
    })

    // Chess move made
    socket.on('move', (data) => {
      console.log(`[MOVE] Received move for game ${data.gameId} from socket ${socket.id}`)
      console.log(`[MOVE] FEN: ${data.fen?.substring(0, 50)}...`)
      console.log(`[MOVE] Times - White: ${data.whiteTimeLeft}, Black: ${data.blackTimeLeft}`)
      
      // Get all sockets in the game room
      const room = io.sockets.adapter.rooms.get(`game:${data.gameId}`)
      const roomSize = room ? room.size : 0
      console.log(`[MOVE] Room size for game ${data.gameId}: ${roomSize}`)
      
      // Broadcast to all other players in the game room (not the sender)
      socket.to(`game:${data.gameId}`).emit('move-made', {
        ...data,
        whiteTimeLeft: data.whiteTimeLeft,
        blackTimeLeft: data.blackTimeLeft,
      })
      console.log(`[MOVE] Broadcast sent to game ${data.gameId} (excluding sender ${socket.id})`)
    })

    // Game state update
    socket.on('game-update', (data) => {
      // Broadcast to all other players in the game room (not the sender)
      socket.to(`game:${data.gameId}`).emit('game-updated', data)
      console.log(`Game update broadcast to game ${data.gameId}`)
    })

    // Draw offer
    socket.on('draw-offer', (data) => {
      io.to(`game:${data.gameId}`).emit('draw-offered', data)
    })

    // Draw response
    socket.on('draw-response', (data) => {
      io.to(`game:${data.gameId}`).emit('draw-responded', data)
    })

    // Resign
    socket.on('resign', (data) => {
      io.to(`game:${data.gameId}`).emit('player-resigned', data)
    })

    // Chat message
    socket.on('chat-message', (data) => {
      // Send to receiver
      io.to(`user:${data.receiverId}`).emit('new-message', data)
      // Send back to sender for confirmation
      io.to(`user:${data.senderId}`).emit('message-sent', data)
    })

    // FEATURE 4: In-Game Chat
    socket.on('game-chat-message', (data) => {
      const { gameId, message } = data
      // Emit to all users in the game room
      io.to(`game:${gameId}`).emit('game-chat-message', {
        gameId,
        message
      })
    })

    // FEATURE 5: User online status
    socket.on('user-online', async (data) => {
      const { userId } = data
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true }
        })
        
        const friendships = await prisma.friendship.findMany({
          where: {
            status: 'accepted',
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        })
        
        friendships.forEach(friendship => {
          const friendId = friendship.senderId === userId 
            ? friendship.receiverId 
            : friendship.senderId
          
          io.to(`user:${friendId}`).emit('user-online', { userId })
        })
      } catch (error) {
        console.error('User online error:', error)
      }
    })

    socket.on('user-offline', async (data) => {
      const { userId } = data
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isOnline: false,
            lastSeenAt: new Date()
          }
        })
        
        const friendships = await prisma.friendship.findMany({
          where: {
            status: 'accepted',
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        })
        
        friendships.forEach(friendship => {
          const friendId = friendship.senderId === userId 
            ? friendship.receiverId 
            : friendship.senderId
          
          io.to(`user:${friendId}`).emit('user-offline', { userId })
        })
      } catch (error) {
        console.error('User offline error:', error)
      }
    })

    // FEATURE 7: Game Quit Flow
    socket.on('game-quit-initiated', (data) => {
      const { gameId, playerId, timeoutSeconds } = data
      // Notify opponent
      io.to(`game:${gameId}`).emit('game-quit-initiated', {
        gameId,
        playerId,
        timeoutSeconds
      })
    })

    socket.on('game-quit-returned', (data) => {
      const { gameId, playerId } = data
      io.to(`game:${gameId}`).emit('game-quit-returned', {
        gameId,
        playerId
      })
    })

    socket.on('game-quit-timeout', (data) => {
      const { gameId, resignedPlayerId } = data
      io.to(`game:${gameId}`).emit('game-quit-timeout', {
        gameId,
        resignedPlayerId
      })
    })

    // Typing indicator
    socket.on('typing', (data) => {
      io.to(`user:${data.receiverId}`).emit('user-typing', data)
    })

    // Friend request
    socket.on('friend-request', (data) => {
      io.to(`user:${data.receiverId}`).emit('new-friend-request', data)
    })

    // Friend request accepted
    socket.on('friend-accepted', (data) => {
      io.to(`user:${data.userId}`).emit('friend-request-accepted', data)
    })

    // Spectate game
    socket.on('spectate-game', (data) => {
      socket.join(`game:${data.gameId}`)
      io.to(`game:${data.gameId}`).emit('spectator-joined', data)
    })

    // Tournament update
    socket.on('tournament-update', (tournamentId) => {
      io.emit('tournament-updated', { tournamentId })
    })

    // Game challenge notification
    socket.on('game-challenge', (data) => {
      io.to(`user:${data.opponentId}`).emit('game-challenge', {
        gameId: data.gameId,
        challenger: data.challenger,
        timeControl: data.timeControl,
      })
    })

    // Move notification (notify opponent it's their turn)
    socket.on('move-notification', (data) => {
      io.to(`user:${data.opponentId}`).emit('move-notification', {
        gameId: data.gameId,
        playerName: data.playerName,
      })
    })

    // Challenge declined notification
    socket.on('challenge-declined', (data) => {
      io.to(`user:${data.challengerId}`).emit('challenge-declined', {
        gameId: data.gameId,
      })
    })

    // Disconnect
    socket.on('disconnect', async () => {
      const userId = connectedUsers.get(socket.id) || socket.data.userId
      if (userId) {
        connectedUsers.delete(socket.id)
        console.log(`User ${userId} disconnected`)
        
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              isOnline: false,
              lastSeenAt: new Date()
            }
          })
          
          // Get user's friends and notify them
          const friendships = await prisma.friendship.findMany({
            where: {
              status: 'accepted',
              OR: [
                { senderId: userId },
                { receiverId: userId }
              ]
            }
          })
          
          friendships.forEach(friendship => {
            const friendId = friendship.senderId === userId 
              ? friendship.receiverId 
              : friendship.senderId
            
            io.to(`user:${friendId}`).emit('user-offline', { userId })
          })
        } catch (error) {
          console.error('Disconnect error:', error)
        }
      }
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

