'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { revalidatePath } from 'next/cache'
import { getUserCountry } from '@/core/shared/lib/geolocation'
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/core/shared/lib/email'

interface PaymentRequestResult {
  success?: boolean
  payment?: {
    id: string
    amount: number
    currency: string
  }
  gateway?: {
    id: string
    gatewayName: string
    qrImage: string | null
    instructions: string | null
  }
  plan?: {
    id: string
    name: string
    displayNameEn: string
    displayNameEs: string
    price: number
  }
  error?: string
}

export async function createPaymentRequest(planId: string): Promise<PaymentRequestResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId, isActive: true },
    })

    if (!plan) {
      return { error: 'PlanNotFound' }
    }

    if (plan.price === 0) {
      return { error: 'FreePlanNoPayment' }
    }

    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    if (existingPendingPayment) {
      return { error: 'PendingPaymentExists' }
    }

    const countryCode = await getUserCountry()

    let gateway = await prisma.paymentGateway.findFirst({
      where: {
        countryCode: countryCode.toUpperCase(),
        isActive: true,
      },
    })

    if (!gateway) {
      gateway = await prisma.paymentGateway.findFirst({
        where: { isActive: true },
      })
    }

    if (!gateway) {
      return { error: 'NoGatewayAvailable' }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        gatewayId: gateway.id,
        amount: plan.price,
        currency: 'USD',
        status: 'PENDING',
      },
    })

    console.log(`[Payments] ✅ Payment request created: ${payment.id}`)

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
      },
      gateway: {
        id: gateway.id,
        gatewayName: gateway.gatewayName,
        qrImage: gateway.qrImage,
        instructions: gateway.instructions,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        displayNameEn: plan.displayNameEn,
        displayNameEs: plan.displayNameEs,
        price: plan.price,
      },
    }
  } catch (error) {
    console.error('[Payments] Error creating payment request:', error)
    return { error: 'DatabaseError' }
  }
}

export async function uploadPaymentReceipt(
  paymentId: string,
  receiptUrl: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { error: 'PaymentNotFound' }
    }

    if (payment.userId !== session.user.id) {
      return { error: 'Forbidden' }
    }

    if (payment.status !== 'PENDING') {
      return { error: 'PaymentNotPending' }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptImage: receiptUrl },
    })

    console.log(`[Payments] ✅ Receipt uploaded for payment: ${paymentId}`)

    return { success: true }
  } catch (error) {
    console.error('[Payments] Error uploading receipt:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getPendingPayments() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        gateway: {
          select: { gatewayName: true, countryCode: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const paymentsWithPlan = await Promise.all(
      payments.map(async (payment) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: payment.planId },
          select: { name: true, displayNameEn: true, displayNameEs: true },
        })
        return { ...payment, plan }
      })
    )

    return { success: true, payments: paymentsWithPlan }
  } catch (error) {
    console.error('[Payments] Error getting pending payments:', error)
    return { error: 'DatabaseError' }
  }
}

export async function approvePayment(
  paymentId: string,
  adminNotes?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    })

    if (!payment) {
      return { error: 'PaymentNotFound' }
    }

    if (payment.status !== 'PENDING') {
      return { error: 'PaymentNotPending' }
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: payment.planId },
    })

    if (!plan) {
      return { error: 'PlanNotFound' }
    }

    const nextRenewalDate = new Date()
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'APPROVED',
          adminNotes,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.userSubscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: plan.id,
          tokensRemaining: plan.tokens,
          tokensUsed: 0,
          startDate: new Date(),
          renewalDate: nextRenewalDate,
        },
        update: {
          planId: plan.id,
          tokensRemaining: plan.tokens,
          tokensUsed: 0,
          startDate: new Date(),
          renewalDate: nextRenewalDate,
        },
      }),
    ])

    try {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { email: true },
      })

      if (user?.email) {
        await sendPaymentApprovedEmail(user.email, plan.displayNameEn, 'en')
      }
    } catch (emailError) {
      console.error('[Payments] Error sending approval email:', emailError)
    }

    console.log(`[Payments] ✅ Payment approved: ${paymentId}`)
    revalidatePath('/admin/settings')

    return { success: true }
  } catch (error) {
    console.error('[Payments] Error approving payment:', error)
    return { error: 'DatabaseError' }
  }
}

export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return { error: 'Forbidden' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { error: 'PaymentNotFound' }
    }

    if (payment.status !== 'PENDING') {
      return { error: 'PaymentNotPending' }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        adminNotes: reason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    try {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { email: true },
      })

      if (user?.email) {
        await sendPaymentRejectedEmail(user.email, reason, 'en')
      }
    } catch (emailError) {
      console.error('[Payments] Error sending rejection email:', emailError)
    }

    console.log(`[Payments] ✅ Payment rejected: ${paymentId}`)
    revalidatePath('/admin/settings')

    return { success: true }
  } catch (error) {
    console.error('[Payments] Error rejecting payment:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getUserPayments(userId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const targetUserId = userId || session.user.id

    if (userId && userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })

      if (user?.role !== 'ADMIN') {
        return { error: 'Forbidden' }
      }
    }

    const payments = await prisma.payment.findMany({
      where: { userId: targetUserId },
      include: {
        gateway: {
          select: { gatewayName: true, countryCode: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const paymentsWithPlan = await Promise.all(
      payments.map(async (payment) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: payment.planId },
          select: { name: true, displayNameEn: true, displayNameEs: true },
        })
        return { ...payment, plan }
      })
    )

    return { success: true, payments: paymentsWithPlan }
  } catch (error) {
    console.error('[Payments] Error getting user payments:', error)
    return { error: 'DatabaseError' }
  }
}

export async function cancelPendingPayment(paymentId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { error: 'PaymentNotFound' }
    }

    if (payment.userId !== session.user.id) {
      return { error: 'Forbidden' }
    }

    if (payment.status !== 'PENDING') {
      return { error: 'PaymentNotPending' }
    }

    await prisma.payment.delete({
      where: { id: paymentId },
    })

    console.log(`[Payments] ✅ Payment cancelled: ${paymentId}`)

    return { success: true }
  } catch (error) {
    console.error('[Payments] Error cancelling payment:', error)
    return { error: 'DatabaseError' }
  }
}
