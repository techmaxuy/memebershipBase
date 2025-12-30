'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon, Globe, Save, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { updateSettings } from '@/core/admin/actions/settings'

interface SettingsFormProps {
  settings: {
    id: string
    appName: string
    welcomeMessageEn: string
    welcomeMessageEs: string
    logo: string | null
    favicon: string | null
    defaultLocale: string
    backgroundImageMobile: string | null 
    backgroundImageDesktop: string | null 
  }
  locale: string
}

export function SettingsForm({ settings, locale }: SettingsFormProps) {
  const router = useRouter()
  const t = useTranslations('Settings')
  const [isPending, startTransition] = useTransition()
  
  // Form state
  const [appName, setAppName] = useState(settings.appName)
  const [welcomeMessageEn, setWelcomeMessageEn] = useState(settings.welcomeMessageEn)
  const [welcomeMessageEs, setWelcomeMessageEs] = useState(settings.welcomeMessageEs)
  const [defaultLocale, setDefaultLocale] = useState<'en' | 'es'>(settings.defaultLocale as 'en' | 'es')
  
  // Image upload state
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingBgMobile, setUploadingBgMobile] = useState(false)
  const [uploadingBgDesktop, setUploadingBgDesktop] = useState(false)
  
  // Messages
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateSettings({
        appName,
        welcomeMessageEn,
        welcomeMessageEs,
        defaultLocale,
      })

      if (result.error) {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error })
      } else {
        setMessage({ type: 'success', text: t('settingsSaved') })
        router.refresh()
      }
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setUploadingLogo(true)
  setMessage(null)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/api/upload/logo', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      setMessage({ type: 'error', text: result.error || t('errors.UploadFailed') })
    } else {
      setMessage({ type: 'success', text: t('logoUploaded') })
      router.refresh()
    }
  } catch (error) {
    setMessage({ type: 'error', text: t('errors.UploadFailed') })
  }

  setUploadingLogo(false)
}

const handleLogoDelete = async () => {
  if (!confirm(t('confirmDeleteLogo'))) return

  setUploadingLogo(true)
  setMessage(null)

  try {
    const response = await fetch('/api/upload/logo', {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      setMessage({ type: 'error', text: result.error || t('errors.DeleteFailed') })
    } else {
      setMessage({ type: 'success', text: t('logoDeleted') })
      router.refresh()
    }
  } catch (error) {
    setMessage({ type: 'error', text: t('errors.DeleteFailed') })
  }

  setUploadingLogo(false)
}

const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setUploadingFavicon(true)
  setMessage(null)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/api/upload/favicon', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      setMessage({ type: 'error', text: result.error || t('errors.UploadFailed') })
    } else {
      setMessage({ type: 'success', text: t('faviconUploaded') })
      router.refresh()
    }
  } catch (error) {
    setMessage({ type: 'error', text: t('errors.UploadFailed') })
  }

  setUploadingFavicon(false)
}

const handleFaviconDelete = async () => {
  if (!confirm(t('confirmDeleteFavicon'))) return

  setUploadingFavicon(true)
  setMessage(null)

  try {
    const response = await fetch('/api/upload/favicon', {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok || result.error) {
      setMessage({ type: 'error', text: result.error || t('errors.DeleteFailed') })
    } else {
      setMessage({ type: 'success', text: t('faviconDeleted') })
      router.refresh()
    }
  } catch (error) {
    setMessage({ type: 'error', text: t('errors.DeleteFailed') })
  }

  setUploadingFavicon(false)
}

// Handlers para Mobile
const handleBackgroundMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingBgMobile(true)
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await fetch('/api/upload/background-mobile', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setMessage({ type: 'success', text: t('bgMobileUploaded') })
    router.refresh()
  } catch {
    setMessage({ type: 'error', text: t('errors.UploadFailed') })
  }
  setUploadingBgMobile(false)
}

const handleBackgroundMobileDelete = async () => {
  if (!confirm(t('confirmDeleteBgMobile'))) return
  setUploadingBgMobile(true)
  try {
    const response = await fetch('/api/upload/background-mobile', { method: 'DELETE' })
    if (!response.ok) throw new Error()
    setMessage({ type: 'success', text: t('bgMobileDeleted') })
    router.refresh()
  } catch {
    setMessage({ type: 'error', text: t('errors.DeleteFailed') })
  }
  setUploadingBgMobile(false)
}

const handleBackgroundDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingBgDesktop(true)
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await fetch('/api/upload/background-desktop', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setMessage({ type: 'success', text: t('bgDesktopUploaded') })
    router.refresh()
  } catch {
    setMessage({ type: 'error', text: t('errors.UploadFailed') })
  }
  setUploadingBgDesktop(false)
}

const handleBackgroundDesktopDelete = async () => {
  if (!confirm(t('confirmDeleteBgDesktop'))) return
  setUploadingBgDesktop(true)
  try {
    const response = await fetch('/api/upload/background-desktop', { method: 'DELETE' })
    if (!response.ok) throw new Error()
    setMessage({ type: 'success', text: t('bgDesktopDeleted') })
    router.refresh()
  } catch {
    setMessage({ type: 'error', text: t('errors.DeleteFailed') })
  }
  setUploadingBgDesktop(false)
}

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('generalSettings')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('generalSettingsDescription')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* App Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('appName')}
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('appNameDescription')}
              </p>
            </div>

            {/* Default Locale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('defaultLanguage')}
              </label>
              <select
                value={defaultLocale}
                onChange={(e) => setDefaultLocale(e.target.value  as 'en' | 'es')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('defaultLanguageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Messages Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('welcomeMessages')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('welcomeMessagesDescription')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* English Welcome Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('welcomeMessageEnglish')}
              </label>
              <textarea
                value={welcomeMessageEn}
                onChange={(e) => setWelcomeMessageEn(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {welcomeMessageEn.length}/200 {t('characters')}
              </p>
            </div>

            {/* Spanish Welcome Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('welcomeMessageSpanish')}
              </label>
              <textarea
                value={welcomeMessageEs}
                onChange={(e) => setWelcomeMessageEs(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {welcomeMessageEs.length}/200 {t('characters')}
              </p>
            </div>
          </div>
        </div>

        {/* Branding Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('branding')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('brandingDescription')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('logo')}
              </label>
              
              {settings.logo ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={settings.logo}
                      alt="Logo"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                    className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {t('removeLogo')}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('uploadLogo')}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('logoInfo')}
              </p>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('favicon')}
              </label>
              
              {settings.favicon ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <Image
                      src={settings.favicon}
                      alt="Favicon"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFaviconDelete}
                    disabled={uploadingFavicon}
                    className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploadingFavicon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {t('removeFavicon')}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    disabled={uploadingFavicon}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    {uploadingFavicon ? (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('uploadFavicon')}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('faviconInfo')}
              </p>
            </div>
          </div>

            // agregar una linea divisoria

          <hr className="my-6 border-gray-200 dark:border-zinc-700" />

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('backgroundImages')}
              </h2>
            </div>
            </div>
          
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('backgroundImageMobile')}
              </label>
              {settings.backgroundImageMobile ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image src={settings.backgroundImageMobile} alt="Mobile BG" fill className="object-cover" />
                  </div>
                  <button type="button" onClick={handleBackgroundMobileDelete} disabled={uploadingBgMobile} 
                    className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    {uploadingBgMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    {t('removeBackgroundMobile')}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleBackgroundMobileUpload} 
                    disabled={uploadingBgMobile} className="hidden" id="bg-mobile-upload" />
                  <label htmlFor="bg-mobile-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    {uploadingBgMobile ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm">{t('uploadBackgroundMobile')}</span></>}
                  </label>
                </div>
              )}
            </div>

            {/* Desktop Background (similar) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('backgroundImageDesktop')}
              </label>
              {settings.backgroundImageDesktop ? (
                <div className="space-y-3">
                  <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image src={settings.backgroundImageDesktop} alt="Desktop BG" fill className="object-cover" />
                  </div>
                  <button type="button" onClick={handleBackgroundDesktopDelete} disabled={uploadingBgDesktop} 
                    className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    {uploadingBgDesktop ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    {t('removeBackgroundDesktop')}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleBackgroundDesktopUpload} 
                    disabled={uploadingBgDesktop} className="hidden" id="bg-desktop-upload" />
                  <label htmlFor="bg-desktop-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    {uploadingBgDesktop ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm">{t('uploadBackgroundDesktop')}</span></>}
                  </label>
                </div>
              )}
            </div>
          </div>   
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isPending ? t('saving') : t('saveSettings')}
          </button>
        </div>
      </form>
    </div>
  )
}