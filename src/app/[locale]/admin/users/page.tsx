import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { getTranslations } from 'next-intl/server'
import { UserList } from '@/components/admin/UserList'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/../auth'

interface UsersPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    page?: string
    search?: string
    role?: string
    status?: string
  }>
}

const USERS_PER_PAGE = 10

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const { locale } = await params
  const t = await getTranslations('Admin')
  
  // 🔒 VERIFICACIÓN CRÍTICA - Segunda línea de defensa
  await requireAdmin(locale)
  
  // Obtener sesión para saber el ID del admin actual
  const session = await auth()
  const currentAdminId = session?.user?.id || ''
  
  // Obtener parámetros de búsqueda
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1')
  const search = resolvedSearchParams.search || ''
  const roleFilter = resolvedSearchParams.role || 'all'
  const statusFilter = resolvedSearchParams.status || 'all'
  
  // Construir filtros
  const where: any = {}
  
  // Filtro de búsqueda (nombre o email)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  // Filtro de rol
  if (roleFilter !== 'all') {
    where.role = roleFilter
  }
  
  // Filtro de estado de verificación
  if (statusFilter === 'verified') {
    where.emailVerified = { not: null }
  } else if (statusFilter === 'unverified') {
    where.emailVerified = null
  }
  
  // Contar total de usuarios
  const totalUsers = await prisma.user.count({ where })
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)
  
  // Obtener usuarios paginados
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          accounts: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * USERS_PER_PAGE,
    take: USERS_PER_PAGE,
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/${locale}/admin`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('manageUsers')}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-14">
                {t('manageUsersDescription')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('totalUsers')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalUsers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserList
          users={users}
          currentAdminId={currentAdminId}
          locale={locale}
          page={page}
          totalPages={totalPages}
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  )
}