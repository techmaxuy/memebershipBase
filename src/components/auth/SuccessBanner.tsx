'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SuccessBanner() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const t = useTranslations('Auth')
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  if (!success || !isVisible) return null

  const messages: Record<string, { title: string; description: string }> = {
    login: {
      title: t('welcomeBack'),
      description: t('loginSuccess')
    },
    register: {
      title: t('welcomeTitle'),
      description: t('registerSuccess')
    }
  }

  const message = messages[success]

  if (!message) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              {message.title}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {message.description}
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}