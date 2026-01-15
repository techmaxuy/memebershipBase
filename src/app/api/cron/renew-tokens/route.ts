import { NextRequest, NextResponse } from 'next/server'
import { renewMonthlyTokens } from '@/core/shared/lib/tokens'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[CronRenewTokens] ❌ Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CronRenewTokens] Starting monthly token renewal...')

    const result = await renewMonthlyTokens()

    if (result.error) {
      console.error('[CronRenewTokens] ❌ Error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log(`[CronRenewTokens] ✅ Renewed ${result.renewed} subscriptions`)

    return NextResponse.json({
      success: true,
      renewed: result.renewed,
      message: `Successfully renewed ${result.renewed} subscriptions`
    })

  } catch (error) {
    console.error('[CronRenewTokens] Error:', error)

    return NextResponse.json(
      { error: 'Failed to renew tokens' },
      { status: 500 }
    )
  }
}
