import OpenAI from 'openai'

interface OpenAIRequestOptions {
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

export async function generateWithOpenAI(options: OpenAIRequestOptions): Promise<AIProviderResponse> {
  const { apiKey, model, prompt, maxTokens = 1000, systemPrompt } = options

  try {
    const client = new OpenAI({ apiKey })

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
    })

    const content = response.choices[0]?.message?.content || ''
    const tokensUsed = response.usage?.total_tokens || 0

    console.log(`[OpenAI] ✅ Generated response with ${tokensUsed} tokens`)

    return { content, tokensUsed }
  } catch (error) {
    console.error('[OpenAI] ❌ Error generating response:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new OpenAI({ apiKey })

    await client.models.list()

    console.log('[OpenAI] ✅ Connection test successful')
    return { success: true }
  } catch (error) {
    console.error('[OpenAI] ❌ Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
