// components/settings/BoardCustomizer.tsx
'use client'

import { useState } from 'react'
import { useBoardStore } from '@/lib/stores/useBoardStore'
import toast from 'react-hot-toast'

const BOARD_THEMES = [
  { id: 'brown', name: 'Brown', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green', name: 'Green', light: '#ffffdd', dark: '#86a666' },
  { id: 'blue', name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'purple', name: 'Purple', light: '#e8e0f5', dark: '#9f90b0' },
  { id: 'wood', name: 'Wood', light: '#f0d9b5', dark: '#b58863' },
  { id: 'marble', name: 'Marble', light: '#f0f0f0', dark: '#cccccc' }
]

const PIECE_SETS = [
  { id: 'default', name: 'Default', urlPrefix: 'neo' },
  { id: 'merida', name: 'Merida', urlPrefix: 'neo' },
  { id: 'alpha', name: 'Alpha', urlPrefix: 'alpha' },
  { id: 'neo_wood', name: 'Wood', urlPrefix: 'neo_wood' },
  { id: 'neo_plastic', name: 'Plastic', urlPrefix: 'neo_plastic' }
]

// Helper function to get piece image URL
function getPieceUrl(setId: string, piece: string): string {
  const set = PIECE_SETS.find(s => s.id === setId)
  const prefix = set?.urlPrefix || 'neo'
  return `https://images.chesscomfiles.com/chess-themes/pieces/${prefix}/150/${piece}.png`
}

// Initial piece positions for the preview board
const INITIAL_PIECES: { [key: number]: string } = {
  // Black pieces (row 0)
  0: 'br', 1: 'bn', 2: 'bb', 3: 'bq', 4: 'bk', 5: 'bb', 6: 'bn', 7: 'br',
  // Black pawns (row 1)
  8: 'bp', 9: 'bp', 10: 'bp', 11: 'bp', 12: 'bp', 13: 'bp', 14: 'bp', 15: 'bp',
  // White pawns (row 6)
  48: 'wp', 49: 'wp', 50: 'wp', 51: 'wp', 52: 'wp', 53: 'wp', 54: 'wp', 55: 'wp',
  // White pieces (row 7)
  56: 'wr', 57: 'wn', 58: 'wb', 59: 'wq', 60: 'wk', 61: 'wb', 62: 'wn', 63: 'wr',
}

export default function BoardCustomizer() {
  const { boardTheme, pieceSet, setBoardTheme, setPieceSet, savePreferences } = useBoardStore()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await savePreferences()
      toast.success('Board preferences saved!')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Customize Your Board
      </h2>

      {/* Board Theme Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Board Theme
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BOARD_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setBoardTheme(theme.id)}
              className={`p-4 rounded-lg border-2 transition ${
                boardTheme === theme.id
                  ? 'border-blue-500 ring-2 ring-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex gap-2 mb-2">
                <div
                  className="w-12 h-12 rounded"
                  style={{ backgroundColor: theme.light }}
                />
                <div
                  className="w-12 h-12 rounded"
                  style={{ backgroundColor: theme.dark }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {theme.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Piece Set Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Piece Set
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PIECE_SETS.map((set) => {
            // Debug: Log all piece sets being rendered
            if (set.id === 'neo_plastic') {
              console.log('Rendering Plastic piece set:', set)
            }
            return (
            <button
              key={set.id}
              onClick={() => setPieceSet(set.id)}
              className={`p-4 rounded-lg border-2 transition min-h-[120px] ${
                pieceSet === set.id
                  ? 'border-blue-500 ring-2 ring-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex justify-center gap-1 mb-2 min-h-[40px] items-center">
                <img 
                  src={getPieceUrl(set.id, 'wk')} 
                  alt="White King" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    console.error('Failed to load piece image:', getPieceUrl(set.id, 'wk'))
                    (e.target as HTMLImageElement).src = 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png'
                  }}
                />
                <img 
                  src={getPieceUrl(set.id, 'wq')} 
                  alt="White Queen" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png'
                  }}
                />
                <img 
                  src={getPieceUrl(set.id, 'bk')} 
                  alt="Black King" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png'
                  }}
                />
                <img 
                  src={getPieceUrl(set.id, 'bq')} 
                  alt="Black Queen" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png'
                  }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white text-center mt-1">
                {set.name}
              </p>
            </button>
            )
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        <div className="flex justify-center">
          <div className="grid grid-cols-8 w-80 h-80 border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8)
              const col = i % 8
              const isLight = (row + col) % 2 === 0
              const theme = BOARD_THEMES.find(t => t.id === boardTheme)
              const bgColor = isLight ? theme?.light : theme?.dark
              const piece = INITIAL_PIECES[i]
              
              return (
                <div
                  key={i}
                  className="w-10 h-10 flex items-center justify-center relative"
                  style={{ backgroundColor: bgColor }}
                >
                  {piece ? (
                    <img 
                      src={getPieceUrl(pieceSet || 'merida', piece)} 
                      alt={piece}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => {
                        // Fallback to neo pieces if the selected set fails
                        const fallbackUrl = `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${piece}.png`
                        if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                          (e.target as HTMLImageElement).src = fallbackUrl
                        }
                      }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}


