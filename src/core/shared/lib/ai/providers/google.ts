import { GoogleGenerativeAI } from '@google/generative-ai'

interface GoogleRequestOptions {
  apiKey: string
  model: string
  prompt: string
  maxTokens?: number
  systemPrompt?: string
}

interface AIProviderResponse {
  content: string
  tokensUsed: number
  error?: string
}

export async function generateWithGoogle(options: GoogleRequestOptions): Promise<AIProviderResponse> {
  const { apiKey, model, prompt, systemPrompt } = options

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({ model })

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

    const result = await generativeModel.generateContent(fullPrompt)
    const response = await result.response
    const content = response.text()

    const usageMetadata = response.usageMetadata
    const tokensUsed = (usageMetadata?.promptTokenCount || 0) + (usageMetadata?.candidatesTokenCount || 0)

    console.log(`[Google] ✅ Generated response with ${tokensUsed} tokens`)

    return { content, tokensUsed }
  } catch (error) {
    console.error('[Google] ❌ Error generating response:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function testGoogleConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    await model.generateContent('Hi')

    console.log('[Google] ✅ Connection test successful')
    return { success: true }
  } catch (error) {
    console.error('[Google] ❌ Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
