// Shared loading spinner component for consistency
'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  }

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin mx-auto`}></div>
        {text && (
          <p className={`mt-4 text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-sm' : ''}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}


