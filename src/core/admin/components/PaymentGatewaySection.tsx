'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Banknote, Plus, Edit2, Trash2, Loader2, Check, X, ExternalLink, Link2 } from 'lucide-react'
import {
  getPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  seedUruguayGateway,
} from '@/core/admin/actions/payment-gateways'

interface PaymentGateway {
  id: string
  countryCode: string
  countryName: string
  gatewayName: string
  paymentLink: string | null
  instructions: string | null
  isActive: boolean
}

export function PaymentGatewaySection() {
  const t = useTranslations('PaymentGateways')
  const [isPending, startTransition] = useTransition()

  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    countryCode: '',
    countryName: '',
    gatewayName: '',
    paymentLink: '',
    instructions: '',
    isActive: true,
  })

  useEffect(() => {
    loadGateways()
  }, [])

  const loadGateways = async () => {
    setLoading(true)
    const result = await getPaymentGateways()
    if (result.success && result.gateways) {
      setGateways(result.gateways)
    }
    setLoading(false)
  }

  const handleSeedUruguay = async () => {
    setMessage(null)
    startTransition(async () => {
      const result = await seedUruguayGateway()
      if (result.success) {
        setMessage({ type: 'success', text: t('uruguaySeeded') })
        loadGateways()
      } else {
        setMessage({ type: 'error', text: t('errors.seedFailed') })
      }
    })
  }

  const handleCreate = async () => {
    setMessage(null)
    startTransition(async () => {
      const dataToSend = {
        ...formData,
        paymentLink: formData.paymentLink || null,
      }
      const result = await createPaymentGateway(dataToSend)
      if (result.success) {
        setMessage({ type: 'success', text: t('gatewayCreated') })
        setIsCreating(false)
        resetForm()
        loadGateways()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('errors.createFailed')})
      }
    })
  }

  const handleUpdate = async () => {
    if (!editingGateway) return
    setMessage(null)
    startTransition(async () => {
      const dataToSend = {
        ...formData,
        paymentLink: formData.paymentLink || null,
      }
      const result = await updatePaymentGateway(editingGateway.id, dataToSend)
      if (result.success) {
        setMessage({ type: 'success', text: t('gatewayUpdated') })
        setEditingGateway(null)
        resetForm()
        loadGateways()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('errors.updateFailed')})
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return
    setMessage(null)
    startTransition(async () => {
      const result = await deletePaymentGateway(id)
      if (result.success) {
        setMessage({ type: 'success', text: t('gatewayDeleted') })
        loadGateways()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('errors.deleteFailed')})
      }
    })
  }

  const startEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway)
    setFormData({
      countryCode: gateway.countryCode,
      countryName: gateway.countryName,
      gatewayName: gateway.gatewayName,
      paymentLink: gateway.paymentLink || '',
      instructions: gateway.instructions || '',
      isActive: gateway.isActive,
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingGateway(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      countryCode: '',
      countryName: '',
      gatewayName: '',
      paymentLink: '',
      instructions: '',
      isActive: true,
    })
  }

  const cancelEdit = () => {
    setEditingGateway(null)
    setIsCreating(false)
    resetForm()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
            <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
          {!gateways.find((g) => g.countryCode === 'UY') && (
            <button
              onClick={handleSeedUruguay}
              disabled={isPending}
              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('addUruguay')}
            </button>
          )}
          <button
            onClick={startCreate}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('addGateway')}
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

      {(isCreating || editingGateway) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <h3 className="text-md font-medium mb-4">
            {isCreating ? t('addGateway') : t('editGateway')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('countryCode')}</label>
              <input
                type="text"
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder="UY"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('countryName')}</label>
              <input
                type="text"
                value={formData.countryName}
                onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder="Uruguay"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('gatewayName')}</label>
              <input
                type="text"
                value={formData.gatewayName}
                onChange={(e) => setFormData({ ...formData, gatewayName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder="MercadoPago"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gatewayIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="gatewayIsActive" className="text-sm font-medium">{t('isActive')}</label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('paymentLink')}</label>
              <input
                type="url"
                value={formData.paymentLink}
                onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder="https://link.mercadopago.com.uy/..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('instructions')}</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                rows={3}
                placeholder={t('instructionsPlaceholder')}
              />
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
      ) : gateways.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('noGateways')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="border dark:border-zinc-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">
                      {gateway.countryName} ({gateway.countryCode})
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        gateway.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-400'
                      }`}
                    >
                      {gateway.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{gateway.gatewayName}</p>

                  {gateway.paymentLink && (
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      <a
                        href={gateway.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {t('viewPaymentLink')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {gateway.instructions && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{gateway.instructions}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(gateway)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                    title={t('edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(gateway.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
