import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { prisma } from '@/core/shared/lib/db'
import { getTranslations } from 'next-intl/server'
import { Users, UserCheck, ShieldAlert, Calendar } from 'lucide-react'
import Link from 'next/link'

interface AdminPageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params
  const t = await getTranslations('Admin')
  
  // 🔒 VERIFICACIÓN CRÍTICA - Segunda línea de defensa
  await requireAdmin(locale)
  
  // Obtener estadísticas
  const stats = await prisma.user.aggregate({
    _count: true,
  })
  
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' }
  })
  
  const verifiedCount = await prisma.user.count({
    where: { emailVerified: { not: null } }
  })
  
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    }
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('description')}
              </p>
            </div>
            <Link
              href={`/${locale}`}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← {t('backToHome')}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('totalUsers')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats._count}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('administrators')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {adminCount}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <ShieldAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Verified */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('verifiedUsers')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {verifiedCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Unverified */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('unverifiedUsers')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats._count - verifiedCount}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Link
            href={`/${locale}/admin/users`}
            className="block p-6 bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('manageUsers')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('manageUsersDescription')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/settings`}
            className="block p-6 bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('systemSettings')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('systemSettingsDescription')}
            </p>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('recentUsers')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('joined')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || t('noName')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.emailVerified
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {user.emailVerified ? t('verified') : t('unverified')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}