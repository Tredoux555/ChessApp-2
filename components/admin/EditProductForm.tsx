'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  imageUrl: string | null
  isActive: boolean
}

interface EditProductFormProps {
  product: Product
  onSave: (data: any) => void
  onCancel: () => void
}

export default function EditProductForm({ product, onSave, onCancel }: EditProductFormProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price.toString(),
    quantity: product.quantity.toString(),
    imageUrl: product.imageUrl || '',
    isActive: product.isActive,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(formData.price)
    const quantity = parseInt(formData.quantity)
    
    if (isNaN(price) || price < 0) {
      toast.error('Invalid price')
      return
    }
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Invalid quantity')
      return
    }

    onSave({
      name: formData.name,
      description: formData.description || null,
      price,
      quantity,
      imageUrl: formData.imageUrl || null,
      isActive: formData.isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Product</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price (¥) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity *</label>
          <input
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image URL</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          className="w-full px-3 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Active (visible in marketplace)</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


