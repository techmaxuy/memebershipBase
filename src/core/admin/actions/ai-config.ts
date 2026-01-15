'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { testAIConfigConnection, getAvailableModels } from '@/core/shared/lib/ai'
import type { AIProvider } from '@prisma/client'

const AIConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE']),
  apiKey: z.string().min(10, 'API key is required'),
  defaultModel: z.string().min(1, 'Model is required'),
  isActive: z.boolean().default(true),
})

export async function getAIConfigs() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const configs = await prisma.aIConfig.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        defaultModel: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, configs }
  } catch (error) {
    console.error('[AIConfig] Error getting configs:', error)
    return { error: 'DatabaseError' }
  }
}

export async function createAIConfig(values: z.infer<typeof AIConfigSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const validated = AIConfigSchema.safeParse(values)
    if (!validated.success) {
      return { error: 'InvalidFields' }
    }

    const config = await prisma.aIConfig.create({
      data: validated.data,
    })

    console.log(`[AIConfig] ✅ Config created: ${config.name}`)
    revalidatePath('/admin/settings')

    return { success: true, config }
  } catch (error) {
    console.error('[AIConfig] Error creating config:', error)
    return { error: 'DatabaseError' }
  }
}

export async function updateAIConfig(
  id: string,
  values: Partial<z.infer<typeof AIConfigSchema>>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const existingConfig = await prisma.aIConfig.findUnique({
      where: { id },
    })

    if (!existingConfig) {
      return { error: 'ConfigNotFound' }
    }

    const config = await prisma.aIConfig.update({
      where: { id },
      data: values,
    })

    console.log(`[AIConfig] ✅ Config updated: ${config.name}`)
    revalidatePath('/admin/settings')

    return { success: true, config }
  } catch (error) {
    console.error('[AIConfig] Error updating config:', error)
    return { error: 'DatabaseError' }
  }
}

export async function deleteAIConfig(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const existingConfig = await prisma.aIConfig.findUnique({
      where: { id },
    })

    if (!existingConfig) {
      return { error: 'ConfigNotFound' }
    }

    await prisma.aIConfig.delete({
      where: { id },
    })

    console.log(`[AIConfig] ✅ Config deleted: ${existingConfig.name}`)
    revalidatePath('/admin/settings')

    return { success: true }
  } catch (error) {
    console.error('[AIConfig] Error deleting config:', error)
    return { error: 'DatabaseError' }
  }
}

export async function testAIConfig(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const result = await testAIConfigConnection(id)

    if (result.success) {
      console.log(`[AIConfig] ✅ Connection test successful for config: ${id}`)
    } else {
      console.log(`[AIConfig] ❌ Connection test failed for config: ${id}`)
    }

    return result
  } catch (error) {
    console.error('[AIConfig] Error testing config:', error)
    return { success: false, error: 'TestFailed' }
  }
}

export async function getModelsForProvider(provider: AIProvider) {
  try {
    const models = await getAvailableModels(provider)
    return { success: true, models }
  } catch (error) {
    console.error('[AIConfig] Error getting models:', error)
    return { error: 'Failed' }
  }
}
