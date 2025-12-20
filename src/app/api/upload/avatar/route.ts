import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, deleteImage } from '@/core/shared/lib/azure-storage'
import { prisma } from '@/core/shared/lib/db'

export const runtime = 'nodejs' // Necesario para sharp

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`[UploadAvatar] User ${session.user.id} uploading: ${file.name}`)

    // Obtener usuario actual para eliminar avatar anterior
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })

    // Subir nueva imagen a Azure
    const imageUrl = await uploadImage(file, {
      folder: 'avatars',
      maxWidth: 400, // Avatares más pequeños
      maxHeight: 400,
      quality: 90,
    })

    // Actualizar usuario en la base de datos
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl }
    })

    // Eliminar avatar anterior si existía (y no es de OAuth)
    if (user?.image && user.image.includes('blob.core.windows.net')) {
      await deleteImage(user.image).catch(err => {
        console.warn('[UploadAvatar] Failed to delete old image:', err)
      })
    }

    console.log(`[UploadAvatar] ✅ Avatar updated for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Avatar updated successfully'
    })

  } catch (error) {
    console.error('[UploadAvatar] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })

    if (!user?.image) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 400 }
      )
    }

    // No eliminar imágenes de OAuth providers
    if (!user.image.includes('blob.core.windows.net')) {
      return NextResponse.json(
        { error: 'Cannot delete OAuth provider image' },
        { status: 400 }
      )
    }

    // Eliminar de Azure
    await deleteImage(user.image)

    // Actualizar usuario (poner imagen en null)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null }
    })

    console.log(`[UploadAvatar] ✅ Avatar deleted for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully'
    })

  } catch (error) {
    console.error('[UploadAvatar] Delete error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}