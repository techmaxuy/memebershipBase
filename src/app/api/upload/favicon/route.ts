import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, deleteImage } from '@/lib/azure-storage'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

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

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
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

    console.log(`[UploadFavicon] Admin ${session.user.id} uploading: ${file.name}`)

    // Obtener configuración actual para eliminar favicon anterior
    let settings = await prisma.settings.findFirst()

    // Subir nueva imagen a Azure (favicon más pequeño)
    const imageUrl = await uploadImage(file, {
      folder: 'settings/favicons',
      maxWidth: 256,
      maxHeight: 256,
      quality: 95,
    })

    // Actualizar configuración en la base de datos
    if (!settings) {
      settings = await prisma.settings.create({
        data: { favicon: imageUrl }
      })
    } else {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { favicon: imageUrl }
      })
    }

    // Eliminar favicon anterior si existía
    if (settings?.favicon && settings.favicon.includes('blob.core.windows.net')) {
      await deleteImage(settings.favicon).catch(err => {
        console.warn('[UploadFavicon] Failed to delete old favicon:', err)
      })
    }

    console.log(`[UploadFavicon] ✅ Favicon updated`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Favicon updated successfully'
    })

  } catch (error) {
    console.error('[UploadFavicon] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload favicon' },
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

    // Verificar que sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Obtener configuración actual
    const settings = await prisma.settings.findFirst()

    if (!settings?.favicon) {
      return NextResponse.json(
        { error: 'No favicon to delete' },
        { status: 400 }
      )
    }

    // Eliminar de Azure
    if (settings.favicon.includes('blob.core.windows.net')) {
      await deleteImage(settings.favicon)
    }

    // Actualizar configuración (poner favicon en null)
    await prisma.settings.update({
      where: { id: settings.id },
      data: { favicon: null }
    })

    console.log(`[UploadFavicon] ✅ Favicon deleted`)

    return NextResponse.json({
      success: true,
      message: 'Favicon deleted successfully'
    })

  } catch (error) {
    console.error('[UploadFavicon] Delete error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete favicon' },
      { status: 500 }
    )
  }
}