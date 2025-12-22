'use client'

interface GameInfoProps {
  whitePlayer: any
  blackPlayer: any
  whiteTime: number
  blackTime: number
  currentTurn: 'w' | 'b'
  status: string
  result?: string
}

export default function GameInfo({
  whitePlayer,
  blackPlayer,
  whiteTime,
  blackTime,
  currentTurn,
  status,
  result,
}: GameInfoProps) {
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* White Player */}
      <div className={`p-4 rounded-lg ${
        currentTurn === 'w' && status === 'active'
          ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-600'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <div className="flex items-center space-x-3">
          {whitePlayer.profileImage ? (
            <img
              src={whitePlayer.profileImage}
              alt={whitePlayer.username}
              className="w-10 h-10 rounded-lg object-contain border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center font-bold">
              {whitePlayer.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {whitePlayer.displayName || whitePlayer.username}
            </p>
            <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
              {formatTime(whiteTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Black Player */}
      <div className={`p-4 rounded-lg ${
        currentTurn === 'b' && status === 'active'
          ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-600'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <div className="flex items-center space-x-3">
          {blackPlayer.profileImage ? (
            <img
              src={blackPlayer.profileImage}
              alt={blackPlayer.username}
              className="w-10 h-10 rounded-lg object-contain border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-800 text-white flex items-center justify-center font-bold">
              {blackPlayer.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {blackPlayer.displayName || blackPlayer.username}
            </p>
            <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
              {formatTime(blackTime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

