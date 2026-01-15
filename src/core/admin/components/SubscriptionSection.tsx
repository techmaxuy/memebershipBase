'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { CreditCard, Plus, Edit2, Trash2, Loader2, Check, X, DollarSign } from 'lucide-react'
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  seedDefaultPlans,
} from '@/core/admin/actions/subscriptions'

interface SubscriptionPlan {
  id: string
  name: string
  displayNameEn: string
  displayNameEs: string
  tokens: number
  price: number
  additionalLimit: number
  isActive: boolean
  sortOrder: number
}

export function SubscriptionSection() {
  const router = useRouter()
  const t = useTranslations('Subscriptions')
  const [isPending, startTransition] = useTransition()

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    displayNameEn: '',
    displayNameEs: '',
    tokens: 0,
    price: 0,
    additionalLimit: 0,
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    const result = await getSubscriptionPlans()
    if (result.success && result.plans) {
      setPlans(result.plans)
    }
    setLoading(false)
  }

  const handleSeedPlans = async () => {
    setMessage(null)
    startTransition(async () => {
      const result = await seedDefaultPlans()
      if (result.success) {
        setMessage({ type: 'success', text: t('plansSeeded') })
        loadPlans()
      } else {
        setMessage({ type: 'error', text: t('errors.seedFailed') })
      }
    })
  }

  const handleCreate = async () => {
    setMessage(null)
    startTransition(async () => {
      const result = await createSubscriptionPlan(formData)
      if (result.success) {
        setMessage({ type: 'success', text: t('planCreated') })
        setIsCreating(false)
        resetForm()
        loadPlans()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`)  || result.error || t('errors.createFailed')})
      }
    })
  }

  const handleUpdate = async () => {
    if (!editingPlan) return
    setMessage(null)
    startTransition(async () => {
      const result = await updateSubscriptionPlan(editingPlan.id, formData)
      if (result.success) {
        setMessage({ type: 'success', text: t('planUpdated') })
        setEditingPlan(null)
        resetForm()
        loadPlans()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('errors.updateFailed') })
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return
    setMessage(null)
    startTransition(async () => {
      const result = await deleteSubscriptionPlan(id)
      if (result.success) {
        setMessage({ type: 'success', text: t('planDeleted') })
        loadPlans()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('errors.deleteFailed') })
      }
    })
  }

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      displayNameEn: plan.displayNameEn,
      displayNameEs: plan.displayNameEs,
      tokens: plan.tokens,
      price: plan.price,
      additionalLimit: plan.additionalLimit,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingPlan(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayNameEn: '',
      displayNameEs: '',
      tokens: 0,
      price: 0,
      additionalLimit: 0,
      isActive: true,
      sortOrder: plans.length,
    })
  }

  const cancelEdit = () => {
    setEditingPlan(null)
    setIsCreating(false)
    resetForm()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {plans.length === 0 && (
            <button
              onClick={handleSeedPlans}
              disabled={isPending}
              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('seedDefaults')}
            </button>
          )}
          <button
            onClick={startCreate}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('addPlan')}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {(isCreating || editingPlan) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <h3 className="text-md font-medium mb-4">
            {isCreating ? t('createPlan') : t('editPlan')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('planName')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder="e.g., pro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('displayNameEn')}</label>
              <input
                type="text"
                value={formData.displayNameEn}
                onChange={(e) => setFormData({ ...formData, displayNameEn: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('displayNameEs')}</label>
              <input
                type="text"
                value={formData.displayNameEs}
                onChange={(e) => setFormData({ ...formData, displayNameEs: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('tokens')}</label>
              <input
                type="number"
                value={formData.tokens}
                onChange={(e) => setFormData({ ...formData, tokens: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('price')} (USD)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('additionalLimit')}</label>
              <input
                type="number"
                value={formData.additionalLimit}
                onChange={(e) => setFormData({ ...formData, additionalLimit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('sortOrder')}</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">{t('isActive')}</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={isCreating ? handleCreate : handleUpdate}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isCreating ? t('create') : t('save')}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('noPlans')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-700">
                <th className="text-left py-3 px-2">{t('planName')}</th>
                <th className="text-left py-3 px-2">{t('displayName')}</th>
                <th className="text-center py-3 px-2">{t('tokens')}</th>
                <th className="text-center py-3 px-2">{t('price')}</th>
                <th className="text-center py-3 px-2">{t('additionalLimit')}</th>
                <th className="text-center py-3 px-2">{t('status')}</th>
                <th className="text-right py-3 px-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="py-3 px-2 font-medium">{plan.name}</td>
                  <td className="py-3 px-2">{plan.displayNameEn}</td>
                  <td className="py-3 px-2 text-center">{plan.tokens}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-flex items-center">
                      <DollarSign className="w-3 h-3" />
                      {plan.price}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">{plan.additionalLimit}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        plan.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-400'
                      }`}
                    >
                      {plan.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(plan)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
