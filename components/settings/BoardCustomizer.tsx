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
  { id: 'default', name: 'Default' },
  { id: 'merida', name: 'Merida' },
  { id: 'alpha', name: 'Alpha' },
  { id: 'tatiana', name: 'Tatiana' },
  { id: 'leipzig', name: 'Leipzig' }
]

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
          {PIECE_SETS.map((set) => (
            <button
              key={set.id}
              onClick={() => setPieceSet(set.id)}
              className={`p-4 rounded-lg border-2 transition ${
                pieceSet === set.id
                  ? 'border-blue-500 ring-2 ring-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {set.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {set.id === 'default' ? 'Classic pieces' : `${set.name} style`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        <div className="flex justify-center">
          <div className="grid grid-cols-8 w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8)
              const col = i % 8
              const isLight = (row + col) % 2 === 0
              const theme = BOARD_THEMES.find(t => t.id === boardTheme)
              const bgColor = isLight ? theme?.light : theme?.dark
              
              return (
                <div
                  key={i}
                  className="w-8 h-8"
                  style={{ backgroundColor: bgColor }}
                />
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


