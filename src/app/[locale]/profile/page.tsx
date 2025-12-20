import { redirect } from 'next/navigation'
import { auth } from '@/../auth'
import { getCurrentProfile } from '@/actions/profile'
import { getTranslations } from 'next-intl/server'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { EditNameForm } from '@/components/profile/EditNameForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm'
import { Shield, Calendar, Mail, User as UserIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface ProfilePageProps {
  params: Promise<{ locale: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('Profile')

  // Proteger la ruta
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  // Obtener perfil completo
  const result = await getCurrentProfile()

  if (result.error || !result.user) {
    redirect(`/${locale}/login`)
  }

  const { user } = result

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {/* Avatar Section */}
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 border-b border-gray-200 dark:border-zinc-800">
            <AvatarUpload
              currentImage={user.image}
              userName={user.name}
            />
          </div>

          {/* Profile Info */}
          <div className="p-6 space-y-6">
            {/* Name */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t('personalInfo')}
              </h2>
              <EditNameForm currentName={user.name} />
            </div>

            {/* Email */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t('emailAddress')}
              </h2>
              <ChangeEmailForm
                currentEmail={user.email}
                hasPassword={user.hasPassword}
                locale={locale}
              />
            </div>

            {/* Password */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t('security')}
              </h2>
              <ChangePasswordForm hasPassword={user.hasPassword} />
            </div>

            {/* Account Info */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t('accountInfo')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">{t('role')}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.role}
                  </p>
                </div>

                {/* Created At */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{t('memberSince')}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Email Verified */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{t('emailStatus')}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">
                        {t('verified')}
                      </span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {t('notVerified')}
                      </span>
                    )}
                  </p>
                </div>

                {/* Auth Method */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">{t('authMethod')}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.authProviders.length > 0 ? (
                      <span className="capitalize">
                        {user.authProviders.join(', ')}
                      </span>
                    ) : (
                      t('emailPassword')
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between items-center">
          <Link
            href={`/${locale}`}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
          >
            ← {t('backToHome')}
          </Link>
          
          <LogoutButton locale={locale} variant="profile" />
        </div>
      </div>
    </div>
  )
}