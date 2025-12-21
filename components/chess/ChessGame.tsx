// components/chess/ChessGame.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useBoardStore } from '@/lib/stores/useBoardStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'
import GameControls from './GameControls'
import GameInfo from './GameInfo'
import GameChatBox from './GameChatBox'
import QuitGameModal from './QuitGameModal'

interface Player {
  id: string
  username: string
  displayName: string | null
  profileImage: string | null
}

interface ChessGameProps {
  gameId: string
  initialFen: string
  initialPgn: string
  whitePlayer: Player
  blackPlayer: Player
  timeControl: number
  whiteTimeLeft: number
  blackTimeLeft: number
  status: string
  result?: string | null
}

interface SocketMoveData {
  gameId: string
  fen: string
  pgn: string
  whiteTimeLeft: number
  blackTimeLeft: number
  move?: { from: string; to: string }
}

interface SocketGameUpdateData {
  gameId: string
  status: string
  result?: string
  fen?: string
  whiteTimeLeft?: number
  blackTimeLeft?: number
}

interface SocketTimerSyncData {
  gameId: string
  whiteTimeLeft?: number
  blackTimeLeft?: number
}

interface SocketQuitData {
  gameId: string
  resignedPlayerId?: string
}

// FEATURE 3: Board theme colors
const BOARD_THEMES = {
  brown: {
    light: '#f0d9b5',
    dark: '#b58863'
  },
  green: {
    light: '#ffffdd',
    dark: '#86a666'
  },
  blue: {
    light: '#dee3e6',
    dark: '#8ca2ad'
  },
  purple: {
    light: '#e8e0f5',
    dark: '#9f90b0'
  },
  wood: {
    light: '#f0d9b5',
    dark: '#b58863'
  },
  marble: {
    light: '#f0f0f0',
    dark: '#cccccc'
  }
}

