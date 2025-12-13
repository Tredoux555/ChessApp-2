'use client'

import ProductGrid from '@/components/marketplace/ProductGrid'

export default function MarketplacePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Marketplace
      </h1>
      <ProductGrid />
    </div>
  )
}
