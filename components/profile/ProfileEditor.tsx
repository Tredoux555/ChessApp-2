// components/profile/ProfileEditor.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'

export default function ProfileEditor() {
  const { user, setUser } = useAuthStore()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Compress image before upload
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              const compressedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() })
              resolve(compressedFile)
            },
            file.type,
            quality
          )
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setProfileImage(user.profileImage || null)
    }
  }, [user])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    try {
      // Compress image before setting preview
      const compressedFile = await compressImage(file)
      setImageFile(compressedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Image compression error:', error)
      toast.error('Failed to process image')
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(percentComplete)
        }
      })

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers({ 'Content-Type': 'application/json' })
          })
          resolve(response)
        })
        xhr.addEventListener('error', reject)
        xhr.open('PUT', '/api/profile/picture')
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.send(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setProfileImage(data.user.profileImage)
        setImageFile(null)
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        await loadUser()
        toast.success('Profile picture updated!')
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return

    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE'
      })

      if (response.ok) {
        setProfileImage(null)
        setImageFile(null)
        await loadUser()
        toast.success('Profile picture removed')
      } else {
        toast.error('Failed to remove image')
      }
    } catch (error) {
      console.error('Remove image error:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bio: bio.trim() || null
        })
      })

      if (response.ok) {
        await loadUser()
        toast.success('Profile updated!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Profile
      </h2>

      {/* Profile Picture Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
            >
              Choose Image
            </button>
            
            {imageFile && (
              <button
                type="button"
                onClick={handleUploadImage}
                disabled={isUploading}
                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 transition relative overflow-hidden"
              >
                {isUploading ? (
                  <span className="relative z-10">
                    Uploading... {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ''}
                  </span>
                ) : (
                  'Upload'
                )}
                {isUploading && uploadProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-green-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
              </button>
            )}
            
            {profileImage && !imageFile && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Max 5MB • JPEG, PNG, or WebP
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={50}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/500 characters
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}


