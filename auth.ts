// src/auth.ts
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { prisma } from "@/core/shared/lib/db"
import { verifyPassword } from "@/core/auth/lib/password"
import { cookies } from "next/headers"
import { ConditionalPrismaAdapter } from "@/core/auth/lib/auth-adapter"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: ConditionalPrismaAdapter(),
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile, credentials }) {
            try {
                const cookieStore = await cookies()
                console.log(`[SignIn] ✅ Provider: ${account?.provider}, Email: ${user.email}`)
                
                // Credentials provider - validar password
                if (account?.provider === "credentials" && credentials) {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: credentials.email as string }
                    })
                    
                    if (!existingUser || !existingUser.password) {
                        console.log("[Credentials] User not found")
                        return false
                    }
                    
                    const valid = await verifyPassword(
                        credentials.password as string, 
                        existingUser.password
                    )
                    
                    if (!valid) {
                        console.log("[Credentials] Invalid password")
                        return false
                    }
                    
                    user.id = existingUser.id
                    user.role = existingUser.role
                    
                    return true
                }

                // OAuth providers
                if (!user.email) {
                    console.log("[SignIn] No email provided")
                    return false
                }

                // Leer intención desde cookie Y base de datos
                let intent = cookieStore.get('auth_intent')?.value as 'login' | 'register' | undefined
                const stateId = cookieStore.get('oauth_state_id')?.value
                const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
                
                console.log(`[SignIn] Cookie intent: ${intent}`)
                console.log(`[SignIn] State ID: ${stateId}`)

                // Si no hay intent en cookie, buscar en BD usando stateId
                if (!intent && stateId) {
                    console.log(`[SignIn] No cookie intent, searching DB for: ${stateId}`)
                    const stateRecord = await prisma.verificationToken.findFirst({
                        where: {
                            identifier: stateId,
                            expires: { gte: new Date() }
                        }
                    }).catch(() => null)
                    
                    if (stateRecord) {
                        intent = stateRecord.token as 'login' | 'register'
                        console.log(`[SignIn] ✅ Found intent from DB: ${intent}`)
                    }
                }

                console.log(`[SignIn] Intent: ${intent}, Locale: ${locale}`)

                // Verificar si el usuario existe
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: {
                        accounts: true
                    }
                })

                console.log(`[SignIn] Existing user: ${existingUser ? 'Yes' : 'No'}`)

                // INTENT = LOGIN (usuario intentando iniciar sesión)
                if (intent === 'login' || !intent) {
                    if (!existingUser) {
                        console.log("[SignIn] OAuth login blocked - user not registered")
                        cookieStore.delete('auth_intent')
                        cookieStore.delete('oauth_state_id')
                        if (stateId) {
                            await prisma.verificationToken.deleteMany({
                                where: { identifier: stateId }
                            }).catch(() => {})
                        }
                        return `/${locale}/register?error=AccountNotFound&email=${encodeURIComponent(user.email)}`
                    }
                    user.id = existingUser.id
                    user.role = existingUser.role
                    cookieStore.delete('auth_intent')
                    cookieStore.delete('oauth_state_id')
                    if (stateId) {
                        await prisma.verificationToken.deleteMany({
                            where: { identifier: stateId }
                        }).catch(() => {})
                    }
                    return true
                }

                // INTENT = REGISTER (usuario intentando registrarse)
                if (intent === 'register') {
                    if (existingUser) {
                        console.log("[SignIn] OAuth register blocked - user already exists")
                        cookieStore.delete('auth_intent')
                        cookieStore.delete('oauth_state_id')
                        if (stateId) {
                            await prisma.verificationToken.deleteMany({
                                where: { identifier: stateId }
                            }).catch(() => {})
                        }
                        return `/${locale}/login?error=AlreadyRegistered&email=${encodeURIComponent(user.email)}`
                    }
                    // Usuario NO existe - el adapter se encargará de crearlo
                    // NO limpiamos aquí porque el adapter necesita leer la intención
                    console.log("[SignIn] OAuth register - allowing adapter to create user")
                    return true
                }

                // Fallback
                console.log("[SignIn] No valid intent - blocking")
                cookieStore.delete('auth_intent')
                cookieStore.delete('oauth_state_id')
                return `/${locale}/login?error=InvalidRequest`

            } catch (error) {
                console.error("[SignIn] Error:", error)
                
                if (error instanceof Error && error.message === 'USER_CREATION_BLOCKED') {
                    try {
                        const cookieStore2 = await cookies()
                        const locale = cookieStore2.get('NEXT_LOCALE')?.value || 'en'
                        cookieStore2.delete('auth_intent')
                        return `/${locale}/register?error=AccountNotFound&email=${encodeURIComponent(user?.email || '')}`
                    } catch {
                        return `/en/register?error=AccountNotFound`
                    }
                }
                
                return false
            }
        },
    },
    events: {
        async linkAccount({ user, account, profile }) {
            console.log(`[LinkAccount] Account linked for user: ${user.email}`)
        }
    },
    debug: process.env.NODE_ENV === 'development',
})
