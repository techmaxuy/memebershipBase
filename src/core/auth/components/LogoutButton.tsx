'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { logout } from '@/core/auth/actions/auth'
import { Loader2, LogOut } from 'lucide-react'

interface LogoutButtonProps {
  locale: string
  variant?: 'default' | 'profile' | 'menu'
}

export function LogoutButton({ locale, variant = 'default' }: LogoutButtonProps) {
  const t = useTranslations('Auth')
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout(locale)
    })
  }

  if (variant === 'profile') {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('signingOut')}
          </>
        ) : (
          <>
            {t('signOut')}
            <LogOut className="w-4 h-4" />
          </>
        )}
      </button>
    )
  }


   if (variant === 'menu') {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-0 py-0 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('signingOut')}
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </>
        )}
      </button>
    )
  }


  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('signingOut')}
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          {t('signOut')}
        </>
      )}
    </button>
  )
}