import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, deleteImage } from '@/core/shared/lib/azure-storage'
import { prisma } from '@/core/shared/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`[UploadBgMobile] Admin ${session.user.id} uploading: ${file.name}`)

    const settings = await prisma.settings.findFirst()

    const imageUrl = await uploadImage(file, {
      folder: 'settings/backgrounds/mobile',
      maxWidth: 1200,
      maxHeight: 2000,
      quality: 85,
    })

    if (!settings) {
      await prisma.settings.create({
        data: { backgroundImageMobile: imageUrl }
      })
    } else {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { backgroundImageMobile: imageUrl }
      })
    }

    if (settings?.backgroundImageMobile) {
      await deleteImage(settings.backgroundImageMobile).catch(err => {
        console.warn('[UploadBgMobile] Failed to delete old image:', err)
      })
    }

    console.log(`[UploadBgMobile] ✅ Background mobile updated`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Mobile background updated successfully'
    })

  } catch (error) {
    console.error('[UploadBgMobile] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to upload mobile background' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findFirst()

    if (!settings?.backgroundImageMobile) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 })
    }

    if (settings.backgroundImageMobile.includes('blob.core.windows.net')) {
      await deleteImage(settings.backgroundImageMobile)
    }

    await prisma.settings.update({
      where: { id: settings.id },
      data: { backgroundImageMobile: null }
    })

    console.log(`[UploadBgMobile] ✅ Mobile background deleted`)

    return NextResponse.json({
      success: true,
      message: 'Mobile background deleted successfully'
    })

  } catch (error) {
    console.error('[UploadBgMobile] Delete error:', error)
    
    return NextResponse.json({ error: 'Failed to delete mobile background' }, { status: 500 })
  }
}