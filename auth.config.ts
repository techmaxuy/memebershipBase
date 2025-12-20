// src/auth.config.ts
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"
import { LoginSchema } from "@/schemas/auth"

export const authConfig: NextAuthConfig = {
    providers: [
        Google({ 
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        GitHub({ allowDangerousEmailAccountLinking: true }),
        MicrosoftEntraId({ allowDangerousEmailAccountLinking: true }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials);
                if (!validatedFields.success) return null
                // La validación real se hará en el servidor
                return validatedFields.data as any
            }
        })
    ],
    session: { 
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const pathname = nextUrl.pathname
            
            // Rutas que requieren autenticación
            const isProtectedRoute = pathname.includes('/dashboard') || 
                                    pathname.includes('/profile') ||
                                    pathname.includes('/settings')
            
            if (isProtectedRoute && !isLoggedIn) {
                return false // Redirigir a login
            }
            
            return true
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as any
            }
            return session
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    trustHost: true,
} satisfies NextAuthConfig