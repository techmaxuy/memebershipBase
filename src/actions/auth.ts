'use server'

import { signIn, signOut } from "@/../auth"
import { LoginSchema, RegisterSchema } from "@/schemas/auth"
import { AuthError } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { cookies } from "next/headers"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export const login = async (values: z.infer<typeof LoginSchema>, locale: string) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "InvalidFields" }
    }

    const { email, password } = validatedFields.data;

    // Verificar si el usuario existe ANTES de intentar login
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return { error: "UserNotFound" }
        }

        if (!user.password) {
            return { error: "UseOAuthProvider" }
        }

        // Verificar si el email está verificado
        if (!user.emailVerified) {
            return { error: "EmailNotVerified", email: user.email }
        }
    } catch (dbError) {
        console.error("[Login] Database error:", dbError)
        return { error: "DatabaseError" }
    }

    // Establecer cookie de intención
    const cookieStore = await cookies()
    cookieStore.set({
        name: 'auth_intent',
        value: 'login',
        httpOnly: true,
        path: '/',
        maxAge: 300 // 5 minutes
    })

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: `/${locale}?success=login`
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                case "CallbackRouteError":
                    return { error: "InvalidPassword" }
                default:
                    console.error("[Login] Auth error:", error.type)
                    return { error: "AuthError" }
            }
        }
        throw error;
    }
}

export const register = async (values: z.infer<typeof RegisterSchema>, locale: string) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "InvalidFields" }
    }

    const { email, password } = validatedFields.data;

    // Check if user already exists
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "AlreadyRegistered" }
        }
    } catch (dbError) {
        console.error("[Register] Database error checking user:", dbError)
        return { error: "DatabaseError" }
    }

    const hashedPassword = await hashPassword(password);

    try {
        // Crear usuario sin emailVerified
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                emailVerified: null, // Explícitamente null hasta verificar
            }
        });

        // Generar token de verificación
        const verificationToken = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 3600 * 1000) // 1 hora

        // Guardar token en la base de datos
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires,
            }
        })

        // Enviar email de verificación
        await sendVerificationEmail(email, verificationToken, locale)

        console.log(`[Register] ✅ User created, verification email sent to: ${email}`)

        return { 
            success: "UserCreated",
            requiresVerification: true,
            email 
        }
    } catch (dbError) {
        console.error("[Register] Database error creating user:", dbError)
        return { error: "DatabaseError" }
    }
}

export const resendVerificationEmail = async (email: string, locale: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return { error: "UserNotFound" }
        }

        if (user.emailVerified) {
            return { error: "AlreadyVerified" }
        }

        // Eliminar tokens anteriores
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        })

        // Generar nuevo token
        const verificationToken = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 3600 * 1000) // 1 hora

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: verificationToken,
                expires,
            }
        })

        // Enviar email
        await sendVerificationEmail(email, verificationToken, locale)

        return { success: "EmailSent" }
    } catch (error) {
        console.error("[ResendVerification] Error:", error)
        return { error: "EmailSendFailed" }
    }
}

export const logout = async (locale?: string) => {
    await signOut({ redirectTo: locale ? `/${locale}` : "/" });
}

export const socialLogin = async (
    provider: "google" | "github" | "microsoft-entra-id", 
    intent: 'login' | 'register', 
    locale?: string
) => {
    // Generar un ID único para esta sesión OAuth
    const stateId = `oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    console.log(`[socialLogin] Provider: ${provider}, Intent: ${intent}, StateID: ${stateId}`)
    
    try {
        // Guardar la intención en la base de datos ANTES de cualquier otra cosa
        await prisma.verificationToken.create({
            data: {
                identifier: stateId,
                token: intent, // Guardamos la intención aquí
                expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
            }
        })
        
        console.log(`[socialLogin] ✅ Created intent record in DB: ${stateId} -> ${intent}`)
        
        // Establecer cookie con el stateId
        const cookieStore = await cookies()
        cookieStore.set('oauth_state_id', stateId, {
            httpOnly: true,
            path: '/',
            maxAge: 600, // 10 minutos
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        })
        
        console.log(`[socialLogin] ✅ Cookie set: oauth_state_id=${stateId}`)

        const redirectTo = intent === 'register' 
            ? `/${locale || 'en'}?success=register`
            : `/${locale || 'en'}?success=login`

        console.log(`[socialLogin] Initiating OAuth redirect...`)

        // Este throw del NEXT_REDIRECT es esperado y normal
        await signIn(provider, { redirectTo })
    } catch (error) {
        // Solo loguear errores reales, no NEXT_REDIRECT
        if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
            console.error('[socialLogin] ❌ Real error:', error)
            
            // Limpiar el registro de la BD si falla
            await prisma.verificationToken.deleteMany({
                where: { identifier: stateId }
            }).catch(() => {})
        }
        throw error
    }
}