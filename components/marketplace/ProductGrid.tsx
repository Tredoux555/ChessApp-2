'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function ProductGrid() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const res = await fetch('/api/products')
      const data = await res.json()
      if (res.ok) {
        setProducts(data.products || [])
      } else {
        setError(data.error || 'Failed to load products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-gray-900 dark:text-white font-semibold mb-2">Error loading products</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No products available</p>
          {user?.isAdmin && (
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
              Add products from the admin panel
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {product.imageUrl ? (
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Show placeholder instead of hiding
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                      const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                  />
                  <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700" style={{ display: 'none' }}>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">Image unavailable</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">🛒</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {product.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ¥{product.price.toFixed(2)}
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}





