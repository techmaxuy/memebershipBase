'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { User, LogOut, UserCircle, Settings, Globe, ChevronDown, ShieldAlert } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { LogoutButton } from '../../auth/components/LogoutButton'
import Image from 'next/image'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
  locale: string
  isAuthenticated: boolean
}

export function UserMenu({ user, locale, isAuthenticated }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('UserMenu')

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
      
    }
  }, [isOpen])

  // Cambiar idioma
  const switchLocale = (newLocale: string) => {
    const path = window.location.pathname.replace(`/${locale}`, `/${newLocale}`)
    window.location.href = path
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar/Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 py-2 z-50">
          {isAuthenticated && user ? (
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {user.name || t('noName')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {user.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {user.role}
                  </span>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  {t('profile')}
                </Link>

              {/* Admin Dashboard - Solo si es ADMIN */}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {t('adminDashboard')}
                  </Link>
                )}
              </div>

              {/* Language Switcher */}
              <div className="border-t border-gray-200 dark:border-zinc-800 py-1">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('language')}
                </div>
                <button
                  onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {locale === 'en' ? 'Español' : 'English'}
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 dark:border-zinc-800 py-1">
                <div className="px-4 py-2">
                  <LogoutButton locale={locale} variant="menu" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Not authenticated */}
              <div className="py-1">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-4 h-4 rotate-180" />
                  {t('login')}
                </Link>

                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  {t('register')}
                </Link>
              </div>

              {/* Language Switcher */}
              <div className="border-t border-gray-200 dark:border-zinc-800 py-1">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('language')}
                </div>
                <button
                  onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {locale === 'en' ? 'Español' : 'English'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}