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
  const { apiKey, model, prompt, maxTokens, systemPrompt } = options

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // SOLUCIÓN AL 404: Asegurar el formato 'models/nombre-del-modelo'
    const modelId = model.startsWith('models/') ? model : `models/${model}`
    
    // Configuración avanzada para modelos 1.5
    const isModel15 = model.includes('1.5')
    
    const generativeModel = genAI.getGenerativeModel({ 
      model: modelId,
      // Solo enviamos systemInstruction si es Gemini 1.5
      ...(isModel15 && systemPrompt ? { systemInstruction: systemPrompt } : {})
    })

    const generationConfig = {
      maxOutputTokens: maxTokens || 1000,
      temperature: 0.7,
      topP: 0.95,
    }

    // Si NO es 1.5, concatenamos el systemPrompt manualmente como respaldo
    const finalPrompt = (!isModel15 && systemPrompt) 
      ? `${systemPrompt}\n\n${prompt}` 
      : prompt

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig,
    })

    const response = await result.response
    const text = response.text()

    return { 
      content: text, 
      tokensUsed: response.usageMetadata?.totalTokenCount || 0 
    }
  } catch (error: any) {
    console.error('[Google] ❌ Error detallado:', error)
    return {
      content: '',
      tokensUsed: 0,
      error: error.message.includes('404') 
        ? `Modelo no encontrado (${model}). Intenta con gemini-1.5-flash-latest` 
        : error.message,
    }
  }
}

export async function testGoogleConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    // Usamos el nombre base que suele ser el más compatible para tests
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' })

    const result = await model.generateContent('Hi')
    const response = await result.response
    const text = response.text()
    
    return { success: !!text }
  } catch (error: any) {
    return {
      success: false,
      error: `Error de conexión: ${error.message}`,
    }
  }
}
