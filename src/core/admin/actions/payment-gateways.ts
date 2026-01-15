'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const PaymentGatewaySchema = z.object({
  countryCode: z.string().min(2).max(3),
  countryName: z.string().min(1).max(100),
  gatewayName: z.string().min(1).max(100),
  qrImage: z.string().url().optional().nullable(),
  instructions: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function getPaymentGateways() {
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

    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { countryName: 'asc' },
    })

    return { success: true, gateways }
  } catch (error) {
    console.error('[PaymentGateways] Error getting gateways:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getActivePaymentGateways() {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      where: { isActive: true },
      orderBy: { countryName: 'asc' },
    })

    return { success: true, gateways }
  } catch (error) {
    console.error('[PaymentGateways] Error getting active gateways:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getGatewayByCountry(countryCode: string) {
  try {
    const gateway = await prisma.paymentGateway.findFirst({
      where: {
        countryCode: countryCode.toUpperCase(),
        isActive: true,
      },
    })

    if (!gateway) {
      const defaultGateway = await prisma.paymentGateway.findFirst({
        where: {
          countryCode: 'US',
          isActive: true,
        },
      })
      return { success: true, gateway: defaultGateway }
    }

    return { success: true, gateway }
  } catch (error) {
    console.error('[PaymentGateways] Error getting gateway by country:', error)
    return { error: 'DatabaseError' }
  }
}

export async function createPaymentGateway(values: z.infer<typeof PaymentGatewaySchema>) {
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

    const validated = PaymentGatewaySchema.safeParse(values)
    if (!validated.success) {
      return { error: 'InvalidFields' }
    }

    const gateway = await prisma.paymentGateway.create({
      data: {
        ...validated.data,
        countryCode: validated.data.countryCode.toUpperCase(),
      },
    })

    console.log(`[PaymentGateways] ✅ Gateway created: ${gateway.gatewayName} (${gateway.countryCode})`)
    revalidatePath('/admin/settings')

    return { success: true, gateway }
  } catch (error) {
    console.error('[PaymentGateways] Error creating gateway:', error)
    return { error: 'DatabaseError' }
  }
}

export async function updatePaymentGateway(
  id: string,
  values: Partial<z.infer<typeof PaymentGatewaySchema>>
) {
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

    const existingGateway = await prisma.paymentGateway.findUnique({
      where: { id },
    })

    if (!existingGateway) {
      return { error: 'GatewayNotFound' }
    }

    const updateData = { ...values }
    if (values.countryCode) {
      updateData.countryCode = values.countryCode.toUpperCase()
    }

    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: updateData,
    })

    console.log(`[PaymentGateways] ✅ Gateway updated: ${gateway.gatewayName}`)
    revalidatePath('/admin/settings')

    return { success: true, gateway }
  } catch (error) {
    console.error('[PaymentGateways] Error updating gateway:', error)
    return { error: 'DatabaseError' }
  }
}

export async function deletePaymentGateway(id: string) {
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

    const existingGateway = await prisma.paymentGateway.findUnique({
      where: { id },
      include: { payments: { take: 1 } },
    })

    if (!existingGateway) {
      return { error: 'GatewayNotFound' }
    }

    if (existingGateway.payments.length > 0) {
      return { error: 'GatewayHasPayments' }
    }

    await prisma.paymentGateway.delete({
      where: { id },
    })

    console.log(`[PaymentGateways] ✅ Gateway deleted: ${existingGateway.gatewayName}`)
    revalidatePath('/admin/settings')

    return { success: true }
  } catch (error) {
    console.error('[PaymentGateways] Error deleting gateway:', error)
    return { error: 'DatabaseError' }
  }
}

export async function seedUruguayGateway() {
  try {
    const existingGateway = await prisma.paymentGateway.findFirst({
      where: { countryCode: 'UY' },
    })

    if (existingGateway) {
      console.log('[PaymentGateways] Uruguay gateway already exists, skipping seed')
      return { success: true, message: 'GatewayAlreadyExists' }
    }

    const gateway = await prisma.paymentGateway.create({
      data: {
        countryCode: 'UY',
        countryName: 'Uruguay',
        gatewayName: 'MercadoPago',
        instructions: 'Escanea el código QR con tu app de MercadoPago para realizar el pago. Una vez realizado, sube el comprobante para verificación.',
        isActive: true,
      },
    })

    console.log('[PaymentGateways] ✅ Uruguay gateway seeded successfully')
    return { success: true, gateway }
  } catch (error) {
    console.error('[PaymentGateways] Error seeding Uruguay gateway:', error)
    return { error: 'DatabaseError' }
  }
}
