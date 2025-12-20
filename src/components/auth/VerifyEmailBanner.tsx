'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { resendVerificationEmail } from '@/actions/auth'

interface VerifyEmailBannerProps {
  email: string
  locale: string
}

export function VerifyEmailBanner({ email, locale }: VerifyEmailBannerProps) {
  const t = useTranslations('VerifyEmail')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleResend = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await resendVerificationEmail(email, locale)
      
      if (result.error) {
        setMessage({
          type: 'error',
          text: t(`errors.${result.error}`) || t('errors.default')
        })
      } else {
        setMessage({
          type: 'success',
          text: t('resendSuccess')
        })
      }
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('title')}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              {t('description', { email })}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
              {t('checkSpam')}
            </p>

            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  message.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={isPending}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('resending')}
                </>
              ) : (
                t('resendButton')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}