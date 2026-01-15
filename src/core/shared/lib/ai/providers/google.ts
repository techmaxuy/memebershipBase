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
    // Especificamos la versión v1 para mayor estabilidad si v1beta falla
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Algunos entornos requieren que el modelo tenga el prefijo models/
    const modelName = model.startsWith('models/') ? model : `models/${model}`;
    
    const generativeModel = genAI.getGenerativeModel({ 
      model: modelName,
      // Si el modelo es gemini-1.0-pro, no soporta systemInstruction nativo
      // así que lo manejamos con una validación simple:
      ...(systemPrompt && model.includes('1.5') ? { systemInstruction: systemPrompt } : {})
    });

    // Si es un modelo antiguo (1.0), concatenamos el systemPrompt manualmente
    const finalPrompt = (!model.includes('1.5') && systemPrompt) 
      ? `${systemPrompt}\n\n${prompt}` 
      : prompt;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens || 1000,
        temperature: 0.7,
      },
    });

    const response = await result.response;
    const content = response.text();
    const usageMetadata = response.usageMetadata;

    return { 
      content, 
      tokensUsed: usageMetadata?.totalTokenCount || 0 
    };
  } catch (error: any) {
    console.error('[Google] ❌ Error:', error);
    return {
      content: '',
      tokensUsed: 0,
      error: `[Google API Error]: ${error.message}`,
    };
  }
}

// Actualiza también el testConnection para usar el nombre correcto
export async function testGoogleConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Cambiamos a 'models/gemini-1.5-flash' para asegurar la ruta completa
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

    const result = await model.generateContent('ping');
    const response = await result.response;
    
    return { success: !!response.text() };
  } catch (error: any) {
    return {
      success: false,
      error: `Test failed: ${error.message}`,
    };
  }
}
