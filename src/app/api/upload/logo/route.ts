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

    console.log(`[UploadLogo] Admin ${session.user.id} uploading: ${file.name}`)

    // Obtener configuración actual para eliminar logo anterior
    let settings = await prisma.settings.findFirst()

    // Subir nueva imagen a Azure
    const imageUrl = await uploadImage(file, {
      folder: 'settings/logos',
      maxWidth: 800,
      maxHeight: 400,
      quality: 90,
    })

    // Actualizar configuración en la base de datos
    if (!settings) {
      settings = await prisma.settings.create({
        data: { logo: imageUrl }
      })
    } else {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { logo: imageUrl }
      })
    }

    // Eliminar logo anterior si existía
    if (settings?.logo && settings.logo.includes('blob.core.windows.net')) {
      await deleteImage(settings.logo).catch(err => {
        console.warn('[UploadLogo] Failed to delete old logo:', err)
      })
    }

    console.log(`[UploadLogo] ✅ Logo updated`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Logo updated successfully'
    })

  } catch (error) {
    console.error('[UploadLogo] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload logo' },
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

    if (!settings?.logo) {
      return NextResponse.json(
        { error: 'No logo to delete' },
        { status: 400 }
      )
    }

    // Eliminar de Azure
    if (settings.logo.includes('blob.core.windows.net')) {
      await deleteImage(settings.logo)
    }

    // Actualizar configuración (poner logo en null)
    await prisma.settings.update({
      where: { id: settings.id },
      data: { logo: null }
    })

    console.log(`[UploadLogo] ✅ Logo deleted`)

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully'
    })

  } catch (error) {
    console.error('[UploadLogo] Delete error:', error)
    
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}


