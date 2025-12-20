'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { changePassword } from '@/core/auth/actions/profile'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

interface ChangePasswordFormProps {
  hasPassword: boolean
}

export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
  const t = useTranslations('Profile')
  const [isOpen, setIsOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('errors.passwordsDontMatch'))
      return
    }

    if (formData.newPassword.length < 6) {
      setError(t('errors.passwordTooShort'))
      return
    }

    startTransition(async () => {
      const result = await changePassword(formData)

      if (result.error) {
        setError(t(`errors.${result.error}`) || t('errors.updateFailed'))
      } else {
        setSuccess(true)
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        
        // Cerrar formulario después de 2 segundos
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 2000)
      }
    })
  }

  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setError(null)
    setSuccess(false)
    setIsOpen(false)
  }

  // Si el usuario no tiene contraseña (OAuth), no mostrar
  if (!hasPassword) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('oauthAccount')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {t('oauthAccountDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {t('changePassword')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('changePasswordDescription')}
            </p>
          </div>
        </div>
        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
          {t('change')}
        </span>
      </button>
    )
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t('changePassword')}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('currentPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              disabled={isPending}
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('newPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              disabled={isPending}
              required
              minLength={6}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('confirmNewPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isPending}
              required
              minLength={6}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            {t('passwordChanged')}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('saveChanges')}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}