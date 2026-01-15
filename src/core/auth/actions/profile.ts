'use server'

import { auth } from '@/../auth'
import { prisma } from '@/core/shared/lib/db'
import { hashPassword, verifyPassword } from '@/core/auth/lib/password'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/core/shared/lib/email'

// Schema de validación para actualizar nombre
const UpdateNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

// Schema para cambiar contraseña
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Schema para cambiar email
const ChangeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Obtiene el perfil del usuario actual
 */
export async function getCurrentProfile() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        subscription: {
          select: {
            id: true,
            tokensUsed: true,
            tokensRemaining: true,
            startDate: true,
            renewalDate: true,
            plan: {
              select: {
                id: true,
                name: true,
                displayNameEn: true,
                displayNameEs: true,
                tokens: true,
                price: true,
                additionalLimit: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return { error: 'UserNotFound' }
    }

    // Determinar si usa OAuth
    const hasPassword = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    return {
      user: {
        ...user,
        hasPassword: !!hasPassword?.password,
        authProviders: user.accounts.map(acc => acc.provider),
      }
    }
  } catch (error) {
    console.error('[GetProfile] Error:', error)
    return { error: 'Failed to fetch profile' }
  }
}

/**
 * Actualiza el nombre del usuario
 */
export async function updateName(values: z.infer<typeof UpdateNameSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validatedFields = UpdateNameSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { name } = validatedFields.data

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })

    revalidatePath('/profile')
    
    console.log(`[UpdateName] ✅ Name updated for user ${session.user.id}`)
    
    return { success: true }
  } catch (error) {
    console.error('[UpdateName] Error:', error)
    return { error: 'FailedToUpdate' }
  }
}

/**
 * Cambia la contraseña del usuario
 */
export async function changePassword(values: z.infer<typeof ChangePasswordSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validatedFields = ChangePasswordSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { currentPassword, newPassword } = validatedFields.data

    // Obtener usuario con password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user?.password) {
      return { error: 'NoPassword' } // Usuario de OAuth
    }

    // Verificar contraseña actual
    const isValid = await verifyPassword(currentPassword, user.password)
    
    if (!isValid) {
      return { error: 'InvalidCurrentPassword' }
    }

    // Hash nueva contraseña
    const hashedPassword = await hashPassword(newPassword)

    // Actualizar
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    console.log(`[ChangePassword] ✅ Password changed for user ${session.user.id}`)
    
    return { success: true }
  } catch (error) {
    console.error('[ChangePassword] Error:', error)
    return { error: 'FailedToUpdate' }
  }
}

/**
 * Inicia el proceso de cambio de email
 */
export async function changeEmail(values: z.infer<typeof ChangeEmailSchema>, locale: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const validatedFields = ChangeEmailSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    const { newEmail, password } = validatedFields.data

    // Verificar que el nuevo email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    })

    if (existingUser) {
      return { error: 'EmailInUse' }
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true },
    })

    // Si el usuario tiene contraseña, verificarla
    if (user?.password) {
      const isValid = await verifyPassword(password, user.password)
      
      if (!isValid) {
        return { error: 'InvalidPassword' }
      }
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hora

    // Guardar token con el nuevo email como identifier
    // Usamos un prefijo para distinguir de tokens de registro
    await prisma.verificationToken.create({
      data: {
        identifier: `change-email:${session.user.id}:${newEmail}`,
        token: verificationToken,
        expires,
      }
    })

    // Enviar email de verificación al NUEVO email
    await sendVerificationEmail(newEmail, verificationToken, locale)

    console.log(`[ChangeEmail] ✅ Verification sent to new email for user ${session.user.id}`)
    
    return { 
      success: true,
      message: 'VerificationSent',
      newEmail,
    }
  } catch (error) {
    console.error('[ChangeEmail] Error:', error)
    return { error: 'FailedToUpdate' }
  }
}

/**
 * Elimina la cuenta del usuario
 */
export async function deleteAccount(password: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    // Si tiene contraseña, verificarla
    if (user?.password) {
      const isValid = await verifyPassword(password, user.password)
      
      if (!isValid) {
        return { error: 'InvalidPassword' }
      }
    }

    // Eliminar usuario (cascade eliminará accounts, sessions, etc.)
    await prisma.user.delete({
      where: { id: session.user.id },
    })

    console.log(`[DeleteAccount] ✅ Account deleted: ${session.user.id}`)
    
    return { success: true }
  } catch (error) {
    console.error('[DeleteAccount] Error:', error)
    return { error: 'FailedToDelete' }
  }
}