// components/chess/ChessGame.tsx
'use client'

import { useState, useEffect } from 'react'
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

interface ChessGameProps {
  gameId: string
  initialFen: string
  initialPgn: string
  whitePlayer: any
  blackPlayer: any
  timeControl: number
  whiteTimeLeft: number
  blackTimeLeft: number
  status: string
  result?: string | null
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
  tatiana: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/tatiana/150/bk.png'
  },
  leipzig: {
    wP: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wp.png',
    wN: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wn.png',
    wB: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wb.png',
    wR: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wr.png',
    wQ: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wq.png',
    wK: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/wk.png',
    bP: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/bp.png',
    bN: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/bn.png',
    bB: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/bb.png',
    bR: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/br.png',
    bQ: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/bq.png',
    bK: 'https://images.chesscomfiles.com/chess-themes/pieces/leipzig/150/bk.png'
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

  // FEATURE 3: Load user's board preferences
  useEffect(() => {
    if (user) {
      loadPreferences(user.id)
    }
  }, [user, loadPreferences])

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
        console.error('Error parsing last move:', error)
      }
    }
  }, [pgn])

  // Socket listeners
  useEffect(() => {
    if (!socket || !gameId) return

    socket.emit('join-game', gameId)

    socket.on('move-made', (data: any) => {
      if (data.gameId === gameId) {
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
        
        toast('Opponent made a move!', { icon: '♟️' })
      }
    })

    socket.on('game-updated', (data: any) => {
      if (data.gameId === gameId) {
        setStatus(data.status)
        setResult(data.result)
        if (data.fen) {
          const newGame = new Chess(data.fen)
          setGame(newGame)
          setFen(data.fen)
        }
      }
    })

    // FEATURE 7: Quit game socket events
    socket.on('game-quit-initiated', (data: any) => {
      if (data.gameId === gameId) {
        toast('Opponent left the game. Waiting for return... (30 seconds)', {
          icon: '⏱️',
          duration: 5000
        })
      }
    })

    socket.on('game-quit-timeout', (data: any) => {
      if (data.gameId === gameId) {
        setStatus('resigned')
        setResult(data.resignedPlayerId === whitePlayer.id ? 'black_wins' : 'white_wins')
        toast.success('Opponent did not return. You win!')
      }
    })

    socket.on('game-quit-returned', (data: any) => {
      if (data.gameId === gameId) {
        setStatus('active')
        toast.success('Opponent returned to the game')
      }
    })

    return () => {
      socket.off('move-made')
      socket.off('game-updated')
      socket.off('game-quit-initiated')
      socket.off('game-quit-timeout')
      socket.off('game-quit-returned')
      socket.emit('leave-game', gameId)
    }
  }, [socket, gameId, whitePlayer.id])

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

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move === null) return false

      const newFen = game.fen()
      const newPgn = game.pgn()

      setFen(newFen)
      setPgn(newPgn)
      
      // FEATURE 1: Update last move
      setLastMove({ from: sourceSquare, to: targetSquare })

      // Send move to server
      fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          fen: newFen,
          pgn: newPgn,
          move: { from: sourceSquare, to: targetSquare }
        })
      })

      return true
    } catch (error) {
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
      
      socket?.emit('resign', {
        gameId,
        playerId: user?.id,
        winner: isPlayerWhite ? 'black_wins' : 'white_wins'
      })
      
      toast.success('You have resigned from the game')
      setShowQuitModal(false)
      
      // Navigate to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Failed to resign:', error)
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
      console.error('Failed to initiate quit:', error)
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
      console.error('Failed to return to game:', error)
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
      console.error('Failed to confirm quit:', error)
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

  // FEATURE 3: Get custom pieces (always use Chess.com pieces if pieceSet is set)
  const customPieces = pieceSet && pieceSet !== 'default' && PIECE_SETS[pieceSet as keyof typeof PIECE_SETS]
    ? PIECE_SETS[pieceSet as keyof typeof PIECE_SETS] 
    : PIECE_SETS.merida // Default to Chess.com merida/neo pieces

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
