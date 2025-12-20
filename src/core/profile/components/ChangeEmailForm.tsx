'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { changeEmail } from '@/core/auth/actions/profile'
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ChangeEmailFormProps {
  currentEmail: string
  hasPassword: boolean
  locale: string
}

export function ChangeEmailForm({ currentEmail, hasPassword, locale }: ChangeEmailFormProps) {
  const t = useTranslations('Profile')

  if (!hasPassword) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {currentEmail}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('oauthEmailNote')}
            </p>
          </div>
        </div>
      </div>
    )
  }



  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    newEmail: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.newEmail) {
      setError(t('errors.emailRequired'))
      return
    }

    if (formData.newEmail === currentEmail) {
      setError(t('errors.sameEmail'))
      return
    }

    if (hasPassword && !formData.password) {
      setError(t('errors.passwordRequired'))
      return
    }

    startTransition(async () => {
      const result = await changeEmail(formData, locale)

      if (result.error) {
        setError(t(`errors.${result.error}`) || t('errors.updateFailed'))
      } else if (result.newEmail) {
        setSuccess(result.newEmail)
        setFormData({ newEmail: '', password: '' })
      }
    })
  }

  const handleCancel = () => {
    setFormData({ newEmail: '', password: '' })
    setError(null)
    setSuccess(null)
    setIsOpen(false)
  }


  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {t('changeEmail')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentEmail}
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
        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t('changeEmail')}
        </h3>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  {t('verificationEmailSent')}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {t('verificationEmailDescription', { email: success })}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('close')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('currentEmail')}
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            />
          </div>

          {/* New Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('newEmail')}
            </label>
            <input
              type="email"
              value={formData.newEmail}
              onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
              disabled={isPending}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder={t('enterNewEmail')}
            />
          </div>

          {/* Password (if has password) */}
          {hasPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isPending}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder={t('enterPasswordToConfirm')}
              />
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {t('changeEmailWarning')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              {error}
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
              {t('sendVerification')}
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
      )}
    </div>
  )
}