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

    console.log(`[UploadBgDesktop] Admin ${session.user.id} uploading: ${file.name}`)

    const settings = await prisma.settings.findFirst()

    const imageUrl = await uploadImage(file, {
      folder: 'settings/backgrounds/desktop',
      maxWidth: 2500,
      maxHeight: 1400,
      quality: 85,
    })

    if (!settings) {
      await prisma.settings.create({
        data: { backgroundImageDesktop: imageUrl }
      })
    } else {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { backgroundImageDesktop: imageUrl }
      })
    }

    if (settings?.backgroundImageDesktop) {
      await deleteImage(settings.backgroundImageDesktop).catch(err => {
        console.warn('[UploadBgDesktop] Failed to delete old image:', err)
      })
    }

    console.log(`[UploadBgDesktop] ✅ Background desktop updated`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Desktop background updated successfully'
    })

  } catch (error) {
    console.error('[UploadBgDesktop] Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to upload desktop background' }, { status: 500 })
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

    if (!settings?.backgroundImageDesktop) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 })
    }

    if (settings.backgroundImageDesktop.includes('blob.core.windows.net')) {
      await deleteImage(settings.backgroundImageDesktop)
    }

    await prisma.settings.update({
      where: { id: settings.id },
      data: { backgroundImageDesktop: null }
    })

    console.log(`[UploadBgDesktop] ✅ Desktop background deleted`)

    return NextResponse.json({
      success: true,
      message: 'Desktop background deleted successfully'
    })

  } catch (error) {
    console.error('[UploadBgDesktop] Delete error:', error)
    
    return NextResponse.json({ error: 'Failed to delete desktop background' }, { status: 500 })
  }
}