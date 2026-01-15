'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, ExternalLink, Upload, Loader2, Check, AlertCircle } from 'lucide-react'
import { uploadPaymentReceipt, cancelPendingPayment } from '@/core/payments/actions/payments'
import { useRouter } from 'next/navigation'

interface PaymentFlowModalProps {
  paymentId: string
  amount: number
  currency: string
  gatewayName: string
  paymentLink: string | null
  instructions: string | null
  planName: string
  locale: string
  onClose: () => void
}

export function PaymentFlowModal({
  paymentId,
  amount,
  currency,
  gatewayName,
  paymentLink,
  instructions,
  planName,
  locale,
  onClose,
}: PaymentFlowModalProps) {
  const t = useTranslations('PaymentFlow')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'payment' | 'upload' | 'success'>('payment')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('paymentId', paymentId)

    try {
      const response = await fetch('/api/upload/payment-receipt', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || t('errors.uploadFailed'))
      } else {
        // Now save the receipt URL to the payment
        const uploadResult = await uploadPaymentReceipt(paymentId, result.imageUrl)

        if (uploadResult.success) {
          setStep('success')
        } else {
          setError(t(`errors.${uploadResult.error}`) || uploadResult.error || t('errors.uploadFailed'))
        }
      }
    } catch {
      setError(t('errors.uploadFailed'))
    }

    setUploading(false)
  }

  const handleCancel = async () => {
    startTransition(async () => {
      await cancelPendingPayment(paymentId)
      onClose()
    })
  }

  const handleGoToPayment = () => {
    setStep('upload')
  }

  const handleDone = () => {
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'success' ? t('paymentSubmitted') : t('completePayment')}
          </h2>
          {step !== 'success' && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'payment' && (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('upgradeToText')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {planName}
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  ${amount} {currency}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('paymentMethod')}: {gatewayName}
                </p>
                {instructions && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {instructions}
                  </p>
                )}
              </div>

              {paymentLink ? (
                <div className="space-y-3">
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    {t('goToPaymentLink')}
                  </a>
                  <button
                    onClick={handleGoToPayment}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {t('alreadyPaid')}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noPaymentLink')}</p>
                </div>
              )}
            </>
          )}

          {step === 'upload' && (
            <>
              <div className="text-center mb-6">
                <Upload className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('uploadReceipt')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('uploadReceiptDescription')}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadReceipt}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('uploading')}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('clickToUpload')}
                        </p>
                      </>
                    )}
                  </div>
                </label>

                <button
                  onClick={() => setStep('payment')}
                  disabled={uploading}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {t('back')}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('receiptSubmitted')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t('pendingReviewDescription')}
              </p>
              <button
                onClick={handleDone}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}