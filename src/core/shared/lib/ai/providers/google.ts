import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

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
  const { apiKey, model, prompt,maxTokens, systemPrompt } = options

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({ model: model,
      systemInstruction: systemPrompt || undefined, })

      const generationConfig = {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    }

   
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    })


    const response = await result.response
    const content = response.text()

   
    const tokensUsed = response.usageMetadata 
      ? response.usageMetadata.totalTokenCount 
      : 0

    console.log(`[Google] ✅ Generated response with ${tokensUsed} tokens`)

    return { content, tokensUsed }
  } catch (error:any) {
    console.error('[Google] ❌ Error generating response:', error)

    // Captura de errores específicos de cuota o API Key
    let errorMessage = error.message || 'Unknown error'
    if (errorMessage.includes('429')) errorMessage = 'Quota exceeded or API rate limit reached'
    if (errorMessage.includes('API key not valid')) errorMessage = 'Invalid Google API Key'

    return {
      content: '',
      tokensUsed: 0,
      error: errorMessage,
    }
  }
}

export async function testGoogleConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    // Usamos gemini-1.5-flash para el test por ser más rápido y barato
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Un prompt minimalista para validar la llave
    const result = await model.generateContent('ping')
    const response = await result.response
    
    if (response.text()) {
      return { success: true }
    }
    return { success: false, error: 'Empty response' }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Connection failed',
    }
  }
}
