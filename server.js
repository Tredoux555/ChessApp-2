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
  
  // Periodic timer sync (every 1 second for accurate sync)
  setInterval(async () => {
    try {
      const activeGameIds = Array.from(activeGames.keys())
      for (const gameId of activeGameIds) {
        try {
          const game = await prisma.game.findUnique({
            where: { id: gameId },
            select: { 
              whiteTimeLeft: true, 
              blackTimeLeft: true, 
              status: true,
              lastMoveAt: true,
              fen: true
            }
          })
          
          if (game && game.status === 'active') {
            // Calculate actual time remaining based on lastMoveAt
            const now = Date.now()
            const lastMoveTime = game.lastMoveAt ? new Date(game.lastMoveAt).getTime() : now
            const elapsedSeconds = Math.floor((now - lastMoveTime) / 1000)
            
            // Determine whose turn it is from FEN (last character before space)
            const turnChar = game.fen ? game.fen.split(' ')[1] : 'w'
            const isWhiteTurn = turnChar === 'w'
            
            // Calculate actual times
            let whiteTime = game.whiteTimeLeft
            let blackTime = game.blackTimeLeft
            
            if (isWhiteTurn && elapsedSeconds > 0) {
              whiteTime = Math.max(0, game.whiteTimeLeft - elapsedSeconds)
            } else if (!isWhiteTurn && elapsedSeconds > 0) {
              blackTime = Math.max(0, game.blackTimeLeft - elapsedSeconds)
            }
            
            // Only sync if times have changed significantly (avoid unnecessary updates)
            if (Math.abs(whiteTime - game.whiteTimeLeft) > 0 || Math.abs(blackTime - game.blackTimeLeft) > 0) {
              io.to(`game:${gameId}`).emit('timer-sync', {
                gameId,
                whiteTimeLeft: whiteTime,
                blackTimeLeft: blackTime
              })
            }
          } else if (!game) {
            // Game was deleted, remove from activeGames
            activeGames.delete(gameId)
          }
        } catch (gameError) {
          console.error(`Timer sync error for game ${gameId}:`, gameError)
          // Remove problematic game from activeGames
          activeGames.delete(gameId)
        }
      }
    } catch (error) {
      console.error('Timer sync error:', error)
    }
  }, 1000) // Sync every 1 second for better accuracy

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    // User authentication
    socket.on('authenticate', async (data) => {
      const userId = typeof data === 'string' ? data : data?.userId
      if (userId) {
        // Verify user exists and is not banned/suspended
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isBanned: true, isSuspended: true }
          })
          
          if (!user || user.isBanned) {
            console.warn(`Invalid or banned user attempted socket auth: ${userId}`)
            socket.disconnect()
            return
          }
          
          if (user.isSuspended) {
            console.warn(`Suspended user attempted socket auth: ${userId}`)
            socket.disconnect()
            return
          }
        } catch (error) {
          console.error('Socket auth verification error:', error)
          socket.disconnect()
          return
        }
        
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
      // Broadcast resignation to all players in the game
      io.to(`game:${data.gameId}`).emit('player-resigned', {
        gameId: data.gameId,
        resignedPlayerId: data.resignedPlayerId || data.playerId,
        winner: data.winner
      })
      // Also emit game-updated to sync state
      io.to(`game:${data.gameId}`).emit('game-updated', {
        gameId: data.gameId,
        status: 'completed',
        result: data.winner
      })
    })

    // Chat message
    socket.on('chat-message', (data) => {
      const userId = connectedUsers.get(socket.id)
      if (!userId) return
      
      const messageData = {
        id: data.messageId || null, // Include message ID if available
        senderId: userId,
        receiverId: data.receiverId,
        content: data.content,
        createdAt: data.createdAt || new Date().toISOString(),
        tempId: data.tempId || null
      }
      
      // Send to receiver
      io.to(`user:${data.receiverId}`).emit('new-message', messageData)
      // Send back to sender for confirmation (only if not already in their list)
      socket.emit('message-sent', messageData)
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

