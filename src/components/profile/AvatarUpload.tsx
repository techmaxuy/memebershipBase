'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, Trash2, Loader2, User } from 'lucide-react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentImage: string | null
  userName: string | null
  onUploadSuccess?: (imageUrl: string) => void
  onDeleteSuccess?: () => void
}

export function AvatarUpload({ 
  currentImage, 
  userName,
  onUploadSuccess,
  onDeleteSuccess 
}: AvatarUploadProps) {
  const t = useTranslations('Profile')
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return

    setError(null)

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError(t('errors.invalidFileType'))
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.fileTooLarge'))
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Subir
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      console.log('[AvatarUpload] ✅ Upload successful')
      
      if (onUploadSuccess) {
        onUploadSuccess(data.imageUrl)
      }

      // Recargar página para actualizar session
      window.location.reload()
    } catch (err) {
      console.error('[AvatarUpload] Error:', err)
      setError(err instanceof Error ? err.message : t('errors.uploadFailed'))
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('confirmDeleteAvatar'))) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      console.log('[AvatarUpload] ✅ Delete successful')
      
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }

      setPreviewUrl(null)
      
      // Recargar página para actualizar session
      window.location.reload()
    } catch (err) {
      console.error('[AvatarUpload] Delete error:', err)
      setError(err instanceof Error ? err.message : t('errors.deleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  const displayImage = previewUrl || currentImage
  const canDelete = currentImage && currentImage.includes('blob.core.windows.net')

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-lg">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={userName || 'User avatar'}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          
          {/* Loading overlay */}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Camera button overlay */}
        {!isUploading && !isDeleting && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
            disabled={isUploading || isDeleting}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isDeleting}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? t('uploading') : t('changeAvatar')}
        </button>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? t('deleting') : t('removeAvatar')}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
        {t('avatarInfo')}
      </p>
    </div>
  )
}