'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function ProductGrid() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (res.ok) {
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
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
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Hide broken image
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
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





