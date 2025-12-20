'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Search, Filter, ChevronLeft, ChevronRight, Shield, ShieldOff, Trash2, MoreVertical, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { changeUserRole, deleteUser } from '@/actions/admin'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  _count: {
    accounts: number
  }
}

interface UserListProps {
  users: User[]
  currentAdminId: string
  locale: string
  page: number
  totalPages: number
  search: string
  roleFilter: string
  statusFilter: string
}

export function UserList({
  users,
  currentAdminId,
  locale,
  page,
  totalPages,
  search: initialSearch,
  roleFilter: initialRoleFilter,
  statusFilter: initialStatusFilter
}: UserListProps) {
  const router = useRouter()
  const t = useTranslations('Admin')
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actioningUserId, setActioningUserId] = useState<string | null>(null)

  // Aplicar filtros
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    params.set('page', '1')
    
    router.push(`/${locale}/admin/users?${params.toString()}`)
  }

  // Cambiar página
  const changePage = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    params.set('page', newPage.toString())
    
    router.push(`/${locale}/admin/users?${params.toString()}`)
  }

  // Cambiar rol
  const handleChangeRole = async (userId: string, newRole: 'USER' | 'ADMIN', userName: string) => {
    const confirmed = confirm(
      t('confirmRoleChange', { name: userName || t('noName'), role: newRole })
    )
    
    if (!confirmed) return

    setActioningUserId(userId)
    setOpenMenuId(null)
    
    startTransition(async () => {
      const result = await changeUserRole(userId, newRole)
      
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
      
      setActioningUserId(null)
    })
  }

  // Eliminar usuario
  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = confirm(t('confirmDelete'))
    
    if (!confirmed) return

    const doubleConfirm = confirm(t('confirmDeleteWarning'))
    
    if (!doubleConfirm) return

    setActioningUserId(userId)
    setOpenMenuId(null)
    
    startTransition(async () => {
      const result = await deleteUser(userId)
      
      if (result.error) {
        alert(t(`errors.${result.error}`) || result.error)
      } else {
        router.refresh()
      }
      
      setActioningUserId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allRoles')}</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="verified">{t('verified')}</option>
              <option value="unverified">{t('unverified')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('applyFilters')}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                  {t('authMethod')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('joined')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || t('noName')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.emailVerified
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {user.emailVerified ? t('verified') : t('unverified')}
                    </span>
                  </td>

                  {/* Auth Method */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user._count.accounts > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        OAuth
                      </span>
                    ) : (
                      'Email'
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString(locale)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actioningUserId === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 ml-auto" />
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          disabled={user.id === currentAdminId}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-10">
                            {/* Change Role */}
                            {user.role === 'USER' ? (
                              <button
                                onClick={() => handleChangeRole(user.id, 'ADMIN', user.name || user.email)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              >
                                <Shield className="w-4 h-4" />
                                {t('changeRoleTo', { role: 'ADMIN' })}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeRole(user.id, 'USER', user.name || user.email)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                              >
                                <ShieldOff className="w-4 h-4" />
                                {t('changeRoleTo', { role: 'USER' })}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('deleteUser')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page === 1 || isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('previousPage')}
            </button>

            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages || isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {t('nextPage')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}