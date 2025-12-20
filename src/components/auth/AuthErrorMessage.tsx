// components/auth/AuthErrorMessage.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function AuthErrorMessage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const success = searchParams.get('success')
  const t = useTranslations('AuthErrors')

  if (!error && !success) return null

  const errorMessages: Record<string, string> = {
    NoEmail: t('noEmail'),
    AlreadyRegistered: t('alreadyRegistered'),
    AccountNotFound: t('accountNotFound'),
    SystemError: t('systemError'),
    InvalidCredentials: t('invalidCredentials'),
    Unauthorized: t('unauthorized'),
    InvalidRequest: t('invalidRequest'),
    OAuthError: t('oauthError'),
    Configuration: t('configurationError'),
  }

  if (success) {
    return (
      <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-800 dark:text-green-200">
          {t('registrationSuccess')}
        </p>
      </div>
    )
  }

  // Obtener email del query param si existe
  const email = searchParams.get('email')

  return (
    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            {error && errorMessages[error] ? errorMessages[error] : t('unknownError')}
          </p>
          {email && error === 'AccountNotFound' && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {t('emailNotRegistered', { email })}
            </p>
          )}
          {/* Mostrar el error original si es desconocido */}
          {error && !errorMessages[error] && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
              Error code: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
