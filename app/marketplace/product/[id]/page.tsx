'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const productId = params?.id as string

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return
      
      try {
        setIsLoading(true)
        const res = await fetch(`/api/products/${productId}`)
        const data = await res.json()
        
        if (res.ok && data.product) {
          setProduct(data.product)
        } else {
          toast.error(data.error || 'Product not found')
          router.push('/marketplace')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to load product')
        router.push('/marketplace')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId, router])

  const handlePurchase = async () => {
    if (!product || !user) return

    setIsPurchasing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Purchase successful!')
        router.push('/marketplace')
      } else {
        toast.error(data.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Error purchasing product:', error)
      toast.error('Failed to complete purchase')
    } finally {
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Product not found</p>
        <button
          onClick={() => router.push('/marketplace')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Back to Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:w-1/2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center min-h-[400px]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  img.style.display = 'none'
                  const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement
                  if (placeholder) placeholder.style.display = 'flex'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🛒</span>
              </div>
            )}
            <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hidden">
              <span className="text-gray-400 dark:text-gray-500">Image unavailable</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="md:w-1/2 p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                ¥{product.price.toFixed(2)}
              </span>
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !user}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold text-lg transition"
              >
                {isPurchasing ? 'Processing...' : `Purchase for ¥${product.price.toFixed(2)}`}
              </button>
              {!user && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Please log in to purchase
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

