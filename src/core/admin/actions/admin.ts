'use server'

import { prisma } from '@/core/shared/lib/db'
import { hashPassword } from '@/core/auth/lib/password'
import { auth } from '@/../auth'
import { z } from 'zod'

const CreateAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function createFirstAdmin(
  values: z.infer<typeof CreateAdminSchema>,
  locale: string
) {
  try {
    // Validar
    const validatedFields = CreateAdminSchema.safeParse(values)
    
    if (!validatedFields.success) {
      return { error: 'InvalidFields' }
    }

    // Verificar que NO exista ya un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return { error: 'AdminAlreadyExists' }
    }

    const { name, email, password } = validatedFields.data

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: 'EmailInUse' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Crear admin
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(), // Auto-verificado
      }
    })

    console.log(`[Setup] ✅ First admin created: ${email}`)

    return { success: true }
  } catch (error) {
    console.error('[Setup] Error creating admin:', error)
    return { error: 'SetupFailed' }
  }
}

/**
 * Cambiar el rol de un usuario
 */
export async function changeUserRole(
  userId: string,
  newRole: 'USER' | 'ADMIN'
) {
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

    // No permitir auto-modificación
    if (userId === session.user.id) {
      return { error: 'CannotModifySelf' }
    }

    // Obtener el usuario a modificar
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        email: true,
        name: true
      }
    })

    if (!targetUser) {
      return { error: 'UserNotFound' }
    }

    // Si estamos degradando de ADMIN a USER, verificar que no sea el último admin
    if (targetUser.role === 'ADMIN' && newRole === 'USER') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return { error: 'CannotRemoveLastAdmin' }
      }
    }

    // Actualizar el rol
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    })

    console.log(`[Admin] ✅ User role changed: ${targetUser.email} → ${newRole}`)

    return { success: true }
  } catch (error) {
    console.error('[Admin] Error changing user role:', error)
    return { error: 'ChangeRoleFailed' }
  }
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(userId: string) {
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

    // No permitir auto-eliminación
    if (userId === session.user.id) {
      return { error: 'CannotDeleteSelf' }
    }

    // Obtener el usuario a eliminar
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        email: true,
        name: true
      }
    })

    if (!targetUser) {
      return { error: 'UserNotFound' }
    }

    // Si es ADMIN, verificar que no sea el último
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return { error: 'CannotDeleteLastAdmin' }
      }
    }

    // Eliminar el usuario (Prisma eliminará automáticamente las relaciones en cascada)
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log(`[Admin] ✅ User deleted: ${targetUser.email}`)

    return { success: true }
  } catch (error) {
    console.error('[Admin] Error deleting user:', error)
    return { error: 'DeleteUserFailed' }
  }
}
