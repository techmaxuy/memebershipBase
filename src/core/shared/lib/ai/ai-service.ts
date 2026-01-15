'use server'

import { prisma } from '@/core/shared/lib/db'
import { consumeTokens, canUseAI } from '@/core/shared/lib/tokens'
import { generateWithOpenAI, testOpenAIConnection } from './providers/openai'
import { generateWithAnthropic, testAnthropicConnection } from './providers/anthropic'
import { generateWithGoogle, testGoogleConnection } from './providers/google'
import type { AIProvider } from '@prisma/client'

interface AIRequest {
  userId: string
  prompt: string
  configId?: string
  maxTokens?: number
  systemPrompt?: string
  tokensToConsume?: number
}

interface AIResponse {
  success?: boolean
  content?: string
  tokensUsed?: number
  error?: string
}

export async function generateAIResponse(request: AIRequest): Promise<AIResponse> {
  const { userId, prompt, configId, maxTokens = 1000, systemPrompt, tokensToConsume = 1 } = request

  try {
    const hasTokens = await canUseAI(userId, tokensToConsume)
    if (!hasTokens) {
      return { error: 'InsufficientTokens' }
    }

    let config
    if (configId) {
      config = await prisma.aIConfig.findUnique({
        where: { id: configId, isActive: true },
      })
    } else {
      config = await prisma.aIConfig.findFirst({
        where: { isActive: true },
      })
    }

    if (!config) {
      return { error: 'NoAIConfigured' }
    }

    let result: { content: string; tokensUsed: number; error?: string }

    switch (config.provider) {
      case 'OPENAI':
        result = await generateWithOpenAI({
          apiKey: config.apiKey,
          model: config.defaultModel,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      case 'ANTHROPIC':
        result = await generateWithAnthropic({
          apiKey: config.apiKey,
          model: config.defaultModel,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      case 'GOOGLE':
        result = await generateWithGoogle({
          apiKey: config.apiKey,
          model: config.defaultModel,
          prompt,
          maxTokens,
          systemPrompt,
        })
        break

      default:
        return { error: 'UnsupportedProvider' }
    }

    if (result.error) {
      return { error: result.error }
    }

    await consumeTokens(userId, tokensToConsume, 'ai_generation', config.id, {
      provider: config.provider,
      model: config.defaultModel,
      promptLength: prompt.length,
    })

    return {
      success: true,
      content: result.content,
      tokensUsed: result.tokensUsed,
    }
  } catch (error) {
    console.error('[AIService] ❌ Error generating response:', error)
    return { error: 'GenerationFailed' }
  }
}

export async function testAIConfigConnection(configId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.aIConfig.findUnique({
      where: { id: configId },
    })

    if (!config) {
      return { success: false, error: 'ConfigNotFound' }
    }

    switch (config.provider) {
      case 'OPENAI':
        return await testOpenAIConnection(config.apiKey)

      case 'ANTHROPIC':
        return await testAnthropicConnection(config.apiKey)

      case 'GOOGLE':
        return await testGoogleConnection(config.apiKey,config.defaultModel)

      default:
        return { success: false, error: 'UnsupportedProvider' }
    }
  } catch (error) {
    console.error('[AIService] ❌ Error testing connection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getAvailableModels(provider: AIProvider): Promise<string[]> {
  switch (provider) {
    case 'OPENAI':
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ]

    case 'ANTHROPIC':
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ]

    case 'GOOGLE':
      return [
        'gemini-3-flash-preview', // Intenta este primero
    'gemini-1.5-pro-latest',
    'gemini-pro',
      ]

    default:
      return []
  }
}