// FEATURE 3: Piece sets (custom piece URLs)
const PIECE_SETS = {
  default: null, // Uses default react-chessboard pieces
  merida: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png'
  },
  alpha: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bk.png'
  },
  neo_wood: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_wood/150/bk.png'
  },
  neo_plastic: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/neo_plastic/150/bk.png'
  }
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
  result: initialResult
}: ChessGameProps) {
  const [game, setGame] = useState(new Chess(initialFen))
  const [fen, setFen] = useState(initialFen)
  const [pgn, setPgn] = useState(initialPgn)
  const [status, setStatus] = useState(initialStatus)
  const [result, setResult] = useState(initialResult)
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime)
  const [blackTime, setBlackTime] = useState(initialBlackTime)
  
  // FEATURE 1: Last move tracking for highlighting
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  
  // FEATURE 7: Quit game modal
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [quitTimerSeconds, setQuitTimerSeconds] = useState(30)
  const [isQuitting, setIsQuitting] = useState(false)
  
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  
  // FEATURE 3: Board customization
  const { boardTheme, pieceSet, loadPreferences } = useBoardStore()

  const isPlayerWhite = user?.id === whitePlayer.id
  const isPlayerBlack = user?.id === blackPlayer.id
  const isSpectator = !isPlayerWhite && !isPlayerBlack
  const currentTurn = game.turn() // 'w' or 'b'
  const isMyTurn = (isPlayerWhite && currentTurn === 'w') || (isPlayerBlack && currentTurn === 'b')

  // Handle game end (checkmate, stalemate, draw) - useCallback to fix dependencies
  // MUST be defined before any useEffects that use it
  const handleGameEnd = useCallback(async (result: string) => {
    setStatus('completed')
    setResult(result)
    
    socket?.emit('game-update', {
      gameId,
      status: 'completed',
      result
    })
    
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkmate',
          data: { winner: result }
        })
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save game end:', error)
      }
    }
    
    if (result === 'draw') {
      toast.success('Game ended in a draw!')
    } else {
      toast.success('Checkmate!')
    }
  }, [socket, gameId])

  // Handle timeout (flag) - useCallback to fix dependencies
  const handleTimeout = useCallback(async (loser: 'white' | 'black') => {
    const winner = loser === 'white' ? 'black_wins' : 'white_wins'
    setStatus('completed')
    setResult(winner)
    
    // Notify via socket
    socket?.emit('game-update', {
      gameId,
      status: 'completed',
      result: winner
    })
    
    // Save to database
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'timeout',
          data: { result: winner }
        })
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save timeout result:', error)
      }
    }
    
    toast.error(`${loser === 'white' ? 'White' : 'Black'} ran out of time!`)
  }, [socket, gameId])

  // FEATURE 3: Load user's board preferences
  useEffect(() => {
    if (user) {
      loadPreferences(user.id)
    }
  }, [user, loadPreferences])

  // TIMER COUNTDOWN - Decrement every second for the active player
  useEffect(() => {
    // Only run timer if game is active
    if (status !== 'active') return
    
    const timer = setInterval(() => {
      // Use functional update to read current game state
      setGame((prevGame) => {
        const currentTurn = prevGame.turn()
        
        if (currentTurn === 'w') {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              handleTimeout('white')
              return 0
            }
            return prev - 1
          })
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              handleTimeout('black')
              return 0
            }
            return prev - 1
          })
        }
        
        return prevGame
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status, handleTimeout])

  // FEATURE 1: Extract last move from PGN when game updates
  useEffect(() => {
    if (pgn) {
      try {
        const moves = pgn.trim().split(/\d+\./).filter(m => m.trim())
        if (moves.length > 0) {
          const lastMoveStr = moves[moves.length - 1].trim().split(' ').pop()
          if (lastMoveStr) {
            // Create a temporary chess instance to get the actual move
            const tempGame = new Chess()
            tempGame.loadPgn(pgn)
            const history = tempGame.history({ verbose: true })
            if (history.length > 0) {
              const lastMoveObj = history[history.length - 1]
              setLastMove({ from: lastMoveObj.from, to: lastMoveObj.to })
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing last move:', error)
        }
      }
    }
  }, [pgn])

  // Socket listeners
  useEffect(() => {
    if (!socket || !gameId) return

    socket.emit('join-game', gameId)

    const handleMoveMade = (data: SocketMoveData) => {
      if (data.gameId === gameId) {
        // Check if this is an opponent move by comparing FEN turn
        const currentFenTurn = fen.split(' ')[1] // Current turn from existing FEN
        const newFenTurn = data.fen.split(' ')[1] // Turn from new FEN
        const isOpponentMove = currentFenTurn !== newFenTurn
        
        // Always update the game state from server (source of truth)
        const newGame = new Chess(data.fen)
        setGame(newGame)
        setFen(data.fen)
        setPgn(data.pgn)
        setWhiteTime(data.whiteTimeLeft)
        setBlackTime(data.blackTimeLeft)
        
        // FEATURE 1: Update last move
        if (data.move) {
          setLastMove({ from: data.move.from, to: data.move.to })
        }
        
        // Only show toast and check game end for opponent moves
        if (isOpponentMove) {
          // Check for game end conditions after opponent's move
          if (newGame.isCheckmate()) {
            const winner = newGame.turn() === 'w' ? 'black_wins' : 'white_wins'
            handleGameEnd(winner)
          } else if (newGame.isStalemate() || newGame.isDraw() || newGame.isThreefoldRepetition()) {
            handleGameEnd('draw')
          } else {
            toast('Opponent made a move!', { icon: '♟️' })
          }
        }
      }
    }

    const handleGameUpdated = (data: SocketGameUpdateData) => {
      if (data.gameId === gameId) {
        setStatus(data.status)
        setResult(data.result)
        if (data.fen) {
          const newGame = new Chess(data.fen)
          setGame(newGame)
          setFen(data.fen)
          
          // Check for game end conditions after game update
          if (newGame.isCheckmate()) {
            const winner = newGame.turn() === 'w' ? 'black_wins' : 'white_wins'
            handleGameEnd(winner)
          } else if (newGame.isStalemate() || newGame.isDraw() || newGame.isThreefoldRepetition()) {
            handleGameEnd('draw')
          }
        }
        // Sync timer when game updates
        if (data.whiteTimeLeft !== undefined) setWhiteTime(data.whiteTimeLeft)
        if (data.blackTimeLeft !== undefined) setBlackTime(data.blackTimeLeft)
      }
    }

    const handleTimerSync = (data: SocketTimerSyncData) => {
      if (data.gameId === gameId) {
        // Always sync with server (server is source of truth)
        // This ensures perfect synchronization between players
        if (data.whiteTimeLeft !== undefined) {
          setWhiteTime(data.whiteTimeLeft)
        }
        if (data.blackTimeLeft !== undefined) {
          setBlackTime(data.blackTimeLeft)
        }
      }
    }

    const handleQuitInitiated = (data: SocketQuitData) => {
      if (data.gameId === gameId) {
        toast('Opponent left the game. Waiting for return... (30 seconds)', {
          icon: '⏱️',
          duration: 5000
        })
      }
    }

    const handleQuitTimeout = (data: SocketQuitData) => {
      if (data.gameId === gameId) {
        setStatus('resigned')
        setResult(data.resignedPlayerId === whitePlayer.id ? 'black_wins' : 'white_wins')
        toast.success('Opponent did not return. You win!')
      }
    }

    const handleQuitReturned = (data: SocketQuitData) => {
      if (data.gameId === gameId) {
        setStatus('active')
        toast.success('Opponent returned to the game')
      }
    }

    const handlePlayerResigned = (data: any) => {
      if (data.gameId === gameId) {
        setStatus('completed')
        setResult(data.winner)
        const resignedPlayer = data.resignedPlayerId === whitePlayer.id ? whitePlayer : blackPlayer
        toast.success(`${resignedPlayer.displayName || resignedPlayer.username} has resigned. You win!`)
      }
    }

    const handleReconnect = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket reconnected, re-attaching game listeners')
      }
      socket.emit('join-game', gameId)
      socket.on('move-made', handleMoveMade)
      socket.on('game-updated', handleGameUpdated)
      socket.on('timer-sync', handleTimerSync)
      socket.on('game-quit-initiated', handleQuitInitiated)
      socket.on('game-quit-timeout', handleQuitTimeout)
      socket.on('game-quit-returned', handleQuitReturned)
      socket.on('player-resigned', handlePlayerResigned)
    }

    socket.on('move-made', handleMoveMade)
    socket.on('game-updated', handleGameUpdated)
    socket.on('timer-sync', handleTimerSync)
    socket.on('game-quit-initiated', handleQuitInitiated)
    socket.on('game-quit-timeout', handleQuitTimeout)
    socket.on('game-quit-returned', handleQuitReturned)
    socket.on('player-resigned', handlePlayerResigned)
    socket.on('reconnect', handleReconnect)

    return () => {
      socket.off('move-made', handleMoveMade)
      socket.off('game-updated', handleGameUpdated)
      socket.off('timer-sync', handleTimerSync)
      socket.off('game-quit-initiated', handleQuitInitiated)
      socket.off('game-quit-timeout', handleQuitTimeout)
      socket.off('game-quit-returned', handleQuitReturned)
      socket.off('player-resigned', handlePlayerResigned)
      socket.off('reconnect', handleReconnect)
      socket.emit('leave-game', gameId)
    }
  }, [socket, gameId, whitePlayer.id, handleGameEnd])

  // FEATURE 7: Quit timer countdown
  useEffect(() => {
    if (isQuitting && quitTimerSeconds > 0) {
      const timer = setTimeout(() => {
        setQuitTimerSeconds(s => s - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isQuitting && quitTimerSeconds === 0) {
      // Auto-resign
      handleQuitConfirm()
    }
  }, [isQuitting, quitTimerSeconds])

  // Handle piece drop (make move)
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (isSpectator || !isMyTurn || status !== 'active') {
      return false
    }

    if (!socket || !socket.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Socket not connected, cannot make move')
      }
      toast.error('Connection lost. Please refresh the page.')
      return false
    }

    try {
      // Create new game instance BEFORE making the move to avoid mutation issues
      const newGame = new Chess(game.fen())
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move === null) return false
      
      const newFen = newGame.fen()
      const newPgn = newGame.pgn()

      // Update all game state
      setGame(newGame)
      setFen(newFen)
      setPgn(newPgn)
      
      // FEATURE 1: Update last move
      setLastMove({ from: sourceSquare, to: targetSquare })

      // Check for game end conditions
      if (newGame.isCheckmate()) {
        const winner = newGame.turn() === 'w' ? 'black_wins' : 'white_wins'
        handleGameEnd(winner)
        return true
      }
      
      if (newGame.isStalemate() || newGame.isDraw() || newGame.isThreefoldRepetition()) {
        handleGameEnd('draw')
        return true
      }

      // Use current timer values (already being decremented by the timer useEffect)
      const currentWhiteTime = whiteTime
      const currentBlackTime = blackTime

      // Emit move via socket FIRST for real-time updates
      socket.emit('move', {
        gameId,
        fen: newFen,
        pgn: newPgn,
        move: { from: sourceSquare, to: targetSquare },
        whiteTimeLeft: currentWhiteTime,
        blackTimeLeft: currentBlackTime,
      })

      // Then send move to API for persistence
      fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          data: {
            fen: newFen,
            pgn: newPgn,
            whiteTimeLeft: currentWhiteTime,
            blackTimeLeft: currentBlackTime,
            move: { from: sourceSquare, to: targetSquare }
          }
        })
      }).catch(error => {
        console.error('Failed to save move to server:', error)
        toast.error('Failed to save move. Please refresh.')
      })

      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Move error:', error)
      }
      return false
    }
  }

  // FEATURE 7: Quit game handlers
  const handleGoToDashboard = () => {
    setShowQuitModal(true)
  }

  const handleQuitNo = async () => {
    // Resign immediately
    try {
      await fetch(`/api/games/${gameId}/quit-confirm`, {
        method: 'POST'
      })
      
      // Update game via API first
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resign',
        }),
      })
      
      // Then emit socket event to notify opponent
      socket?.emit('resign', {
        gameId,
        playerId: user?.id,
        winner: isPlayerWhite ? 'black_wins' : 'white_wins',
        resignedPlayerId: user?.id
      })
      
      toast.success('You have resigned from the game')
      setShowQuitModal(false)
      
      // Navigate to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to resign:', error)
      }
      toast.error('Failed to resign')
    }
  }

  const handleQuitYes = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/quit`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsQuitting(true)
        setQuitTimerSeconds(30)
        
        // Emit socket event
        socket?.emit('game-quit-initiated', {
          gameId,
          playerId: user?.id,
          timeoutSeconds: 30
        })
        
        toast('You have 30 seconds to return', {
          icon: '⏱️',
          duration: 5000
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to initiate quit:', error)
      }
      toast.error('Failed to quit game')
    }
  }

  const handleReturnToGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/quit`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setIsQuitting(false)
        setQuitTimerSeconds(30)
        setShowQuitModal(false)
        
        socket?.emit('game-quit-returned', {
          gameId,
          playerId: user?.id
        })
        
        toast.success('Returned to game')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to return to game:', error)
      }
      toast.error('Failed to return to game')
    }
  }

  const handleQuitConfirm = async () => {
    try {
      await fetch(`/api/games/${gameId}/quit-confirm`, {
        method: 'POST'
      })
      
      socket?.emit('game-quit-timeout', {
        gameId,
        resignedPlayerId: user?.id
      })
      
      setShowQuitModal(false)
      window.location.href = '/dashboard'
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to confirm quit:', error)
      }
    }
  }

  // FEATURE 1: Square styles for last move highlighting
  const squareStyles: { [key: string]: React.CSSProperties } = {}
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: '#FFEB3B' }
    squareStyles[lastMove.to] = { backgroundColor: '#FBC02D' }
  }

  // FEATURE 3: Get board theme colors
  const boardColors = BOARD_THEMES[boardTheme as keyof typeof BOARD_THEMES] || BOARD_THEMES.brown

  // FEATURE 3: Get custom pieces (always use Chess.com pieces by default)
  const effectivePieceSet = pieceSet || 'merida' // Default to merida if not set
  const pieceSetData = effectivePieceSet !== 'default' && PIECE_SETS[effectivePieceSet as keyof typeof PIECE_SETS]
    ? PIECE_SETS[effectivePieceSet as keyof typeof PIECE_SETS] 
    : PIECE_SETS.merida // Fallback to Chess.com merida/neo pieces

  // Convert piece URLs to customPieces function format for react-chessboard
  const customPieces = pieceSetData ? Object.keys(pieceSetData).reduce((acc, piece) => {
    acc[piece] = ({ squareWidth }: { squareWidth: number }) => (
      <img
        src={pieceSetData[piece as keyof typeof pieceSetData]}
        alt={piece}
        style={{ width: squareWidth, height: squareWidth }}
        onError={(e) => {
          // If image fails, try to load from a working set as last resort
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to load piece image: ${pieceSetData[piece as keyof typeof pieceSetData]}`)
          }
        }}
      />
    )
    return acc
  }, {} as any) : undefined

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      <div className="flex-1">
        <div className="max-w-[600px] mx-auto">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={isPlayerBlack ? 'black' : 'white'}
            customSquareStyles={squareStyles}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
            }}
            customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
            customLightSquareStyle={{ backgroundColor: boardColors.light }}
            customPieces={customPieces as any}
          />
        </div>
      </div>

      <div className="lg:w-96 space-y-4">
        <GameInfo
          whitePlayer={whitePlayer}
          blackPlayer={blackPlayer}
          whiteTime={whiteTime}
          blackTime={blackTime}
          currentTurn={currentTurn}
          status={status}
          result={result || undefined}
        />

        <GameControls
          gameId={gameId}
          status={status}
          isSpectator={isSpectator}
          isMyTurn={isMyTurn}
          onGoToDashboard={handleGoToDashboard}
        />

        {/* FEATURE 4: Game Chat */}
        {!isSpectator && (
          <GameChatBox
            gameId={gameId}
            opponentId={isPlayerWhite ? blackPlayer.id : whitePlayer.id}
            opponentName={isPlayerWhite ? (blackPlayer.displayName || blackPlayer.username) : (whitePlayer.displayName || whitePlayer.username)}
          />
        )}
      </div>

      {/* FEATURE 7: Quit Modal */}
      {showQuitModal && (
        <QuitGameModal
          isQuitting={isQuitting}
          secondsRemaining={quitTimerSeconds}
          onYes={handleQuitYes}
          onNo={handleQuitNo}
          onReturnToGame={handleReturnToGame}
        />
      )}
    </div>
  )
}
