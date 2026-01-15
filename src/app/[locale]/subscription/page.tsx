import { redirect } from 'next/navigation'
import { auth } from '@/../auth'
import { getTranslations } from 'next-intl/server'
import { getAvailablePlans, getUserSubscription } from '@/core/payments/actions/subscription-plans'
import { SubscriptionPlansView } from '@/core/payments/components/SubscriptionPlansView'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface SubscriptionPageProps {
  params: Promise<{ locale: string }>
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('SubscriptionPage')

  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const [plansResult, subscriptionResult] = await Promise.all([
    getAvailablePlans(),
    getUserSubscription(),
  ])

  const plans = plansResult.success ? plansResult.plans : []
  const currentSubscription = subscriptionResult.success ? subscriptionResult.subscription : null

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/profile`}
            className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('backToProfile')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        <SubscriptionPlansView
          plans={plans || []}
          currentSubscription={currentSubscription}
          locale={locale}
        />
      </div>
    </div>
  )
}