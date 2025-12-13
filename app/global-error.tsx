'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

