import { requireAdmin } from '@/core/auth/lib/auth-helpers'
import { getSettings } from '@/core/admin/actions/settings'
import { getTranslations } from 'next-intl/server'
import { SettingsForm } from '@/core/admin/components/SettingsForm'
import { SubscriptionSection } from '@/core/admin/components/SubscriptionSection'
import { AIConfigSection } from '@/core/admin/components/AIConfigSection'
import { PaymentGatewaySection } from '@/core/admin/components/PaymentGatewaySection'
import { PendingPaymentsSection } from '@/core/admin/components/PendingPaymentsSection'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface SettingsPageProps {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params
  const t = await getTranslations('Settings')
  
  // 🔒 VERIFICACIÓN CRÍTICA - Segunda línea de defensa
  await requireAdmin(locale)
  
  // Obtener configuración actual
  const settings = await getSettings()
  
  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {t('errorLoadingSettings')}
          </p>
        </div>
      </div>
    )
  }

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
                  {t('title')}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 ml-14">
                {t('description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <SettingsForm settings={settings} locale={locale} />

        {/* AI Configuration */}
        <AIConfigSection />

        {/* Subscription Plans */}
        <SubscriptionSection />

        {/* Payment Gateways */}
        <PaymentGatewaySection />

        {/* Pending Payments */}
        <PendingPaymentsSection />
      </div>
    </div>
  )
}