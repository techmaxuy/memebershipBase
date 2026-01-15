'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'

export async function getAvailablePlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayNameEn: true,
        displayNameEs: true,
        tokens: true,
        price: true,
        additionalLimit: true,
      },
    })

    return { success: true, plans }
  } catch (error) {
    console.error('[SubscriptionPlans] Error getting available plans:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getUserSubscription() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            displayNameEn: true,
            displayNameEs: true,
            tokens: true,
            price: true,
            additionalLimit: true,
          },
        },
      },
    })

    return { success: true, subscription }
  } catch (error) {
    console.error('[SubscriptionPlans] Error getting user subscription:', error)
    return { error: 'DatabaseError' }
  }
}
