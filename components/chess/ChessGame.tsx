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

  // Join game room
  useEffect(() => {
    if (!socket || !gameId) return

    socket.emit('join-game', gameId)

    return () => {
      socket.emit('leave-game', gameId)
    }
  }, [socket, gameId])

  // Listen for moves and time updates
  useEffect(() => {
    if (!socket) return

    const handleMove = (data: any) => {
      if (data.gameId === gameId) {
        game.load(data.fen)
        setFen(data.fen)
        
        // Sync times from server
        if (data.whiteTimeLeft !== undefined) {
          setWhiteTime(data.whiteTimeLeft)
        }
        if (data.blackTimeLeft !== undefined) {
          setBlackTime(data.blackTimeLeft)
        }
      }
    }

    const handleGameUpdate = (data: any) => {
      if (data.gameId === gameId) {
        setStatus(data.state.status)
        setResult(data.state.result)
        // Sync times from server update
        if (data.state.whiteTimeLeft !== undefined) {
          setWhiteTime(data.state.whiteTimeLeft)
        }
        if (data.state.blackTimeLeft !== undefined) {
          setBlackTime(data.state.blackTimeLeft)
        }
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
    socket.on('time-sync', handleTimeSync)

    return () => {
      socket.off('move-made', handleMove)
      socket.off('game-updated', handleGameUpdate)
      socket.off('time-sync', handleTimeSync)
    }
  }, [socket, gameId, game])

  // Time countdown - only decrement locally, server will sync
  useEffect(() => {
    if (!isGameActive) return

    const interval = setInterval(() => {
      // Only countdown if it's the active player's turn
      if (game.turn() === 'w') {
        setWhiteTime((t) => Math.max(0, t - 1))
      } else {
        setBlackTime((t) => Math.max(0, t - 1))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isGameActive, game.turn()])

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

      // Update game state and emit move (async, but don't block)
      updateGameState(newFen, newPgn).then((updatedState) => {
        // Emit move to server with synced times
        if (socket) {
          socket.emit('move', {
            gameId,
            move,
            fen: newFen,
            pgn: newPgn,
            whiteTimeLeft: updatedState?.whiteTimeLeft || whiteTime,
            blackTimeLeft: updatedState?.blackTimeLeft || blackTime,
          })
          
          // Notify opponent it's their turn
          const opponentId = playerColor === 'w' ? blackPlayer.id : whitePlayer.id
          socket.emit('move-notification', {
            gameId,
            opponentId,
            playerName: user?.displayName || user?.username || 'Opponent',
          })
        }
      })

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
      // Update times from server response
      if (data.game) {
        setWhiteTime(data.game.whiteTimeLeft || whiteTime)
        setBlackTime(data.game.blackTimeLeft || blackTime)
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

      {/* Show controls for active players */}
      {isGameActive && playerColor !== null && !isSpectator && (
        <div className="mt-4">
          <GameControls gameId={gameId} status={status} playerColor={playerColor} />
        </div>
      )}
      

      {status === 'completed' && (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Game Over
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {result === 'draw' ? 'Draw' : result === 'white_wins' ? 'White Wins' : 'Black Wins'}
          </p>
        </div>
      )}
    </div>
  )
}
