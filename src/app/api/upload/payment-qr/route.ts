import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage, deleteImage } from '@/core/shared/lib/azure-storage'
import { prisma } from '@/core/shared/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const gatewayId = formData.get('gatewayId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!gatewayId) {
      return NextResponse.json(
        { error: 'No gateway ID provided' },
        { status: 400 }
      )
    }

    const gateway = await prisma.paymentGateway.findUnique({
      where: { id: gatewayId }
    })

    if (!gateway) {
      return NextResponse.json(
        { error: 'Gateway not found' },
        { status: 404 }
      )
    }

    console.log(`[UploadPaymentQR] Admin ${session.user.id} uploading QR for gateway: ${gatewayId}`)

    const imageUrl = await uploadImage(file, {
      folder: 'payments/qr',
      maxWidth: 500,
      maxHeight: 500,
      quality: 95,
    })

    await prisma.paymentGateway.update({
      where: { id: gatewayId },
      data: { qrImage: imageUrl }
    })

    if (gateway.qrImage && gateway.qrImage.includes('blob.core.windows.net')) {
      await deleteImage(gateway.qrImage).catch(err => {
        console.warn('[UploadPaymentQR] Failed to delete old QR:', err)
      })
    }

    console.log(`[UploadPaymentQR] ✅ QR updated for gateway: ${gatewayId}`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'QR image updated successfully'
    })

  } catch (error) {
    console.error('[UploadPaymentQR] Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload QR image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    const { searchParams } = new URL(request.url)
    const gatewayId = searchParams.get('gatewayId')

    if (!gatewayId) {
      return NextResponse.json(
        { error: 'No gateway ID provided' },
        { status: 400 }
      )
    }

    const gateway = await prisma.paymentGateway.findUnique({
      where: { id: gatewayId }
    })

    if (!gateway) {
      return NextResponse.json(
        { error: 'Gateway not found' },
        { status: 404 }
      )
    }

    if (!gateway.qrImage) {
      return NextResponse.json(
        { error: 'No QR image to delete' },
        { status: 400 }
      )
    }

    if (gateway.qrImage.includes('blob.core.windows.net')) {
      await deleteImage(gateway.qrImage)
    }

    await prisma.paymentGateway.update({
      where: { id: gatewayId },
      data: { qrImage: null }
    })

    console.log(`[UploadPaymentQR] ✅ QR deleted for gateway: ${gatewayId}`)

    return NextResponse.json({
      success: true,
      message: 'QR image deleted successfully'
    })

  } catch (error) {
    console.error('[UploadPaymentQR] Delete error:', error)

    return NextResponse.json(
      { error: 'Failed to delete QR image' },
      { status: 500 }
    )
  }
}
