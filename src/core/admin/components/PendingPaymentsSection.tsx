'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Receipt, Check, X, Loader2, Eye, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { getPendingPayments, approvePayment, rejectPayment } from '@/core/payments/actions/payments'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  receiptImage: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
  gateway: {
    gatewayName: string
    countryCode: string
  }
  plan: {
    name: string
    displayNameEn: string
    displayNameEs: string
  } | null
}

export function PendingPaymentsSection() {
  const router = useRouter()
  const t = useTranslations('PendingPayments')
  const [isPending, startTransition] = useTransition()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    const result = await getPendingPayments()
    if (result.success && result.payments) {
      setPayments(result.payments as Payment[])
    }
    setLoading(false)
  }

  const handleApprove = async (paymentId: string) => {
    if (!confirm(t('confirmApprove'))) return
    setProcessingId(paymentId)
    setMessage(null)

    startTransition(async () => {
      const result = await approvePayment(paymentId)
      if (result.success) {
        setMessage({ type: 'success', text: t('paymentApproved') })
        loadPayments()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      }
      setProcessingId(null)
    })
  }

  const handleReject = async (paymentId: string) => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: t('rejectReasonRequired') })
      return
    }

    setProcessingId(paymentId)
    setMessage(null)

    startTransition(async () => {
      const result = await rejectPayment(paymentId, rejectReason)
      if (result.success) {
        setMessage({ type: 'success', text: t('paymentRejected') })
        setRejectingId(null)
        setRejectReason('')
        loadPayments()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      }
      setProcessingId(null)
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Receipt className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
        {payments.length > 0 && (
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 rounded-full text-sm font-medium">
            {payments.length} {t('pending')}
          </span>
        )}
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

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t('noPayments')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border dark:border-zinc-700 rounded-lg p-4"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  {payment.receiptImage ? (
                    <div
                      className="relative w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setViewingReceipt(payment.receiptImage)}
                    >
                      <Image
                        src={payment.receiptImage}
                        alt="Receipt"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">{t('noReceipt')}</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{payment.user.name || payment.user.email}</p>
                      <p className="text-sm text-gray-500">{payment.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${payment.amount} {payment.currency}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-xs">
                      {payment.plan?.displayNameEn || payment.plan?.name || 'Unknown Plan'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-400 rounded text-xs">
                      {payment.gateway.gatewayName} ({payment.gateway.countryCode})
                    </span>
                  </div>

                  {rejectingId === payment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t('rejectReasonPlaceholder')}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(payment.id)}
                          disabled={processingId === payment.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                        >
                          {processingId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          {t('confirmReject')}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null)
                            setRejectReason('')
                          }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(payment.id)}
                        disabled={processingId === payment.id}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                      >
                        {processingId === payment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => setRejectingId(payment.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        {t('reject')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingReceipt && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <a
              href={viewingReceipt}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 left-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <Image
              src={viewingReceipt}
              alt="Receipt"
              width={800}
              height={1000}
              className="object-contain max-h-[90vh]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
