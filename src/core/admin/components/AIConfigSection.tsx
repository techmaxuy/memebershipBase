'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Bot, Plus, Edit2, Trash2, Loader2, Check, X, Zap, Eye, EyeOff } from 'lucide-react'
import {
  getAIConfigs,
  createAIConfig,
  updateAIConfig,
  deleteAIConfig,
  testAIConfig,
  getModelsForProvider,
} from '@/core/admin/actions/ai-config'

type AIProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE'

interface AIConfig {
  id: string
  name: string
  provider: AIProvider
  defaultModel: string
  isActive: boolean
  createdAt: Date
}

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'ANTHROPIC', label: 'Anthropic' },
  { value: 'GOOGLE', label: 'Google' },
]

export function AIConfigSection() {
  const router = useRouter()
  const t = useTranslations('AIConfig')
  const [isPending, startTransition] = useTransition()

  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    provider: 'OPENAI' as AIProvider,
    apiKey: '',
    defaultModel: '',
    isActive: true,
  })

  useEffect(() => {
    loadConfigs()
  }, [])

  useEffect(() => {
    if (formData.provider) {
      loadModels(formData.provider)
    }
  }, [formData.provider])

  const loadConfigs = async () => {
    setLoading(true)
    const result = await getAIConfigs()
    if ('success' in result && result.success && result.configs) {
      setConfigs(result.configs)
    }
    setLoading(false)
  }

  const loadModels = async (provider: AIProvider) => {
    const result = await getModelsForProvider(provider)
    if ('success' in result && result.success && result.models) {
      setAvailableModels(result.models)
      if (result.models.length > 0 && !formData.defaultModel) {
        setFormData((prev) => ({ ...prev, defaultModel: result.models[0] }))
      }
    }
  }

  const handleCreate = async () => {
    setMessage(null)
    startTransition(async () => {
      const result = await createAIConfig(formData)
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: t('configCreated') })
        setIsCreating(false)
        resetForm()
        loadConfigs()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`)     || result.error || 'Unknown Error'  })
      }
    })
  }

  const handleUpdate = async () => {
    if (!editingConfig) return
    setMessage(null)
    startTransition(async () => {
      const updateData = { ...formData }
      if (!updateData.apiKey) {
        delete (updateData as Partial<typeof formData>).apiKey
      }
      const result = await updateAIConfig(editingConfig.id, updateData)
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: t('configUpdated') })
        setEditingConfig(null)
        resetForm()
        loadConfigs()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || 'Unknown Error' })
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return
    setMessage(null)
    startTransition(async () => {
      const result = await deleteAIConfig(id)
      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: t('configDeleted') })
        loadConfigs()
      } else {
        setMessage({ type: 'error', text: t(`errors.${result.error}`) || result.error || t('connectionFailed') })
      }
    })
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    setMessage(null)
    const result = await testAIConfig(id) 
    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: t('connectionSuccess') })
    }
     else {
      setMessage({ type: 'error', text: result.error || t('connectionFailed')   })
    }
    setTestingId(null)
  }

  const startEdit = (config: AIConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      provider: config.provider,
      apiKey: '',
      defaultModel: config.defaultModel,
      isActive: config.isActive,
    })
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingConfig(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'OPENAI',
      apiKey: '',
      defaultModel: '',
      isActive: true,
    })
    setShowApiKey(false)
  }

  const cancelEdit = () => {
    setEditingConfig(null)
    setIsCreating(false)
    resetForm()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/20 rounded-lg">
            <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
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
        <button
          onClick={startCreate}
          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addProvider')}
        </button>
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

      {(isCreating || editingConfig) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <h3 className="text-md font-medium mb-4">
            {isCreating ? t('addProvider') : t('editProvider')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('providerName')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                placeholder={t('providerNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('provider')}</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as AIProvider, defaultModel: '' })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('apiKey')}</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
                  placeholder={editingConfig ? t('apiKeyPlaceholderEdit') : t('apiKeyPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('defaultModel')}</label>
              <select
                value={formData.defaultModel}
                onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600"
              >
                <option value="">{t('selectModel')}</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aiIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="aiIsActive" className="text-sm font-medium">{t('isActive')}</label>
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
      ) : configs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('noConfigs')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-700">
                <th className="text-left py-3 px-2">{t('providerName')}</th>
                <th className="text-left py-3 px-2">{t('provider')}</th>
                <th className="text-left py-3 px-2">{t('defaultModel')}</th>
                <th className="text-center py-3 px-2">{t('status')}</th>
                <th className="text-right py-3 px-2">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="py-3 px-2 font-medium">{config.name}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">
                      {config.provider}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{config.defaultModel}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        config.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-400'
                      }`}
                    >
                      {config.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTest(config.id)}
                        disabled={testingId === config.id}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-blue-600"
                        title={t('testConnection')}
                      >
                        {testingId === config.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(config)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
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
