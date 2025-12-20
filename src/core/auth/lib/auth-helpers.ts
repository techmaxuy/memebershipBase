// lib/auth-helpers.ts
import { auth } from '@/../auth'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'
import { prisma } from '@/core/shared/lib/db'

/**
 * Obtiene la sesión actual del servidor
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

/**
 * Requiere que el usuario esté autenticado
 * Redirige a login si no lo está
 */
export async function requireAuth(locale: string = 'en') {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect(`/${locale}/login`)
  }
  
  return user
}

/**
 * Requiere un rol específico
 * Redirige si el usuario no tiene el rol
 */
export async function requireRole(role: Role, locale: string = 'en') {
  const user = await requireAuth(locale)
  
  if (user.role !== role) {
    redirect(`/${locale}?error=Unauthorized`)
  }
  
  return user
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Verifica si el usuario es admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN')
}

/**
 * Requiere que el usuario sea admin
 */
export async function requireAdmin(locale: string = 'en') {

  const session = await auth()
  
  // Verificación 1: Usuario autenticado
  if (!session?.user) {
    console.log('[Auth] 🚫 No session - redirecting to login')
    redirect(`/${locale}/login?error=Unauthorized`)
  }
  
  // Verificación 2: Role en session
  if (session.user.role !== 'ADMIN') {
    console.log('[Auth] 🚫 User is not ADMIN - access denied')
    redirect(`/${locale}?error=AccessDenied`)
  }
  
  // Verificación 3: Confirmar en base de datos (crítico)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true, email: true }
  })
  
  if (!user || user.role !== 'ADMIN') {
    console.log('[Auth] 🚫 DB verification failed - role mismatch')
    redirect(`/${locale}?error=AccessDenied`)
  }
  
  console.log('[Auth] ✅ Admin verified:', user.email)
  
  return user

  return requireRole('ADMIN', locale)
}

/**
 * Verifica si el usuario actual es el propietario del recurso
 */
export async function isOwner(userId: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.id === userId
}

/**
 * Requiere que el usuario sea el propietario o admin
 */
export async function requireOwnerOrAdmin(
  userId: string, 
  locale: string = 'en'
) {
  const user = await requireAuth(locale)
  const admin = await isAdmin()
  
  if (!admin && user.id !== userId) {
    redirect(`/${locale}?error=Unauthorized`)
  }
  
  return user
}