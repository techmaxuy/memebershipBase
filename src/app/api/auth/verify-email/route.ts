import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const locale = searchParams.get('locale') || 'en' 

  console.log('[VerifyEmail] Received token:', token ? 'present' : 'missing')

  if (!token) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=InvalidToken`, request.url) 
    )
  }

  try {
    // Buscar el token en la base de datos
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: { gte: new Date() }, // Token no expirado
      },
    })

    if (!verificationToken) {
      console.log('[VerifyEmail] Token not found or expired')
      return NextResponse.redirect(
        new URL(`/${locale}/login?error=TokenExpired`, request.url)
      )
    }

    const email = verificationToken.identifier

    // Actualizar el usuario como verificado
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    // Eliminar el token usado
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    console.log(`[VerifyEmail] ✅ Email verified: ${email}`)

    // Redirigir a login con mensaje de éxito
    return NextResponse.redirect(
      new URL(`/${locale}/login?verified=true`, request.url) 
    )
  } catch (error) {
    console.error('[VerifyEmail] Error:', error)
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=VerificationFailed`, request.url)
    )
  }
}