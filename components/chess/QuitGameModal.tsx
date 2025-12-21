// components/chess/QuitGameModal.tsx
'use client'

interface QuitGameModalProps {
  isQuitting: boolean
  secondsRemaining: number
  onYes: () => void
  onNo: () => void
  onReturnToGame: () => void
}

export default function QuitGameModal({
  isQuitting,
  secondsRemaining,
  onYes,
  onNo,
  onReturnToGame
}: QuitGameModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isQuitting ? 'Quit Timer Active' : 'Do you want to quit?'}
          </h2>

          {isQuitting ? (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                You have <span className="text-red-500 font-bold text-xl">{secondsRemaining}</span> seconds to return to the game.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you don't return in time, you will automatically resign.
              </p>
              <button
                onClick={onReturnToGame}
                className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
              >
                Return to Game
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Choose an option:
              </p>
              
              {/* Black bar with YES/NO buttons */}
              <div className="bg-black rounded-lg p-4 flex gap-4">
                <button
                  onClick={onYes}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                  YES
                  <span className="block text-xs mt-1">Leave for 30 seconds</span>
                </button>
                
                <button
                  onClick={onNo}
                  className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  NO
                  <span className="block text-xs mt-1">Resign immediately</span>
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                YES: You can return within 30 seconds<br />
                NO: You resign and lose the game
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



