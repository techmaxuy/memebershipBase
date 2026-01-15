'use server'

import { prisma } from '@/core/shared/lib/db'

interface TokensResult {
  success?: boolean
  tokensRemaining?: number
  tokensUsed?: number
  planName?: string
  error?: string
}

export async function getUserTokens(userId: string): Promise<TokensResult> {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    })

    if (!subscription) {
      return { error: 'NoSubscription' }
    }

    return {
      success: true,
      tokensRemaining: subscription.tokensRemaining,
      tokensUsed: subscription.tokensUsed,
      planName: subscription.plan.name,
    }
  } catch (error) {
    console.error('[Tokens] Error getting user tokens:', error)
    return { error: 'DatabaseError' }
  }
}

export async function canUseAI(userId: string, requiredTokens: number = 1): Promise<boolean> {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return false
    }

    return subscription.tokensRemaining >= requiredTokens
  } catch (error) {
    console.error('[Tokens] Error checking AI availability:', error)
    return false
  }
}

export async function consumeTokens(
  userId: string,
  amount: number,
  operation: string,
  aiConfigId?: string,
  metadata?: Record<string, unknown>
): Promise<TokensResult> {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return { error: 'NoSubscription' }
    }

    if (subscription.tokensRemaining < amount) {
      return { error: 'InsufficientTokens' }
    }

    const [updatedSubscription] = await prisma.$transaction([
      prisma.userSubscription.update({
        where: { userId },
        data: {
          tokensRemaining: { decrement: amount },
          tokensUsed: { increment: amount },
        },
      }),
      prisma.tokenUsage.create({
        data: {
          userId,
          tokensUsed: amount,
          operation,
          aiConfigId,
          metadata: metadata ?JSON.parse(JSON.stringify(metadata)) : null,
        },
      }),
    ])

    console.log(`[Tokens] ✅ Consumed ${amount} tokens for user ${userId} (${operation})`)

    return {
      success: true,
      tokensRemaining: updatedSubscription.tokensRemaining,
      tokensUsed: updatedSubscription.tokensUsed,
    }
  } catch (error) {
    console.error('[Tokens] Error consuming tokens:', error)
    return { error: 'DatabaseError' }
  }
}

export async function renewMonthlyTokens(): Promise<{ success?: boolean; renewed?: number; error?: string }> {
  try {
    const now = new Date()

    const subscriptionsToRenew = await prisma.userSubscription.findMany({
      where: {
        renewalDate: { lte: now },
      },
      include: { plan: true },
    })

    if (subscriptionsToRenew.length === 0) {
      console.log('[Tokens] No subscriptions to renew')
      return { success: true, renewed: 0 }
    }

    let renewedCount = 0

    for (const subscription of subscriptionsToRenew) {
      const nextRenewalDate = new Date(subscription.renewalDate)
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1)

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          tokensRemaining: subscription.plan.tokens,
          tokensUsed: 0,
          renewalDate: nextRenewalDate,
        },
      })

      renewedCount++
      console.log(`[Tokens] ✅ Renewed tokens for user ${subscription.userId}`)
    }

    console.log(`[Tokens] ✅ Renewed ${renewedCount} subscriptions`)
    return { success: true, renewed: renewedCount }
  } catch (error) {
    console.error('[Tokens] Error renewing tokens:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getTokenUsageHistory(
  userId: string,
  limit: number = 50
): Promise<{ success?: boolean; usage?: unknown[]; error?: string }> {
  try {
    const usage = await prisma.tokenUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return { success: true, usage }
  } catch (error) {
    console.error('[Tokens] Error getting usage history:', error)
    return { error: 'DatabaseError' }
  }
}
