import Anthropic from '@anthropic-ai/sdk'

interface AnthropicRequestOptions {
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

export async function generateWithAnthropic(options: AnthropicRequestOptions): Promise<AIProviderResponse> {
  const { apiKey, model, prompt, maxTokens = 1000, systemPrompt } = options

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((block) => block.type === 'text')
    const content = textContent?.type === 'text' ? textContent.text : ''
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)

    console.log(`[Anthropic] ✅ Generated response with ${tokensUsed} tokens`)

    return { content, tokensUsed }
  } catch (error) {
    console.error('[Anthropic] ❌ Error generating response:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function testAnthropicConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new Anthropic({ apiKey })

    await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })

    console.log('[Anthropic] ✅ Connection test successful')
    return { success: true }
  } catch (error) {
    console.error('[Anthropic] ❌ Connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
