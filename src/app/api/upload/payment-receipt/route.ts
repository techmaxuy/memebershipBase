import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/../auth'
import { uploadImage } from '@/core/shared/lib/azure-storage'
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const paymentId = formData.get('paymentId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'No payment ID provided' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment is not pending' },
        { status: 400 }
      )
    }

    console.log(`[UploadPaymentReceipt] User ${session.user.id} uploading receipt for payment: ${paymentId}`)

    const imageUrl = await uploadImage(file, {
      folder: 'payments/receipts',
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 90,
    })

    await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptImage: imageUrl }
    })

    console.log(`[UploadPaymentReceipt] ✅ Receipt uploaded for payment: ${paymentId}`)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Receipt uploaded successfully'
    })

  } catch (error) {
    console.error('[UploadPaymentReceipt] Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload receipt' },
      { status: 500 }
    )
  }
}
