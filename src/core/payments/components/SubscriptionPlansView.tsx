'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Zap, Loader2, ExternalLink } from 'lucide-react'
import { createPaymentRequest } from '@/core/payments/actions/payments'
import { PaymentFlowModal } from './PaymentFlowModal'

interface SubscriptionPlan {
  id: string
  name: string
  displayNameEn: string
  displayNameEs: string
  tokens: number
  price: number
  additionalLimit: number
}

interface CurrentSubscription {
  id: string
  plan: SubscriptionPlan
}

interface SubscriptionPlansViewProps {
  plans: SubscriptionPlan[]
  currentSubscription: CurrentSubscription | null
  locale: string
}

export function SubscriptionPlansView({
  plans,
  currentSubscription,
  locale,
}: SubscriptionPlansViewProps) {
  const t = useTranslations('SubscriptionPage')
  const [isPending, startTransition] = useTransition()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<{
    paymentId: string
    amount: number
    currency: string
    gatewayName: string
    paymentLink: string | null
    instructions: string | null
    planName: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getPlanDisplayName = (plan: SubscriptionPlan) => {
    return locale === 'es' ? plan.displayNameEs : plan.displayNameEn
  }

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan.id === planId
  }

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan.id)) return
    if (plan.price === 0) return // Free plan doesn't need payment

    setSelectedPlanId(plan.id)
    setError(null)

    startTransition(async () => {
      const result = await createPaymentRequest(plan.id)

      if (result.success && result.payment && result.gateway) {
        setPaymentData({
          paymentId: result.payment.id,
          amount: result.payment.amount,
          currency: result.payment.currency,
          gatewayName: result.gateway.gatewayName,
          paymentLink: result.gateway.paymentLink,
          instructions: result.gateway.instructions,
          planName: getPlanDisplayName(plan),
        })
      } else {
        setError(t(`errors.${result.error}`) || result.error || t('errors.unknown'))
      }
      setSelectedPlanId(null)
    })
  }

  const closePaymentModal = () => {
    setPaymentData(null)
  }

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = []

    if (plan.tokens > 0) {
      features.push(`${plan.tokens} ${t('tokensPerMonth')}`)
    } else {
      features.push(t('noTokens'))
    }

    if (plan.additionalLimit > 0) {
      features.push(`${plan.additionalLimit} ${t('additionalLimit')}`)
    }

    return features
  }

  const getPopularPlan = () => {
    // Mark 'pro' as popular, or the middle plan
    const proIndex = plans.findIndex(p => p.name.toLowerCase() === 'pro')
    if (proIndex >= 0) return plans[proIndex].id
    if (plans.length >= 3) return plans[Math.floor(plans.length / 2)].id
    return null
  }

  const popularPlanId = getPopularPlan()

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id)
          const isPopular = plan.id === popularPlanId
          const isSelecting = selectedPlanId === plan.id

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-lg border-2 overflow-hidden transition-all ${
                isCurrent
                  ? 'border-green-500 dark:border-green-400'
                  : isPopular
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-zinc-700'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {t('popular')}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {t('currentPlan')}
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {getPlanDisplayName(plan)}
                </h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /{t('month')}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {getPlanFeatures(plan).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || isSelecting || plan.price === 0}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-default'
                      : plan.price === 0
                      ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
                  }`}
                >
                  {isSelecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('processing')}
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('currentPlan')}
                    </>
                  ) : plan.price === 0 ? (
                    t('freePlan')
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {t('selectPlan')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {paymentData && (
        <PaymentFlowModal
          paymentId={paymentData.paymentId}
          amount={paymentData.amount}
          currency={paymentData.currency}
          gatewayName={paymentData.gatewayName}
          paymentLink={paymentData.paymentLink}
          instructions={paymentData.instructions}
          planName={paymentData.planName}
          locale={locale}
          onClose={closePaymentModal}
        />
      )}
    </>
  )
}