'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const UpdateSettingsSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(50, 'App name too long'),
  welcomeMessageEn: z.string().min(1, 'English welcome message is required').max(200),
  welcomeMessageEs: z.string().min(1, 'Spanish welcome message is required').max(200),
  defaultLocale: z.enum(['en', 'es']),
})

/**
 * Obtener configuración actual del sistema
 */
export async function getSettings() {
  try {
    let settings = await prisma.settings.findFirst()
    
    // Si no existe, crear configuración por defecto
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          appName: 'MemberBase',
          welcomeMessageEn: 'Welcome to the Member Base with Roles Application',
          welcomeMessageEs: 'Bienvenido a la aplicación base de miembros con roles',
          defaultLocale: 'en',
        }
      })
    }
    
    return settings
  } catch (error) {
    console.error('[Settings] Error getting settings:', error)
    return null
  }
}

/**
 * Actualizar configuración del sistema
 */
export async function updateSettings(values: z.infer<typeof UpdateSettingsSchema>) {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Verificar que el usuario actual sea ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    // Validar datos
    const validatedFields = UpdateSettingsSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { appName, welcomeMessageEn, welcomeMessageEs, defaultLocale } = validatedFields.data

    // Obtener o crear configuración
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          appName,
          welcomeMessageEn,
          welcomeMessageEs,
          defaultLocale,
        }
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          appName,
          welcomeMessageEn,
          welcomeMessageEs,
          defaultLocale,
        }
      })
    }

    // Revalidar todas las páginas para que vean los cambios
    revalidatePath('/', 'layout')

    console.log('[Settings] ✅ Settings updated')

    return { success: true, settings }
  } catch (error) {
    console.error('[Settings] Error updating settings:', error)
    return { error: 'UpdateFailed' }
  }
}