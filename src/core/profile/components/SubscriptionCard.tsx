'use client'

import { useTranslations } from 'next-intl'
import { CreditCard, Zap, Calendar, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  name: string
  displayNameEn: string
  displayNameEs: string
  tokens: number
  price: number
  additionalLimit: number
}

interface Subscription {
  id: string
  tokensUsed: number
  tokensRemaining: number
  startDate: Date
  renewalDate: Date
  plan: SubscriptionPlan
}

interface SubscriptionCardProps {
  subscription: Subscription | null
  locale: string
}

export function SubscriptionCard({ subscription, locale }: SubscriptionCardProps) {
  const t = useTranslations('ProfileSubscription')

  const getPlanDisplayName = (plan: SubscriptionPlan) => {
    return locale === 'es' ? plan.displayNameEs : plan.displayNameEn
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getTokensPercentage = () => {
    if (!subscription) return 0
    const total = subscription.plan.tokens
    if (total === 0) return 0
    return Math.round((subscription.tokensRemaining / total) * 100)
  }

  const getProgressBarColor = () => {
    const percentage = getTokensPercentage()
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!subscription) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('noSubscription')}
          </p>
          <Link
            href={`/${locale}/subscription`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            {t('choosePlan')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('currentPlan')}: <span className="font-medium text-blue-600 dark:text-blue-400">{getPlanDisplayName(subscription.plan)}</span>
              </p>
            </div>
          </div>
          {subscription.plan.price > 0 && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
              ${subscription.plan.price}/mo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Tokens Remaining */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">{t('tokensRemaining')}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscription.tokensRemaining}
              </span>
              <span className="text-sm text-gray-500">
                / {subscription.plan.tokens}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressBarColor()}`}
                style={{ width: `${getTokensPercentage()}%` }}
              />
            </div>
          </div>

          {/* Tokens Used */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">{t('tokensUsed')}</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {subscription.tokensUsed}
            </span>
          </div>

          {/* Renewal Date */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{t('renewalDate')}</span>
            </div>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.renewalDate)}
            </span>
          </div>

          {/* Additional Limit */}
          {subscription.plan.additionalLimit > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{t('additionalLimit')}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscription.plan.additionalLimit}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${locale}/subscription`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            {subscription.plan.price === 0 ? t('upgradePlan') : t('changePlan')}
          </Link>
          <Link
            href={`/${locale}/subscription/history`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t('viewHistory')}
          </Link>
        </div>
      </div>
    </div>
  )
}