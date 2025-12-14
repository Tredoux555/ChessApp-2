'use client'

import { useState, useEffect } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useThemeStore } from '@/lib/stores/useThemeStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import GameControls from './GameControls'
import GameInfo from './GameInfo'
import toast from 'react-hot-toast'

interface ChessGameProps {
  gameId: string
  initialFen?: string
  initialPgn?: string
  whitePlayer: any
  blackPlayer: any
  timeControl: number
  whiteTimeLeft: number
  blackTimeLeft: number
  status: string
  result?: string
  isSpectator?: boolean
}

export default function ChessGame({
  gameId,
  initialFen,
  initialPgn,
  whitePlayer,
  blackPlayer,
  timeControl,
  whiteTimeLeft: initialWhiteTime,
  blackTimeLeft: initialBlackTime,
  status: initialStatus,
  result: initialResult,
  isSpectator = false,
}: ChessGameProps) {
  const [game] = useState(() => new Chess(initialFen))
  const [fen, setFen] = useState(initialFen || game.fen())
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime)
  const [blackTime, setBlackTime] = useState(initialBlackTime)
  const [status, setStatus] = useState(initialStatus)
  const [result, setResult] = useState(initialResult)
  const { socket } = useSocketStore()
  const { boardTheme } = useThemeStore()
  const { user } = useAuthStore()

  const playerColor = user?.id === whitePlayer?.id ? 'w' : user?.id === blackPlayer?.id ? 'b' : null
  const isPlayerTurn = playerColor !== null && game.turn() === playerColor
  const isGameActive = status === 'active' || status.includes('draw_offered')
  const isPending = status === 'pending'
  

  // Join game room - ensure socket is connected first
  useEffect(() => {
    if (!socket || !gameId) return

    const joinGame = () => {
      if (socket.connected) {
        console.log(`Joining game room: ${gameId}`)
        socket.emit('join-game', gameId)
      } else {
        console.log('Socket not connected yet, waiting...')
        // Wait for connection
        const connectHandler = () => {
          console.log(`Socket connected, joining game room: ${gameId}`)
          socket.emit('join-game', gameId)
          socket.off('connect', connectHandler)
        }
        socket.on('connect', connectHandler)
      }
    }

    joinGame()

    return () => {
      if (socket.connected) {
        console.log(`Leaving game room: ${gameId}`)
        socket.emit('leave-game', gameId)
      }
    }
  }, [socket, gameId])

  // Listen for moves, time updates, draw offers, and game state changes
  useEffect(() => {
    if (!socket) return

    const handleMove = (data: any) => {
      if (data.gameId === gameId) {
        console.log('Received move via socket:', data)
        try {
          // Load the new position into the Chess object
          const newGame = new Chess(data.fen)
          game.load(data.fen)
          setFen(data.fen)
          
          console.log('Move applied successfully. New FEN:', data.fen)
          console.log('New turn:', newGame.turn())
          
          // Sync times from server
          if (data.whiteTimeLeft !== undefined) {
            setWhiteTime(data.whiteTimeLeft)
          }
          if (data.blackTimeLeft !== undefined) {
            setBlackTime(data.blackTimeLeft)
          }
          
          // Show a subtle notification that opponent moved
          toast(`Opponent moved`, { icon: '♟️', duration: 2000 })
        } catch (error) {
          console.error('Error loading move:', error)
          toast.error('Error applying opponent\'s move')
        }
      } else {
        console.log('Received move for different game:', data.gameId, 'current game:', gameId)
      }
    }

    const handleGameUpdate = (data: any) => {
      if (data.gameId === gameId) {
        console.log('Received game update via socket:', data)
        if (data.state) {
          setStatus(data.state.status || status)
          setResult(data.state.result || result)
          // Sync times from server update
          if (data.state.whiteTimeLeft !== undefined) {
            setWhiteTime(data.state.whiteTimeLeft)
          }
          if (data.state.blackTimeLeft !== undefined) {
            setBlackTime(data.state.blackTimeLeft)
          }
        }
      }
    }

    const handleDrawOffered = (data: any) => {
      if (data.gameId === gameId) {
        console.log('Draw offer received:', data)
        const newStatus = data.offererColor === 'w' ? 'draw_offered_white' : 'draw_offered_black'
        setStatus(newStatus)
        toast('Your opponent has offered a draw', { icon: '♟️' })
      }
    }

    const handleDrawResponded = (data: any) => {
      if (data.gameId === gameId) {
        console.log('Draw response received:', data)
        if (data.accepted) {
          setStatus('completed')
          setResult('draw')
          toast.success('Draw accepted!')
        } else {
          setStatus('active')
          toast('Draw offer declined', { icon: 'ℹ️' })
        }
      }
    }

    const handlePlayerResigned = (data: any) => {
      if (data.gameId === gameId) {
        console.log('Player resigned:', data)
        setStatus('completed')
        const winner = data.resignerColor === 'w' ? 'black_wins' : 'white_wins'
        setResult(winner)
        toast('Your opponent has resigned', { icon: '🏳️' })
      }
    }

    const handleTimeSync = (data: any) => {
      if (data.gameId === gameId) {
        // Periodic time sync from server
        if (data.whiteTimeLeft !== undefined) {
          setWhiteTime(data.whiteTimeLeft)
        }
        if (data.blackTimeLeft !== undefined) {
          setBlackTime(data.blackTimeLeft)
        }
      }
    }

    socket.on('move-made', handleMove)
    socket.on('game-updated', handleGameUpdate)
    socket.on('draw-offered', handleDrawOffered)
    socket.on('draw-responded', handleDrawResponded)
    socket.on('player-resigned', handlePlayerResigned)
    socket.on('time-sync', handleTimeSync)

    return () => {
      socket.off('move-made', handleMove)
      socket.off('game-updated', handleGameUpdate)
      socket.off('draw-offered', handleDrawOffered)
      socket.off('draw-responded', handleDrawResponded)
      socket.off('player-resigned', handlePlayerResigned)
      socket.off('time-sync', handleTimeSync)
    }
  }, [socket, gameId, game, status, result])

  // Time countdown - only decrement locally, server will sync
  // IMPORTANT: Only start timer if game status is 'active' (not 'pending')
  useEffect(() => {
    if (!isGameActive || status !== 'active') return

    const interval = setInterval(() => {
      // Only countdown if it's the active player's turn
      if (game.turn() === 'w' && whiteTime > 0) {
        setWhiteTime((t) => Math.max(0, t - 1))
      } else if (game.turn() === 'b' && blackTime > 0) {
        setBlackTime((t) => Math.max(0, t - 1))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isGameActive, status, game.turn(), whiteTime, blackTime])

  // Periodic time sync from server every 5 seconds
  useEffect(() => {
    if (!isGameActive || !socket) return

    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`)
        const data = await res.json()
        if (data.game && res.ok) {
          setWhiteTime(data.game.whiteTimeLeft || whiteTime)
          setBlackTime(data.game.blackTimeLeft || blackTime)
        }
      } catch (error) {
        console.error('Time sync error:', error)
      }
    }, 5000) // Sync every 5 seconds

    return () => clearInterval(syncInterval)
  }, [isGameActive, gameId, socket, whiteTime, blackTime])

  // Check for timeout
  useEffect(() => {
    if (whiteTime === 0 && isGameActive) {
      handleTimeout('black_wins')
    } else if (blackTime === 0 && isGameActive) {
      handleTimeout('white_wins')
    }
  }, [whiteTime, blackTime, isGameActive])

  const handleTimeout = async (winner: string) => {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'timeout',
          data: { winner },
        }),
      })

      setStatus('completed')
      setResult(winner)
      toast.error(winner === 'white_wins' ? 'Black ran out of time!' : 'White ran out of time!')
    } catch (error) {
      console.error('Timeout error:', error)
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isPending) {
      toast.error('Game has not been accepted yet')
      return false
    }
    
    if (!isGameActive) {
      toast.error('Game is not active')
      return false
    }
    
    if (isSpectator) {
      toast.error('Spectators cannot make moves')
      return false
    }
    
    if (!isPlayerTurn) {
      toast.error('Not your turn!')
      return false
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      })

      if (move === null) {
        toast.error('Invalid move')
        return false
      }

      const newFen = game.fen()
      const newPgn = game.pgn()
      
      setFen(newFen)
      toast.success(`Moved ${sourceSquare} to ${targetSquare}`)

      // Emit move IMMEDIATELY via socket (before API call for instant update)
      if (socket) {
        if (socket.connected) {
          // Calculate time after move (switch turns, so decrement current player's time)
          const newWhiteTime = playerColor === 'w' ? Math.max(0, whiteTime - 1) : whiteTime
          const newBlackTime = playerColor === 'b' ? Math.max(0, blackTime - 1) : blackTime
          
          console.log(`Emitting move to game ${gameId}:`, { fen: newFen, whiteTime: newWhiteTime, blackTime: newBlackTime })
          
          socket.emit('move', {
            gameId,
            move,
            fen: newFen,
            pgn: newPgn,
            whiteTimeLeft: newWhiteTime,
            blackTimeLeft: newBlackTime,
          })
          
          // Update local times immediately
          setWhiteTime(newWhiteTime)
          setBlackTime(newBlackTime)
          
          // Notify opponent it's their turn
          const opponentId = playerColor === 'w' ? blackPlayer.id : whitePlayer.id
          socket.emit('move-notification', {
            gameId,
            opponentId,
            playerName: user?.displayName || user?.username || 'Opponent',
          })
        } else {
          console.error('Socket not connected! Cannot emit move in real-time.')
          console.log('Socket state:', { connected: socket.connected, id: socket.id })
          toast.error('Connection lost. Move will be saved but may not appear in real-time.')
        }
      } else {
        console.error('Socket is null! Cannot emit move.')
        toast.error('Socket not initialized. Move will be saved but may not appear in real-time.')
      }

      // Update game state in database (async, but don't block)
      updateGameState(newFen, newPgn)

      // Check for game over
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'black_wins' : 'white_wins'
        handleGameOver(winner)
      } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
        handleGameOver('draw')
      }

      return true
    } catch (error) {
      console.error('Move error:', error)
      toast.error('Invalid move')
      return false
    }
  }

  async function updateGameState(fen: string, pgn: string): Promise<{ whiteTimeLeft: number; blackTimeLeft: number } | null> {
    try {
      // Use current times (already updated from move)
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          data: {
            fen,
            pgn,
            whiteTimeLeft: whiteTime,
            blackTimeLeft: blackTime,
          },
        }),
      })
      const data = await res.json()
      
      // Emit game update via socket with server response
      if (socket && data.game) {
        socket.emit('game-update', {
          gameId,
          state: {
            status: data.game.status || status,
            result: data.game.result || result,
            whiteTimeLeft: data.game.whiteTimeLeft,
            blackTimeLeft: data.game.blackTimeLeft,
          }
        })
      }
      
      // Update times from server response (server is source of truth)
      if (data.game) {
        setWhiteTime(data.game.whiteTimeLeft || whiteTime)
        setBlackTime(data.game.blackTimeLeft || blackTime)
        setStatus(data.game.status || status)
        return {
          whiteTimeLeft: data.game.whiteTimeLeft || whiteTime,
          blackTimeLeft: data.game.blackTimeLeft || blackTime,
        }
      }
    } catch (error) {
      console.error('Update game error:', error)
    }
    return null
  }

  async function handleGameOver(result: string) {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkmate',
          data: { winner: result },
        }),
      })

      setStatus('completed')
      setResult(result)

      if (result === 'draw') {
        toast.success('Game ended in a draw!')
      } else {
        const winner = result === 'white_wins' ? whitePlayer : blackPlayer
        toast.success(`${winner.displayName || winner.username} wins!`)
      }
    } catch (error) {
      console.error('Game over error:', error)
    }
  }

  return (
    <div className="space-y-4">
      <GameInfo
        whitePlayer={whitePlayer}
        blackPlayer={blackPlayer}
        whiteTime={whiteTime}
        blackTime={blackTime}
        currentTurn={game.turn()}
        status={status}
        result={result}
      />

      <div className={`board-${boardTheme} mx-auto max-w-lg`}>
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={playerColor === 'w' ? 'white' : playerColor === 'b' ? 'black' : 'white'}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          customPieces={{
            wP: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white pawn"
              />
            ),
            wR: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white rook"
              />
            ),
            wN: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white knight"
              />
            ),
            wB: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white bishop"
              />
            ),
            wQ: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white queen"
              />
            ),
            wK: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="white king"
              />
            ),
            bP: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black pawn"
              />
            ),
            bR: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black rook"
              />
            ),
            bN: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black knight"
              />
            ),
            bB: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black bishop"
              />
            ),
            bQ: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black queen"
              />
            ),
            bK: ({ squareWidth }) => (
              <img
                src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png"
                style={{ width: squareWidth, height: squareWidth }}
                alt="black king"
              />
            ),
          }}
        />
      </div>

      {/* Show waiting message if game is pending */}
      {status === 'pending' && (
        <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400 mt-4">
          <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            ⏳ Waiting for opponent to accept challenge...
          </p>
          {playerColor === 'b' && (
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
              You need to accept this challenge to start the game
            </p>
          )}
        </div>
      )}

      {/* Show controls for active players */}
      {isGameActive && playerColor !== null && !isSpectator && (
        <div className="mt-4">
          <GameControls 
            gameId={gameId} 
            status={status} 
            playerColor={playerColor}
            whitePlayerId={whitePlayer.id}
            currentUserId={user?.id || ''}
          />
        </div>
      )}
      

      {status === 'completed' && (
        <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Game Over
          </p>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            {result === 'cancelled' 
              ? 'Game Closed by Creator' 
              : result === 'draw' 
              ? 'Draw' 
              : result === 'white_wins' 
              ? `${whitePlayer?.displayName || whitePlayer?.username || 'White'} Wins!` 
              : result === 'black_wins'
              ? `${blackPlayer?.displayName || blackPlayer?.username || 'Black'} Wins!`
              : 'Game Ended'}
          </p>
          {result === 'cancelled' && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              The game creator closed this game
            </p>
          )}
        </div>
      )}
    </div>
  )
}
