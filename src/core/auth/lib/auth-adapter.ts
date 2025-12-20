// src/lib/auth-adapter.ts
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/core/shared/lib/db"
import type { Adapter, AdapterUser } from "next-auth/adapters"
import { cookies } from "next/headers"

export function ConditionalPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma)
  
  return {
    ...baseAdapter,
    createUser: async (user): Promise<AdapterUser> => {
      try {
        console.log(`[Adapter] ====== CREATE USER CALLED ======`)
        console.log(`[Adapter] User email: ${user.email}`)
        console.log(`[Adapter] User name: ${user.name}`)
        
        // Leer el state ID de la cookie
        const cookieStore = await cookies()
        const stateId = cookieStore.get('oauth_state_id')?.value
        
        console.log(`[Adapter] Looking for cookie 'oauth_state_id': ${stateId ? 'FOUND' : 'NOT FOUND'}`)
        console.log(`[Adapter] State ID value: ${stateId}`)
        
        // También intentar buscar TODAS las cookies para debug
        const allCookies = cookieStore.getAll()
        console.log(`[Adapter] All cookies:`, allCookies.map(c => c.name).join(', '))
        
        let intent: string | undefined
        
        if (stateId) {
          console.log(`[Adapter] Searching DB for identifier: ${stateId}`)
          
          // Buscar la intención en la base de datos
          const stateRecord = await prisma.verificationToken.findFirst({
            where: {
              identifier: stateId,
              expires: { gte: new Date() }
            }
          }).catch((err) => {
            console.error('[Adapter] ❌ Error finding state:', err)
            return null
          })
          
          if (stateRecord) {
            intent = stateRecord.token
            console.log(`[Adapter] ✅ Found intent from DB: ${intent}`)
            
            // Limpiar el registro temporal
            await prisma.verificationToken.deleteMany({
              where: { identifier: stateId }
            }).catch((err) => {
              console.error('[Adapter] Error deleting state:', err)
            })
            
            // Limpiar cookie
            cookieStore.delete('oauth_state_id')
            console.log(`[Adapter] Cleaned up state and cookie`)
          } else {
            console.log(`[Adapter] ❌ No state record found in DB for: ${stateId}`)
            
            // Debug: listar todos los registros para ver qué hay
            const allStates = await prisma.verificationToken.findMany({
              where: {
                identifier: { startsWith: 'oauth_' }
              },
              take: 5
            })
            console.log(`[Adapter] Available oauth states in DB:`, allStates.map(s => `${s.identifier} -> ${s.token}`))
          }
        } else {
          console.log(`[Adapter] ⚠️  No oauth_state_id cookie found`)
          
          // Buscar si hay algún registro reciente (últimos 2 minutos)
          const recentStates = await prisma.verificationToken.findMany({
            where: {
              identifier: { startsWith: 'oauth_' },
              expires: { gte: new Date() }
            },
            orderBy: { expires: 'desc' },
            take: 1
          })
          
          if (recentStates.length > 0) {
            console.log(`[Adapter] ⚠️  Found recent state without cookie match: ${recentStates[0].identifier} -> ${recentStates[0].token}`)
            intent = recentStates[0].token
            
            // Usar este y limpiarlo
            await prisma.verificationToken.deleteMany({
              where: { identifier: recentStates[0].identifier }
            }).catch(() => {})
          }
        }
        
        console.log(`[Adapter] Final resolved intent: ${intent || 'NONE'}`)
        
        // Solo permitir creación si la intención es 'register'
        if (intent !== 'register') {
          console.log(`[Adapter] ❌ BLOCKING user creation - intent is '${intent}', expected 'register'`)
          throw new Error('USER_CREATION_BLOCKED')
        }
        
        console.log(`[Adapter] ✅ Intent is 'register' - proceeding with user creation`)
        if (!baseAdapter.createUser) {
          throw new Error('createUser not implemented')
        }
        
        const createdUser = await baseAdapter.createUser(user)
        console.log(`[Adapter] ✅ User created successfully: ${createdUser.id}`)
        console.log(`[Adapter] ====== CREATE USER COMPLETED ======`)
        return createdUser
      } catch (error) {
        console.error('[Adapter] ❌ Error in createUser:', error)
        throw error
      }
    },
  }
}