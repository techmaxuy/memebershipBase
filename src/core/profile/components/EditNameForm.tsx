'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { updateName } from '@/core/auth/actions/profile'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface EditNameFormProps {
  currentName: string | null
  onSuccess?: () => void
}

export function EditNameForm({ currentName, onSuccess }: EditNameFormProps) {
  const t = useTranslations('Profile')
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(currentName || '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(t('errors.nameRequired'))
      return
    }

    startTransition(async () => {
      const result = await updateName({ name: name.trim() })

      if (result.error) {
        setError(t(`errors.${result.error}`) || t('errors.updateFailed'))
      } else {
        setIsEditing(false)
        if (onSuccess) onSuccess()
        // Recargar para actualizar session
        window.location.reload()
      }
    })
  }

  const handleCancel = () => {
    setName(currentName || '')
    setError(null)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            {t('name')}
          </label>
          <p className="text-gray-900 dark:text-white">
            {currentName || t('noName')}
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          title={t('editName')}
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
        {t('name')}
      </label>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          maxLength={100}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          placeholder={t('enterName')}
          autoFocus
        />
        
        <button
          type="submit"
          disabled={isPending}
          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('save')}
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>
        
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('cancel')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  )
}