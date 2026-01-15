'use server'

import { prisma } from '@/core/shared/lib/db'
import { auth } from '@/../auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const SubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  displayNameEn: z.string().min(1, 'English name is required').max(100),
  displayNameEs: z.string().min(1, 'Spanish name is required').max(100),
  tokens: z.number().int().min(0),
  price: z.number().min(0),
  additionalLimit: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function getSubscriptionPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return { success: true, plans }
  } catch (error) {
    console.error('[Subscriptions] Error getting plans:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getActiveSubscriptionPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return { success: true, plans }
  } catch (error) {
    console.error('[Subscriptions] Error getting active plans:', error)
    return { error: 'DatabaseError' }
  }
}

export async function createSubscriptionPlan(values: z.infer<typeof SubscriptionPlanSchema>) {
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

    const validated = SubscriptionPlanSchema.safeParse(values)
    if (!validated.success) {
      return { error: 'InvalidFields' }
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { name: validated.data.name },
    })

    if (existingPlan) {
      return { error: 'PlanAlreadyExists' }
    }

    const plan = await prisma.subscriptionPlan.create({
      data: validated.data,
    })

    console.log(`[Subscriptions] ✅ Plan created: ${plan.name}`)
    revalidatePath('/admin/settings')

    return { success: true, plan }
  } catch (error) {
    console.error('[Subscriptions] Error creating plan:', error)
    return { error: 'DatabaseError' }
  }
}

export async function updateSubscriptionPlan(
  id: string,
  values: Partial<z.infer<typeof SubscriptionPlanSchema>>
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

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return { error: 'PlanNotFound' }
    }

    if (values.name && values.name !== existingPlan.name) {
      const duplicatePlan = await prisma.subscriptionPlan.findUnique({
        where: { name: values.name },
      })
      if (duplicatePlan) {
        return { error: 'PlanAlreadyExists' }
      }
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: values,
    })

    console.log(`[Subscriptions] ✅ Plan updated: ${plan.name}`)
    revalidatePath('/admin/settings')

    return { success: true, plan }
  } catch (error) {
    console.error('[Subscriptions] Error updating plan:', error)
    return { error: 'DatabaseError' }
  }
}

export async function deleteSubscriptionPlan(id: string) {
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

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { subscriptions: { take: 1 } },
    })

    if (!existingPlan) {
      return { error: 'PlanNotFound' }
    }

    if (existingPlan.subscriptions.length > 0) {
      return { error: 'PlanHasSubscriptions' }
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    })

    console.log(`[Subscriptions] ✅ Plan deleted: ${existingPlan.name}`)
    revalidatePath('/admin/settings')

    return { success: true }
  } catch (error) {
    console.error('[Subscriptions] Error deleting plan:', error)
    return { error: 'DatabaseError' }
  }
}

export async function seedDefaultPlans() {
  try {
    const existingPlans = await prisma.subscriptionPlan.count()
    if (existingPlans > 0) {
      console.log('[Subscriptions] Plans already exist, skipping seed')
      return { success: true, message: 'PlansAlreadyExist' }
    }

    const defaultPlans = [
      {
        name: 'free',
        displayNameEn: 'Free',
        displayNameEs: 'Gratis',
        tokens: 0,
        price: 0,
        additionalLimit: 0,
        sortOrder: 0,
      },
      {
        name: 'standard',
        displayNameEn: 'Standard',
        displayNameEs: 'Estándar',
        tokens: 5,
        price: 5,
        additionalLimit: 0,
        sortOrder: 1,
      },
      {
        name: 'pro',
        displayNameEn: 'Pro',
        displayNameEs: 'Pro',
        tokens: 20,
        price: 8,
        additionalLimit: 0,
        sortOrder: 2,
      },
      {
        name: 'premium',
        displayNameEn: 'Premium',
        displayNameEs: 'Premium',
        tokens: 50,
        price: 10,
        additionalLimit: 0,
        sortOrder: 3,
      },
    ]

    await prisma.subscriptionPlan.createMany({
      data: defaultPlans,
    })

    console.log('[Subscriptions] ✅ Default plans seeded successfully')
    return { success: true }
  } catch (error) {
    console.error('[Subscriptions] Error seeding plans:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    })
    return { success: true, subscription }
  } catch (error) {
    console.error('[Subscriptions] Error getting user subscription:', error)
    return { error: 'DatabaseError' }
  }
}
