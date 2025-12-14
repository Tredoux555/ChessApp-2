const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

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
    socket.on('authenticate', (userId) => {
      connectedUsers.set(socket.id, userId)
      socket.join(`user:${userId}`)
      console.log(`User ${userId} authenticated on socket ${socket.id}`)
    })

    // Join game room
    socket.on('join-game', (gameId) => {
      socket.join(`game:${gameId}`)
      console.log(`Socket ${socket.id} joined game ${gameId}`)
    })

    // Leave game room
    socket.on('leave-game', (gameId) => {
      socket.leave(`game:${gameId}`)
      console.log(`Socket ${socket.id} left game ${gameId}`)
    })

    // Chess move made
    socket.on('move', (data) => {
      io.to(`game:${data.gameId}`).emit('move-made', {
        ...data,
        whiteTimeLeft: data.whiteTimeLeft,
        blackTimeLeft: data.blackTimeLeft,
      })
    })

    // Game state update
    socket.on('game-update', (data) => {
      io.to(`game:${data.gameId}`).emit('game-updated', data)
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

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

