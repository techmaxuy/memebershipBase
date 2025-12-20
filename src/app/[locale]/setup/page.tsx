import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getTranslations } from 'next-intl/server'
import { SetupForm } from '@/components/admin/SetupForm'
import { Shield, AlertTriangle } from 'lucide-react'

interface SetupPageProps {
  params: Promise<{ locale: string }>
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { locale } = await params
  const t = await getTranslations('Setup')

  // Verificar si ya existe un administrador
  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  // Si ya hay un admin, redirigir a home
  if (adminExists) {
    redirect(`/${locale}`)
  }

  // Contar usuarios totales
  const totalUsers = await prisma.user.count()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        {/* Warning if there are existing users */}
        {totalUsers > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('existingUsersWarning')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {t('existingUsersCount', { count: totalUsers })}
              </p>
            </div>
          </div>
        )}

        {/* Setup Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-8">
          <SetupForm locale={locale} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('securityNote')}
          </p>
        </div>
      </div>
    </div>
  )
}